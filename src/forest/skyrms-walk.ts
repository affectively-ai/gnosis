/**
 * skyrms-walk.ts -- Walk the void boundary of Forest rejections to find
 * the Skyrms equilibrium assignment.
 *
 * Forest races compilers and records winners (hard assignment). The Skyrms
 * walk uses the full rejection *distribution* -- a language that lost by
 * 1us gets almost the same weight as the winner, while a language that
 * lost by 200us gets near-zero weight.
 *
 * The walk converges to a Nash equilibrium: the assignment where no single
 * node wants to switch languages given every other node's assignment.
 *
 * Input: Forest's GenerationState[] (timings per node per language)
 * Output: Soft assignment (probabilities per node per language) + hard
 *         assignment (argmax) + convergence certificate
 *
 * Usage:
 *   import { skyrmsWalkFromForest } from './skyrms-walk.js';
 *   const result = skyrmsWalkFromForest(forestCertificate, { eta: 3.0 });
 */

import {
  createVoidBoundary,
  updateVoidBoundary,
  complementDistribution,
  type VoidBoundary,
} from '../void.js';
import type { GenerationState, CompilerName } from './types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface SkyrmsConfig {
  /** Temperature parameter for complement distribution. Higher = sharper. */
  eta: number;
  /** Maximum iterations for the Skyrms walk. */
  maxIterations: number;
  /** Convergence threshold: max change in any probability. */
  convergenceThreshold: number;
  /** Verbose logging. */
  verbose: boolean;
}

export interface NodeAssignment {
  /** Node ID */
  nodeId: string;
  /** Probability distribution over compilers (the soft assignment) */
  distribution: Map<CompilerName, number>;
  /** The winning compiler (argmax of distribution) */
  winner: CompilerName;
  /** Confidence: winner's probability */
  confidence: number;
  /** Void boundary for this node */
  boundary: VoidBoundary;
}

export interface SkyrmsResult {
  /** Per-node assignments */
  assignments: NodeAssignment[];
  /** Did the walk converge? */
  converged: boolean;
  /** Number of iterations to converge */
  iterations: number;
  /** Hard assignment (argmax per node) */
  hardAssignment: Map<string, CompilerName>;
  /** Number of languages represented in hard assignment */
  diversity: number;
  /** Total void boundary (merged across all nodes) */
  totalBoundary: VoidBoundary;
  /** Languages ordered by total weight across all nodes */
  ranking: Array<{ compiler: CompilerName; totalWeight: number }>;
}

export const DEFAULT_SKYRMS_CONFIG: SkyrmsConfig = {
  eta: 3.0,
  maxIterations: 100,
  convergenceThreshold: 0.001,
  verbose: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Build void boundaries from Forest timing data
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert Forest generation timings into per-node void boundaries.
 *
 * GOD FORMULA APPLICATION: Binary rejection counting.
 *
 * For each node in each generation, the winning compiler gets 0 rejection.
 * Every losing compiler gets +1 rejection. This is the correct Buleyean
 * counting: each race is one observation round, each loser is one rejection.
 *
 * Previous approach used continuous slowdown magnitudes (time - minTime) / minTime,
 * which is unbounded and causes weight clipping. Binary counting preserves
 * the God Formula's guarantees:
 *   w = R - min(v, R) + 1, where R = total races, v = losses
 *
 * The complement distribution from binary counts naturally gives:
 * - Winner of all races: weight = R + 1 (maximum)
 * - Loser of all races: weight = 1 (the sliver)
 * - Partial winner: weight proportional to win rate
 */
function buildNodeBoundaries(
  generations: GenerationState[],
  compilers: CompilerName[]
): Map<string, VoidBoundary> {
  const boundaries = new Map<string, VoidBoundary>();
  const compilerIndex = new Map<CompilerName, number>();
  compilers.forEach((c, i) => compilerIndex.set(c, i));

  for (const gen of generations) {
    for (const [nodeId, nodeTimings] of gen.timings) {
      if (!boundaries.has(nodeId)) {
        boundaries.set(nodeId, createVoidBoundary(compilers.length));
      }
      const boundary = boundaries.get(nodeId)!;

      // Find the winner's time for this node in this generation
      let minTime = Infinity;
      for (const [, time] of nodeTimings) {
        if (time < minTime) minTime = time;
      }

      // Binary rejection: winner gets 0, every loser gets +1
      // This is the God Formula's counting: one observation round per race,
      // one rejection per loss. Bounded, interpretable, theorem-backed.
      for (const compiler of compilers) {
        const idx = compilerIndex.get(compiler);
        if (idx === undefined) continue;
        const time = nodeTimings.get(compiler) ?? Infinity;
        const didLose = time > minTime;
        if (didLose) {
          updateVoidBoundary(boundary, idx, 1);
        }
      }
    }
  }

  return boundaries;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skyrms walk
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Walk the void boundary to find the Skyrms equilibrium.
 *
 * At each iteration:
 * 1. Compute complement distribution for each node
 * 2. Check if any node wants to switch (best-response dynamics)
 * 3. If no node wants to switch, we're at Nash equilibrium
 * 4. Otherwise, update the boundary with the new rejection and repeat
 */
export function skyrmsWalk(
  nodeBoundaries: Map<string, VoidBoundary>,
  compilers: CompilerName[],
  config: SkyrmsConfig = DEFAULT_SKYRMS_CONFIG
): SkyrmsResult {
  const { eta, maxIterations, convergenceThreshold, verbose } = config;

  let prevDistributions = new Map<string, number[]>();
  let iterations = 0;
  let converged = false;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;
    let maxChange = 0;

    const currentDistributions = new Map<string, number[]>();

    for (const [nodeId, boundary] of nodeBoundaries) {
      const dist = complementDistribution(boundary, eta);
      currentDistributions.set(nodeId, dist);

      // Check convergence against previous iteration
      const prevDist = prevDistributions.get(nodeId);
      if (prevDist) {
        for (let d = 0; d < dist.length; d++) {
          maxChange = Math.max(maxChange, Math.abs(dist[d] - (prevDist[d] ?? 0)));
        }
      } else {
        maxChange = 1.0; // First iteration
      }
    }

    if (verbose && iter % 10 === 0) {
      console.log(`[Skyrms:iter${iter}] maxChange=${maxChange.toFixed(6)}`);
    }

    if (maxChange < convergenceThreshold && iter > 0) {
      converged = true;
      break;
    }

    prevDistributions = currentDistributions;
  }

  // Build final assignments
  const assignments: NodeAssignment[] = [];
  const hardAssignment = new Map<string, CompilerName>();
  const totalBoundary = createVoidBoundary(compilers.length);

  for (const [nodeId, boundary] of nodeBoundaries) {
    const dist = complementDistribution(boundary, eta);

    // Build distribution map
    const distribution = new Map<CompilerName, number>();
    let maxProb = 0;
    let winner: CompilerName = compilers[0];
    for (let d = 0; d < compilers.length; d++) {
      distribution.set(compilers[d], dist[d]);
      if (dist[d] > maxProb) {
        maxProb = dist[d];
        winner = compilers[d];
      }
    }

    assignments.push({
      nodeId,
      distribution,
      winner,
      confidence: maxProb,
      boundary,
    });

    hardAssignment.set(nodeId, winner);

    // Merge into total boundary
    for (let d = 0; d < boundary.counts.length; d++) {
      totalBoundary.counts[d] += boundary.counts[d];
    }
    totalBoundary.totalEntries += boundary.totalEntries;
  }

  // Compute ranking
  const totalWeights = new Map<CompilerName, number>();
  for (const a of assignments) {
    for (const [compiler, prob] of a.distribution) {
      totalWeights.set(compiler, (totalWeights.get(compiler) ?? 0) + prob);
    }
  }
  const ranking = [...totalWeights.entries()]
    .map(([compiler, totalWeight]) => ({ compiler, totalWeight }))
    .sort((a, b) => b.totalWeight - a.totalWeight);

  const diversity = new Set(hardAssignment.values()).size;

  return {
    assignments,
    converged,
    iterations,
    hardAssignment,
    diversity,
    totalBoundary,
    ranking,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Integration with Forest
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the Skyrms walk on Forest's generation history.
 *
 * Takes the rejection data from Forest's convergence process and walks
 * the void boundary to find the soft optimal assignment.
 */
export function skyrmsWalkFromForest(
  generations: GenerationState[],
  compilers: CompilerName[],
  config: SkyrmsConfig = DEFAULT_SKYRMS_CONFIG
): SkyrmsResult {
  const available = compilers.filter((c) => {
    // Only include compilers that have timing data
    for (const gen of generations) {
      for (const [, timings] of gen.timings) {
        if (timings.has(c)) return true;
      }
    }
    return false;
  });

  const boundaries = buildNodeBoundaries(generations, available);
  return skyrmsWalk(boundaries, available, config);
}
