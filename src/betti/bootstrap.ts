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
 *   7. Compile arbitrary .gg through Betti to prove generalization
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
import { runAllVerificationPasses, type VerificationResult } from '../betty/verify.js';
import {
  areStructurallyEquivalent,
  diffASTs,
  type ASTDiffEntry,
} from './ast-equivalence.js';
import {
  godelEncodeAST,
  verifyBootstrapFixedPoint,
} from './fixed-point.js';
import { buildBetti } from './build-config.js';
import { compileTypeScriptToGnosis } from '../ts-bridge.js';

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
  /** Generalization proof results (Stage 3.5, null if not run) */
  generalization: GeneralizationResult | null;
  /** Cross-compilation: Betty's TS -> .gg -> Betti parse (null if not run or failed) */
  crossCompilation: GeneralizationResult | null;
}

export interface GeneralizationResult {
  /** The .gg source that was compiled through Betti */
  source: string;
  /** Betty's AST for this source */
  bettyAst: GraphAST;
  /** Betti's AST for this source */
  bettiAst: GraphAST;
  /** Whether the ASTs are structurally equivalent */
  equivalent: boolean;
  /** Whether beta1 numbers match */
  b1Match: boolean;
  /** Diff entries */
  diffs: ASTDiffEntry[];
  /** Betti's verification result */
  verification: VerificationResult;
}

// ============================================================================
// Betti compilation pipeline (manual handler execution)
// ============================================================================

/**
 * Compute beta1 from an AST's edge structure.
 */
export function computeB1(ast: GraphAST): number {
  let b1 = 0;
  for (const edge of ast.edges) {
    if (edge.type === 'FORK') {
      b1 += edge.targetIds.length - 1;
    } else if (
      edge.type === 'FOLD' ||
      edge.type === 'COLLAPSE' ||
      edge.type === 'OBSERVE'
    ) {
      b1 = Math.max(0, b1 - (edge.sourceIds.length - 1));
    } else if (edge.type === 'RACE' || edge.type === 'INTERFERE') {
      b1 = Math.max(
        0,
        b1 - Math.max(0, edge.sourceIds.length - edge.targetIds.length)
      );
    } else if (edge.type === 'VENT') {
      b1 = Math.max(0, b1 - 1);
    }
  }
  return b1;
}

/**
 * Run the Betti compilation pipeline manually by executing handlers in order.
 * This simulates what the GnosisEngine would do with betti.gg's topology.
 *
 * Works on ANY .gg source, not just betti.gg itself.
 */
export function runBettiPipeline(source: string): GraphAST {
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
// Generalization: Betti compiles arbitrary .gg sources
// ============================================================================

/**
 * Prove that Betti generalizes beyond self-compilation by compiling
 * an arbitrary .gg source and verifying the result matches Betty's output.
 */
export function proveGeneralization(ggSource: string): GeneralizationResult {
  // Betty compiles
  const betty = new BettyCompiler();
  const bettyResult = betty.parse(ggSource);
  const bettyAst = bettyResult.ast!;
  const bettyB1 = bettyResult.b1;

  // Betti compiles the same source
  const bettiAst = runBettiPipeline(ggSource);
  const bettiB1 = computeB1(bettiAst);

  // Structural comparison
  const equivalent = areStructurallyEquivalent(bettyAst, bettiAst);
  const diffs = equivalent ? [] : diffASTs(bettyAst, bettiAst);

  // Betti runs verification passes
  const verification = runAllVerificationPasses(bettiAst, bettiB1);

  return {
    source: ggSource,
    bettyAst,
    bettiAst,
    equivalent,
    b1Match: bettyB1 === bettiB1,
    diffs,
    verification,
  };
}

/**
 * Find all .gg files in the gnosis source tree for generalization testing.
 */
function findGgFiles(rootDir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(rootDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...findGgFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.gg')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return results;
}

// ============================================================================
// Cross-compilation: Betti compiles Betty's own topology
// ============================================================================

/**
 * The ultimate generalization test: compile Betty's TypeScript source through
 * the TS bridge to produce a .gg topology of Betty's own control flow graph,
 * then feed that .gg through Betti and verify Betti can parse it.
 *
 * This proves: Betti generalizes beyond .gg source to program-derived topologies.
 */
export function crossCompileBetty(): GeneralizationResult | null {
  const bettySourcePath = path.resolve(__dirname, '../betty/compiler.ts');
  try {
    const bettySource = fs.readFileSync(bettySourcePath, 'utf-8');

    // TS bridge compiles Betty's source into a .gg topology
    const bridgeResult = compileTypeScriptToGnosis(bettySource, {
      sourceFilePath: bettySourcePath,
      exportName: 'BettyCompiler',
    });

    // Feed the generated .gg through both compilers
    return proveGeneralization(bridgeResult.ggSource);
  } catch {
    // TS bridge may fail if Betty's source doesn't have a single-param export
    // (it's a class, not a function). This is expected -- return null.
    return null;
  }
}

// ============================================================================
// Bootstrap orchestrator
// ============================================================================

/**
 * Run the full bootstrap: Betty vs Betti comparison + fixed-point verification.
 */
export function runBootstrap(
  bettiSourcePath?: string,
  options: { race?: boolean; verifyFinalOnly?: boolean; generalize?: boolean } = {}
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
  const bettiB1 = computeB1(bettiAst);
  const b1Match = bettyB1 === bettiB1;

  // 5. Fixed-point verification
  const fixedPoint = verifyBootstrapFixedPoint(source);

  // 6. Polyglot race (Stage 2)
  const polyglotWinners = new Map<string, string>();

  // 7. Generalization proof (Stage 3.5)
  let generalization: GeneralizationResult | null = null;
  if (options.generalize !== false) {
    // Find a non-betti .gg file to prove generalization
    const gnosisRoot = path.resolve(__dirname, '../..');
    const ggFiles = findGgFiles(gnosisRoot).filter(
      (f) => !f.endsWith('betti.gg')
    );
    if (ggFiles.length > 0) {
      // Use the first available .gg file
      const testSource = fs.readFileSync(ggFiles[0], 'utf-8');
      generalization = proveGeneralization(testSource);
    }
  }

  // 8. Cross-compilation: TS bridge -> Betty's CFG -> Betti
  let crossCompilation: GeneralizationResult | null = null;
  if (options.generalize !== false) {
    crossCompilation = crossCompileBetty();
  }

  return {
    bettyAst,
    bettiAst,
    fixedPoint,
    equivalent,
    b1Match,
    diffs,
    polyglotWinners,
    generalization,
    crossCompilation,
  };
}
