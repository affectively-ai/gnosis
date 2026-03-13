# Gnosis Benchmarks

- Parent README: [../README.md](../README.md)

This directory contains executable benchmark helpers for Gnosis-native topologies.

Together these reports now cover the full Chapter 17 learned boundary:

- where linear recombination beats nonlinear selection,
- where the separation disappears,
- where sparse nonlinear selection is the correct inductive bias,
- and how sharply the boundary opens as additive recombination becomes necessary.

## Files

- `statistics.ts`: deterministic summary-statistics and bootstrap-interval helpers shared by the benchmark reports.
- `fold-training-benchmark.ts`: seeded parameter-matched training benchmark for the linear-vs-selection fold boundary, driven by `.gg` topologies in [../../examples/benchmarks/README.md](../../examples/benchmarks/README.md) and now emitting 95% bootstrap intervals alongside the point estimates.
- `fold-training-benchmark.test.ts`: regression tests for the benchmark report and the companion `.test.gg` topology suite.
- `negative-controls-benchmark.ts`: seeded one-path control benchmark that reuses the existing affine and routed Chapter 17 topologies on tasks where additive recombination is unnecessary, checking that the fold-rule separation collapses as predicted.
- `negative-controls-benchmark.test.ts`: regression tests for the negative-control parity report.
- `regime-sweep-benchmark.ts`: seeded regime sweep that continuously varies how much the target depends on additive recombination, identifying the first-separated affine and routed regimes where linear fold starts to outperform nonlinear selection.
- `regime-sweep-benchmark.test.ts`: regression tests for the regime-sweep report and its first-separated boundary summaries.
- `adversarial-controls-benchmark.ts`: seeded adversarial suite that reuses the same benchmark families on tasks designed to reward winner selection or early stopping, checking that the theory remains symmetric and does not overclaim linear superiority.
- `adversarial-controls-benchmark.test.ts`: regression tests for the adversarial-control rankings and learning-curve summaries.
- `moe-routing-benchmark.ts`: harder four-expert mini-MoE routing benchmark where two routed paths must contribute per off-axis sample, again varying only the `FOLD` strategy.
- `moe-routing-benchmark.test.ts`: regression tests for the mini-MoE routing benchmark report and `.test.gg` topology suite.
