# Gnosis Source

Parent: [Gnosis README](../README.md)

This directory contains the Gnosis compiler, runtime, and execution tooling.

## Top-Level Modules

- `index.ts`: CLI/runtime orchestration entrypoint (kept for CLI workflows), including `build`/`verify`, `--verbose` REPL banner mode, and `--steering-mode <off|report|suggest|apply>`.
- CLI easter eggs: `crank` = Wallace check, `stank` = Buley check.
- `lib.ts`: Package main entry used by `@affectively/gnosis` imports.
- `cli.ts`: CLI entrypoint used by `bin/gnosis.js`.
- `analysis.ts`: Formal complexity/steering analysis for `.gg` topologies, including canonical `wallaceNumber`/`wally` frontier diagnostics, `twokeys` EDA summaries, micro-Charley wall/CPU telemetry, and steering modes. The old `charleyNumber` steering name is removed.
- `neural-compat.ts`: `.gg`-native neural runtime exposing [`@affectively/neural`](https://github.com/affectively-ai/neural/)'s `NeuralEngine` interface, including `GPUEngine`, `WebNNEngine`, canonical topic-domain module constants, and neural graph repositories/types.

## Subdirectories

- [auth](./auth): Native UCAN/ZK/custodial runtime integration, HALT attestation verification, and execution-envelope authorization helpers.
- [benchmarks](./benchmarks/README.md): seeded benchmark helpers for parameter-matched `.gg` topologies, including the learned linear-vs-selection fold ablation used by the Chapter 17 companion artifacts.
- [betty](./betty): Betty bootstrap compiler, parser, and quantum bridge.
- [capabilities](./capabilities): Runtime capability profiles and target validation (`workers`, `node`, `bun`).
- [mod](./mod): `gnosis mod` package manager commands.
- [runtime](./runtime): Runtime registry, interpreter engine, native `Result`/`Option`/`Destructure` handlers, case-aware branch routing, native frame runtime adapter, and renderer compatibility layer.
