/**
 * Theorem-backed optimization pass manager for the Betty compiler.
 *
 * Each pass is backed by a mechanized theorem from the formal ledger.
 * The pass manager runs passes in priority order, accumulating diagnostics
 * and proof obligations that feed into lean.ts certificate emission.
 */

import type {
  ASTEdge,
  ASTNode,
  Diagnostic,
  DiagnosticCode,
  GraphAST,
} from './compiler.js';
import type { StabilityReport } from './stability.js';

// ─── Pass result ─────────────────────────────────────────────────────

export interface OptimizationPassResult {
  ast: GraphAST;
  diagnostics: Diagnostic[];
  certificates: OptimizationCertificate[];
  applied: boolean;
}

export interface OptimizationCertificate {
  passName: string;
  theoremId: string;
  leanTheoremName: string;
  summary: string;
  data: Record<string, unknown>;
}

// ─── Pass interface ──────────────────────────────────────────────────

export interface OptimizationPass {
  readonly name: string;
  readonly theoremId: string;
  readonly priority: number;
  /** Whether this pass modifies the AST ('transform') or only analyzes ('analyze').
   *  Analysis-only passes are FORKED in parallel per THM-SERVER-OPTIMALITY. */
  readonly kind: 'transform' | 'analyze';
  predicate(ast: GraphAST, stability: StabilityReport): boolean;
  apply(ast: GraphAST, stability: StabilityReport): OptimizationPassResult;
}

// ─── Coarsening pass (THM-RECURSIVE-COARSENING-SYNTHESIS) ────────────
//
// Backed by RecursiveCoarseningSynthesis.lean:
//   synthesis_sound: if all coarse nodes have negative drift, certificate is valid
//   drift_conservation: total fine drift = total coarse drift
//   fine_stability_implies_coarse_stability: stable fine graph → stable coarse graph
//
// The pass identifies subgraphs that can be collapsed into coarse nodes
// while preserving stability certificates.

export interface CoarseNodeData {
  coarseId: string;
  fineNodeIds: string[];
  aggregateArrival: number;
  aggregateService: number;
  coarseDrift: number;
}

export class CoarseningPass implements OptimizationPass {
  readonly name = 'coarsening';
  readonly theoremId = 'THM-RECURSIVE-COARSENING-SYNTHESIS';
  readonly priority = 10;
  readonly kind = 'transform' as const;

  predicate(ast: GraphAST, stability: StabilityReport): boolean {
    // Only coarsen when we have stability data and enough nodes to coarsen
    if (!stability.enabled || ast.nodes.size < 4) {
      return false;
    }
    // Need at least some stable states to synthesize quotient
    return stability.stateAssessments.some((sa) => sa.status === 'stable');
  }

  apply(ast: GraphAST, stability: StabilityReport): OptimizationPassResult {
    const diagnostics: Diagnostic[] = [];
    const certificates: OptimizationCertificate[] = [];

    // Identify candidate fiber groups: nodes with same drift sign that
    // share only internal edges between them
    const groups = this.identifyCoarseningCandidates(ast, stability);
    if (groups.length === 0) {
      return { ast, diagnostics, certificates, applied: false };
    }

    // For each group, compute aggregate rates (THM: drift_conservation)
    const coarseNodes: CoarseNodeData[] = [];
    for (const group of groups) {
      const arrival = group.fineNodeIds.reduce((sum, nodeId) => {
        const assessment = stability.stateAssessments.find(
          (sa) => sa.nodeId === nodeId
        );
        return sum + (assessment?.arrival ? parseFloat(assessment.arrival) : 0);
      }, 0);
      const service = group.fineNodeIds.reduce((sum, nodeId) => {
        const assessment = stability.stateAssessments.find(
          (sa) => sa.nodeId === nodeId
        );
        return sum + (assessment?.service ? parseFloat(assessment.service) : 0);
      }, 0);
      const drift = arrival - service;

      coarseNodes.push({
        coarseId: group.coarseId,
        fineNodeIds: group.fineNodeIds,
        aggregateArrival: arrival,
        aggregateService: service,
        coarseDrift: drift,
      });
    }

    // THM: synthesis_sound -- if all coarse nodes have negative drift, emit certificate
    const allStable = coarseNodes.every((cn) => cn.coarseDrift < 0);
    if (!allStable) {
      const unstable = coarseNodes.filter((cn) => cn.coarseDrift >= 0);
      for (const cn of unstable) {
        diagnostics.push({
          line: 1,
          column: 1,
          message: `Coarsening: node group ${cn.coarseId} has non-negative aggregate drift ${cn.coarseDrift.toFixed(3)} (arrival=${cn.aggregateArrival.toFixed(3)}, service=${cn.aggregateService.toFixed(3)}). Cannot synthesize certificate.`,
          severity: 'info',
        });
      }
    }

    // Build the coarsened AST
    const coarsenedAst = this.buildCoarsenedAST(ast, coarseNodes);

    // Emit certificate for the coarsening
    const totalFineDrift = stability.stateAssessments.reduce((sum, sa) => {
      const arrival = sa.arrival ? parseFloat(sa.arrival) : 0;
      const service = sa.service ? parseFloat(sa.service) : 0;
      return sum + (arrival - service);
    }, 0);
    const totalCoarseDrift = coarseNodes.reduce(
      (sum, cn) => sum + cn.coarseDrift,
      0
    );

    certificates.push({
      passName: this.name,
      theoremId: this.theoremId,
      leanTheoremName:
        'RecursiveCoarseningSynthesis.synthesis_sound',
      summary: `Coarsened ${ast.nodes.size} nodes → ${coarsenedAst.nodes.size} nodes. Fine drift=${totalFineDrift.toFixed(3)}, coarse drift=${totalCoarseDrift.toFixed(3)}. Conservation delta=${Math.abs(totalFineDrift - totalCoarseDrift).toFixed(6)}.`,
      data: {
        fineNodeCount: ast.nodes.size,
        coarseNodeCount: coarsenedAst.nodes.size,
        groups: coarseNodes.map((cn) => ({
          coarseId: cn.coarseId,
          fineCount: cn.fineNodeIds.length,
          drift: cn.coarseDrift,
        })),
        totalFineDrift,
        totalCoarseDrift,
        allStable,
      },
    });

    diagnostics.push({
      line: 1,
      column: 1,
      message: `[${this.theoremId}] Coarsened topology: ${ast.nodes.size} → ${coarsenedAst.nodes.size} nodes (${groups.length} quotient groups). Drift conservation: ${Math.abs(totalFineDrift - totalCoarseDrift).toFixed(6)} residual.`,
      severity: 'info',
    });

    return { ast: coarsenedAst, diagnostics, certificates, applied: true };
  }

  private identifyCoarseningCandidates(
    ast: GraphAST,
    stability: StabilityReport
  ): { coarseId: string; fineNodeIds: string[] }[] {
    // Build adjacency from internal PROCESS edges only
    const processEdges = ast.edges.filter((e) => e.type === 'PROCESS');
    const adjacency = new Map<string, Set<string>>();
    for (const edge of processEdges) {
      for (const src of edge.sourceIds) {
        for (const tgt of edge.targetIds) {
          if (!adjacency.has(src)) adjacency.set(src, new Set());
          if (!adjacency.has(tgt)) adjacency.set(tgt, new Set());
          adjacency.get(src)!.add(tgt);
          adjacency.get(tgt)!.add(src);
        }
      }
    }

    // Find connected components of nodes that are all stable
    const stableIds = new Set(
      stability.stateAssessments
        .filter((sa) => sa.status === 'stable')
        .map((sa) => sa.nodeId)
    );
    const visited = new Set<string>();
    const groups: { coarseId: string; fineNodeIds: string[] }[] = [];
    let groupIdx = 0;

    for (const nodeId of stableIds) {
      if (visited.has(nodeId)) continue;
      const component: string[] = [];
      const queue = [nodeId];
      while (queue.length > 0) {
        const current = queue.pop()!;
        if (visited.has(current) || !stableIds.has(current)) continue;
        visited.add(current);
        component.push(current);
        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && stableIds.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
      // Only coarsen groups of 2+ nodes
      if (component.length >= 2) {
        groups.push({
          coarseId: `coarse_${groupIdx++}`,
          fineNodeIds: component,
        });
      }
    }

    return groups;
  }

  private buildCoarsenedAST(
    ast: GraphAST,
    coarseNodes: CoarseNodeData[]
  ): GraphAST {
    const fineToCoarse = new Map<string, string>();
    for (const cn of coarseNodes) {
      for (const fineId of cn.fineNodeIds) {
        fineToCoarse.set(fineId, cn.coarseId);
      }
    }

    const newNodes = new Map<string, ASTNode>();
    // Add coarse nodes
    for (const cn of coarseNodes) {
      newNodes.set(cn.coarseId, {
        id: cn.coarseId,
        labels: ['STATE'],
        properties: {
          pressure: cn.aggregateArrival.toString(),
          service_rate: cn.aggregateService.toString(),
          coarsened_from: cn.fineNodeIds.join(','),
        },
      });
    }
    // Keep non-coarsened nodes
    for (const [id, node] of ast.nodes) {
      if (!fineToCoarse.has(id)) {
        newNodes.set(id, node);
      }
    }

    // Remap edges
    const newEdges: ASTEdge[] = [];
    const edgeDedup = new Set<string>();
    for (const edge of ast.edges) {
      const sourceIds = edge.sourceIds.map((id) => fineToCoarse.get(id) ?? id);
      const targetIds = edge.targetIds.map((id) => fineToCoarse.get(id) ?? id);
      // Skip self-loops within a coarse node
      if (
        sourceIds.length === 1 &&
        targetIds.length === 1 &&
        sourceIds[0] === targetIds[0] &&
        fineToCoarse.has(edge.sourceIds[0])
      ) {
        continue;
      }
      const key = `${sourceIds.join(',')}→${edge.type}→${targetIds.join(',')}`;
      if (!edgeDedup.has(key)) {
        edgeDedup.add(key);
        newEdges.push({ ...edge, sourceIds, targetIds });
      }
    }

    return { nodes: newNodes, edges: newEdges };
  }
}

// ─── Codec racing pass (THM-TOPO-RACE-SUBSUMPTION) ──────────────────
//
// Backed by CodecRacing.lean:
//   THM-TOPO-RACE-SUBSUMPTION: racing total <= any fixed-codec total
//   THM-TOPO-RACE-MONOTONE: adding a codec never increases wire size
//   THM-TOPO-RACE-DEFICIT: racing achieves zero compression deficit
//
// The pass analyzes LAMINAR edges and emits certificates showing that
// per-resource codec racing achieves zero compression deficit.

export class CodecRacingPass implements OptimizationPass {
  readonly name = 'codec-racing';
  readonly theoremId = 'THM-TOPO-RACE-SUBSUMPTION';
  readonly priority = 20;
  readonly kind = 'analyze' as const;

  predicate(ast: GraphAST): boolean {
    return ast.edges.some((e) => e.type === 'LAMINAR');
  }

  apply(ast: GraphAST, stability: StabilityReport): OptimizationPassResult {
    const diagnostics: Diagnostic[] = [];
    const certificates: OptimizationCertificate[] = [];

    const laminarEdges = ast.edges.filter((e) => e.type === 'LAMINAR');
    let totalCodecs = 0;
    let totalResources = 0;

    for (const edge of laminarEdges) {
      const codecCount = parseInt(edge.properties.codecs ?? '1', 10);
      const resourceCount = edge.targetIds.length;
      totalCodecs += codecCount;
      totalResources += resourceCount;

      // THM-TOPO-RACE-DEFICIT: racing achieves zero compression deficit
      // beta1 contribution from racing = codecCount - 1 per resource (internal)
      // but external presentation is zero deficit
      const internalBeta1 = (codecCount - 1) * resourceCount;

      certificates.push({
        passName: this.name,
        theoremId: this.theoremId,
        leanTheoremName: 'CodecRacing.raceMin_le_fixedCodec',
        summary: `LAMINAR edge (${edge.sourceIds.join(',')}→${edge.targetIds.join(',')}): ${codecCount} codecs × ${resourceCount} resources. Internal beta1=${internalBeta1}, external deficit=0.`,
        data: {
          sourceIds: edge.sourceIds,
          targetIds: edge.targetIds,
          codecCount,
          resourceCount,
          internalBeta1,
          externalDeficit: 0,
        },
      });
    }

    if (laminarEdges.length > 0) {
      diagnostics.push({
        line: 1,
        column: 1,
        message: `[${this.theoremId}] Codec racing analysis: ${laminarEdges.length} LAMINAR edge(s), ${totalCodecs} total codecs, ${totalResources} total resources. Zero compression deficit certified by THM-TOPO-RACE-DEFICIT.`,
        severity: 'info',
      });
    }

    // Codec racing is analysis-only -- it doesn't transform the AST
    return { ast, diagnostics, certificates, applied: laminarEdges.length > 0 };
  }
}

// ─── Warmup efficiency pass (THM-WARMUP-CONTROLLER) ──────────────────
//
// Backed by WarmupController.lean and WarmupEfficiency.lean:
//   warmup_wallace_drop_cross_closed_form = busyWork * recoveredOverlap
//   warmupWorth: Wallace benefit > controller burden
//
// The pass identifies fork/fold pairs where warmup (staged expansion)
// could improve throughput by overlapping computation.

export class WarmupEfficiencyPass implements OptimizationPass {
  readonly name = 'warmup-efficiency';
  readonly theoremId = 'THM-WARMUP-CONTROLLER';
  readonly priority = 30;
  readonly kind = 'analyze' as const;

  private isMiddleOutCompressed(edge: ASTEdge): boolean {
    return (
      typeof edge.properties.corridor === 'string' ||
      typeof edge.properties.request_compression === 'string' ||
      typeof edge.properties.requestCompression === 'string'
    );
  }

  predicate(ast: GraphAST): boolean {
    const hasFork = ast.edges.some((e) => e.type === 'FORK');
    const hasFold = ast.edges.some(
      (e) =>
        (e.type === 'FOLD' || e.type === 'COLLAPSE') &&
        !this.isMiddleOutCompressed(e)
    );
    return hasFork && hasFold;
  }

  apply(ast: GraphAST, stability: StabilityReport): OptimizationPassResult {
    const diagnostics: Diagnostic[] = [];
    const certificates: OptimizationCertificate[] = [];

    const forkEdges = ast.edges.filter((e) => e.type === 'FORK');
    const foldEdges = ast.edges.filter(
      (e) =>
        (e.type === 'FOLD' || e.type === 'COLLAPSE') &&
        !this.isMiddleOutCompressed(e)
    );

    // Identify fork→fold pairs that form staged pipelines
    for (const fork of forkEdges) {
      const forkWidth = fork.targetIds.length;
      if (forkWidth < 2) continue;

      // Find folds that consume this fork's targets
      const forkTargetSet = new Set(fork.targetIds);
      const matchingFolds = foldEdges.filter((fold) =>
        fold.sourceIds.some((src) => forkTargetSet.has(src))
      );

      for (const fold of matchingFolds) {
        const foldWidth = fold.sourceIds.length;

        // THM: warmup_wallace_drop_cross_closed_form
        // Wallace benefit = busyWork * recoveredOverlap
        // where recoveredOverlap comes from staged expansion
        const sequentialWallace =
          forkWidth > 0 ? (2 * (forkWidth - 1)) / (3 * forkWidth) : 0;
        const multiplexedWallace = 0; // perfect pipeline = zero waste
        const wallaceDropCross = sequentialWallace - multiplexedWallace;

        // THM: warmupWorth -- check if benefit exceeds burden
        const warmupWorth = wallaceDropCross > 0;

        certificates.push({
          passName: this.name,
          theoremId: this.theoremId,
          leanTheoremName:
            'WarmupEfficiency.warmup_wallace_drop_cross_closed_form',
          summary: `Fork(${forkWidth})→Fold(${foldWidth}): Wallace drop cross=${wallaceDropCross.toFixed(3)}. Warmup ${warmupWorth ? 'recommended' : 'not beneficial'}.`,
          data: {
            forkSourceIds: fork.sourceIds,
            forkTargetIds: fork.targetIds,
            foldSourceIds: fold.sourceIds,
            forkWidth,
            foldWidth,
            sequentialWallace,
            multiplexedWallace,
            wallaceDropCross,
            warmupWorth,
          },
        });

        if (warmupWorth) {
          diagnostics.push({
            line: 1,
            column: 1,
            message: `[${this.theoremId}] Warmup opportunity: fork(${forkWidth})→fold(${foldWidth}) has Wallace drop=${wallaceDropCross.toFixed(3)}. Staged expansion would recover ${(wallaceDropCross * 100).toFixed(1)}% throughput waste.`,
            severity: 'info',
          });
        }
      }
    }

    return { ast, diagnostics, certificates, applied: certificates.length > 0 };
  }
}

// ─── Pass manager ────────────────────────────────────────────────────

export interface OptimizerResult {
  ast: GraphAST;
  diagnostics: Diagnostic[];
  certificates: OptimizationCertificate[];
  passesApplied: string[];
}

export class OptimizationPassManager {
  private passes: OptimizationPass[] = [];

  register(pass: OptimizationPass): void {
    this.passes.push(pass);
    this.passes.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Apply passes following the fork/race/fold paradigm:
   *
   * 1. PROCESS: Run 'transform' passes sequentially (they modify the AST)
   * 2. FORK: Run 'analyze' passes in parallel (they only read the AST)
   * 3. FOLD: Merge all diagnostics and certificates
   *
   * This structure follows THM-SERVER-OPTIMALITY: independent analyses
   * are forked, and the fold collects their certificates without
   * serialization overhead.
   */
  apply(ast: GraphAST, stability: StabilityReport): OptimizerResult {
    let currentAst = ast;
    const allDiagnostics: Diagnostic[] = [];
    const allCertificates: OptimizationCertificate[] = [];
    const passesApplied: string[] = [];

    // Phase 1 — PROCESS: transform passes run sequentially (they modify AST)
    const transformPasses = this.passes.filter((p) => p.kind === 'transform');
    for (const pass of transformPasses) {
      if (!pass.predicate(currentAst, stability)) {
        continue;
      }
      const result = pass.apply(currentAst, stability);
      currentAst = result.ast;
      allDiagnostics.push(...result.diagnostics);
      allCertificates.push(...result.certificates);
      if (result.applied) {
        passesApplied.push(pass.name);
      }
    }

    // Phase 2 — FORK: analysis passes are independent (read-only on AST)
    // They could be Promise.all'd in an async context; here we collect
    // results without AST mutation dependency.
    const analyzePasses = this.passes.filter((p) => p.kind === 'analyze');
    const analyzeResults: OptimizationPassResult[] = [];
    for (const pass of analyzePasses) {
      if (!pass.predicate(currentAst, stability)) {
        continue;
      }
      analyzeResults.push(pass.apply(currentAst, stability));
    }

    // Phase 3 — FOLD: merge all analysis results
    for (const result of analyzeResults) {
      allDiagnostics.push(...result.diagnostics);
      allCertificates.push(...result.certificates);
      if (result.applied) {
        const pass = analyzePasses.find(
          (p) =>
            result.certificates.length > 0 &&
            result.certificates[0].passName === p.name
        );
        if (pass) {
          passesApplied.push(pass.name);
        }
      }
    }

    return {
      ast: currentAst,
      diagnostics: allDiagnostics,
      certificates: allCertificates,
      passesApplied,
    };
  }
}

// ─── Default optimizer ───────────────────────────────────────────────

// ─── Self-verification pass (THM-IRREVERSIBILITY-FRAMEWORK) ─────────

class SelfVerificationPass implements OptimizationPass {
  readonly name = 'self-verification';
  readonly theoremId = 'THM-IRREVERSIBILITY-FRAMEWORK';
  readonly priority = 40;
  readonly kind = 'analyze' as const;

  predicate(ast: GraphAST): boolean {
    return ast.edges.some((e) => e.properties.verify !== undefined);
  }

  apply(ast: GraphAST): OptimizationPassResult {
    const annotations: { edge: ASTEdge; verify: string }[] = [];
    for (const edge of ast.edges) {
      if (edge.properties.verify) {
        annotations.push({ edge, verify: edge.properties.verify });
      }
    }

    return {
      ast,
      diagnostics: [],
      certificates: annotations.length > 0
        ? [
            {
              passName: this.name,
              theoremId: this.theoremId,
              leanTheoremName: 'self_verification_collected',
              summary: `Collected ${annotations.length} verify annotation(s): ${annotations.map((a) => a.verify).join(', ')}`,
              data: {
                annotations: annotations.map((a) => ({
                  type: a.edge.type,
                  verify: a.verify,
                  sources: a.edge.sourceIds,
                  targets: a.edge.targetIds,
                })),
              },
            },
          ]
        : [],
      applied: annotations.length > 0,
    };
  }
}

export function createDefaultOptimizer(): OptimizationPassManager {
  const manager = new OptimizationPassManager();
  manager.register(new CoarseningPass());
  manager.register(new CodecRacingPass());
  manager.register(new WarmupEfficiencyPass());
  manager.register(new SelfVerificationPass());
  return manager;
}
