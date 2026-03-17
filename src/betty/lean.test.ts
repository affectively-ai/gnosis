import { readFileSync } from 'node:fs';

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
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_atom_accessible');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_harris_certified');
    expect(artifact?.lean).toContain('theorem complete_is_geometrically_stable_measurable_laminar_certified');
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_atom_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_quantitative_laminar_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_quantitative_harris_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_witness_quantitative_harris_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_eventually_converges'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_small_set_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_containing_atom_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_reference_positive_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_witness_reference_positive_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_reference_positive_persistent'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_finite_time_harris_recurrent'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_harris_recurrent'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_finite_time_geometric_ergodic'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_levy_prokhorov_geometric_ergodic'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_levy_prokhorov_geometric_decay'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_levy_prokhorov_geometric_ergodic_abstract'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_observable'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_observable_drift'
    );
    expect(artifact?.lean).toContain(
      'theorem complete_is_geometrically_stable_measurable_continuous_harris_certified'
    );
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
    expect(artifact?.lean).toContain('MeasurableLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain('MeasurableSmallSetAccessible');
    expect(artifact?.lean).toContain('MeasureTheory.Measure.dirac queueAtom');
    expect(artifact?.lean).toContain(
      'noncomputable def queueAtomMeasure : MeasureTheory.Measure Nat'
    );
    expect(artifact?.lean).toContain('def queueMeasurableEpsilon : ENNReal := 1');
    expect(artifact?.lean).toContain('def queueAtomHittingBound : Nat -> Nat');
    expect(artifact?.lean).toContain('def queueWitnessHittingBound : Nat -> Nat');
    expect(artifact?.lean).toContain('def queueObservableScale : Real := 1');
    expect(artifact?.lean).toContain('def queueObservableOffset : Real := 0');
    expect(artifact?.lean).toContain('def queueObservable : Nat -> Real');
    expect(artifact?.lean).toContain('def queueExpectedObservable : Nat -> Real');
    expect(artifact?.lean).toContain('def queueLyapunov : Nat -> Real');
    expect(artifact?.lean).toContain('def queueContinuousDriftGap : Real := 1');
    expect(artifact?.lean).toContain('def queueSupportStep : Nat -> Nat');
    expect(artifact?.lean).toContain('noncomputable def queueSupportKernel');
    expect(artifact?.lean).toContain('noncomputable def queueWitnessKernel');
    expect(artifact?.lean).toContain('MeasurableAtomAccessible queueSupportKernel queueAtom');
    expect(artifact?.lean).toContain('MeasurableAtomHittingBoundAtAtom');
    expect(artifact?.lean).toContain('MeasurableQuantitativeLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain('MeasurableQuantitativeHarrisCertified');
    expect(artifact?.lean).toContain('MeasurableEventuallyConvergesToReference');
    expect(artifact?.lean).toContain('MeasurableFiniteTimeHarrisRecurrent');
    expect(artifact?.lean).toContain('MeasurableFiniteTimeLevyProkhorovGeometricErgodic');
    expect(artifact?.lean).toContain('MeasurableLevyProkhorovGeometricDecayAfterBurnIn');
    expect(artifact?.lean).toContain('MeasurableLevyProkhorovGeometricErgodic');
    expect(artifact?.lean).toContain('measurableSmallSetHittingBound_of_quantitativeLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain(
      'measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence'
    );
    expect(artifact?.lean).toContain('MeasurableRealObservableWitness');
    expect(artifact?.lean).toContain('MeasurableLyapunovDriftWitness');
    expect(artifact?.lean).toContain('MeasurableContinuousHarrisWitness');
    expect(artifact?.lean).toContain(
      'measurableReferencePositivePersistent_of_eventualConvergence'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableRealObservableWitness_of_queueStep'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableLyapunovDriftWitness_of_queueStep_with_gap'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableContinuousHarrisWitness_of_queueStep_with_gap'
    );
    expect(artifact?.lean).toContain('natQueueAffineObservable');
    expect(artifact?.lean).toContain('natQueueAffineExpectedObservable');
    expect(artifact?.lean).toContain('natQueueWitnessKernel');
    expect(artifact?.lean).toContain('natMeasurableQuantitativeHarrisCertified_of_queueWitnessKernel');
    expect(artifact?.lean).toContain('natMeasurableLaminarCertified_of_queueStep');
    expect(artifact?.lean).toContain('natMeasurableQuantitativeLaminarCertified_of_queueStep');
    expect(artifact?.lean).toContain('natMeasurableEventuallyConvergesToAtom_of_queueStep');
    expect(artifact?.lean).toContain('natSmallSetRecurrent_of_uniformPredecessorMinorization');
    expect(artifact?.lean).toContain('def queueBoundary : Nat := 64');
    expect(artifact?.lean).toContain('def queueAtom : Nat := 0');
    expect(artifact?.lean).toContain('def queueMinorizationFloor : Real := 1');
    expect(artifact?.lean).toContain('def queueKernel (lam mu : Real) (alpha : Nat -> Real)');
    expect(artifact?.lean).toContain('CountableSmallSetRecurrent (queueKernel lam mu alpha)');
    expect(artifact?.lean).toContain('mu + alpha current - lam');
    expect(artifact?.lean).not.toContain('stepMass : Nat -> Real');
    expect(artifact?.lean).not.toContain('(queueKernel : CountableCertifiedKernel Nat)');
    expect(artifact?.lean).not.toContain('(queueMeasurableKernel : ProbabilityTheory.Kernel Nat Nat)');
    expect(artifact?.lean).not.toContain(
      '(h_invariant : ProbabilityTheory.Kernel.Invariant queueSupportKernel invariantMeasure)'
    );
    expect(artifact?.lean).not.toContain(
      'MeasurableSmallSetMinorized queueSupportKernel queueSmallSet minorizationMeasure queueEpsilon'
    );
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

  it('emits a nilpotent bounded-supremum proof for the StructuredMoA primitive path', () => {
    const compiler = new BettyCompiler();
    const structuredMoaSource = readFileSync(
      new URL('../../examples/benchmarks/moa-transformer-moa.gg', import.meta.url),
      'utf8'
    );
    const source = `${structuredMoaSource}
(complete: Sink { beta1_target: "0", capacity: "64" })
(moa_out)-[:FOLD { service_rate: "2", drift_gamma: "1.0" }]->(complete)
`;

    const { ast, diagnostics, stability } = compiler.parse(source);
    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/moa-transformer-moa.gg',
    });

    const errors = diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
    expect(ast).not.toBeNull();
    expect(stability).not.toBeNull();
    expect(stability?.proof.kind).toBe('bounded-supremum');
    expect(stability?.proof.summary).toContain(
      'spectrally stable below one and carries no drift obligation'
    );

    const transformerlets = Array.from(ast?.nodes.values() ?? []).filter((node) =>
      node.labels.includes('MoATransformerlet')
    );
    const headChains = Array.from(ast?.nodes.values() ?? []).filter((node) =>
      node.labels.includes('AttentionHeadChain')
    );

    expect(ast?.nodes.get('moa_out__outer_rotation')).toBeDefined();
    expect(ast?.nodes.get('moa_out__router')).toBeDefined();
    expect(transformerlets).toHaveLength(4);
    expect(headChains).toHaveLength(16);
    expect(artifact).not.toBeNull();
    expect(artifact?.theoremName).toBe('complete_is_geometrically_stable');
    expect(artifact?.lean).toContain('proof-kind: bounded-supremum');
    expect(artifact?.lean).toContain('spectrallyStable_of_nilpotent');
    expect(artifact?.lean).toContain('certifiedKernel_stable_of_supremum');
    expect(artifact?.lean).not.toContain('(h_drift_floor :');
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
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_atom_accessible');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_harris_certified');
    expect(artifact?.lean).toContain('theorem resolved_is_geometrically_stable_measurable_laminar_certified');
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_atom_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_quantitative_laminar_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_quantitative_harris_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_witness_quantitative_harris_certified'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_eventually_converges'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_small_set_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_containing_atom_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_reference_positive_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_witness_reference_positive_hitting_bound'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_reference_positive_persistent'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_finite_time_harris_recurrent'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_harris_recurrent'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_finite_time_geometric_ergodic'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_levy_prokhorov_geometric_ergodic'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_levy_prokhorov_geometric_decay'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_levy_prokhorov_geometric_ergodic_abstract'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_observable'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_observable_drift'
    );
    expect(artifact?.lean).toContain(
      'theorem resolved_is_geometrically_stable_measurable_continuous_harris_certified'
    );
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
    expect(artifact?.lean).toContain('MeasurableLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain('MeasurableSmallSetAccessible');
    expect(artifact?.lean).toContain('MeasureTheory.Measure.dirac queueAtom');
    expect(artifact?.lean).toContain(
      'noncomputable def queueAtomMeasure : MeasureTheory.Measure Nat'
    );
    expect(artifact?.lean).toContain('def queueMeasurableEpsilon : ENNReal := 1');
    expect(artifact?.lean).toContain('def queueAtomHittingBound : Nat -> Nat');
    expect(artifact?.lean).toContain('def queueWitnessHittingBound : Nat -> Nat');
    expect(artifact?.lean).toContain('def queueObservableScale : Real := 1');
    expect(artifact?.lean).toContain('def queueObservableOffset : Real := 0');
    expect(artifact?.lean).toContain('def queueObservable : Nat -> Real');
    expect(artifact?.lean).toContain('def queueExpectedObservable : Nat -> Real');
    expect(artifact?.lean).toContain('def queueLyapunov : Nat -> Real');
    expect(artifact?.lean).toContain('def queueContinuousDriftGap : Real := 1');
    expect(artifact?.lean).toContain('def queueSupportStep : Nat -> Nat');
    expect(artifact?.lean).toContain('noncomputable def queueSupportKernel');
    expect(artifact?.lean).toContain('noncomputable def queueWitnessKernel');
    expect(artifact?.lean).toContain('MeasurableAtomAccessible queueSupportKernel queueAtom');
    expect(artifact?.lean).toContain('MeasurableAtomHittingBoundAtAtom');
    expect(artifact?.lean).toContain('MeasurableQuantitativeLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain('MeasurableQuantitativeHarrisCertified');
    expect(artifact?.lean).toContain('MeasurableEventuallyConvergesToReference');
    expect(artifact?.lean).toContain('MeasurableFiniteTimeHarrisRecurrent');
    expect(artifact?.lean).toContain('MeasurableFiniteTimeLevyProkhorovGeometricErgodic');
    expect(artifact?.lean).toContain('MeasurableLevyProkhorovGeometricDecayAfterBurnIn');
    expect(artifact?.lean).toContain('MeasurableLevyProkhorovGeometricErgodic');
    expect(artifact?.lean).toContain('measurableSmallSetHittingBound_of_quantitativeLaminarCertifiedAtAtom');
    expect(artifact?.lean).toContain(
      'measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom'
    );
    expect(artifact?.lean).toContain(
      'measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence'
    );
    expect(artifact?.lean).toContain('MeasurableRealObservableWitness');
    expect(artifact?.lean).toContain('MeasurableLyapunovDriftWitness');
    expect(artifact?.lean).toContain('MeasurableContinuousHarrisWitness');
    expect(artifact?.lean).toContain(
      'measurableReferencePositivePersistent_of_eventualConvergence'
    );
    expect(artifact?.lean).toContain('natQueueWitnessKernel');
    expect(artifact?.lean).toContain('natMeasurableQuantitativeHarrisCertified_of_queueWitnessKernel');
    expect(artifact?.lean).toContain('natMeasurableLaminarCertified_of_queueStep');
    expect(artifact?.lean).toContain(
      'natMeasurableRealObservableWitness_of_queueStep'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableLyapunovDriftWitness_of_queueStep_with_gap'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableContinuousHarrisWitness_of_queueStep_with_gap'
    );
    expect(artifact?.lean).toContain('natQueueAffineObservable');
    expect(artifact?.lean).toContain('natQueueAffineExpectedObservable');
    expect(artifact?.lean).toContain('natMeasurableQuantitativeLaminarCertified_of_queueStep');
    expect(artifact?.lean).toContain('natMeasurableEventuallyConvergesToAtom_of_queueStep');
    expect(artifact?.lean).toContain('natSmallSetRecurrent_of_uniformPredecessorMinorization');
    expect(artifact?.lean).toContain('def queueAtom : Nat := 0');
    expect(artifact?.lean).toContain('def queueMinorizationFloor : Real := 1');
    expect(artifact?.lean).toContain('def queueKernel (lam mu : Real) (alpha : Nat -> Real)');
    expect(artifact?.lean).toContain('norm_num [lam, mu, alpha]');
    expect(artifact?.lean).toContain('simpa [queueMinorizationFloor] using h_margin_floor');
    expect(artifact?.lean).toContain('CountableSmallSetRecurrent (queueKernel lam mu alpha)');
    expect(artifact?.lean).not.toContain('(queueMeasurableKernel : ProbabilityTheory.Kernel Nat Nat)');
    expect(artifact?.lean).not.toContain('stepMass : Nat -> Real');
    expect(artifact?.lean).not.toContain(
      '(h_invariant : ProbabilityTheory.Kernel.Invariant queueSupportKernel invariantMeasure)'
    );
    expect(artifact?.lean).not.toContain(
      'MeasurableSmallSetMinorized queueSupportKernel queueSmallSet minorizationMeasure queueEpsilon'
    );
    expect(artifact?.lean).toContain('countable-queue-theorem: true');
  });

  it('emits explicit affine observable parameters from .gg state properties', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (traffic:Source { pressure: "lambda" })
      (processing:State { potential: "beta1", observable_kind: "fluid-backlog", observable: "backlog_bytes", observable_scale: "2.5", observable_offset: "0.25" })
      (complete:Sink { beta1_target: "0", capacity: "32" })
      (traffic)-[:FORK { weight: "1.0" }]->(processing)
      (processing)-[:FOLD { service_rate: "mu", drift_gamma: "1.0" }]->(complete)
      (processing)-[:VENT { drift_coefficient: "alpha(n)", repair_debt: "0" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/affine-observable.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.lean).toContain('def queueObservableScale : Real := 2.5');
    expect(artifact?.lean).toContain('def queueObservableOffset : Real := 0.25');
    expect(artifact?.lean).toContain('def queueContinuousDriftGap : Real := 2.5');
    expect(artifact?.lean).toContain(
      'natQueueAffineObservable queueObservableScale queueObservableOffset'
    );
    expect(artifact?.lean).toContain(
      'natQueueAffineExpectedObservable'
    );
  });

  it('emits bounded affine drift gaps below the observable scale', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (traffic:Source { pressure: "lambda" })
      (processing:State { potential: "beta1", observable_kind: "thermal-load", observable_scale: "2", drift_gap: "1" })
      (complete:Sink { beta1_target: "0", capacity: "16" })
      (traffic)-[:FORK { weight: "1.0" }]->(processing)
      (processing)-[:FOLD { service_rate: "mu", drift_gamma: "1.0" }]->(complete)
      (processing)-[:VENT { drift_coefficient: "alpha(n)", repair_debt: "0" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/bounded-drift-gap.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.lean).toContain('def queueObservableScale : Real := 2');
    expect(artifact?.lean).toContain('def queueContinuousDriftGap : Real := 1');
    expect(artifact?.lean).toContain(
      'natMeasurableLyapunovDriftWitness_of_queueStep_with_gap'
    );
    expect(artifact?.lean).toContain(
      'natMeasurableContinuousHarrisWitness_of_queueStep_with_gap'
    );
  });
});
