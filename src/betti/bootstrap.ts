/**
 * bootstrap.ts -- The Betti bootstrap orchestrator.
 *
 * Pipeline:
 *   1. Read betti.gg source
 *   2. BettyCompiler.parse(source) -- trusted reference
 *   3. Betti handlers compile the same source -- self-hosted compilation
 *   4. Compare structurally via ast-equivalence.ts
 *   5. Verify fixed-point via fixed-point.ts
 *   6. Optionally race via polyglot build (Stage 2)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GraphAST } from '../betty/compiler.js';
import type { VoidBoundary } from '../void.js';
import type { FixedPoint } from '../self-reference.js';
import { BettyCompiler } from '../betty/compiler.js';
import {
  parseNodeDeclarations,
  parseEdgeDeclarations,
  parseProperties,
  stripComments,
} from '../betty/parse-utils.js';
import { runAllVerificationPasses } from '../betty/verify.js';
import {
  areStructurallyEquivalent,
  diffASTs,
  type ASTDiffEntry,
} from './ast-equivalence.js';
import {
  godelEncodeAST,
  verifyBootstrapFixedPoint,
} from './fixed-point.js';

// ============================================================================
// Types
// ============================================================================

export interface BootstrapResult {
  /** Betty's reference AST output */
  bettyAst: GraphAST;
  /** Betti's self-hosted AST output */
  bettiAst: GraphAST;
  /** Fixed-point convergence result */
  fixedPoint: FixedPoint<VoidBoundary>;
  /** Whether Betty and Betti produce structurally equivalent ASTs */
  equivalent: boolean;
  /** Whether the Betti numbers match */
  b1Match: boolean;
  /** Diff entries if not equivalent */
  diffs: ASTDiffEntry[];
  /** Polyglot race winners (Stage 2, empty if not raced) */
  polyglotWinners: Map<string, string>;
}

// ============================================================================
// Betti compilation pipeline (manual handler execution)
// ============================================================================

/**
 * Run the Betti compilation pipeline manually by executing handlers in order.
 * This simulates what the GnosisEngine would do with betti.gg's topology.
 */
function runBettiPipeline(source: string): GraphAST {
  // Step 1: Strip comments (Logic handler)
  const stripped = stripComments(source);

  // Step 2: FORK into parallel lexers
  const lines = stripped.split('\n');
  const allNodes: Array<{ id: string; label: string; properties: Record<string, string> }> = [];
  const allEdges: Array<{ src: string; type: string; props: string; target: string }> = [];
  const allProps: Record<string, Record<string, string>> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Node lexer
    const nodes = parseNodeDeclarations(trimmed);
    for (const pn of nodes) {
      allNodes.push({
        id: pn.id,
        label: pn.label,
        properties: parseProperties(pn.propertiesRaw),
      });
    }

    // Edge lexer
    const edges = parseEdgeDeclarations(trimmed);
    for (const pe of edges) {
      allEdges.push({
        src: pe.sourceRaw,
        type: pe.edgeType,
        props: pe.propertiesRaw,
        target: pe.targetRaw,
      });
    }

    // Property lexer
    for (const pn of nodes) {
      if (pn.propertiesRaw) {
        allProps[pn.id] = parseProperties(pn.propertiesRaw);
      }
    }
  }

  // Step 3: FOLD (merge-ast) then assemble
  const nodeMap = new Map<string, import('../betty/compiler.js').ASTNode>();
  for (const n of allNodes) {
    const existingProps = allProps[n.id] ?? {};
    if (!nodeMap.has(n.id)) {
      nodeMap.set(n.id, {
        id: n.id,
        labels: n.label ? [n.label] : [],
        properties: { ...n.properties, ...existingProps },
      });
    } else {
      const existing = nodeMap.get(n.id)!;
      if (n.label && existing.labels.length === 0) {
        existing.labels = [n.label];
      }
      existing.properties = { ...existing.properties, ...n.properties, ...existingProps };
    }
  }

  const astEdges: import('../betty/compiler.js').ASTEdge[] = [];
  for (const e of allEdges) {
    const sources = e.src.split('|').map((s) => s.split(':')[0].trim());
    const targets = e.target.split('|').map((s) => s.split(':')[0].trim());
    const edgeProps = e.props ? parseProperties(e.props) : {};

    astEdges.push({
      sourceIds: sources,
      targetIds: targets,
      type: e.type,
      properties: edgeProps,
    });

    for (const id of [...sources, ...targets]) {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, labels: [], properties: {} });
      }
    }
  }

  return { nodes: nodeMap, edges: astEdges };
}

// ============================================================================
// Bootstrap orchestrator
// ============================================================================

/**
 * Run the full bootstrap: Betty vs Betti comparison + fixed-point verification.
 */
export function runBootstrap(
  bettiSourcePath?: string,
  options: { race?: boolean; verifyFinalOnly?: boolean } = {}
): BootstrapResult {
  // 1. Read betti.gg source
  const sourcePath =
    bettiSourcePath ??
    path.resolve(__dirname, '../../betti.gg');
  const source = fs.readFileSync(sourcePath, 'utf-8');

  // 2. Betty (trusted reference) compiles betti.gg
  const betty = new BettyCompiler();
  const bettyResult = betty.parse(source);
  const bettyAst = bettyResult.ast!;
  const bettyB1 = bettyResult.b1;

  // 3. Betti (self-hosted) compiles the same source
  const bettiAst = runBettiPipeline(source);

  // 4. Compare structurally
  const equivalent = areStructurallyEquivalent(bettyAst, bettiAst);
  const diffs = equivalent ? [] : diffASTs(bettyAst, bettiAst);

  // Compute Betti's b1 for comparison
  let bettiB1 = 0;
  for (const edge of bettiAst.edges) {
    if (edge.type === 'FORK') {
      bettiB1 += edge.targetIds.length - 1;
    } else if (
      edge.type === 'FOLD' ||
      edge.type === 'COLLAPSE' ||
      edge.type === 'OBSERVE'
    ) {
      bettiB1 = Math.max(0, bettiB1 - (edge.sourceIds.length - 1));
    } else if (edge.type === 'RACE' || edge.type === 'INTERFERE') {
      bettiB1 = Math.max(
        0,
        bettiB1 - Math.max(0, edge.sourceIds.length - edge.targetIds.length)
      );
    } else if (edge.type === 'VENT') {
      bettiB1 = Math.max(0, bettiB1 - 1);
    }
  }

  const b1Match = bettyB1 === bettiB1;

  // 5. Fixed-point verification
  const fixedPoint = verifyBootstrapFixedPoint(source);

  // 6. Polyglot race (Stage 2, placeholder)
  const polyglotWinners = new Map<string, string>();

  return {
    bettyAst,
    bettiAst,
    fixedPoint,
    equivalent,
    b1Match,
    diffs,
    polyglotWinners,
  };
}
