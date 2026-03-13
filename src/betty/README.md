# Betty

Parent: [Gnosis Source](../README.md)

Bootstrap compiler surfaces for parsing `.gg`, validating graph structure, and lowering topology semantics into runtime-ready ASTs.

## Files

- [compiler.ts](./compiler.ts): Betty parser/compiler for `.gg`, including tagged-route exhaustiveness checks for `Result`, `Option`, and closed `Variant` nodes plus UFCS lowering for single-receiver `PROCESS` call chains.
- [compiler.test.ts](./compiler.test.ts): Compiler parsing and diagnostic regression tests.

## Subdirectories

- [quantum](./quantum/README.md): Quantum bridge helpers for mapping parsed topology edges into low-level runtime flags.
