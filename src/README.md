# Gnosis Source

Parent: [Gnosis README](../README.md)

This directory contains the Gnosis compiler, runtime, and execution tooling.

## Top-Level Modules

- `index.ts`: CLI/runtime orchestration entrypoint (kept for CLI workflows), including `build`/`verify`, `--verbose` REPL banner mode, `--steering-mode <off|report|suggest|apply>`, and optional `--execution-auth-json` / `--execution-auth-file` boundary-walk UCAN envelopes.
- CLI easter eggs: `crank` = Wallace check, `stank` = Buley check.
- `lib.ts`: Package main entry used by `@affectively/gnosis` imports.
- `cli.ts`: CLI entrypoint used by `bin/gnosis.js`.
- `analysis.ts`: Formal complexity/steering analysis for `.gg` topologies, including canonical `wallaceNumber` frontier diagnostics with `wally`/`frontierDeficit` aliases, the FailureTrilemma/Composition/Universality collapse-cost surface (`totalVentCost`, `totalRepairDebt`, `paidStageCount`, `collapseCostFloor`, `freeCollapsePrefixRisk`), boundary-walk bias / lean-in classification, `twokeys` EDA summaries, and separate microCharley wall/CPU time telemetry. The old `charleyNumber` steering name is removed.
- `behavioral-taxonomy.ts`: builds a Gnosis topology from the open-source behavioral-loop corpus, infers prerequisite and same-origin couplings, measures the resulting buley number for the full dataset or filtered subsets, emits per-loop executable `.gg` topologies plus `.tla`/`.cfg` artifacts, and can execute single-loop behavior topologies through the runtime.
- `ufcs.ts`: source-level lowering for narrow single-receiver call syntax like `func(value)` and `value.func()`, plus the shared normalization pass that expands GG structured primitives before compiler/runtime analysis.
- `structured-primitives.ts`: GG macro lowerer for first-class structured graph forms such as `StructuredMoA`, expanding a compact primitive declaration into the nested Wallington Rotation plus Worthington Whip topology it denotes.
- `steering-trace.ts`: `QDoc`/Aeon-relay-backed steering trace stream plus indexed, bounded `twokeys` cohort summaries for empirical Wallace-vs-microCharley time analysis across runs and nodes, including aggregate failure-trajectory payment fields (`totalVentCost`, `totalRepairDebt`, `paidStageCount`, `collapseCostFloor`, `freeCollapsePrefixRisk`) with loud alerting for failures, invalid CRDT events, relay disconnects, and UCAN-denied boundary-walk surfaces.
- `neural-compat.ts`: `.gg`-native neural runtime exposing [`@affectively/neural`](https://github.com/affectively-ai/neural/)'s `NeuralEngine` interface, including `GPUEngine`, `WebNNEngine`, canonical topic-domain module constants, and neural graph repositories/types.
- `benchmarks/`: learned benchmark kernels for the Chapter 17 fold-boundary evidence package, including the original cancellation learner, the one-path negative controls, the fine-grained near-control zoom, the continuous regime sweep, the adversarial-control suite, and the harder mini-MoE routing learner.

## Subdirectories

- [auth](./auth): Native UCAN/ZK/custodial runtime integration, topology-local auth bootstrap, HALT attestation verification, execution-envelope authorization helpers, and steering/boundary-walk capability contracts.
- [benchmarks](./benchmarks/README.md): seeded benchmark helpers for parameter-matched `.gg` topologies, including the cancellation learner, the one-path negative controls, the near-control zoom, the regime sweep, the adversarial controls, the mini-MoE routing learner, the Aeon-framed transformer battery, the direct rotated MoA-vs-regular transformer shootout, and the paper-oriented sweep/ablation evidence layer used by the Chapter 17 companion artifacts.
- [betty](./betty/README.md): Betty bootstrap compiler, parser, closed-variant exhaustiveness checks, UFCS lowering, thermodynamic stability auditing, certified-kernel Lean proof artifact generation, direct spectral-only certification for acyclic no-drift lowered topologies such as sink-wrapped `StructuredMoA`, deterministic/measurable queue proof emission over `queueSupportKernel`, metric-level Lévy-Prokhorov exact-convergence, geometric-decay, and abstract geometric-ergodicity queue emission, stochastic witness-kernel quantitative Harris certificates over `queueWitnessKernel`, and quantum bridge.
- [capabilities](./capabilities/README.md): Runtime capability profiles, effect-contract summaries, and target validation (`workers`, `node`, `bun`).
- [crdt](./crdt/README.md): topology-native CRDT primitives plus the generic Aeon relay adapter and DashRelay compatibility shim.
- [mod](./mod/README.md): `gnosis mod` package manager commands plus native `.mgg` module parsing, resolution, and merged-source loading.
- [runtime](./runtime): Runtime registry, interpreter engine, an internal structured-concurrency core for the Gnosis multiprocessing analogue, native `Result`/`Option`/`Variant`/`Destructure`/`Delay` handlers, case-aware branch routing, path-aware and tuple-aware destructuring, persistent execution-auth propagation, structured concurrency semantics for `RACE`/`FOLD`, native frame runtime adapter, emitted stability metadata including measurable queue, Lévy-Prokhorov exact-convergence, Lévy-Prokhorov geometric-decay, and abstract Lévy-Prokhorov geometric-ergodicity theorem names, and renderer compatibility layer.
