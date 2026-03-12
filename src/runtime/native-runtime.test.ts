import { describe, expect, it } from 'bun:test';
import { BettyCompiler, type ASTEdge } from '../betty/compiler.js';
import { GnosisNativeRuntime } from './native-runtime.js';

describe('GnosisNativeRuntime', () => {
  it('processes supported topology edges and returns metrics', async () => {
    const compiler = new BettyCompiler();
    const { ast } = compiler.parse(`
      (start)-[:FORK]->(a|b)
      (a|b)-[:FOLD]->(join)
      (join)-[:VENT]->(sink)
    `);

    const runtime = new GnosisNativeRuntime();
    const snapshot = await runtime.processEdges(ast?.edges ?? []);

    expect(snapshot.edgesProcessed).toBe(3);
    expect(snapshot.metrics).toContain('Paths:');
    expect(snapshot.metrics).toContain('Beta1:');
    expect(snapshot.trace.length).toBeGreaterThan(0);
  });

  it('ignores non-topological PROCESS edges', async () => {
    const runtime = new GnosisNativeRuntime();
    const processEdge: ASTEdge = {
      sourceIds: ['a'],
      targetIds: ['b'],
      type: 'PROCESS',
      properties: {},
    };

    await runtime.onEdge(processEdge);
    const snapshot = runtime.snapshot();

    expect(snapshot.edgesProcessed).toBe(0);
  });
});

