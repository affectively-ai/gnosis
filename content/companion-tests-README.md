# Chapter 17 Companion Checks

Back to [Content](./README.md)

The monoidal repair for Chapter 17 has two companion checks.

## Lean

These commands rebuild the local Mathlib workspace and re-run the mechanized laws named in the manuscript:

```bash
cd open-source/gnosis
lake build GnosisProofs
lake env lean GnosisProofs.lean
```

The relevant theorems live in [`GnosisProofs.lean`](../GnosisProofs.lean):

- `tensor_interchange`
- `race_tree_coherence`
- `fold_tree_coherence`
- `c3_deterministic_fold`
- `spectrallyStable_of_nilpotent`
- `spectrallyStable_of_rowMass`
- `supportPath_reachesSmallSet_of_distanceWitness`
- `finiteSmallSetRecurrent_of_distanceWitness`
- `countableSupportPath_reachesSmallSet_of_driftWitness`
- `countableSmallSetRecurrent_of_driftWitness`
- `countableAtomicSmallSetMinorized_one_of_collapse`
- `countableAtomAccessible_of_smallSetRecurrence_and_atomicMinorization`
- `countablePsiIrreducibleAtAtom_of_atomAccessible`
- `countableHarrisPreludeAtAtom_of_components`
- `countableHarrisRecurrentClassAtAtom_of_recurrence_and_prelude`
- `countableAtomHittingBoundAtAtom_of_minorization`
- `countableGeometricEnvelopeAtAtom_of_harrisPrelude_and_bound`
- `countableAtomGeometricHitLowerBoundAtAtom_of_minorization`
- `countableQuantitativeGeometricEnvelopeAtAtom_of_components`
- `countableLaminarGeometricStabilityAtAtom_of_components`
- `measurableHarrisPrelude_of_components`
- `measurableHarrisPrelude_of_reversible`
- `measurableHarrisPrelude_of_le_referenceMeasure`
- `measurableSmallSetAccessible_of_irreducible`
- `measurableReferencePositiveAccessible_of_irreducible`
- `measurableHarrisCertified_of_prelude`
- `measurableIrreducible_dirac_of_atomAccessible`
- `measurableHarrisCertified_of_atomAccessible`
- `measurableSmallSetAccessible_of_atomAccessible`
- `measurableContainingAtomAccessible_of_atomAccessible`
- `natSmallSetRecurrent_of_stepDown`
- `natSmallSetRecurrent_of_uniformPredecessorMinorization`
- `natSmallSetRecurrent_of_margin_step`
- `certifiedKernel_stable`
- `certifiedKernel_stable_of_drift_certificate`

## Betti

Betti's Lean artifact emission should still pass after the proof workspace changes:

```bash
bun test open-source/gnosis/src/betty/lean.test.ts
```

This confirms that the compiler's generated proof artifact now emits a real `CertifiedKernel` witness that imports the shared proof workspace instead of relying on a local `Unit`/axiom scaffold.
