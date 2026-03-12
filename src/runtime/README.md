# Gnosis Runtime

Parent: [Gnosis Source](../README.md)

Runtime execution surfaces for graph traversal and handler dispatch.

## Files

- [registry.ts](./registry.ts): Label-to-handler registration map.
- [engine.ts](./engine.ts): Topology execution engine for `FORK/RACE/FOLD/VENT` graphs.
- [renderer-compat.ts](./renderer-compat.ts): 3D renderer compatibility layer targeting `@affectively/aeon-3d` with local fallback.
- [engine.test.ts](./engine.test.ts): Runtime engine behavior tests.
- [renderer-compat.test.ts](./renderer-compat.test.ts): Topology renderer compatibility tests.
