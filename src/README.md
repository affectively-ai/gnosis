# Gnosis Source

Parent: [Gnosis README](../README.md)

This directory contains the Gnosis compiler, runtime, and execution tooling.

## Top-Level Modules

- `index.ts`: CLI/runtime orchestration entrypoint (kept for CLI workflows).
- `lib.ts`: Package main entry used by `@affectively/gnosis` imports.
- `cli.ts`: CLI entrypoint used by `bin/gnosis.js`.
- `neural-compat.ts`: `.gg`-native neural runtime exposing `NeuralEngine`,
  `GPUEngine`, `WebNNEngine`, canonical topic-domain module constants, and neural graph repositories/types.

## Subdirectories

- [auth](./auth): Native UCAN/ZK/custodial runtime integration and edge authorization helpers.
- [betty](./betty): Betty bootstrap compiler, parser, and quantum bridge.
- [capabilities](./capabilities): Runtime capability profiles and target validation (`workers`, `node`, `bun`).
- [mod](./mod): `gnosis mod` package manager commands.
- [runtime](./runtime): Runtime registry, interpreter engine, native frame runtime adapter, and renderer compatibility layer.
