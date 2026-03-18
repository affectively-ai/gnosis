# Gnosis CRDT

Parent: [Gnosis Source](../README.md)

This directory contains Gnosis's native CRDT and relay primitives.

## Files

- `qdoc.ts`: topology-native CRDT document model, delta encoding, presence, GG export, and typed observation/change event contracts such as `QDocEvent`, `QMapKeyChange`, and `QMapEvent`.
- `aeon-relay.ts`: generic Aeon-compatible relay adapter for `QDoc`, including configurable join envelopes and telemetry hooks for OTEL bridges.
- `dashrelay-adapter.ts`: compatibility shim that re-exports the generic Aeon relay surface for DashRelay-era imports.
- `yjs-compat.ts`: compatibility exports for Yjs-shaped APIs used by downstream consumers.
- `index.ts`: public barrel for `QDoc`, relay adapters, Yjs compatibility helpers, and exported CRDT event types.
- `qdoc.test.ts`: focused CRDT behavior and sync protocol tests.
- `aeon-relay.test.ts`: relay handshake and telemetry tests for the generic Aeon relay abstraction.
