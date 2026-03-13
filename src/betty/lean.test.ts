import { describe, expect, it } from 'bun:test';
import { BettyCompiler } from './compiler.js';
import { generateLeanFromGnosisAst } from './lean.js';

describe('generateLeanFromGnosisAst', () => {
  it('emits a proof scaffold for thermodynamic topologies', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (traffic:Source { pressure: "lambda" })
      (processing:State { potential: "beta1" })
      (complete:Sink { beta1_target: "0", capacity: "64" })
      (traffic)-[:FORK { weight: "1.0" }]->(processing)
      (processing)-[:FOLD { service_rate: "mu", drift_gamma: "1.0" }]->(complete)
      (processing)-[:VENT { drift_coefficient: "alpha(n)", repair_debt: "0" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/pipeline.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.moduleName).toBe('pipeline');
    expect(artifact?.theoremName).toContain('complete_is_geometrically_stable');
    expect(artifact?.lean).toContain('import GnosisProofs');
    expect(artifact?.lean).toContain('CertifiedKernel');
    expect(artifact?.lean).toContain('certifiedKernel_stable_of_drift_certificate');
    expect(artifact?.lean).toContain('spectrallyStable_of_nilpotent');
    expect(artifact?.lean).toContain('FiniteSmallSetRecurrent');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_finitely_recurrent');
    expect(artifact?.lean).toContain('CountableSmallSetRecurrent');
    expect(artifact?.lean).toContain('CountableAtomicSmallSetMinorized');
    expect(artifact?.lean).toContain('CountableUniformPredecessorMinorized');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_countably_recurrent');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_small_set_minorized');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_uniformly_minorized');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_atom_accessible');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_psi_irreducible');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_harris_prelude');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_harris_recurrent_class');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_atom_hitting_bound');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_geometric_envelope');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_atom_hit_lower_bound');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_quantitative_geometric_envelope');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_laminar_geometric_stable');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_harris_certified');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_small_set_accessible');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_containing_atom_accessible');
    expect(artifact?.lean).toContain('CountableAtomAccessible');
    expect(artifact?.lean).toContain('CountablePsiIrreducibleAtAtom');
    expect(artifact?.lean).toContain('CountableHarrisPreludeAtAtom');
    expect(artifact?.lean).toContain('CountableHarrisRecurrentClassAtAtom');
    expect(artifact?.lean).toContain('CountableAtomHittingBoundAtAtom');
    expect(artifact?.lean).toContain('CountableGeometricEnvelopeAtAtom');
    expect(artifact?.lean).toContain('CountableAtomGeometricHitLowerBoundAtAtom');
    expect(artifact?.lean).toContain('CountableQuantitativeGeometricEnvelopeAtAtom');
    expect(artifact?.lean).toContain('CountableLaminarGeometricStabilityAtAtom');
    expect(artifact?.lean).toContain('MeasurableHarrisCertified');
    expect(artifact?.lean).toContain('MeasurableSmallSetAccessible');
    expect(artifact?.lean).toContain('MeasureTheory.Measure.dirac queueAtom');
    expect(artifact?.lean).toContain('natSmallSetRecurrent_of_uniformPredecessorMinorization');
    expect(artifact?.lean).toContain('def queueBoundary : Nat := 64');
    expect(artifact?.lean).toContain('def queueAtom : Nat := 0');
    expect(artifact?.lean).toContain('def queueMinorizationFloor : Real := 1');
    expect(artifact?.lean).toContain('def queueKernel (lam mu : Real) (alpha : Nat -> Real)');
    expect(artifact?.lean).toContain('CountableSmallSetRecurrent (queueKernel lam mu alpha)');
    expect(artifact?.lean).toContain('mu + alpha current - lam');
    expect(artifact?.lean).not.toContain('stepMass : Nat -> Real');
    expect(artifact?.lean).not.toContain('(queueKernel : CountableCertifiedKernel Nat)');
    expect(artifact?.lean).toContain('distanceToSmallSet');
    expect(artifact?.lean).toContain('nextTowardSmallSet');
    expect(artifact?.lean).toContain('transitionRat ^ topologyNodeCount = 0');
    expect(artifact?.lean).toContain('rw [transition, ← map_pow]');
    expect(artifact?.lean).toContain('topologyNodes');
    expect(artifact?.lean).toContain('proof-kind: symbolic-reneging');
    expect(artifact?.lean).toContain('finite-state-recurrent: true');
    expect(artifact?.lean).toContain('countable-queue-theorem: true');
    expect(artifact?.lean).not.toContain('GnosisKernel (_lam _mu : Real)');
  });

  it('emits a row-contractive proof for bounded supremum routing', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (inbound:Source { pressure: "1" })
      (complete:Sink { beta1_target: "0", capacity: "64" })
      (inbound)-[:RACE { weight: "0.4", supremum_bound: "0.95" }]->(inbound)
      (inbound)-[:RACE { weight: "0.4", supremum_bound: "0.95" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/router.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.lean).toContain('proof-kind: bounded-supremum');
    expect(artifact?.lean).toContain('HasNonnegativeTransitions');
    expect(artifact?.lean).toContain('spectrallyStable_of_rowMass');
    expect(artifact?.lean).toContain('FiniteSmallSetRecurrent');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_finitely_recurrent');
    expect(artifact?.lean).toContain('countable-queue-theorem: false');
    expect(artifact?.lean).toContain('rowBoundRat');
  });

  it('emits a numeric countable queue recurrence bridge', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (inbound:Source { pressure: "1" })
      (queue:State { potential: "queue_depth" })
      (resolved:Sink { beta1_target: "0", capacity: "8" })
      (inbound)-[:FORK { weight: "1.0" }]->(queue)
      (queue)-[:FOLD { service_rate: "2", drift_gamma: "1.0" }]->(resolved)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/numeric.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.lean).toContain('proof-kind: numeric');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_countably_recurrent');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_small_set_minorized');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_uniformly_minorized');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_atom_accessible');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_psi_irreducible');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_harris_prelude');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_harris_recurrent_class');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_atom_hitting_bound');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_geometric_envelope');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_atom_hit_lower_bound');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_quantitative_geometric_envelope');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_laminar_geometric_stable');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_harris_certified');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_small_set_accessible');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_containing_atom_accessible');
    expect(artifact?.lean).toContain('CountableAtomAccessible');
    expect(artifact?.lean).toContain('CountablePsiIrreducibleAtAtom');
    expect(artifact?.lean).toContain('CountableHarrisPreludeAtAtom');
    expect(artifact?.lean).toContain('CountableHarrisRecurrentClassAtAtom');
    expect(artifact?.lean).toContain('CountableAtomHittingBoundAtAtom');
    expect(artifact?.lean).toContain('CountableGeometricEnvelopeAtAtom');
    expect(artifact?.lean).toContain('CountableAtomGeometricHitLowerBoundAtAtom');
    expect(artifact?.lean).toContain('CountableQuantitativeGeometricEnvelopeAtAtom');
    expect(artifact?.lean).toContain('CountableLaminarGeometricStabilityAtAtom');
    expect(artifact?.lean).toContain('CountableAtomicSmallSetMinorized');
    expect(artifact?.lean).toContain('CountableUniformPredecessorMinorized');
    expect(artifact?.lean).toContain('MeasurableHarrisCertified');
    expect(artifact?.lean).toContain('MeasurableSmallSetAccessible');
    expect(artifact?.lean).toContain('MeasureTheory.Measure.dirac queueAtom');
    expect(artifact?.lean).toContain('natSmallSetRecurrent_of_uniformPredecessorMinorization');
    expect(artifact?.lean).toContain('def queueAtom : Nat := 0');
    expect(artifact?.lean).toContain('def queueMinorizationFloor : Real := 1');
    expect(artifact?.lean).toContain('def queueKernel (lam mu : Real) (alpha : Nat -> Real)');
    expect(artifact?.lean).toContain('norm_num [lam, mu, alpha]');
    expect(artifact?.lean).toContain('simpa [queueMinorizationFloor] using h_margin_floor');
    expect(artifact?.lean).toContain('CountableSmallSetRecurrent (queueKernel lam mu alpha)');
    expect(artifact?.lean).not.toContain('stepMass : Nat -> Real');
    expect(artifact?.lean).toContain('countable-queue-theorem: true');
  });
});
