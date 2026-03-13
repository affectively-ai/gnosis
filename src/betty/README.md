# Betty

Parent: [Gnosis Source](../README.md)

Bootstrap compiler surfaces for parsing `.gg`, validating graph structure, and lowering topology semantics into runtime-ready ASTs.

## Files

- [compiler.ts](./compiler.ts): Betty parser/compiler for `.gg`, including tagged-route exhaustiveness checks for `Result`, `Option`, and closed `Variant` nodes, UFCS lowering for single-receiver `PROCESS` call chains, and opt-in thermodynamic validation output.
- [compiler.test.ts](./compiler.test.ts): Compiler parsing and diagnostic regression tests.
- [stability.ts](./stability.ts): Thermodynamic/topological validation pass for spectral radius, drift floors, small-set reachability, branch-isolated venting, and emitted stability metadata.
- [lean.ts](./lean.ts): Lean 4 proof artifact generator for thermodynamic topologies, emitting finite `CertifiedKernel` witnesses that import the shared Gnosis proof workspace instead of relying on a local `Unit`/axiom scaffold.
- [lean.test.ts](./lean.test.ts): Lean artifact generation regression tests.

## Subdirectories

- [quantum](./quantum/README.md): Quantum bridge helpers for mapping parsed topology edges into low-level runtime flags.
