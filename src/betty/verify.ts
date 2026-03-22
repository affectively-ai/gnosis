/**
 * verify.ts -- Standalone verification passes extracted from BettyCompiler.
 *
 * Each pass is a pure function operating on (ast, b1) or (ast, stability).
 * BettyCompiler.parse() calls runAllVerificationPasses() which orchestrates them.
 * Betti's verifier handler calls the same passes.
 */

import type { GraphAST, Diagnostic, DeficitAnalysis } from './compiler.js';
import type { StabilityReport } from './stability.js';
import type { OptimizerResult } from './optimizer.js';
import type { CoarseningSynthesisResult } from './coarsen.js';
import type { SemanticCompatibilityResult } from './semantic-compatibility.js';
import type { HopeCertificate } from './semantic-hope.js';
import { analyzeTopologyStability } from './stability.js';
import { createDefaultOptimizer } from './optimizer.js';
import {
  extractFiberPartition,
  validatePartition,
  synthesizeCoarsening,
} from './coarsen.js';
import { analyzeSemanticCompatibility } from './semantic-compatibility.js';
import { generateHopeCertificate } from './semantic-hope.js';

// ============================================================================
// Verification result
// ============================================================================

export interface VerificationResult {
  diagnostics: Diagnostic[];
  stability: StabilityReport | null;
  optimizer: OptimizerResult | null;
  coarseningSynthesis: CoarseningSynthesisResult | null;
  voidDimensions: number;
  landauerHeat: number;
  deficit: DeficitAnalysis | null;
  semanticCompatibility: SemanticCompatibilityResult | null;
  hopeCertificate: HopeCertificate | null;
  /** The AST after optimizer transforms (may differ from input). */
  ast: GraphAST;
}

// ============================================================================
// Individual pass helpers
// ============================================================================

/**
 * Compute void dimensions: sum of FORK branch counts.
 */
export function computeVoidDimensions(ast: GraphAST): number {
  let dims = 0;
  for (const edge of ast.edges) {
    if (edge.type === 'FORK') {
      dims += edge.targetIds.length;
    }
  }
  return dims;
}

/**
 * Compute Landauer heat: kT ln(2) per irreversible bit erasure.
 * Each FOLD/COLLAPSE/OBSERVE merging N sources erases log2(N) bits.
 */
export function computeLandauerHeat(ast: GraphAST): number {
  const kT = 1; // normalized
  let heat = 0;
  for (const edge of ast.edges) {
    if (
      edge.type === 'FOLD' ||
      edge.type === 'COLLAPSE' ||
      edge.type === 'OBSERVE'
    ) {
      const n = edge.sourceIds.length;
      if (n > 1) {
        heat += kT * Math.log2(n);
      }
    }
  }
  return heat;
}

/**
 * Compute per-node deficit analysis.
 * Deficit = outgoing branching factor - incoming merge factor.
 */
export function computeDeficitAnalysis(ast: GraphAST): DeficitAnalysis {
  const perNode = new Map<string, number>();
  const diagnostics: Diagnostic[] = [];

  for (const [nodeId] of ast.nodes) {
    let outBranching = 0;
    let inMerging = 0;

    for (const edge of ast.edges) {
      if (edge.sourceIds.includes(nodeId)) {
        outBranching += edge.targetIds.length;
      }
      if (edge.targetIds.includes(nodeId)) {
        inMerging += edge.sourceIds.length;
      }
    }

    const deficit = outBranching - inMerging;
    perNode.set(nodeId, deficit);
  }

  const totalDeficit = Array.from(perNode.values()).reduce(
    (sum, d) => sum + Math.abs(d),
    0
  );

  return { perNode, totalDeficit, diagnostics };
}

// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Run all verification passes on an AST.
 *
 * This is the standalone equivalent of the verification section in
 * BettyCompiler.parse() (lines 467-594). The BettyCompiler instance
 * methods (checkTaggedNodeExhaustiveness, checkVoidWalkerInvariants, etc.)
 * remain on the class for now -- this function runs the passes that
 * operate on pure data without needing the compiler's internal state.
 */
export function runAllVerificationPasses(
  ast: GraphAST,
  b1: number
): VerificationResult {
  const diagnostics: Diagnostic[] = [];
  let currentAst = ast;

  // ── FORK: independent passes that only need the AST ──────────────
  // These run first because they don't depend on stability/optimizer.
  // Conceptually forked: semantic on one path, metrics on another.

  // Semantic compatibility (independent of stability chain)
  const semanticCompatibility = analyzeSemanticCompatibility(currentAst);
  diagnostics.push(...semanticCompatibility.diagnostics);

  // O(E) metric passes (independent of everything -- just read edges)
  const voidDimensions = computeVoidDimensions(currentAst);
  const landauerHeat = computeLandauerHeat(currentAst);
  const deficit = computeDeficitAnalysis(currentAst);

  // ── SEQUENTIAL CHAIN: stability → optimizer → coarsening ─────────
  // These form a blocking dependency chain.

  const stability = analyzeTopologyStability(currentAst, b1);
  if (stability) {
    diagnostics.push(...stability.diagnostics);

    // Optimizer passes (needs stability)
    const optimizer = createDefaultOptimizer();
    const optimizerResult = optimizer.apply(currentAst, stability);
    currentAst = optimizerResult.ast;
    diagnostics.push(...optimizerResult.diagnostics);

    // Coarsening synthesis (needs stability + optimized AST)
    const partition = extractFiberPartition(currentAst);
    let coarseningSynthesis: CoarseningSynthesisResult | null = null;
    if (partition) {
      const valDiags = validatePartition(partition, stability);
      diagnostics.push(...valDiags);
      if (!valDiags.some((d) => d.severity === 'error')) {
        coarseningSynthesis = synthesizeCoarsening(
          currentAst,
          stability,
          partition
        );
        diagnostics.push(...coarseningSynthesis.diagnostics);
      }
    }

    // ── FOLD: merge independent + sequential results ─────────────
    // Hope certificate depends on semantic (already done above)
    const hopeCertificate = generateHopeCertificate(
      currentAst,
      semanticCompatibility
    );

    return {
      diagnostics,
      stability,
      optimizer: optimizerResult,
      coarseningSynthesis,
      voidDimensions,
      landauerHeat,
      deficit,
      semanticCompatibility,
      hopeCertificate,
      ast: currentAst,
    };
  }

  // No stability report -- independent passes already computed above
  return {
    diagnostics,
    stability: null,
    optimizer: null,
    coarseningSynthesis: null,
    voidDimensions,
    landauerHeat,
    deficit,
    semanticCompatibility,
    hopeCertificate: null,
    ast: currentAst,
  };
}
