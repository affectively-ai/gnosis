# Fold Benchmark Topologies

- Parent README: [../README.md](../README.md)

This directory contains the Gnosis-native topologies for the learned fold-boundary benchmark.

All three `.gg` modules share the same topology and parameter count:

- one input pair,
- two affine branch-local paths,
- one recombination node,
- one output path.

Only the `FOLD { strategy: ... }` property changes.

## Files

- `fold-training-linear.gg`: additive recombination baseline.
- `fold-training-winner-take-all.gg`: nonlinear winner-selection ablation.
- `fold-training-early-stop.gg`: nonlinear first-branch ablation.
- `fold-training.test.gg`: `.test.gg` suite that verifies all three benchmark modules as safe bounded topologies.
