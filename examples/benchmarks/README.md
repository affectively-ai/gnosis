# Fold Benchmark Topologies

- Parent README: [../README.md](../README.md)

This directory contains the Gnosis-native topologies for the learned fold-boundary benchmarks.

Two benchmark families live here:

- `fold-training-*`: two affine paths and one recombination node for the cancellation-sensitive `left - right` task.
- `moe-routing-*`: four sign-specialized experts behind one routing gate for the mini-MoE `|x| + |y|` routing task.

These same topologies also drive four additional Chapter 17 learned-evidence surfaces:

- the one-path negative-control benchmark in `src/benchmarks/negative-controls-benchmark.ts`, where the data are restricted so one branch or one expert is sufficient and nonlinear selection should therefore not be penalized;
- the continuous regime sweep in `src/benchmarks/regime-sweep-benchmark.ts`, where the targets interpolate from one-path parity to mandatory additive recombination;
- the adversarial controls in `src/benchmarks/adversarial-controls-benchmark.ts`, where the targets intentionally reward winner selection or early stopping;
- and the artifact writers in the companion suite, which reuse these same `.gg` modules to keep topology fixed while the data distribution moves across the boundary.

Within each family, only the `FOLD { strategy: ... }` property changes.

## Files

- `fold-training-linear.gg`: additive recombination baseline.
- `fold-training-winner-take-all.gg`: nonlinear winner-selection ablation.
- `fold-training-early-stop.gg`: nonlinear first-branch ablation.
- `fold-training.test.gg`: `.test.gg` suite that verifies all three benchmark modules as safe bounded topologies.
- `moe-routing-linear.gg`: additive routed-expert baseline.
- `moe-routing-winner-take-all.gg`: nonlinear top-1 routed-expert ablation.
- `moe-routing-early-stop.gg`: nonlinear first-branch routed-expert ablation.
- `moe-routing.test.gg`: `.test.gg` suite that verifies the three routed-expert modules as safe bounded topologies.
