# Gnosis Mod

Parent: [Gnosis Source](../README.md)

Module and package management surfaces for reproducible `.gg` module resolution.

## Files

- [manager.ts](./manager.ts): `gnosis.mod` / `gnosis.lock` parsing, duplicate detection, deterministic lockfile generation, and `init` / `tidy` workflows.
- [manager.test.ts](./manager.test.ts): Regression tests for module parsing and reproducible lockfile behavior.
- [loader.ts](./loader.ts): native `.mgg` import/export parsing, filesystem-backed module resolution, AST merge/lowering, and canonical merged-source rendering for CLI/runtime consumers.
- [loader.test.ts](./loader.test.ts): Regression tests for `.mgg` parsing, re-export modules, import validation, and merged topology loading.
