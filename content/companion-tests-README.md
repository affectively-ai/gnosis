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
- `certifiedKernel_stable`
- `certifiedKernel_stable_of_drift_certificate`

## Betti

Betti's Lean artifact emission should still pass after the proof workspace changes:

```bash
bun test open-source/gnosis/src/betty/lean.test.ts
```

This confirms that the compiler's generated proof artifact now emits a real `CertifiedKernel` witness that imports the shared proof workspace instead of relying on a local `Unit`/axiom scaffold.
