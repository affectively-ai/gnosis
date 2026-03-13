# Generated TLA Artifacts

Parent: [Gnosis README](../../README.md)

This directory stores generated TLA+/TLC artifacts emitted from `.gg` toy systems via `gnosis build` and the batch helper `bun run build:toy-tla`.

Files written here are generated outputs, not hand-authored source.

- `manifest.json`: machine-readable inventory of generated artifacts, retained logical-check failures, and logical-opposite pairings.
- `manifest.md`: human-readable summary table of the same inventory.

Logical opposites are mapped only for explicit `warmup_*` and `warmup_invert_*` pairs. A non-zero logical-check result does not discard emitted TLA artifacts; only missing artifact emission is treated as a batch failure.
