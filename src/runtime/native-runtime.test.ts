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
    expect(snapshot.stabilityMetadata?.countableQueueCertified).toBe(true);
    expect(snapshot.stabilityMetadata?.queueBoundary).toBe(8);
    expect(snapshot.stabilityMetadata?.laminarAtom).toBe(0);
    expect(snapshot.stabilityMetadata?.queuePotential).toBe('beta1');
    expect(snapshot.stabilityMetadata?.continuousHarris?.observableKind).toBe(
      'queue-depth'
    );
    expect(
      snapshot.stabilityMetadata?.continuousHarris?.observableDriftTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_observable_drift`
    );
    expect(
      snapshot.stabilityMetadata?.continuousHarris?.continuousHarrisTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_continuous_harris_certified`
    );
    expect(snapshot.stabilityMetadata?.laminarGeometricTheoremName).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_laminar_geometric_stable`
    );
    expect(snapshot.stabilityMetadata?.measurableHarrisTheoremName).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_harris_certified`
    );
    expect(snapshot.stabilityMetadata?.measurableLaminarTheoremName).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_laminar_certified`
    );
    expect(
      snapshot.stabilityMetadata?.measurableQuantitativeLaminarTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_quantitative_laminar_certified`
    );
    expect(
      snapshot.stabilityMetadata?.measurableQuantitativeHarrisTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_quantitative_harris_certified`
    );
    expect(snapshot.stabilityMetadata?.measurableFiniteTimeHarrisTheoremName).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_finite_time_harris_recurrent`
    );
    expect(snapshot.stabilityMetadata?.measurableHarrisRecurrentTheoremName).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_harris_recurrent`
    );
    expect(
      snapshot.stabilityMetadata?.measurableFiniteTimeGeometricErgodicTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_finite_time_geometric_ergodic`
    );
    expect(
      snapshot.stabilityMetadata?.measurableLevyProkhorovGeometricErgodicTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_levy_prokhorov_geometric_ergodic`
    );
    expect(
      snapshot.stabilityMetadata?.measurableLevyProkhorovGeometricDecayTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_levy_prokhorov_geometric_decay`
    );
    expect(
      snapshot.stabilityMetadata
        ?.measurableLevyProkhorovAbstractGeometricErgodicTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_levy_prokhorov_geometric_ergodic_abstract`
    );
    expect(
      snapshot.stabilityMetadata?.measurableWitnessQuantitativeHarrisTheoremName
    ).toBe(
      `${snapshot.stabilityMetadata?.theoremName}_measurable_witness_quantitative_harris_certified`
    );
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
