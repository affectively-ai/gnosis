import { ReynoldsTracker, frameRace, frameFold, type FrameRaceResult } from '@affectively/aeon-pipelines';
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
import { injectSensitiveZkEnvelopes } from '../auth/auto-zk.js';
import type { GnosisHandler, GnosisHandlerContext } from './registry.js';
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
}

export interface GnosisEngineExecuteOptions {
  executionAuth?: GnosisExecutionAuthContext | null;
}

export interface GnosisEngineExecutionResult {
  logs: string;
  payload: unknown;
}

export class GnosisEngine {
  private registry: GnosisRegistry;
  private bridge: QuantumWasmBridge;
  private tracker: ReynoldsTracker;
  private onEdgeEvaluated: ((edge: ASTEdge) => Promise<void> | void) | null;
  private runtimeExecutionAuth: GnosisExecutionAuthContext | null = null;

  constructor(registry?: GnosisRegistry, options: GnosisEngineOptions = {}) {
    this.registry = registry || new GnosisRegistry();
    registerCoreAuthHandlers(this.registry);
    registerCoreRuntimeHandlers(this.registry);
    this.bridge = new QuantumWasmBridge();
    this.tracker = new ReynoldsTracker(128); // Default capacity
    this.onEdgeEvaluated = options.onEdgeEvaluated ?? null;
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
    if (ast.edges.length === 0) {
      return {
        logs: '[Engine] No graph to execute.',
        payload: initialPayload,
      };
    }

    this.initializeExecutionAuthState(
      initialPayload,
      options.executionAuth ?? null
    );

    const autoInjected = injectSensitiveZkEnvelopes(ast);
    const activeAst = autoInjected.ast;
    this.tracker = new ReynoldsTracker(activeAst.nodes.size || 128);
    const execLogs: string[] = ['\n[Gnosis Engine Execution]'];
    if (autoInjected.injected.length > 0) {
      execLogs.push(
        `Auto-injected ${autoInjected.injected.length} ZK envelope node(s) for sensitive flows.`
      );
    }
    let currentPayload = initialPayload;

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
          });
          this.syncExecutionAuthFromPayload(currentPayload);
          this.tracker.updateStream(sid, 'completed');
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

        let activeTargets = [...edge.targetIds];

        // 1. EVOLVE corollary: Dynamic Scaling based on Reynolds Number
        if (edge.type === 'EVOLVE') {
          const re = this.tracker.metrics().reynoldsNumber;
          const maxRe = parseFloat(edge.properties.max_re || '0.7');
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
        });
        currentPayload = concurrentResult.payload;
        this.syncExecutionAuthFromPayload(currentPayload);
        streamCounter = concurrentResult.streamCounter;
        currentNodeId = collapseEdge.targetIds[0].trim();
        continue;
      }

      if (edge.type === 'VENT') {
        execLogs.push(`  -> VENTING path: ${edge.sourceIds[0]}`);
      }

      // LAMINAR: hella-whipped pipeline — self-contained fork/race/fold
      // Internally races codecs per chunk, but externally acts like PROCESS.
      // The payload passes through compressed → handler → decompressed.
      if (edge.type === 'LAMINAR') {
        const chunkSize = parseInt(edge.properties.chunk ?? '65536', 10);
        const codecList = edge.properties.codecs ?? 'identity';
        execLogs.push(
          `  [LAMINAR] Hella-whipped pipeline: chunk=${chunkSize}, codecs=${codecList}`
        );
        // LAMINAR is β₁-neutral: internal fork/race/fold is self-contained.
        // The target handler receives the payload and compresses via the
        // registered LaminarCompress (or equivalent) handler.
        // Engine treats it as sequential flow to the target node.
      }

      // Normal sequential flow
      currentNodeId = edge.targetIds[0].trim();
    }

    execLogs.push(`Final System Result: ${JSON.stringify(currentPayload)}`);
    return {
      logs: execLogs.join('\n'),
      payload: currentPayload,
    };
  }

  public get executionAuth(): GnosisExecutionAuthContext | null {
    return this.runtimeExecutionAuth
      ? this.cloneExecutionAuth(this.runtimeExecutionAuth)
      : null;
  }

  private async executeConcurrentBlock({
    activeAst,
    activeTargets,
    payloads,
    sharedState,
    collapseEdge,
    streamCounter,
    execLogs,
  }: {
    activeAst: GraphAST;
    activeTargets: string[];
    payloads: unknown[];
    sharedState: unknown;
    collapseEdge: ASTEdge;
    streamCounter: number;
    execLogs: string[];
  }): Promise<{ payload: unknown; streamCounter: number }> {
    const policy = this.parseStructuredConcurrencyPolicy(collapseEdge);
    this.logStructuredPolicy(collapseEdge, policy, execLogs);

    // ─── Frame-native fast path ───────────────────────────────────────
    // When there are no timeouts, no deadlines, no shared state, and all
    // handlers exist, bypass AbortController/ConcurrentBranchHandle overhead
    // entirely. Direct Promise.race/allSettled on raw handler calls.
    //
    // This gives all .gg topology executions the same 4-5x speedup that
    // frame-native fold/race achieves in aeon-pipelines benchmarks.
    if (this.canUseFrameNativePath(activeAst, activeTargets, policy, sharedState)) {
      const frameResult = await this.executeFrameNative({
        activeAst,
        activeTargets,
        payloads,
        collapseEdge,
        streamCounter,
        execLogs,
      });
      if (frameResult !== null) return frameResult;
      // Fall through to standard path if frame-native fails
    }

    const blockStartedAt = Date.now();
    const deadlineAt =
      policy.deadlineMs === null ? null : blockStartedAt + policy.deadlineMs;

    const branches = activeTargets.map((targetId, index) => {
      const sid = streamCounter++;
      this.tracker.updateStream(sid, 'active');

      return this.startConcurrentBranch({
        activeAst,
        targetId,
        payload: payloads[index] ?? null,
        sharedState,
        sid,
        timeoutMs: this.resolveConcurrentTimeout(policy.timeoutMs, deadlineAt),
      });
    });

    const result =
      collapseEdge.type === 'RACE'
        ? await this.resolveRaceCollapse(
            branches,
            collapseEdge,
            policy,
            execLogs
          )
        : await this.resolveFoldCollapse(
            branches,
            collapseEdge,
            policy,
            execLogs
          );

    this.logBranchOutcomes(result.outcomes, execLogs);
    return {
      payload: result.payload,
      streamCounter,
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
    sharedState: unknown,
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
  }: {
    activeAst: GraphAST;
    activeTargets: string[];
    payloads: unknown[];
    collapseEdge: ASTEdge;
    streamCounter: number;
    execLogs: string[];
  }): Promise<{ payload: unknown; streamCounter: number } | null> {
    try {
      // Build raw work functions from handlers + payloads
      const workFns: (() => Promise<unknown>)[] = activeTargets.map(
        (targetId, index) => {
          const node = activeAst.nodes.get(targetId)!;
          const handler = this.findHandler(node)!;
          const payload = payloads[index] ?? null;
          return () =>
            Promise.resolve(handler(payload, node.properties, {
              nodeId: targetId,
              executionAuth: this.executionAuth ?? undefined,
            }));
        }
      );

      // Update tracker for all branches
      for (let i = 0; i < activeTargets.length; i++) {
        this.tracker.updateStream(streamCounter + i, 'active');
      }

      let payload: unknown;

      if (collapseEdge.type === 'RACE') {
        execLogs.push(
          `   [FRAME-NATIVE] Racing ${activeTargets.length} paths`
        );
        const raceResult = await frameRace(workFns);
        payload = raceResult.result;
        const winnerTarget = activeTargets[raceResult.winnerIndex];
        execLogs.push(`   Race concluded! Winner: ${winnerTarget}`);

        // Update tracker
        for (let i = 0; i < activeTargets.length; i++) {
          const sid = streamCounter + i;
          this.tracker.updateStream(
            sid,
            i === raceResult.winnerIndex ? 'completed' : 'vented'
          );
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
            successValues.push(
              (results[i] as PromiseFulfilledResult<unknown>).value
            );
            successTargets.push(activeTargets[i]);
            this.tracker.updateStream(sid, 'completed');
          } else {
            this.tracker.updateStream(sid, 'vented');
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
      }

      this.syncExecutionAuthFromPayload(payload);
      return { payload, streamCounter: streamCounter + activeTargets.length };
    } catch {
      return null; // Frame-native failed — fall through to standard path
    }
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
  }: {
    activeAst: GraphAST;
    targetId: string;
    payload: unknown;
    sharedState: unknown;
    sid: number;
    timeoutMs: number | null;
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
  }: {
    activeAst: GraphAST;
    targetId: string;
    payload: unknown;
    sharedState: unknown;
    sid: number;
    controller: AbortController;
    timeoutMs: number | null;
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
    execLogs: string[]
  ): Promise<{ payload: unknown; outcomes: ConcurrentBranchOutcome[] }> {
    execLogs.push(`   Racing paths: [${collapseEdge.sourceIds.join(', ')}]`);
    const resolution = await resolveStructuredRace(branches, policy);
    if (resolution.cancelledByFailure) {
      execLogs.push(
        `   [STRUCTURED] Race cancelled by ${resolution.cancelledByFailure.path} (${resolution.cancelledByFailure.status}).`
      );
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
    execLogs: string[]
  ): Promise<{ payload: unknown; outcomes: ConcurrentBranchOutcome[] }> {
    execLogs.push(`   Folding paths: [${collapseEdge.sourceIds.join(', ')}]`);
    const resolution = await resolveStructuredFold(branches, policy);
    if (resolution.cancelledByFailure) {
      execLogs.push(
        `   [STRUCTURED] Fold cancelled by ${resolution.cancelledByFailure.path} (${resolution.cancelledByFailure.status}).`
      );
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

    const payload = this.mergeFoldOutcomes([...resolution.outcomes], policy);
    execLogs.push(
      `   Folded result: ${JSON.stringify(payload).substring(0, 50)}...`
    );
    return { payload, outcomes: [...resolution.outcomes] };
  }

  private mergeFoldOutcomes(
    outcomes: readonly ConcurrentBranchOutcome[],
    policy: StructuredConcurrencyPolicy
  ): unknown {
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
