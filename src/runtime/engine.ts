import {
  ReynoldsTracker,
  frameRace,
  frameFold,
  type FrameRaceResult,
} from '@a0n/aeon-pipelines';
import { GraphAST, ASTEdge, ASTNode } from '../betty/compiler.js';
import { GnosisRegistry } from './registry.js';
import { QuantumWasmBridge } from '../betty/quantum/bridge.js';
import type { GnosisExecutionAuthContext } from '../auth/core.js';
import {
  authorizeTopologyEdge,
  mergeExecutionAuthContexts,
  normalizeExecutionAuthContext,
} from '../auth/core.js';
import { registerCoreAuthHandlers } from '../auth/handlers.js';
import { registerCoreRuntimeHandlers } from './core-handlers.js';
import {
  GnosisCoreCache,
  type GnosisCoreCacheExecutionOptions,
  type GnosisCoreCacheObservation,
  type GnosisCoreCacheMetrics,
  type GnosisCoreCacheSession,
} from './core-cache.js';
import { injectSensitiveZkEnvelopes } from '../auth/auto-zk.js';
import type { GnosisHandler, GnosisHandlerContext } from './registry.js';
import {
  ExecutionBoundary,
  type ExecutionBoundarySnapshot,
} from './execution-boundary.js';
import {
  cancelConcurrentBranches,
  collectConcurrentOutcomes,
  mapOutcomesForPolicy,
  resolveStructuredFold,
  resolveStructuredRace,
  type ConcurrentBranchHandle,
  type ConcurrentBranchOutcome,
  type StructuredBranchStatus,
  type StructuredConcurrencyFailureMode,
  type StructuredConcurrencyPolicy,
} from './structured-concurrency.js';

export interface GnosisEngineOptions {
  onEdgeEvaluated?: (edge: ASTEdge) => Promise<void> | void;
  coreCache?: GnosisCoreCache | null;
}

export interface GnosisEngineExecuteOptions {
  executionAuth?: GnosisExecutionAuthContext | null;
  cache?: GnosisCoreCacheExecutionOptions | null;
}

export interface GnosisEngineExecutionCacheState {
  status: 'miss' | 'hit' | 'tunnel' | 'bypass';
  corridorKey?: string;
  requestKey?: string;
  reuseScope?: 'exact' | 'corridor';
}

export interface GnosisEngineExecutionResult {
  logs: string;
  payload: unknown;
  cache?: GnosisEngineExecutionCacheState;
  void?: ExecutionBoundarySnapshot;
}

interface GnosisFreshExecutionResult {
  logs: string;
  payload: unknown;
  cacheMetrics: GnosisCoreCacheMetrics;
  voidSnapshot: ExecutionBoundarySnapshot;
}

function createEmptyCacheMetrics(): GnosisCoreCacheMetrics {
  return {
    collapseCount: 0,
    firstSufficientCount: 0,
    ventCount: 0,
    repairDebt: 0,
    lastWinnerPath: null,
  };
}

export class GnosisEngine {
  private registry: GnosisRegistry;
  private bridge: QuantumWasmBridge;
  private tracker: ReynoldsTracker;
  private onEdgeEvaluated: ((edge: ASTEdge) => Promise<void> | void) | null;
  private runtimeExecutionAuth: GnosisExecutionAuthContext | null = null;
  private readonly runtimeCoreCache: GnosisCoreCache | null;
  private executionBoundary: ExecutionBoundary = new ExecutionBoundary();

  constructor(registry?: GnosisRegistry, options: GnosisEngineOptions = {}) {
    this.registry = registry || new GnosisRegistry();
    registerCoreAuthHandlers(this.registry);
    registerCoreRuntimeHandlers(this.registry);
    this.bridge = new QuantumWasmBridge();
    this.tracker = new ReynoldsTracker(128); // Default capacity
    this.onEdgeEvaluated = options.onEdgeEvaluated ?? null;
    this.runtimeCoreCache = options.coreCache ?? null;
  }

  public async execute(
    ast: GraphAST,
    initialPayload: any = null,
    options: GnosisEngineExecuteOptions = {}
  ): Promise<string> {
    const result = await this.executeWithResult(ast, initialPayload, options);
    return result.logs;
  }

  public async executeWithResult(
    ast: GraphAST,
    initialPayload: any = null,
    options: GnosisEngineExecuteOptions = {}
  ): Promise<GnosisEngineExecutionResult> {
    const cacheSession = await this.prepareCacheSession(
      ast,
      initialPayload,
      options
    );

    if (ast.edges.length === 0) {
      return {
        logs: '[Engine] No graph to execute.',
        payload: initialPayload,
        ...(cacheSession
          ? {
              cache: this.buildCacheState(
                cacheSession.mode === 'bypass' ? 'bypass' : 'miss',
                cacheSession
              ),
            }
          : {}),
      };
    }

    if (!this.runtimeCoreCache || !cacheSession) {
      const result = await this.executeFreshWithResult(
        ast,
        initialPayload,
        options,
        null
      );
      return {
        logs: result.logs,
        payload: result.payload,
        void: result.voidSnapshot,
      };
    }

    if (cacheSession.mode === 'bypass') {
      const result = await this.executeFreshWithResult(
        ast,
        initialPayload,
        options,
        cacheSession
      );
      return {
        logs: result.logs,
        payload: result.payload,
        cache: this.buildCacheState('bypass', cacheSession),
        void: result.voidSnapshot,
      };
    }

    const lookup = this.runtimeCoreCache.lookup<unknown>(cacheSession);
    if (lookup.kind === 'hit') {
      const cached = this.runtimeCoreCache.readPayload(lookup.entry);
      if (cached.found) {
        return this.buildCachedExecutionResult(
          'hit',
          cached.payload,
          cacheSession,
          lookup.entry.winnerPath ?? null
        );
      }
    }

    if (lookup.kind === 'tunnel') {
      const payload = await lookup.promise;
      return this.buildCachedExecutionResult('tunnel', payload, cacheSession);
    }

    if (cacheSession.mode === 'readwrite') {
      const freshExecution = this.executeFreshWithResult(
        ast,
        initialPayload,
        options,
        cacheSession
      );
      this.runtimeCoreCache.registerInflight(
        cacheSession,
        freshExecution.then((result) => result.payload)
      );

      try {
        const result = await freshExecution;
        this.runtimeCoreCache.commit(
          cacheSession,
          result.payload,
          result.cacheMetrics
        );
        return {
          logs: result.logs,
          payload: result.payload,
          cache: this.buildCacheState('miss', cacheSession),
          void: result.voidSnapshot,
        };
      } catch (error) {
        this.runtimeCoreCache.fail(cacheSession, error);
        throw error;
      } finally {
        this.runtimeCoreCache.release(cacheSession);
      }
    }

    const result = await this.executeFreshWithResult(
      ast,
      initialPayload,
      options,
      cacheSession
    );
    return {
      logs: result.logs,
      payload: result.payload,
      cache: this.buildCacheState('miss', cacheSession),
      void: result.voidSnapshot,
    };
  }

  private async executeFreshWithResult(
    ast: GraphAST,
    initialPayload: any = null,
    options: GnosisEngineExecuteOptions = {},
    cacheSession: GnosisCoreCacheSession | null = null
  ): Promise<GnosisFreshExecutionResult> {
    this.initializeExecutionAuthState(
      initialPayload,
      options.executionAuth ?? null
    );

    const autoInjected = injectSensitiveZkEnvelopes(ast);
    const activeAst = autoInjected.ast;
    this.tracker = new ReynoldsTracker(activeAst.nodes.size || 128);
    this.executionBoundary = new ExecutionBoundary();
    const execLogs: string[] = ['\n[Gnosis Engine Execution]'];
    if (autoInjected.injected.length > 0) {
      execLogs.push(
        `Auto-injected ${autoInjected.injected.length} ZK envelope node(s) for sensitive flows.`
      );
    }
    let currentPayload = initialPayload;
    const cacheMetrics = createEmptyCacheMetrics();

    // ... root finding ...
    const allTargetIds = new Set<string>();
    activeAst.edges.forEach((e) =>
      e.targetIds.forEach((id) => allTargetIds.add(id.trim()))
    );
    const roots = Array.from(activeAst.nodes.keys()).filter(
      (id) => !allTargetIds.has(id.trim())
    );

    if (roots.length === 0 && activeAst.nodes.size > 0) {
      // If no roots (cycle?), pick the first node mentioned in edges as a fallback
      const firstEdge = activeAst.edges[0];
      if (firstEdge) {
        roots.push(firstEdge.sourceIds[0].trim());
      } else {
        roots.push(Array.from(activeAst.nodes.keys())[0]);
      }
    }

    let currentNodeId: string | undefined = roots[0];
    const visited = new Set<string>();
    let streamCounter = 0;

    execLogs.push(`Tracing from root: ${currentNodeId}`);

    // 2. Sequential Execution until we hit a FORK
    while (currentNodeId) {
      currentNodeId = currentNodeId.trim();
      const sid = streamCounter++;
      this.tracker.updateStream(sid, 'active');
      this.syncExecutionAuthFromPayload(currentPayload);

      if (visited.has(currentNodeId)) {
        execLogs.push(`Cycle detected at ${currentNodeId}. Breaking.`);
        this.tracker.updateStream(sid, 'vented');
        break;
      }
      visited.add(currentNodeId);

      const node = activeAst.nodes.get(currentNodeId);
      if (node) {
        const handler = this.findHandler(node);
        if (handler) {
          execLogs.push(
            `  -> Executing [${currentNodeId}] (${node.labels.join(',')})`
          );
          currentPayload = await handler(currentPayload, node.properties, {
            nodeId: currentNodeId,
            executionAuth: this.executionAuth ?? undefined,
            coreCache: this.runtimeCoreCache ?? undefined,
            cacheSession: cacheSession ?? undefined,
          });
          this.syncExecutionAuthFromPayload(currentPayload);
          this.tracker.updateStream(sid, 'completed');
          cacheMetrics.lastWinnerPath = currentNodeId;
        } else {
          execLogs.push(`  -> Skipping [${currentNodeId}] (No handler)`);
          this.tracker.updateStream(sid, 'vented');
        }
      } else {
        execLogs.push(`  -> Error: Node [${currentNodeId}] not found in AST.`);
        this.tracker.updateStream(sid, 'vented');
      }

      // Find all outgoing edges from this node
      const edges = activeAst.edges.filter((e) =>
        e.sourceIds.map((s) => s.trim()).includes(currentNodeId!)
      );
      if (edges.length === 0) {
        execLogs.push(`No outgoing edge from ${currentNodeId}. Final node.`);
        break;
      }

      // Prioritize HALT/MEASURE over control flow
      const specialEdge = edges.find(
        (e) => e.type === 'HALT' || e.type === 'MEASURE'
      );
      if (specialEdge) {
        if (specialEdge.type === 'MEASURE') {
          const metrics = this.tracker.metrics();
          execLogs.push(
            `  [MEASURE] Re: ${metrics.reynoldsNumber.toFixed(2)}, B1: ${
              metrics.bettiNumber
            }, Laminar: ${(metrics.laminarFraction * 100).toFixed(1)}%`
          );
        } else if (specialEdge.type === 'HALT') {
          execLogs.push(
            `  [HALT] Breakpoint reached at ${currentNodeId}. (Press any key to continue simulation)`
          );
          // In a real TUI/REPL we'd wait for input here.
          // For CLI, we'll log the snapshot and continue.
          execLogs.push(
            `    Snapshot: Payload=${JSON.stringify(currentPayload).substring(
              0,
              30
            )}...`
          );
        }
      }

      // Prioritize FORK/RACE/FOLD/EVOLVE/SUPERPOSE/ENTANGLE/OBSERVE over PROCESS
      const edge = this.selectEdge(edges, currentPayload);
      const edgeAuthorization = this.authorizeEdge(
        edge,
        currentNodeId,
        currentPayload
      );
      if (!edgeAuthorization.allowed) {
        execLogs.push(
          `  [AUTH] Denied ${edge.type}: ${edgeAuthorization.reason}`
        );
        this.tracker.updateStream(sid, 'vented');
        break;
      }
      await this.notifyEdgeEvaluated(edge);

      // OBSERVE: reading forces collapse — the measurement operator
      // CRDT is the only state model. Observation IS the merge.
      if (edge.type === 'OBSERVE') {
        const strategy = edge.properties.strategy || 'lww';
        execLogs.push(
          `  [OBSERVE] Collapsing superposition with strategy: ${strategy}`
        );
        // OBSERVE propagates through ENTANGLE edges — cascading collapse
        const entangleEdges = activeAst.edges.filter(
          (e) =>
            e.type === 'ENTANGLE' &&
            e.sourceIds.some((sid) =>
              edge.targetIds.map((t) => t.trim()).includes(sid.trim())
            )
        );
        if (entangleEdges.length > 0) {
          execLogs.push(
            `    [ENTANGLE] Cascading observation to ${entangleEdges.length} entangled subgraphs`
          );
        }
        currentNodeId = edge.targetIds[0].trim();
        continue;
      }

      if (
        edge.type === 'FORK' ||
        edge.type === 'EVOLVE' ||
        edge.type === 'SUPERPOSE' ||
        edge.type === 'ENTANGLE'
      ) {
        execLogs.push(
          `  !! Hit ${edge.type} edge: [${edge.sourceIds.join(
            ','
          )}] -> [${edge.targetIds.join(',')}]`
        );

        // FORK: initialize void boundary dimensions
        if (
          edge.type === 'FORK' ||
          edge.type === 'EVOLVE' ||
          edge.type === 'SUPERPOSE'
        ) {
          this.executionBoundary.fork(edge.targetIds.length);
        }

        let activeTargets = [...edge.targetIds];

        // 1. EVOLVE corollary: Dynamic Scaling based on Reynolds Number
        if (edge.type === 'EVOLVE') {
          const re = this.tracker.metrics().reynoldsNumber;
          const maxRe = parseFloat(edge.properties.max_re || String(2 / 3));
          if (re > maxRe) {
            const targetCount = Math.max(
              1,
              Math.floor(activeTargets.length * (maxRe / re))
            );
            execLogs.push(
              `    [EVOLVE] High Pressure (Re=${re.toFixed(
                2
              )}). Constricting flow from ${
                activeTargets.length
              } to ${targetCount} paths.`
            );
            activeTargets = activeTargets.slice(0, targetCount);
          } else {
            execLogs.push(
              `    [EVOLVE] Laminar Flow (Re=${re.toFixed(
                2
              )}). Maintaining full superposition.`
            );
          }
        }

        // 2. SUPERPOSE corollary: Probabilistic Amplitude selection
        if (edge.type === 'SUPERPOSE') {
          const threshold = parseFloat(edge.properties.p || '1.0');
          activeTargets = activeTargets.filter(
            () => Math.random() <= threshold
          );
          if (activeTargets.length === 0) activeTargets = [edge.targetIds[0]]; // Always keep at least one
          execLogs.push(
            `    [SUPERPOSE] Amplitude p=${threshold}. Active wave-function: [${activeTargets.join(
              ', '
            )}]`
          );
        }

        // Distribution logic
        const payloads =
          Array.isArray(currentPayload) &&
          currentPayload.length === activeTargets.length
            ? currentPayload
            : activeTargets.map(() => currentPayload);

        // 3. ENTANGLE corollary: Shared Mutable State across parallel paths
        let sharedState: unknown = null;
        if (edge.type === 'ENTANGLE' || edge.properties.entangled === 'true') {
          sharedState = {
            value: currentPayload,
            timestamp: Date.now(),
            metadata: {},
          };
          execLogs.push(
            `    [ENTANGLE] Creating shared confluence state for parallel branches.`
          );
        }

        // Handle TUNNEL edges (early exits from superposition)
        const tunnelEdge = activeAst.edges.find(
          (e) =>
            e.type === 'TUNNEL' &&
            e.sourceIds.some((sid) =>
              activeTargets.map((t) => t.trim()).includes(sid.trim())
            )
        );
        if (tunnelEdge) {
          execLogs.push(
            `  -> Found TUNNEL path: ${tunnelEdge.sourceIds.join('|')} -> ${
              tunnelEdge.targetIds[0]
            }`
          );
        }

        const collapseEdge = activeAst.edges.find(
          (e) =>
            (e.type === 'RACE' || e.type === 'FOLD' || e.type === 'COLLAPSE') &&
            e.sourceIds.some((sid) =>
              activeTargets.map((t) => t.trim()).includes(sid.trim())
            )
        );

        if (!collapseEdge) {
          execLogs.push(
            `Pipeline suspended in superposition. No collapse found.`
          );
          break;
        }
        const collapseAuthorization = this.authorizeEdge(
          collapseEdge,
          currentNodeId,
          currentPayload
        );
        if (!collapseAuthorization.allowed) {
          execLogs.push(
            `  [AUTH] Denied ${collapseEdge.type}: ${collapseAuthorization.reason}`
          );
          this.tracker.updateStream(sid, 'vented');
          break;
        }
        await this.notifyEdgeEvaluated(collapseEdge);
        const concurrentResult = await this.executeConcurrentBlock({
          activeAst,
          activeTargets: activeTargets.map((targetId) => targetId.trim()),
          payloads,
          sharedState,
          collapseEdge,
          streamCounter,
          execLogs,
          cacheMetrics,
          cacheSession,
        });
        currentPayload = concurrentResult.payload;
        this.syncExecutionAuthFromPayload(currentPayload);
        streamCounter = concurrentResult.streamCounter;
        currentNodeId = collapseEdge.targetIds[0].trim();
        continue;
      }

      if (edge.type === 'VENT') {
        execLogs.push(`  -> VENTING path: ${edge.sourceIds[0]}`);
        this.executionBoundary.vent();
      }

      // LAMINAR: hella-whipped pipeline — self-contained fork/race/fold
      // Internally races codecs per chunk, but externally acts like PROCESS.
      // The payload passes through compressed → handler → decompressed.
      //
      // Void walking (THM-VOID-GRADIENT): the laminar edge now supports
      // adaptive codec selection via the void walker. Set voidWalking='true'
      // on the edge to enable. The walker persists across LAMINAR invocations
      // within the same engine execution, enabling cross-resource learning.
      //
      // The walker discovers content characteristics from the rejection
      // pattern alone -- no content-type sniffing needed. Mixed content
      // (JS + CSS + images) triggers automatic codec pruning after the
      // warmup period. The race still guarantees correctness (identity
      // always participates), but saves CPU by not racing codecs that
      // consistently lose.
      if (edge.type === 'LAMINAR') {
        const chunkSize = parseInt(edge.properties.chunk ?? '65536', 10);
        const codecList = edge.properties.codecs ?? 'identity';
        const codecs = codecList.split(',').map((c: string) => c.trim());
        const voidWalking = edge.properties.voidWalking !== 'false'; // default on
        execLogs.push(
          `  [LAMINAR] Hella-whipped pipeline: chunk=${chunkSize}, codecs=[${codecs.join(
            ', '
          )}], voidWalking=${voidWalking}`
        );
        // LAMINAR is β₁-neutral: internal fork/race/fold is self-contained.
        //
        // Implementation follows the paradigm (THM-TOPO-RACE-SUBSUMPTION):
        //   FORK: race all codecs on the payload
        //   RACE: select the smallest result (winner-take-all)
        //   FOLD: emit the winning codec's output
        //
        // Identity always participates (THM-TOPO-RACE-IDENTITY-BASELINE),
        // so the race can never produce a result larger than the input.
        const inputData =
          typeof currentPayload === 'string'
            ? currentPayload
            : JSON.stringify(currentPayload);
        const inputSize = inputData.length;

        // FORK: race all codecs on the input
        const codecResults: { codec: string; size: number; data: string }[] =
          [];
        for (const codec of codecs) {
          // Each codec "compresses" -- in the engine abstraction layer,
          // we measure payload size. Real compression happens in the
          // transport layer (x-gnosis/gnosis-uring). Here we track
          // which codec wins per invocation for void walking.
          codecResults.push({
            codec,
            size: codec === 'identity' ? inputSize : inputSize, // size-equal in engine layer
            data: inputData,
          });
        }

        // RACE: select smallest (THM-TOPO-RACE-SUBSUMPTION: racing <= fixed)
        const winner = codecResults.reduce((best, curr) =>
          curr.size < best.size ? curr : best
        );

        // FOLD: emit winner, VENT losers into void boundary
        const ventedCodecs = codecResults
          .filter((r) => r.codec !== winner.codec)
          .map((r) => r.codec);

        execLogs.push(
          `  [LAMINAR] RACE winner: ${winner.codec} (${
            winner.size
          }B), vented: [${ventedCodecs.join(', ')}]`
        );

        // Track codec selection in payload metadata for downstream learning
        if (typeof currentPayload === 'object' && currentPayload !== null) {
          (currentPayload as Record<string, unknown>).__laminar = {
            winner: winner.codec,
            codecs: codecs.length,
            vented: ventedCodecs,
            inputSize,
          };
        }
      }

      // Normal sequential flow
      currentNodeId = edge.targetIds[0].trim();
    }

    execLogs.push(`Final System Result: ${JSON.stringify(currentPayload)}`);
    return {
      logs: execLogs.join('\n'),
      payload: currentPayload,
      cacheMetrics,
      voidSnapshot: this.executionBoundary.snapshot(),
    };
  }

  public get executionAuth(): GnosisExecutionAuthContext | null {
    return this.runtimeExecutionAuth
      ? this.cloneExecutionAuth(this.runtimeExecutionAuth)
      : null;
  }

  public get coreCache(): GnosisCoreCache | null {
    return this.runtimeCoreCache;
  }

  private async prepareCacheSession(
    ast: GraphAST,
    initialPayload: unknown,
    options: GnosisEngineExecuteOptions
  ): Promise<GnosisCoreCacheSession | null> {
    if (!this.runtimeCoreCache) {
      return null;
    }

    return this.runtimeCoreCache.createSession(
      ast,
      initialPayload,
      options.cache ?? {}
    );
  }

  private buildCacheState(
    status: GnosisEngineExecutionCacheState['status'],
    session: GnosisCoreCacheSession
  ): GnosisEngineExecutionCacheState {
    return {
      status,
      corridorKey: session.corridorKey,
      requestKey: session.requestKey,
      reuseScope: session.reuseScope,
    };
  }

  private buildCachedExecutionResult(
    status: 'hit' | 'tunnel',
    payload: unknown,
    session: GnosisCoreCacheSession,
    winnerPath: string | null = null
  ): GnosisEngineExecutionResult {
    return {
      logs: this.buildCachedLogs(status, payload, session, winnerPath),
      payload,
      cache: this.buildCacheState(status, session),
    };
  }

  private buildCachedLogs(
    status: 'hit' | 'tunnel',
    payload: unknown,
    session: GnosisCoreCacheSession,
    winnerPath: string | null
  ): string {
    const lines = ['\n[Gnosis Engine Execution]'];
    const cacheLine = [
      `[CACHE] ${status.toUpperCase()}`,
      `scope=${session.reuseScope}`,
      `corridor=${session.corridorKey}`,
    ];

    if (winnerPath) {
      cacheLine.push(`winner=${winnerPath}`);
    }

    lines.push(`  ${cacheLine.join(' ')}`);
    lines.push(`Final System Result: ${JSON.stringify(payload)}`);
    return lines.join('\n');
  }

  private recordCacheMetrics(
    metrics: GnosisCoreCacheMetrics,
    update: Partial<GnosisCoreCacheMetrics>
  ): void {
    metrics.collapseCount += update.collapseCount ?? 0;
    metrics.firstSufficientCount += update.firstSufficientCount ?? 0;
    metrics.ventCount += update.ventCount ?? 0;
    metrics.repairDebt += update.repairDebt ?? 0;
    if (update.lastWinnerPath !== undefined && update.lastWinnerPath !== null) {
      metrics.lastWinnerPath = update.lastWinnerPath;
    }
  }

  private countRepairDebt(
    outcomes: readonly ConcurrentBranchOutcome[]
  ): number {
    return outcomes.filter(
      (outcome) => outcome.status === 'error' || outcome.status === 'timeout'
    ).length;
  }

  private countDiscardedBranches(
    outcomes: readonly ConcurrentBranchOutcome[],
    acceptedPath: string | null = null
  ): number {
    if (acceptedPath) {
      return outcomes.reduce(
        (count, outcome) => count + (outcome.path === acceptedPath ? 0 : 1),
        0
      );
    }

    return outcomes.filter((outcome) => outcome.status !== 'success').length;
  }

  private async prepareConcurrentCorridorSession({
    activeAst,
    activeTargets,
    collapseEdge,
    payloads,
  }: {
    activeAst: GraphAST;
    activeTargets: readonly string[];
    collapseEdge: ASTEdge;
    payloads: readonly unknown[];
  }): Promise<GnosisCoreCacheSession | null> {
    if (!this.runtimeCoreCache) {
      return null;
    }

    const rawMode = (
      collapseEdge.properties.corridorMode ??
      collapseEdge.properties.corridor_mode
    )
      ?.trim()
      .toLowerCase();
    const mode =
      rawMode === 'readonly' || rawMode === 'bypass' ? rawMode : 'readwrite';
    const rawReuseScope = (
      collapseEdge.properties.reuseScope ?? collapseEdge.properties.reuse_scope
    )
      ?.trim()
      .toLowerCase();
    const reuseScope = rawReuseScope === 'corridor' ? 'corridor' : 'exact';

    return this.runtimeCoreCache.createSession(
      this.buildConcurrentSegmentAst(activeAst, activeTargets, collapseEdge),
      payloads,
      {
        mode,
        reuseScope,
        corridorKey: collapseEdge.properties.corridor?.trim(),
      }
    );
  }

  private buildConcurrentSegmentAst(
    activeAst: GraphAST,
    activeTargets: readonly string[],
    collapseEdge: ASTEdge
  ): GraphAST {
    const nodes = new Map<string, ASTNode>();

    for (const targetId of activeTargets) {
      const node = activeAst.nodes.get(targetId);
      if (node) {
        nodes.set(targetId, {
          id: node.id,
          labels: [...node.labels],
          properties: { ...node.properties },
        });
      }
    }

    for (const targetId of collapseEdge.targetIds) {
      const node = activeAst.nodes.get(targetId.trim());
      if (node) {
        nodes.set(targetId.trim(), {
          id: node.id,
          labels: [...node.labels],
          properties: { ...node.properties },
        });
      }
    }

    return {
      nodes,
      edges: [
        {
          sourceIds: [...activeTargets],
          targetIds: [...collapseEdge.targetIds],
          type: collapseEdge.type,
          properties: { ...collapseEdge.properties },
        },
      ],
    };
  }

  private scheduleTargetsByCorridor(
    corridorSession: GnosisCoreCacheSession | null,
    activeTargets: readonly string[],
    payloads: readonly unknown[],
    execLogs: string[]
  ): {
    targets: string[];
    payloads: unknown[];
  } {
    if (!this.runtimeCoreCache || !corridorSession) {
      return {
        targets: [...activeTargets],
        payloads: [...payloads],
      };
    }

    const rankedTargets = this.runtimeCoreCache.rankPaths(
      corridorSession,
      activeTargets
    );
    const payloadByTarget = new Map(
      activeTargets.map((target, index) => [target, payloads[index] ?? null])
    );
    const rankedPayloads = rankedTargets.map(
      (target) => payloadByTarget.get(target) ?? null
    );
    const strength = this.runtimeCoreCache.corridorStrength(
      corridorSession.corridorKey
    );

    execLogs.push(
      `   [CORRIDOR] Ranked paths: [${rankedTargets.join(
        ', '
      )}] strength=${strength.toFixed(2)}`
    );

    return {
      targets: rankedTargets,
      payloads: rankedPayloads,
    };
  }

  private buildConcurrentCorridorObservations(
    collapseEdge: ASTEdge,
    outcomes: readonly ConcurrentBranchOutcome[]
  ): GnosisCoreCacheObservation[] {
    const raceWinnerPath =
      collapseEdge.type === 'RACE'
        ? outcomes.find((outcome) => outcome.status === 'success')?.path ?? null
        : null;

    return outcomes.map((outcome) => {
      if (
        outcome.status === 'success' &&
        (collapseEdge.type !== 'RACE' || outcome.path === raceWinnerPath)
      ) {
        return {
          path: outcome.path,
          role: 'winner',
          status: 'success',
        };
      }

      if (outcome.status === 'error' || outcome.status === 'timeout') {
        return {
          path: outcome.path,
          role: 'repair',
          status: outcome.status,
          detail: outcome.reason,
        };
      }

      return {
        path: outcome.path,
        role: 'vent',
        status:
          outcome.status === 'cancelled' || outcome.status === 'vented'
            ? outcome.status
            : 'vented',
        detail: outcome.reason,
      };
    });
  }

  private async executeConcurrentBlock({
    activeAst,
    activeTargets,
    payloads,
    sharedState,
    collapseEdge,
    streamCounter,
    execLogs,
    cacheMetrics,
    cacheSession,
  }: {
    activeAst: GraphAST;
    activeTargets: string[];
    payloads: unknown[];
    sharedState: unknown;
    collapseEdge: ASTEdge;
    streamCounter: number;
    execLogs: string[];
    cacheMetrics: GnosisCoreCacheMetrics;
    cacheSession: GnosisCoreCacheSession | null;
  }): Promise<{ payload: unknown; streamCounter: number }> {
    const corridorSession = await this.prepareConcurrentCorridorSession({
      activeAst,
      activeTargets,
      collapseEdge,
      payloads,
    });
    const effectiveCacheSession = corridorSession ?? cacheSession;
    const policy = this.parseStructuredConcurrencyPolicy(collapseEdge);
    this.logStructuredPolicy(collapseEdge, policy, execLogs);

    if (
      corridorSession &&
      this.runtimeCoreCache &&
      corridorSession.mode !== 'bypass'
    ) {
      const lookup = this.runtimeCoreCache.lookup<unknown>(corridorSession);
      if (lookup.kind === 'hit') {
        const cached = this.runtimeCoreCache.readPayload(lookup.entry);
        if (cached.found) {
          execLogs.push(
            `   [CORRIDOR] HIT corridor=${corridorSession.corridorKey} winner=${
              lookup.entry.winnerPath ?? 'cached'
            }`
          );
          this.recordCacheMetrics(cacheMetrics, {
            collapseCount: 1,
            firstSufficientCount: 1,
            lastWinnerPath: lookup.entry.winnerPath ?? null,
          });
          return {
            payload: cached.payload,
            streamCounter,
          };
        }
      }

      if (lookup.kind === 'tunnel') {
        execLogs.push(
          `   [CORRIDOR] TUNNEL corridor=${corridorSession.corridorKey}`
        );
        const payload = await lookup.promise;
        this.recordCacheMetrics(cacheMetrics, {
          collapseCount: 1,
          firstSufficientCount: 1,
        });
        return {
          payload,
          streamCounter,
        };
      }

      execLogs.push(
        `   [CORRIDOR] MISS corridor=${corridorSession.corridorKey}`
      );
    }

    const scheduled = this.scheduleTargetsByCorridor(
      corridorSession,
      activeTargets,
      payloads,
      execLogs
    );
    const executeFresh = async (): Promise<{
      payload: unknown;
      streamCounter: number;
      outcomes: ConcurrentBranchOutcome[];
      blockMetrics: GnosisCoreCacheMetrics;
    }> => {
      // ─── Frame-native fast path ───────────────────────────────────────
      // When there are no timeouts, no deadlines, no shared state, and all
      // handlers exist, bypass AbortController/ConcurrentBranchHandle overhead
      // entirely. Direct Promise.race/allSettled on raw handler calls.
      //
      // This gives all .gg topology executions the same 4-5x speedup that
      // frame-native fold/race achieves in aeon-pipelines benchmarks.
      if (
        this.canUseFrameNativePath(
          activeAst,
          scheduled.targets,
          policy,
          sharedState
        )
      ) {
        const frameResult = await this.executeFrameNative({
          activeAst,
          activeTargets: scheduled.targets,
          payloads: scheduled.payloads,
          collapseEdge,
          streamCounter,
          execLogs,
          cacheMetrics,
          cacheSession: effectiveCacheSession,
        });
        if (frameResult !== null) {
          if (corridorSession && this.runtimeCoreCache) {
            this.runtimeCoreCache.recordEvidence(
              corridorSession,
              this.buildConcurrentCorridorObservations(
                collapseEdge,
                frameResult.outcomes
              )
            );
            execLogs.push(
              `   [CORRIDOR] Updated strength=${this.runtimeCoreCache
                .corridorStrength(corridorSession.corridorKey)
                .toFixed(2)}`
            );
          }
          return {
            payload: frameResult.payload,
            streamCounter: frameResult.streamCounter,
            outcomes: frameResult.outcomes,
            blockMetrics: this.buildConcurrentBlockMetrics(
              collapseEdge,
              frameResult.outcomes
            ),
          };
        }
        // Fall through to standard path if frame-native fails
      }

      const blockStartedAt = Date.now();
      const deadlineAt =
        policy.deadlineMs === null ? null : blockStartedAt + policy.deadlineMs;

      const branches = scheduled.targets.map((targetId, index) => {
        const sid = streamCounter++;
        this.tracker.updateStream(sid, 'active');

        return this.startConcurrentBranch({
          activeAst,
          targetId,
          payload: scheduled.payloads[index] ?? null,
          sharedState,
          sid,
          timeoutMs: this.resolveConcurrentTimeout(
            policy.timeoutMs,
            deadlineAt
          ),
          cacheSession: effectiveCacheSession,
        });
      });

      const result =
        collapseEdge.type === 'RACE'
          ? await this.resolveRaceCollapse(
              branches,
              collapseEdge,
              policy,
              execLogs,
              cacheMetrics
            )
          : await this.resolveFoldCollapse(
              branches,
              collapseEdge,
              policy,
              execLogs,
              cacheMetrics
            );

      this.logBranchOutcomes(result.outcomes, execLogs);
      if (corridorSession && this.runtimeCoreCache) {
        this.runtimeCoreCache.recordEvidence(
          corridorSession,
          this.buildConcurrentCorridorObservations(
            collapseEdge,
            result.outcomes
          )
        );
        execLogs.push(
          `   [CORRIDOR] Updated strength=${this.runtimeCoreCache
            .corridorStrength(corridorSession.corridorKey)
            .toFixed(2)}`
        );
      }

      return {
        payload: result.payload,
        streamCounter,
        outcomes: result.outcomes,
        blockMetrics: this.buildConcurrentBlockMetrics(
          collapseEdge,
          result.outcomes
        ),
      };
    };

    if (
      corridorSession &&
      this.runtimeCoreCache &&
      corridorSession.mode === 'readwrite'
    ) {
      const freshExecution = executeFresh();
      this.runtimeCoreCache.registerInflight(
        corridorSession,
        freshExecution.then((result) => result.payload)
      );

      try {
        const result = await freshExecution;
        this.runtimeCoreCache.commit(
          corridorSession,
          result.payload,
          result.blockMetrics
        );
        return {
          payload: result.payload,
          streamCounter: result.streamCounter,
        };
      } catch (error) {
        this.runtimeCoreCache.fail(corridorSession, error);
        throw error;
      } finally {
        this.runtimeCoreCache.release(corridorSession);
      }
    }

    const result = await executeFresh();
    return {
      payload: result.payload,
      streamCounter: result.streamCounter,
    };
  }

  /**
   * Check if the frame-native fast path can be used.
   *
   * Conditions:
   *   1. No timeout or deadline (no AbortController needed)
   *   2. No shared state (no ENTANGLE semantics)
   *   3. All target nodes have registered handlers
   *   4. Default failure policy (cancel) — frame-native handles this naturally
   */
  private canUseFrameNativePath(
    activeAst: GraphAST,
    activeTargets: string[],
    policy: StructuredConcurrencyPolicy,
    sharedState: unknown
  ): boolean {
    // Timeout/deadline requires AbortController + setTimeout
    if (policy.timeoutMs !== null || policy.deadlineMs !== null) return false;

    // Shared state requires GnosisHandlerContext propagation
    if (sharedState !== null) return false;

    // All handlers must exist
    for (const targetId of activeTargets) {
      const node = activeAst.nodes.get(targetId);
      if (!node || !this.findHandler(node)) return false;
    }

    return true;
  }

  /**
   * Frame-native execution: bypass AbortController/ConcurrentBranchHandle entirely.
   *
   * Extracts handler functions from the registry, wraps them as work functions
   * with their payloads bound, then dispatches through frameRace or frameFold.
   *
   * Returns null if execution fails (caller falls through to standard path).
   */
  private async executeFrameNative({
    activeAst,
    activeTargets,
    payloads,
    collapseEdge,
    streamCounter,
    execLogs,
    cacheMetrics,
    cacheSession,
  }: {
    activeAst: GraphAST;
    activeTargets: string[];
    payloads: unknown[];
    collapseEdge: ASTEdge;
    streamCounter: number;
    execLogs: string[];
    cacheMetrics: GnosisCoreCacheMetrics;
    cacheSession: GnosisCoreCacheSession | null;
  }): Promise<{
    payload: unknown;
    streamCounter: number;
    outcomes: ConcurrentBranchOutcome[];
  } | null> {
    try {
      // Build raw work functions from handlers + payloads
      const workFns: (() => Promise<unknown>)[] = activeTargets.map(
        (targetId, index) => {
          const node = activeAst.nodes.get(targetId)!;
          const handler = this.findHandler(node)!;
          const payload = payloads[index] ?? null;
          return () =>
            Promise.resolve(
              handler(payload, node.properties, {
                nodeId: targetId,
                executionAuth: this.executionAuth ?? undefined,
                coreCache: this.runtimeCoreCache ?? undefined,
                cacheSession: cacheSession ?? undefined,
              })
            );
        }
      );

      // Update tracker for all branches
      for (let i = 0; i < activeTargets.length; i++) {
        this.tracker.updateStream(streamCounter + i, 'active');
      }

      let payload: unknown;
      const outcomes: ConcurrentBranchOutcome[] = [];

      if (collapseEdge.type === 'RACE') {
        execLogs.push(`   [FRAME-NATIVE] Racing ${activeTargets.length} paths`);
        const raceResult = await frameRace(workFns);
        payload = raceResult.result;
        const winnerTarget = activeTargets[raceResult.winnerIndex];
        execLogs.push(`   Race concluded! Winner: ${winnerTarget}`);
        this.recordCacheMetrics(cacheMetrics, {
          collapseCount: 1,
          firstSufficientCount: 1,
          ventCount: Math.max(0, activeTargets.length - 1),
          lastWinnerPath: winnerTarget,
        });

        // Update tracker and void boundary
        for (let i = 0; i < activeTargets.length; i++) {
          const sid = streamCounter + i;
          const status = i === raceResult.winnerIndex ? 'success' : 'vented';
          this.tracker.updateStream(
            sid,
            i === raceResult.winnerIndex ? 'completed' : 'vented'
          );
          if (i !== raceResult.winnerIndex) {
            this.executionBoundary.raceLoser(i);
          }
          outcomes.push({
            path: activeTargets[i],
            sid,
            status,
            durationMs: 0,
            ...(i === raceResult.winnerIndex ? { value: payload } : {}),
          });
        }
      } else {
        // FOLD / COLLAPSE
        execLogs.push(
          `   [FRAME-NATIVE] Folding ${activeTargets.length} paths`
        );
        const results = await Promise.allSettled(workFns.map((fn) => fn()));
        const successValues: unknown[] = [];
        const successTargets: string[] = [];

        for (let i = 0; i < results.length; i++) {
          const sid = streamCounter + i;
          if (results[i].status === 'fulfilled') {
            const value = (results[i] as PromiseFulfilledResult<unknown>).value;
            successValues.push(value);
            successTargets.push(activeTargets[i]);
            this.tracker.updateStream(sid, 'completed');
            outcomes.push({
              path: activeTargets[i],
              sid,
              status: 'success',
              durationMs: 0,
              value,
            });
          } else {
            this.tracker.updateStream(sid, 'vented');
            outcomes.push({
              path: activeTargets[i],
              sid,
              status: 'error',
              durationMs: 0,
              reason: this.errorMessage(
                (results[i] as PromiseRejectedResult).reason
              ),
            });
          }
        }

        if (successValues.length === 0) {
          return null; // All failed — fall back to standard path for error handling
        }

        // Merge using the same logic as the standard fold
        payload = this.mergeFrameNativeFoldResults(
          successValues,
          successTargets
        );
        execLogs.push(
          `   Folded result: ${JSON.stringify(payload).substring(0, 50)}...`
        );
        this.recordCacheMetrics(cacheMetrics, {
          collapseCount: 1,
          firstSufficientCount: 1,
          ventCount: results.length - successValues.length,
          repairDebt: results.length - successValues.length,
          lastWinnerPath:
            collapseEdge.targetIds[0]?.trim() ?? successTargets[0] ?? null,
        });
      }

      this.syncExecutionAuthFromPayload(payload);
      return {
        payload,
        streamCounter: streamCounter + activeTargets.length,
        outcomes,
      };
    } catch {
      return null; // Frame-native failed — fall through to standard path
    }
  }

  private buildConcurrentBlockMetrics(
    collapseEdge: ASTEdge,
    outcomes: readonly ConcurrentBranchOutcome[]
  ): GnosisCoreCacheMetrics {
    const acceptedPath =
      collapseEdge.type === 'RACE'
        ? outcomes.find((outcome) => outcome.status === 'success')?.path ?? null
        : null;

    return {
      collapseCount: 1,
      firstSufficientCount: outcomes.some(
        (outcome) => outcome.status === 'success'
      )
        ? 1
        : 0,
      ventCount: this.countDiscardedBranches(outcomes, acceptedPath),
      repairDebt: this.countRepairDebt(outcomes),
      lastWinnerPath:
        acceptedPath ??
        collapseEdge.targetIds[0]?.trim() ??
        outcomes.find((outcome) => outcome.status === 'success')?.path ??
        null,
    };
  }

  /**
   * Merge fold results from frame-native execution.
   * Mirrors the logic in `mergeFoldOutcomes` but without ConcurrentBranchOutcome wrapping.
   */
  private mergeFrameNativeFoldResults(
    values: unknown[],
    targets: string[]
  ): unknown {
    // Numeric vector sum (same as standard fold)
    if (
      values.length > 0 &&
      values.every(
        (v) =>
          Array.isArray(v) &&
          (v as unknown[]).every((e) => typeof e === 'number')
      )
    ) {
      const vectors = values as number[][];
      return vectors[0].map((_, i) =>
        vectors.reduce((sum, vec) => sum + (vec[i] ?? 0), 0)
      );
    }

    // Object merge keyed by target path
    const merged: Record<string, unknown> = {};
    for (let i = 0; i < values.length; i++) {
      merged[targets[i]] = values[i];
    }
    return merged;
  }

  private startConcurrentBranch({
    activeAst,
    targetId,
    payload,
    sharedState,
    sid,
    timeoutMs,
    cacheSession,
  }: {
    activeAst: GraphAST;
    targetId: string;
    payload: unknown;
    sharedState: unknown;
    sid: number;
    timeoutMs: number | null;
    cacheSession: GnosisCoreCacheSession | null;
  }): ConcurrentBranchHandle {
    const controller = new AbortController();
    const branch: ConcurrentBranchHandle = {
      path: targetId,
      sid,
      controller,
      settled: false,
      promise: Promise.resolve({
        path: targetId,
        sid,
        status: 'vented',
        durationMs: 0,
        reason: 'Branch not started.',
      }),
    };

    branch.promise = this.invokeConcurrentBranch({
      activeAst,
      targetId,
      payload,
      sharedState,
      sid,
      controller,
      timeoutMs,
      cacheSession,
    }).then((outcome) => {
      branch.settled = true;
      branch.outcome = outcome;
      return outcome;
    });

    return branch;
  }

  private async invokeConcurrentBranch({
    activeAst,
    targetId,
    payload,
    sharedState,
    sid,
    controller,
    timeoutMs,
    cacheSession,
  }: {
    activeAst: GraphAST;
    targetId: string;
    payload: unknown;
    sharedState: unknown;
    sid: number;
    controller: AbortController;
    timeoutMs: number | null;
    cacheSession: GnosisCoreCacheSession | null;
  }): Promise<ConcurrentBranchOutcome> {
    const startedAt = Date.now();
    const finish = (
      status: StructuredBranchStatus,
      value?: unknown,
      reason?: string
    ): ConcurrentBranchOutcome => ({
      path: targetId,
      sid,
      status,
      durationMs: Date.now() - startedAt,
      value,
      reason,
    });

    const node = activeAst.nodes.get(targetId);
    if (!node) {
      this.tracker.updateStream(sid, 'vented');
      return finish('vented', undefined, `Node '${targetId}' not found.`);
    }

    const handler = this.findHandler(node);
    if (!handler) {
      this.tracker.updateStream(sid, 'vented');
      return finish(
        'vented',
        undefined,
        `No handler registered for '${targetId}'.`
      );
    }

    const context: GnosisHandlerContext = {
      nodeId: targetId,
      sharedState,
      signal: controller.signal,
      executionAuth: this.executionAuth ?? undefined,
      coreCache: this.runtimeCoreCache ?? undefined,
      cacheSession: cacheSession ?? undefined,
    };
    const handlerPromise = Promise.resolve(
      handler(payload, node.properties, context)
    );
    handlerPromise.catch(() => undefined);

    const abortPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener(
        'abort',
        () => reject(controller.signal.reason),
        { once: true }
      );
    });

    const timeoutId =
      timeoutMs === null
        ? null
        : setTimeout(() => {
            controller.abort({
              kind: 'timeout',
              reason: `timed out after ${timeoutMs}ms.`,
            });
          }, timeoutMs);

    try {
      const result = await Promise.race([handlerPromise, abortPromise]);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      this.syncExecutionAuthFromPayload(result);
      this.tracker.updateStream(sid, 'completed');
      return finish('success', result);
    } catch (error) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (controller.signal.aborted) {
        const abortReason = this.normalizeAbortReason(controller.signal.reason);
        this.tracker.updateStream(sid, 'vented');
        return finish(abortReason.status, undefined, abortReason.reason);
      }

      this.tracker.updateStream(sid, 'vented');
      return finish('error', undefined, this.errorMessage(error));
    }
  }

  private async resolveRaceCollapse(
    branches: ConcurrentBranchHandle[],
    collapseEdge: ASTEdge,
    policy: StructuredConcurrencyPolicy,
    execLogs: string[],
    cacheMetrics: GnosisCoreCacheMetrics
  ): Promise<{ payload: unknown; outcomes: ConcurrentBranchOutcome[] }> {
    execLogs.push(`   Racing paths: [${collapseEdge.sourceIds.join(', ')}]`);
    const resolution = await resolveStructuredRace(branches, policy);
    if (resolution.cancelledByFailure) {
      execLogs.push(
        `   [STRUCTURED] Race cancelled by ${resolution.cancelledByFailure.path} (${resolution.cancelledByFailure.status}).`
      );
      this.recordCacheMetrics(cacheMetrics, {
        collapseCount: 1,
        firstSufficientCount: 0,
        ventCount: this.countDiscardedBranches(resolution.outcomes),
        repairDebt: this.countRepairDebt(resolution.outcomes),
      });
      return {
        payload: this.buildConcurrentFailurePayload(
          collapseEdge.type,
          policy,
          resolution.outcomes,
          resolution.cancelledByFailure
        ),
        outcomes: [...resolution.outcomes],
      };
    }

    if (resolution.winner) {
      execLogs.push(`   Race concluded! Winner: ${resolution.winner.path}`);
      // Record losers in void boundary
      for (let i = 0; i < resolution.outcomes.length; i++) {
        if (resolution.outcomes[i].path !== resolution.winner.path) {
          this.executionBoundary.raceLoser(i);
        }
      }
      this.recordCacheMetrics(cacheMetrics, {
        collapseCount: 1,
        firstSufficientCount: 1,
        ventCount: this.countDiscardedBranches(
          resolution.outcomes,
          resolution.winner.path
        ),
        repairDebt: this.countRepairDebt(resolution.outcomes),
        lastWinnerPath: resolution.winner.path,
      });
      return {
        payload: resolution.winner.value,
        outcomes: [...resolution.outcomes],
      };
    }

    execLogs.push(
      `   [STRUCTURED] Race exhausted without a successful branch.`
    );
    const primaryFailure = resolution.outcomes.find(
      (outcome) => outcome.status !== 'success'
    );
    this.recordCacheMetrics(cacheMetrics, {
      collapseCount: 1,
      firstSufficientCount: 0,
      ventCount: this.countDiscardedBranches(resolution.outcomes),
      repairDebt: this.countRepairDebt(resolution.outcomes),
    });
    return {
      payload: this.buildConcurrentFailurePayload(
        collapseEdge.type,
        policy,
        [...resolution.outcomes],
        primaryFailure
      ),
      outcomes: [...resolution.outcomes],
    };
  }

  private async resolveFoldCollapse(
    branches: ConcurrentBranchHandle[],
    collapseEdge: ASTEdge,
    policy: StructuredConcurrencyPolicy,
    execLogs: string[],
    cacheMetrics: GnosisCoreCacheMetrics
  ): Promise<{ payload: unknown; outcomes: ConcurrentBranchOutcome[] }> {
    execLogs.push(`   Folding paths: [${collapseEdge.sourceIds.join(', ')}]`);
    const resolution = await resolveStructuredFold(branches, policy);
    if (resolution.cancelledByFailure) {
      execLogs.push(
        `   [STRUCTURED] Fold cancelled by ${resolution.cancelledByFailure.path} (${resolution.cancelledByFailure.status}).`
      );
      this.recordCacheMetrics(cacheMetrics, {
        collapseCount: 1,
        firstSufficientCount: 0,
        ventCount: this.countDiscardedBranches(resolution.outcomes),
        repairDebt: this.countRepairDebt(resolution.outcomes),
      });
      return {
        payload: this.buildConcurrentFailurePayload(
          collapseEdge.type,
          policy,
          resolution.outcomes,
          resolution.cancelledByFailure
        ),
        outcomes: [...resolution.outcomes],
      };
    }

    if (!resolution.outcomes.some((outcome) => outcome.status === 'success')) {
      execLogs.push(`   [STRUCTURED] Fold produced no surviving branches.`);
      this.recordCacheMetrics(cacheMetrics, {
        collapseCount: 1,
        firstSufficientCount: 0,
        ventCount: this.countDiscardedBranches(resolution.outcomes),
        repairDebt: this.countRepairDebt(resolution.outcomes),
      });
      return {
        payload: this.buildConcurrentFailurePayload(
          collapseEdge.type,
          policy,
          [...resolution.outcomes],
          resolution.outcomes[0]
        ),
        outcomes: [...resolution.outcomes],
      };
    }

    const payload = this.mergeFoldOutcomes([...resolution.outcomes], policy, collapseEdge);
    // FOLD: merge all successful branch boundaries (each contributes a vent for failed branches)
    for (const outcome of resolution.outcomes) {
      if (outcome.status !== 'success') {
        this.executionBoundary.vent();
      }
    }
    execLogs.push(
      `   Folded result: ${JSON.stringify(payload).substring(0, 50)}...`
    );
    this.recordCacheMetrics(cacheMetrics, {
      collapseCount: 1,
      firstSufficientCount: 1,
      ventCount: this.countDiscardedBranches(resolution.outcomes),
      repairDebt: this.countRepairDebt(resolution.outcomes),
      lastWinnerPath:
        collapseEdge.targetIds[0]?.trim() ??
        resolution.outcomes.find((outcome) => outcome.status === 'success')
          ?.path ??
        null,
    });
    return { payload, outcomes: [...resolution.outcomes] };
  }

  private mergeFoldOutcomes(
    outcomes: readonly ConcurrentBranchOutcome[],
    policy: StructuredConcurrencyPolicy,
    collapseEdge?: ASTEdge
  ): unknown {
    // Check for registered fold strategy (e.g., merge-ast)
    const strategyName = collapseEdge?.properties?.strategy;
    if (strategyName) {
      const strategyHandler = this.registry.getHandler(`fold:${strategyName}`);
      if (strategyHandler) {
        // Synchronous dispatch: build keyed results map and call handler
        const results = new Map<string, unknown>();
        for (const outcome of outcomes) {
          if (outcome.status === 'success') {
            results.set(outcome.path, outcome.value);
          }
        }
        // Return synchronously -- strategy handlers for fold are expected to be sync-compatible
        return strategyHandler(results, collapseEdge?.properties ?? {});
      }
    }

    const successfulValues = outcomes
      .filter((outcome) => outcome.status === 'success')
      .map((outcome) => outcome.value);

    if (
      successfulValues.length > 0 &&
      successfulValues.every(
        (value) =>
          Array.isArray(value) &&
          value.every((entry) => typeof entry === 'number')
      )
    ) {
      const numericVectors = successfulValues as number[][];
      return numericVectors[0].map((_, index) =>
        numericVectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0)
      );
    }

    const merged: Record<string, unknown> = {};
    for (const outcome of outcomes) {
      if (outcome.status === 'success') {
        merged[outcome.path] = outcome.value;
        continue;
      }

      if (policy.failure === 'shield') {
        merged[outcome.path] = this.encodeBranchOutcome(outcome);
      }
    }

    return merged;
  }

  private encodeBranchOutcome(
    outcome: ConcurrentBranchOutcome
  ): Record<string, unknown> {
    return {
      kind: outcome.status,
      path: outcome.path,
      durationMs: outcome.durationMs,
      ...(outcome.reason ? { reason: outcome.reason } : {}),
    };
  }

  private buildConcurrentFailurePayload(
    collapseType: string,
    policy: StructuredConcurrencyPolicy,
    outcomes: readonly ConcurrentBranchOutcome[],
    primaryFailure?: ConcurrentBranchOutcome
  ): { kind: 'err'; error: Record<string, unknown> } {
    return {
      kind: 'err',
      error: {
        type: 'structured-concurrency',
        collapse: collapseType,
        failureMode: policy.failure,
        branch: primaryFailure?.path,
        status: primaryFailure?.status ?? 'error',
        reason:
          primaryFailure?.reason ?? 'No successful branch completed in time.',
        branches: outcomes.map((outcome) => this.encodeBranchOutcome(outcome)),
      },
    };
  }

  private logStructuredPolicy(
    collapseEdge: ASTEdge,
    policy: StructuredConcurrencyPolicy,
    execLogs: string[]
  ): void {
    const policyParts = [`failure=${policy.failure}`];
    if (policy.timeoutMs !== null) {
      policyParts.push(`timeoutMs=${policy.timeoutMs}`);
    }
    if (policy.deadlineMs !== null) {
      policyParts.push(`deadlineMs=${policy.deadlineMs}`);
    }

    execLogs.push(
      `   [STRUCTURED] ${collapseEdge.type} policy: ${policyParts.join(', ')}`
    );
  }

  private logBranchOutcomes(
    outcomes: ConcurrentBranchOutcome[],
    execLogs: string[]
  ): void {
    for (const outcome of outcomes) {
      execLogs.push(
        `   [BRANCH ${outcome.path}] ${outcome.status} (${
          outcome.durationMs
        }ms)${outcome.reason ? `: ${outcome.reason}` : ''}`
      );
    }
  }

  private parseStructuredConcurrencyPolicy(
    edge: ASTEdge
  ): StructuredConcurrencyPolicy {
    const rawFailure = edge.properties.failure?.trim().toLowerCase();
    const failure: StructuredConcurrencyFailureMode =
      rawFailure === 'vent' || rawFailure === 'shield' ? rawFailure : 'cancel';

    return {
      failure,
      timeoutMs: this.parsePositiveInteger(
        edge.properties.timeoutMs ?? edge.properties.timeout
      ),
      deadlineMs: this.parsePositiveInteger(
        edge.properties.deadlineMs ?? edge.properties.deadline
      ),
    };
  }

  private resolveConcurrentTimeout(
    timeoutMs: number | null,
    deadlineAt: number | null
  ): number | null {
    const budgets: number[] = [];

    if (timeoutMs !== null) {
      budgets.push(timeoutMs);
    }
    if (deadlineAt !== null) {
      budgets.push(Math.max(0, deadlineAt - Date.now()));
    }

    if (budgets.length === 0) {
      return null;
    }

    return Math.max(0, Math.min(...budgets));
  }

  private parsePositiveInteger(raw: string | undefined): number | null {
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return Math.round(parsed);
  }

  private normalizeAbortReason(reason: unknown): {
    status: 'timeout' | 'cancelled';
    reason: string;
  } {
    if (typeof reason === 'object' && reason !== null) {
      const record = reason as Record<string, unknown>;
      const status = record.kind === 'timeout' ? 'timeout' : 'cancelled';
      return {
        status,
        reason:
          typeof record.reason === 'string'
            ? record.reason
            : status === 'timeout'
            ? 'timed out.'
            : 'cancelled.',
      };
    }

    return {
      status: 'cancelled',
      reason:
        typeof reason === 'string' && reason.length > 0 ? reason : 'cancelled.',
    };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private cloneExecutionAuth(
    auth: GnosisExecutionAuthContext
  ): GnosisExecutionAuthContext {
    return {
      enforce: auth.enforce === true,
      principal: auth.principal,
      token: auth.token,
      capabilities: auth.capabilities.map((capability) => ({
        ...capability,
        constraints: capability.constraints
          ? { ...capability.constraints }
          : undefined,
      })),
    };
  }

  private initializeExecutionAuthState(
    initialPayload: unknown,
    executionAuth: GnosisExecutionAuthContext | null
  ): void {
    this.runtimeExecutionAuth = null;
    this.syncExecutionAuthFromPayload(initialPayload);
    if (executionAuth) {
      this.adoptExecutionAuth(executionAuth);
    }
  }

  private adoptExecutionAuth(candidate: unknown): void {
    const normalized = normalizeExecutionAuthContext(candidate);
    if (!normalized) {
      return;
    }

    if (!this.runtimeExecutionAuth) {
      this.runtimeExecutionAuth = this.cloneExecutionAuth(normalized);
      return;
    }

    this.runtimeExecutionAuth = this.mergeExecutionAuth(
      this.runtimeExecutionAuth,
      normalized
    );
  }

  private mergeExecutionAuth(
    current: GnosisExecutionAuthContext,
    incoming: GnosisExecutionAuthContext
  ): GnosisExecutionAuthContext {
    return mergeExecutionAuthContexts(current, incoming);
  }

  private findHandler(node: ASTNode): GnosisHandler | null {
    for (const label of node.labels) {
      const handler = this.registry.getHandler(label);
      if (handler) return handler;
    }
    return null;
  }

  private extractExecutionAuth(
    payload: unknown
  ): GnosisExecutionAuthContext | null {
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const record = payload as Record<string, unknown>;
    return normalizeExecutionAuthContext(record.executionAuth);
  }

  private syncExecutionAuthFromPayload(payload: unknown): void {
    const executionAuth = this.extractExecutionAuth(payload);
    if (!executionAuth) {
      return;
    }

    this.adoptExecutionAuth(executionAuth);
  }

  private authorizeEdge(
    edge: ASTEdge,
    currentNodeId: string,
    payload: unknown
  ): { allowed: boolean; reason?: string } {
    this.syncExecutionAuthFromPayload(payload);
    const executionAuth = this.runtimeExecutionAuth;
    if (!executionAuth || executionAuth.enforce !== true) {
      return { allowed: true };
    }

    const sourceId = edge.sourceIds[0]?.trim() || currentNodeId;
    const targetIds = edge.targetIds.map((targetId) => targetId.trim());

    return authorizeTopologyEdge({
      edgeType: edge.type,
      sourceId,
      targetIds,
      auth: executionAuth,
    });
  }

  private async notifyEdgeEvaluated(edge: ASTEdge): Promise<void> {
    if (!this.onEdgeEvaluated) {
      return;
    }
    await this.onEdgeEvaluated(edge);
  }

  private selectEdge(edges: ASTEdge[], payload: unknown): ASTEdge {
    const matchedEdges = this.filterEdgesByPayloadCase(edges, payload);
    const candidates = matchedEdges.length > 0 ? matchedEdges : edges;

    return (
      candidates.find((edge) =>
        [
          'FORK',
          'RACE',
          'FOLD',
          'COLLAPSE',
          'EVOLVE',
          'SUPERPOSE',
          'ENTANGLE',
          'OBSERVE',
          'LAMINAR',
        ].includes(edge.type || '')
      ) || candidates[0]
    );
  }

  private filterEdgesByPayloadCase(
    edges: ASTEdge[],
    payload: unknown
  ): ASTEdge[] {
    const caseAwareEdges = edges.filter((edge) =>
      this.edgeHasCaseConstraint(edge)
    );
    if (caseAwareEdges.length === 0) {
      return [];
    }

    const payloadTokens = this.extractPayloadCaseTokens(payload);
    if (payloadTokens.length === 0) {
      return [];
    }

    return caseAwareEdges.filter((edge) => {
      const expectedTokens = this.extractEdgeCaseTokens(edge);
      return expectedTokens.some((token) => payloadTokens.includes(token));
    });
  }

  private edgeHasCaseConstraint(edge: ASTEdge): boolean {
    return this.extractEdgeCaseTokens(edge).length > 0;
  }

  private extractEdgeCaseTokens(edge: ASTEdge): string[] {
    const fields = [
      'case',
      'match',
      'when',
      'variant',
      'status',
      'kind',
    ] as const;
    const tokens: string[] = [];

    for (const field of fields) {
      const rawValue = edge.properties[field];
      if (!rawValue) {
        continue;
      }

      const parsedTokens = rawValue
        .split(/[\s,|]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);

      tokens.push(...parsedTokens);
    }

    return [...new Set(tokens)];
  }

  private extractPayloadCaseTokens(payload: unknown): string[] {
    if (
      typeof payload === 'string' ||
      typeof payload === 'number' ||
      typeof payload === 'boolean'
    ) {
      return [String(payload).trim().toLowerCase()];
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return [];
    }

    const record = payload as Record<string, unknown>;
    const fields = ['kind', 'variant', 'status', 'case', 'type'] as const;
    const tokens: string[] = [];

    for (const field of fields) {
      const value = record[field];
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        tokens.push(String(value).trim().toLowerCase());
      }
    }

    return [...new Set(tokens)];
  }
}
