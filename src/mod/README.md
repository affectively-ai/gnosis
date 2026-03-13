# Gnosis Mod

Parent: [Gnosis Source](../README.md)

Module and package management surfaces for reproducible `.gg` module
resolution, including lockfile-backed bare-specifier imports from vendored
`.gnosis/deps/...` packages.

## Files

- [manager.ts](./manager.ts): `gnosis.mod` / `gnosis.lock` parsing, duplicate detection, deterministic lockfile generation, and `init` / `tidy` workflows.
- [manager.test.ts](./manager.test.ts): Regression tests for module parsing and reproducible lockfile behavior.
- [loader.gg](./loader.gg): GG-native module loading pipeline with native case routing for format, import presence, and export mode (`detect-format -> branch(gg|mgg) -> parse -> branch(imports|none) -> resolve-specifiers -> load-imports -> validate-imports -> compile -> branch(exports explicit|implicit) -> merge -> validate-exports -> assemble`) used by the host shim for unified `.gg` / `.mgg` orchestration.
- [loader.ts](./loader.ts): native `.gg` / `.mgg` import/export parsing, filesystem-backed and lockfile-backed module resolution, GG-driven loading, cycle detection, AST merge/lowering, and canonical merged-source rendering for CLI/runtime consumers.
- [loader.test.ts](./loader.test.ts): Regression tests for `.mgg` parsing, re-export modules, bare-specifier dependency loading, cycle rejection, import validation, and merged topology loading.
