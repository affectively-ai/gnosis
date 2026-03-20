/**
 * Compiled Topology — AOT-compiled gnosis execution
 *
 * Eliminates the engine interpretation loop entirely. At build time,
 * the gnosis AST is compiled into a flat async function that calls
 * handlers directly in topological order. No AST traversal, no
 * handler lookup, no edge filtering, no visited set, no log construction.
 *
 * The compilation pipeline:
 *   1. TS source → compileTypeScriptToGnosis() → GnosisTypeScriptBridgeResult
 *   2. GnosisTypeScriptBridgeResult → compileTopologyToFunction() → CompiledTopology
 *   3. CompiledTopology.execute(input) → result (no engine)
 *
 * This is the "cannon rubber band" pattern:
 *   - Build time: compile everything to flat functions (potential energy)
 *   - Deploy time: store in D1/KV (armed)
 *   - Cold start: preload all functions into memory (launch velocity)
 *   - Runtime: cannon fires preloaded functions through lanes (kinetic)
 *
 * The hella-whipped Wallington rotation applies at the lane level:
 * multiple CompiledTopology instances rotate through lanes with the
 * cannon cursor, each pre-armed and ready to fire.
 *
 * Performance: eliminates ~230μs engine overhead per execution,
 * leaving only handler execution time + function call overhead (~1-5μs).
 *
 * @module compiled-topology
 */

import type { GraphAST, ASTEdge, ASTNode } from '../betty/compiler.js';
import type { GnosisRegistry, GnosisHandler } from './registry.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A compiled execution step — one handler call with static args.
 */
export interface CompiledStep {
  /** Node ID in the original topology */
  readonly nodeId: string;
  /** The handler function to call */
  readonly handler: GnosisHandler;
  /** Static properties from the AST node */
  readonly properties: Record<string, string>;
  /** Node labels for context */
  readonly labels: readonly string[];
}

/**
 * A compiled fork — parallel branches that race or fold.
 */
export interface CompiledFork {
  readonly kind: 'fork';
  /** Branches to execute in parallel */
  readonly branches: CompiledStep[][];
  /** How to combine: 'race' (first wins) or 'fold' (merge all) */
  readonly strategy: 'race' | 'fold';
  /** Fold properties if strategy is 'fold' */
  readonly foldProps?: Record<string, string>;
}

/**
 * A compiled topology — ready to execute without the engine.
 */
export interface CompiledTopology {
  /** Sequential steps in topological order */
  readonly steps: ReadonlyArray<CompiledStep | CompiledFork>;
  /** Total node count */
  readonly nodeCount: number;
  /** Whether this topology has any forks */
  readonly hasForks: boolean;
  /** Source topology fingerprint for cache keying */
  readonly fingerprint: string;
}

/**
 * Result of compiled topology execution.
 */
export interface CompiledExecutionResult {
  /** Final payload */
  readonly payload: unknown;
  /** Execution time in microseconds */
  readonly executionUs: number;
  /** Number of handler calls made */
  readonly handlerCalls: number;
}

// ============================================================================
// Compilation
// ============================================================================

/**
 * Compile a gnosis AST + registry into a flat execution plan.
 *
 * Resolves handlers at compile time so the hot path is just
 * sequential function calls — no Map lookups, no string matching.
 */
export function compileTopology(
  ast: GraphAST,
  registry: GnosisRegistry,
  fingerprint: string
): CompiledTopology {
  // Find root nodes (not targeted by any edge)
  const allTargetIds = new Set<string>();
  for (const edge of ast.edges) {
    for (const id of edge.targetIds) {
      allTargetIds.add(id.trim());
    }
  }
  const roots = [...ast.nodes.keys()].filter(id => !allTargetIds.has(id.trim()));
  if (roots.length === 0 && ast.nodes.size > 0) {
    const firstEdge = ast.edges[0];
    if (firstEdge) roots.push(firstEdge.sourceIds[0].trim());
    else roots.push([...ast.nodes.keys()][0]);
  }

  // Build adjacency list
  const outEdges = new Map<string, ASTEdge[]>();
  for (const edge of ast.edges) {
    for (const sourceId of edge.sourceIds) {
      const trimmed = sourceId.trim();
      const existing = outEdges.get(trimmed) ?? [];
      existing.push(edge);
      outEdges.set(trimmed, existing);
    }
  }

  // Walk the topology in execution order, compiling steps
  const steps: Array<CompiledStep | CompiledFork> = [];
  const visited = new Set<string>();
  let hasForks = false;

  function resolveHandler(node: ASTNode): GnosisHandler | null {
    // Try each label as a handler name
    for (const label of node.labels) {
      const handler = registry.getHandler(label);
      if (handler) return handler;
    }
    // Try the node ID
    return registry.getHandler(node.id) ?? null;
  }

  function compileNode(nodeId: string): CompiledStep | null {
    const trimmed = nodeId.trim();
    if (visited.has(trimmed)) return null;
    visited.add(trimmed);

    const node = ast.nodes.get(trimmed);
    if (!node) return null;

    const handler = resolveHandler(node);
    if (!handler) return null;

    return {
      nodeId: trimmed,
      handler,
      properties: { ...node.properties },
      labels: [...node.labels],
    };
  }

  // Walk from root, following edges
  let currentNodeId: string | undefined = roots[0];

  while (currentNodeId) {
    const step = compileNode(currentNodeId);
    if (step) steps.push(step);

    const edges = outEdges.get(currentNodeId.trim()) ?? [];
    if (edges.length === 0) break;

    // Check for FORK edges
    const forkEdge = edges.find(e =>
      e.type === 'FORK' || (e.properties as any)?.type === 'FORK'
    );

    if (forkEdge && forkEdge.targetIds.length > 1) {
      hasForks = true;
      // Compile each branch
      const branches: CompiledStep[][] = [];
      for (const targetId of forkEdge.targetIds) {
        const branchStep = compileNode(targetId.trim());
        if (branchStep) branches.push([branchStep]);
      }

      // Find the fold/race edge from the fork targets
      const foldTargets = new Set<string>();
      for (const targetId of forkEdge.targetIds) {
        const foldEdges = outEdges.get(targetId.trim()) ?? [];
        for (const fe of foldEdges) {
          for (const foldTarget of fe.targetIds) {
            foldTargets.add(foldTarget.trim());
          }
        }
      }

      const raceEdge = edges.find(e =>
        e.type === 'RACE' || (e.properties as any)?.type === 'RACE'
      );

      steps.push({
        kind: 'fork',
        branches,
        strategy: raceEdge ? 'race' : 'fold',
        foldProps: forkEdge.properties as Record<string, string>,
      });

      // Continue from fold target
      currentNodeId = foldTargets.size > 0 ? [...foldTargets][0] : undefined;
      continue;
    }

    // Sequential: follow first edge to first target
    const nextEdge = edges[0];
    currentNodeId = nextEdge?.targetIds[0]?.trim();
  }

  return {
    steps,
    nodeCount: ast.nodes.size,
    hasForks,
    fingerprint,
  };
}

// ============================================================================
// Execution — the hot path (no engine, no AST, no lookups)
// ============================================================================

/**
 * Execute a compiled topology. This is the hot path.
 *
 * No AST traversal. No handler lookup. No edge filtering.
 * No visited set. No log construction. Just function calls.
 */
export async function executeCompiled(
  topology: CompiledTopology,
  input: unknown
): Promise<CompiledExecutionResult> {
  const start = performance.now();
  let payload = input;
  let handlerCalls = 0;

  for (const step of topology.steps) {
    if ('kind' in step && step.kind === 'fork') {
      // Parallel execution
      if (step.strategy === 'race') {
        // Race: first to complete wins
        const promises = step.branches.map(async (branch) => {
          let branchPayload = payload;
          for (const branchStep of branch) {
            branchPayload = await branchStep.handler(
              branchPayload,
              branchStep.properties,
              { nodeId: branchStep.nodeId }
            );
            handlerCalls++;
          }
          return branchPayload;
        });
        payload = await Promise.race(promises);
      } else {
        // Fold: run all, merge results
        const promises = step.branches.map(async (branch) => {
          let branchPayload = payload;
          for (const branchStep of branch) {
            branchPayload = await branchStep.handler(
              branchPayload,
              branchStep.properties,
              { nodeId: branchStep.nodeId }
            );
            handlerCalls++;
          }
          return branchPayload;
        });
        const results = await Promise.all(promises);
        // Default fold: take last result (can be customized)
        payload = results[results.length - 1];
      }
    } else {
      // Sequential step — direct handler call
      const seqStep = step as CompiledStep;
      payload = await seqStep.handler(
        payload,
        seqStep.properties,
        { nodeId: seqStep.nodeId }
      );
      handlerCalls++;
    }
  }

  const executionUs = (performance.now() - start) * 1000;

  return {
    payload,
    executionUs,
    handlerCalls,
  };
}

// ============================================================================
// Cannon Launcher — preloaded, armed, rotating execution surface
// ============================================================================

/**
 * A pre-armed cannon lane holding a compiled topology ready to fire.
 */
interface CannonLane {
  readonly compiled: CompiledTopology;
  armed: boolean;
  executions: number;
  lastExecutionUs: number;
}

/**
 * The Cannon Launcher — preloads compiled topologies and rotates
 * execution through lanes with Wallington cursor advancement.
 *
 * This is the "rubber band" pattern:
 * - All topologies compiled and loaded at init (potential energy)
 * - Cannon cursor rotates through lanes (kinetic energy)
 * - Each execution fires a pre-armed lane (work extraction)
 * - Lane re-arms immediately after firing (elastic rebound)
 */
export class CannonLauncher {
  private lanes: CannonLane[] = [];
  private cursor = 0;
  private totalExecutions = 0;

  /**
   * Load a compiled topology into a lane.
   * Call this at startup to pre-arm all lanes.
   */
  load(compiled: CompiledTopology): number {
    const laneIndex = this.lanes.length;
    this.lanes.push({
      compiled,
      armed: true,
      executions: 0,
      lastExecutionUs: 0,
    });
    return laneIndex;
  }

  /**
   * Fire the next lane in rotation.
   * Returns the result and advances the cursor (Wallington rotation).
   */
  async fire(input: unknown): Promise<CompiledExecutionResult & { laneIndex: number }> {
    if (this.lanes.length === 0) {
      throw new Error('CannonLauncher: no lanes loaded');
    }

    const laneIndex = this.cursor;
    const lane = this.lanes[laneIndex];
    this.cursor = (this.cursor + 1) % this.lanes.length;

    const result = await executeCompiled(lane.compiled, input);

    lane.executions++;
    lane.lastExecutionUs = result.executionUs;
    lane.armed = true; // Re-arm immediately (elastic rebound)
    this.totalExecutions++;

    return { ...result, laneIndex };
  }

  /**
   * Fire a specific lane by index (for pinned routing).
   */
  async fireAt(laneIndex: number, input: unknown): Promise<CompiledExecutionResult> {
    const lane = this.lanes[laneIndex];
    if (!lane) throw new Error(`CannonLauncher: lane ${laneIndex} not found`);

    const result = await executeCompiled(lane.compiled, input);
    lane.executions++;
    lane.lastExecutionUs = result.executionUs;
    return result;
  }

  get laneCount(): number {
    return this.lanes.length;
  }

  get stats(): {
    totalExecutions: number;
    lanes: Array<{ executions: number; lastUs: number; armed: boolean }>;
  } {
    return {
      totalExecutions: this.totalExecutions,
      lanes: this.lanes.map(l => ({
        executions: l.executions,
        lastUs: l.lastExecutionUs,
        armed: l.armed,
      })),
    };
  }
}
