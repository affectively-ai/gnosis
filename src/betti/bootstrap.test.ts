import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { BettyCompiler, type GraphAST } from '../betty/compiler.js';
import {
  areStructurallyEquivalent,
  diffASTs,
  serializeCanonical,
} from './ast-equivalence.js';
import { godelEncodeAST, verifyBootstrapFixedPoint } from './fixed-point.js';
import { runBootstrap } from './bootstrap.js';

const BETTI_GG_PATH = resolve(__dirname, '../../betti.gg');

describe('ast-equivalence', () => {
  it('identical ASTs are structurally equivalent', () => {
    const nodes = new Map();
    nodes.set('a', { id: 'a', labels: ['IO'], properties: { op: 'read' } });
    nodes.set('b', { id: 'b', labels: [], properties: {} });
    const edges = [
      { sourceIds: ['a'], targetIds: ['b'], type: 'PROCESS', properties: {} },
    ];
    const ast1: GraphAST = { nodes, edges };

    const nodes2 = new Map();
    nodes2.set('a', { id: 'a', labels: ['IO'], properties: { op: 'read' } });
    nodes2.set('b', { id: 'b', labels: [], properties: {} });
    const ast2: GraphAST = {
      nodes: nodes2,
      edges: [
        {
          sourceIds: ['a'],
          targetIds: ['b'],
          type: 'PROCESS',
          properties: {},
        },
      ],
    };

    expect(areStructurallyEquivalent(ast1, ast2)).toBe(true);
  });

  it('different ASTs are not equivalent', () => {
    const nodes1 = new Map();
    nodes1.set('a', { id: 'a', labels: ['IO'], properties: {} });
    const ast1: GraphAST = { nodes: nodes1, edges: [] };

    const nodes2 = new Map();
    nodes2.set('x', { id: 'x', labels: ['IO'], properties: {} });
    const ast2: GraphAST = { nodes: nodes2, edges: [] };

    expect(areStructurallyEquivalent(ast1, ast2)).toBe(false);
  });

  it('diffASTs reports missing nodes', () => {
    const nodes1 = new Map();
    nodes1.set('a', { id: 'a', labels: [], properties: {} });
    nodes1.set('b', { id: 'b', labels: [], properties: {} });
    const ast1: GraphAST = { nodes: nodes1, edges: [] };

    const nodes2 = new Map();
    nodes2.set('a', { id: 'a', labels: [], properties: {} });
    const ast2: GraphAST = { nodes: nodes2, edges: [] };

    const diffs = diffASTs(ast1, ast2);
    expect(diffs.some((d) => d.kind === 'node-missing' && d.id === 'b')).toBe(
      true
    );
  });

  it('canonical serialization is deterministic', () => {
    const nodes = new Map();
    nodes.set('b', { id: 'b', labels: [], properties: { z: '1', a: '2' } });
    nodes.set('a', { id: 'a', labels: ['IO'], properties: {} });
    const ast: GraphAST = { nodes, edges: [] };

    const s1 = serializeCanonical(ast);
    const s2 = serializeCanonical(ast);
    expect(s1).toBe(s2);

    // 'a' should come before 'b' in canonical form
    const parsed = JSON.parse(s1);
    expect(parsed.nodes[0].id).toBe('a');
    expect(parsed.nodes[1].id).toBe('b');
    // Properties should be sorted: 'a' before 'z'
    expect(parsed.nodes[1].properties[0][0]).toBe('a');
    expect(parsed.nodes[1].properties[1][0]).toBe('z');
  });
});

describe('fixed-point', () => {
  it('godelEncodeAST produces a boundary with correct dimensions', () => {
    const nodes = new Map();
    nodes.set('a', { id: 'a', labels: [], properties: {} });
    nodes.set('b', { id: 'b', labels: [], properties: {} });
    const edges = [
      { sourceIds: ['a'], targetIds: ['b'], type: 'PROCESS', properties: {} },
    ];
    const ast: GraphAST = { nodes, edges };

    const boundary = godelEncodeAST(ast);
    // 2 nodes -> 2*2 = 4 dimensions
    expect(boundary.counts.length).toBe(4);
    expect(boundary.totalEntries).toBeGreaterThan(0);
  });

  it('compiling the same source twice yields a fixed point', () => {
    const source = '(a)-[:FORK]->(b|c)\n(b|c)-[:FOLD]->(d)';
    const fp = verifyBootstrapFixedPoint(source);
    expect(fp.converged).toBe(true);
    expect(fp.residual).toBe(0);
  });

  it('fixed-point with betti.gg source converges', () => {
    const source = readFileSync(BETTI_GG_PATH, 'utf-8');
    const fp = verifyBootstrapFixedPoint(source);
    expect(fp.converged).toBe(true);
  });
});

describe('bootstrap', () => {
  it('runBootstrap completes and returns a result', () => {
    const result = runBootstrap(BETTI_GG_PATH);

    expect(result.bettyAst).toBeDefined();
    expect(result.bettiAst).toBeDefined();
    expect(result.bettyAst.nodes.size).toBeGreaterThan(0);
    expect(result.bettiAst.nodes.size).toBeGreaterThan(0);
    expect(typeof result.equivalent).toBe('boolean');
    expect(typeof result.b1Match).toBe('boolean');
    expect(result.fixedPoint.converged).toBe(true);
  });

  it('Betty compilation is deterministic (idempotent)', () => {
    const source = readFileSync(BETTI_GG_PATH, 'utf-8');
    const betty1 = new BettyCompiler().parse(source);
    const betty2 = new BettyCompiler().parse(source);

    expect(betty1.b1).toBe(betty2.b1);
    expect(betty1.ast!.nodes.size).toBe(betty2.ast!.nodes.size);
    expect(betty1.ast!.edges.length).toBe(betty2.ast!.edges.length);
    expect(areStructurallyEquivalent(betty1.ast!, betty2.ast!)).toBe(true);
  });

  it('betti(betti(betti.gg)) === betti(betti.gg) -- idempotence', () => {
    const source = readFileSync(BETTI_GG_PATH, 'utf-8');
    const fp = verifyBootstrapFixedPoint(source);
    expect(fp.converged).toBe(true);
    expect(fp.iterations).toBeLessThanOrEqual(2);
  });
});
