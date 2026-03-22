# Gnosis Benchmarks

- Parent README: [../README.md](../README.md)

This directory contains executable benchmark helpers for Gnosis-native topologies.

Together these reports now cover the full Chapter 17 learned boundary:

- where linear recombination beats nonlinear selection,
- where the separation disappears,
- where sparse nonlinear selection is the correct inductive bias,
- how sharply the boundary opens as additive recombination becomes necessary,
- how Aeon framing plus out-of-order reassembly interacts with the same fold boundary on a toy transformer battery,
- where a recursively rotated sparse transformer stays accuracy-competitive against a dense baseline while activating materially fewer chains,
- how a backend-diverse mirrored `HeteroMoAFabric` meta-race compares against a sequential baseline while preserving per-run telemetry, learned slowest-to-fastest launch schedules, community-memory state, and Cloud Run provenance,
- how the Betty compiler's 13 internal phases (UFCS lowering, parsing, stability, optimizer, coarsening, semantic compatibility, hope certificates, Lean codegen, and the O(E) metric passes) compare against each other and against the lightweight `parseGgProgram` parser across small, medium, and large topologies,
- and how the three compiler variants (Betty, Betti, aeon-logic) perform head-to-head on the named compiler family topologies (`betti.gg`, `franky.gg`, `beckett.gg`) and inline topologies of varying size, confirming the diversity theorem prediction: more diverse compilation approaches (regex-only, handler-pipeline, full-verification) form a Pareto frontier where depth of analysis trades against speed.

## Files

- `statistics.ts`: deterministic summary-statistics and bootstrap-interval helpers shared by the benchmark reports.
- `fold-training-benchmark.ts`: seeded parameter-matched training benchmark for the linear-vs-selection fold boundary, driven by `.gg` topologies in [../../examples/benchmarks/README.md](../../examples/benchmarks/README.md) and now emitting 95% bootstrap intervals alongside the point estimates.
- `fold-training-benchmark.test.ts`: regression tests for the benchmark report and the companion `.test.gg` topology suite.
- `negative-controls-benchmark.ts`: seeded one-path control benchmark that reuses the existing affine and routed Chapter 17 topologies on tasks where additive recombination is unnecessary, checking that the fold-rule separation collapses as predicted.
- `negative-controls-benchmark.test.ts`: regression tests for the negative-control parity report.
- `near-control-sweep-benchmark.ts`: fine-grained low-demand sweep that zooms the control end of the affine and routed families, identifying how long parity persists before linear separation becomes measurable.
- `near-control-sweep-benchmark.test.ts`: regression tests for the near-control parity-to-separation cut points.
- `regime-sweep-benchmark.ts`: seeded regime sweep that continuously varies how much the target depends on additive recombination, identifying the first-separated affine and routed regimes where linear fold starts to outperform nonlinear selection.
- `regime-sweep-benchmark.test.ts`: regression tests for the regime-sweep report and its first-separated boundary summaries.
- `adversarial-controls-benchmark.ts`: seeded adversarial suite that reuses the same benchmark families on tasks designed to reward winner selection or early stopping, checking that the theory remains symmetric and does not overclaim linear superiority.
- `adversarial-controls-benchmark.test.ts`: regression tests for the adversarial-control rankings and learning-curve summaries.
- `moe-routing-benchmark.ts`: harder four-expert mini-MoE routing benchmark where two routed paths must contribute per off-axis sample, again varying only the `FOLD` strategy.
- `moe-routing-benchmark.test.ts`: regression tests for the mini-MoE routing benchmark report and `.test.gg` topology suite.
- `aeon-framed-transformer-benchmark.ts`: staged toy-transformer benchmark that reuses the dual-contribution routing geometry, upgrades the topology to a four-stage Wallington triangle with internal head/feedforward whip, emits real Aeon `FlowFrame`s per transformerlet, and reports both semantic separation and frame-integrity metrics.
- `aeon-framed-transformer-benchmark.test.ts`: regression tests for the framed transformer benchmark report plus the benchmark and structural `.test.gg` suites.
- `moa-transformer-shootout-benchmark.ts`: direct regular-vs-MoA rotated transformer comparison that keeps total block/head capacity fixed, then measures whether sparse outer routing plus sparse inner head whip preserves accuracy while cutting active chains and flow frames; the sparse `.gg` side now exercises the first-class `StructuredMoA` primitive rather than handwritten repeated subgraphs.
- `moa-transformer-shootout-benchmark.test.ts`: regression tests for the MoA shootout report and the paired `.test.gg` benchmark modules, using a reduced deterministic test config plus cached report reuse instead of rerunning the paper-scale default benchmark inside the unit suite.
- `moa-transformer-evidence-benchmark.ts`: paper-oriented evidence layer over the MoA shootout, adding a workload-size sweep, a sparsity ablation matrix, and timing summaries that track where the MoA accuracy gap closes while timing and frame savings persist; it now reuses the unchanged regular baseline across MoA-only ablations instead of retraining identical dense baselines.
- `moa-transformer-evidence-benchmark.test.ts`: regression tests for the MoA evidence report and its sweep/ablation claims, now backed by one cached reduced-size benchmark report so the suite checks the qualitative evidence instead of competing with paper-scale runtime noise.
- `hetero-moa-fabric-benchmark.ts`: benchmark harness for the mirrored `HeteroMoAFabric` runtime, with both a synthetic harness and a `--live` discovered-backend path that compares a sequential baseline against the learned cross-layer meta-race, surfaces Cloud Run env metadata, and emits winner/loser/vent telemetry plus final community-memory scores and launch schedules for proof-backed evidence capture.
- `hetero-moa-fabric-benchmark.test.ts`: regression tests for the hetero-fabric benchmark report, including the learned launch-schedule surface, the discovered-backend live path, and Cloud Run provenance detection.
- `compiler-phase-benchmark.ts`: Gnosis compiler family benchmark with two sections. *Phase breakdown*: instruments all 13 phases of the `BettyCompiler.parse()` pipeline -- UFCS lowering, aeon-logic lightweight parse, Betty full parse, Betti self-hosted pipeline, stability analysis (spectral kernel + drift floors), optimizer passes (coarsening, codec racing, warmup efficiency), coarsening synthesis, semantic compatibility, hope certificate generation, void dimensions, Landauer heat, deficit analysis, and Lean 4 codegen -- across small/medium/large topology size classes. *Compiler shootout*: races all five compiler variants head-to-head -- **aeon-logic** (regex parser), **Betti** (self-hosted handler pipeline), **Franky** (polyglot fork/race/fold: FORK(6 parallel detectors) → RACE → compile), **Beckett** (transport-shaped: FORK(chunks) → FORK(4 codec strategies) → RACE → FOLD(reassemble)), and **Betty** (full verification with stability, semantic, hope, Lean) -- on the named compiler family topologies (`betti.gg`, `franky.gg`, `beckett.gg`) and inline topologies of varying size. Franky and Beckett are implemented as genuine topology-driven compilation strategies that apply their pipeline shape (parallel detection racing, chunked codec racing) to `.gg` parsing. Emits per-phase and per-compiler mean/median/stdev/min/max/95% bootstrap CI, a compiler ranking averaged across all topologies, and a global phase cost ranking. Ships inline topologies for deterministic testing and a `--reduced` CLI flag for fast runs.
- `compiler-phase-benchmark.test.ts`: 18 regression tests for the compiler phase benchmark and five-way compiler shootout, validating that all 13 phases are timed, that all five compilers produce valid ASTs, that Betty is the slowest (full verification), that all parse-only compilers are faster than Betty, that all compilers agree on edge counts, that the diversity theorem holds (five compilers form a Pareto frontier trading speed for verification depth), and that confidence intervals are well-formed.
