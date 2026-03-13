# Gnosis CRDT

Parent: [Gnosis Source](../README.md)

This directory contains Gnosis's native CRDT and relay primitives.

## Files

- `qdoc.ts`: topology-native CRDT document model, delta encoding, presence, and GG export.
- `aeon-relay.ts`: generic Aeon-compatible relay adapter for `QDoc`, including configurable join envelopes and telemetry hooks for OTEL bridges.
- `dashrelay-adapter.ts`: compatibility shim that re-exports the generic Aeon relay surface for DashRelay-era imports.
- `yjs-compat.ts`: compatibility exports for Yjs-shaped APIs used by downstream consumers.
- `qdoc.test.ts`: focused CRDT behavior and sync protocol tests.
- `aeon-relay.test.ts`: relay handshake and telemetry tests for the generic Aeon relay abstraction.
