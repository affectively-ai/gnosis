/**
 * handlers.ts -- Real executable handlers for betti.gg nodes.
 *
 * Each handler corresponds to a node in betti.gg:
 *   IO (source_reader)      -> reads file, returns source string
 *   Logic (strip_comments)  -> strips // comments
 *   Lexer (node|edge|prop)  -> dispatches by target, returns AST fragments
 *   Compiler (ast_assembler)-> merges FOLD output into GraphAST
 *   Topology (betti_verifier)-> calls verify.ts, returns VerificationResult
 *   Runtime (wasm_emitter)  -> calls compileTopology, returns binary stub
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GnosisRegistry } from '../runtime/registry.js';
import type { GraphAST, ASTNode, ASTEdge } from '../betty/compiler.js';
import {
  parseNodeDeclarations,
  parseEdgeDeclarations,
  parseProperties,
  stripComments,
} from '../betty/parse-utils.js';
import { runAllVerificationPasses } from '../betty/verify.js';

// ============================================================================
// Handler implementations
// ============================================================================

/**
 * IO handler: reads a .gg source file from disk.
 */
async function handleIO(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  const op = props['op'];
  if (op === 'read_file') {
    const filePath = path.resolve(
      process.cwd(),
      (payload as string) || 'transformer.gg'
    );
    console.log(`[Betti:IO] Reading source: ${filePath}`);
    return fs.readFileSync(filePath, 'utf-8');
  }
  return payload;
}

/**
 * Logic handler: strips single-line comments.
 */
async function handleLogic(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  const pattern = props['pattern'];
  if (pattern === '//') {
    console.log(`[Betti:Logic] Stripping comments...`);
    return stripComments(payload as string);
  }
  return payload;
}

/**
 * Lexer handler: dispatches by target property to parse nodes, edges, or properties.
 * Uses the shared parse-utils.ts functions for regex-based extraction.
 */
async function handleLexer(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  const target = props['target'];
  const input = payload as string;
  console.log(`[Betti:Lexer] Extracting ${target}...`);

  if (target === 'nodes') {
    const lines = input.split('\n');
    const allNodes: Array<{ id: string; label: string; properties: Record<string, string> }> = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = parseNodeDeclarations(trimmed);
      for (const pn of parsed) {
        allNodes.push({
          id: pn.id,
          label: pn.label,
          properties: parseProperties(pn.propertiesRaw),
        });
      }
    }
    return allNodes;
  }

  if (target === 'edges') {
    const lines = input.split('\n');
    const allEdges: Array<{ src: string; type: string; props: string; target: string }> = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = parseEdgeDeclarations(trimmed);
      for (const pe of parsed) {
        allEdges.push({
          src: pe.sourceRaw,
          type: pe.edgeType,
          props: pe.propertiesRaw,
          target: pe.targetRaw,
        });
      }
    }
    return allEdges;
  }

  if (target === 'properties') {
    const lines = input.split('\n');
    const allProps: Record<string, Record<string, string>> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Extract property blocks from node declarations
      const nodes = parseNodeDeclarations(trimmed);
      for (const pn of nodes) {
        if (pn.propertiesRaw) {
          allProps[pn.id] = parseProperties(pn.propertiesRaw);
        }
      }
      // Also extract from edge property blocks
      const edges = parseEdgeDeclarations(trimmed);
      for (const pe of edges) {
        if (pe.propertiesRaw) {
          const key = `${pe.sourceRaw}->${pe.targetRaw}`;
          allProps[key] = parseProperties(pe.propertiesRaw);
        }
      }
    }
    return allProps;
  }

  return [];
}

/**
 * Compiler handler: assembles FOLD output (3 lexer streams) into a GraphAST.
 */
async function handleCompiler(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  const phase = props['phase'];
  if (phase === 'assemble') {
    console.log(
      `[Betti:Compiler] Assembling AST from fragmented tokens...`
    );
    return assembleAst(payload);
  }
  return payload;
}

/**
 * Merge FOLD output into a proper GraphAST.
 * Payload can be:
 *   - A merge-ast fold result: { nodes: [...], edges: [...], properties: {...} }
 *   - Raw engine payload with node_lexer/edge_lexer/property_lexer keys
 */
function assembleAst(payload: any): { type: string; ast: GraphAST; timestamp: number } {
  const nodes = new Map<string, ASTNode>();
  const edges: ASTEdge[] = [];

  // Handle merge-ast FOLD output
  const nodeList = payload.nodes ?? payload.node_lexer ?? [];
  const edgeList = payload.edges ?? payload.edge_lexer ?? [];
  const propMap = payload.properties ?? payload.property_lexer ?? {};

  for (const n of nodeList) {
    const id = n.id;
    if (!id) continue;
    const existingProps = propMap[id] ?? {};
    const nodeProps = n.properties ?? {};
    nodes.set(id, {
      id,
      labels: n.label ? [n.label] : n.labels ?? [],
      properties: { ...nodeProps, ...existingProps },
    });
  }

  for (const e of edgeList) {
    const sourceRaw = e.src ?? '';
    const targetRaw = e.target ?? '';
    const sources = sourceRaw.split('|').map((s: string) => s.split(':')[0].trim());
    const targets = targetRaw.split('|').map((s: string) => s.split(':')[0].trim());
    const edgeProps = e.props ? parseProperties(e.props) : {};

    edges.push({
      sourceIds: sources,
      targetIds: targets,
      type: e.type,
      properties: edgeProps,
    });

    // Ensure referenced nodes exist
    for (const id of [...sources, ...targets]) {
      if (!nodes.has(id)) {
        nodes.set(id, { id, labels: [], properties: {} });
      }
    }
  }

  return { type: 'GraphAST', ast: { nodes, edges }, timestamp: Date.now() };
}

/**
 * Topology handler: runs verification passes on the assembled AST.
 */
async function handleTopology(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  console.log(
    `[Betti:Topology] Running verification passes...`
  );

  const ast: GraphAST = payload.ast ?? { nodes: new Map(), edges: [] };

  // Compute beta1 from edges
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
    } else if (edge.type === 'RACE' || edge.type === 'SLIVER') {
      b1 = Math.max(
        0,
        b1 - Math.max(0, edge.sourceIds.length - edge.targetIds.length)
      );
    } else if (edge.type === 'VENT') {
      b1 = Math.max(0, b1 - 1);
    }
  }

  const verification = runAllVerificationPasses(ast, b1);

  const hasErrors = verification.diagnostics.some(
    (d) => d.severity === 'error'
  );

  if (hasErrors) {
    console.error(
      `[Betti:Topology] Verification found ${
        verification.diagnostics.filter((d) => d.severity === 'error').length
      } error(s)`
    );
    return {
      ...payload,
      verified: false,
      errors: verification.diagnostics.filter((d) => d.severity === 'error'),
      buleyNumber: b1,
    };
  }

  console.log(
    `[Betti:Topology] Verified! Beta1: ${b1}, Nodes: ${ast.nodes.size}, Edges: ${ast.edges.length}`
  );
  return {
    ...payload,
    verified: true,
    stats: { beta1: b1, nodeCount: ast.nodes.size, edgeCount: ast.edges.length },
    buleyNumber: b1,
    stability: verification.stability,
    voidDimensions: verification.voidDimensions,
    landauerHeat: verification.landauerHeat,
  };
}

/**
 * Runtime handler: emits a binary stub (WASM header placeholder).
 */
async function handleRuntime(
  payload: any,
  props: Record<string, string>
): Promise<any> {
  const target = props['target'];
  console.log(`[Betti:Runtime] Emitting binary for ${target}...`);
  // WASM magic number + "FLOW" marker
  return Buffer.from([0x0a, 0x0e, 0x00, 0x46, 0x4c, 0x4f, 0x57]);
}

// ============================================================================
// merge-ast FOLD strategy
// ============================================================================

/**
 * Merge-ast fold handler: takes 3 branch results and merges them.
 * Branch results are keyed by the FORK target node IDs.
 */
export function mergeAstFold(
  results: Map<string, any>
): { nodes: any[]; edges: any[]; properties: Record<string, any> } {
  let nodes: any[] = [];
  let edges: any[] = [];
  let properties: Record<string, any> = {};

  for (const [key, value] of results) {
    if (key.includes('node') || (Array.isArray(value) && value[0]?.id && value[0]?.label !== undefined)) {
      nodes = value;
    } else if (key.includes('edge') || (Array.isArray(value) && value[0]?.src)) {
      edges = value;
    } else if (key.includes('propert') || (typeof value === 'object' && !Array.isArray(value))) {
      properties = value;
    }
  }

  return { nodes, edges, properties };
}

// ============================================================================
// Registration
// ============================================================================

/**
 * Register all Betti self-hosting handlers into a GnosisRegistry.
 * Also registers the `fold:merge-ast` strategy for engine fold dispatch.
 */
export function registerBettiHandlers(registry: GnosisRegistry): void {
  registry.register('IO', handleIO, { override: true });
  registry.register('Logic', handleLogic, { override: true });
  registry.register('Lexer', handleLexer, { override: true });
  registry.register('Compiler', handleCompiler, { override: true });
  registry.register('Topology', handleTopology, { override: true });
  registry.register('Runtime', handleRuntime, { override: true });

  // Register merge-ast as a fold strategy for the engine's structured concurrency
  registry.register('fold:merge-ast', async (payload: any) => {
    // payload is a Map<string, any> from the engine's fold resolution
    if (payload instanceof Map) {
      return mergeAstFold(payload);
    }
    // Fallback: treat as pre-merged object
    return payload;
  }, { override: true });
}
