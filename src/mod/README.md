# Gnosis Mod

Parent: [Gnosis Source](../README.md)

Module and package management surfaces for reproducible `.gg` module resolution.

## Files

- [manager.ts](./manager.ts): `gnosis.mod` / `gnosis.lock` parsing, duplicate detection, deterministic lockfile generation, and `init` / `tidy` workflows.
- [manager.test.ts](./manager.test.ts): Regression tests for module parsing and reproducible lockfile behavior.
