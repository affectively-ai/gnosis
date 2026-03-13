# Betty

Parent: [Gnosis Source](../README.md)

Bootstrap compiler surfaces for parsing `.gg`, validating graph structure, and lowering topology semantics into runtime-ready ASTs.

## Files

- [compiler.ts](./compiler.ts): Betty parser/compiler for `.gg`, including tagged-route exhaustiveness checks for `Result`, `Option`, and closed `Variant` nodes, UFCS lowering for single-receiver `PROCESS` call chains, and opt-in thermodynamic validation output.
- [compiler.test.ts](./compiler.test.ts): Compiler parsing and diagnostic regression tests.
- [stability.ts](./stability.ts): Thermodynamic/topological validation pass for spectral radius, drift floors, finite-state small-set recurrence witnesses, branch-isolated venting, and emitted stability metadata. Queue-like symbolic/numeric thermodynamic topologies now also surface a structured `countableQueue` witness for infinite-state Lean emission, including the laminar representative atom used by the proof kernel.
- [lean.ts](./lean.ts): Lean 4 proof artifact generator for thermodynamic topologies, emitting finite `CertifiedKernel` witnesses together with spectral, finite-state recurrence, and countable-state reneging-queue artifacts. Symbolic queue proofs now consume the compiler-emitted `countableQueue` witness to synthesize a concrete `queueKernel` over `Nat` queue depths, prove a common-atom small-set minorization theorem, prove a uniform predecessor minorization theorem outside the small set, derive countable recurrence, prove that every queue state reaches the shared laminar atom through positive-support steps, package those facts into a named Harris-prelude theorem over the emitted proof kernel, discharge a recurrent-class theorem on top of that prelude, prove a quantitative atom-hitting bound / geometric-envelope theorem, close with a single `CountableLaminarGeometricStabilityAtAtom` theorem for the emitted queue family, and now also emit measurable-facing theorem stubs keyed to the same laminar atom and small set so generated artifacts can target the `MeasurableHarrisCertified` bridge in `GnosisProofs.lean`.
- [lean.test.ts](./lean.test.ts): Lean artifact generation regression tests.

## Subdirectories

- [quantum](./quantum/README.md): Quantum bridge helpers for mapping parsed topology edges into low-level runtime flags.
