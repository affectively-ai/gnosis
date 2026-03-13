import { describe, expect, it } from 'bun:test';
import { BettyCompiler, type ASTEdge } from '../betty/compiler.js';
import { GnosisNativeRuntime } from './native-runtime.js';

describe('GnosisNativeRuntime', () => {
  it('processes supported topology edges and returns metrics', async () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (start:Source { pressure: "1" })-[:FORK { weight: "1" }]->(a:State { potential: "beta1" }|b)
      (a|b)-[:FOLD { service_rate: "4", drift_gamma: "1" }]->(join:Sink { capacity: "8" })
      (join)-[:VENT { drift_coefficient: "1", repair_debt: "0" }]->(sink:Sink { capacity: "8" })
    `);

    const runtime = new GnosisNativeRuntime();
    const snapshot = await runtime.processEdges(ast?.edges ?? [], {
      stabilityMetadata: stability?.metadata ?? null,
    });

    expect(snapshot.edgesProcessed).toBe(3);
    expect(snapshot.metrics).toContain('Paths:');
    expect(snapshot.metrics).toContain('Beta1:');
    expect(snapshot.trace.length).toBeGreaterThan(0);
    expect(snapshot.stabilityMetadata?.redline).toBe(8);
    expect(snapshot.stabilityMetadata?.proofKind).toBe('numeric');
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
    expect(snapshot.stabilityMetadata).toBeNull();
  });
});
