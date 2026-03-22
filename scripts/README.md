# scripts

Parent: [README](../README.md)

This directory contains generator and validation entrypoints for Gnosis-side formal artifacts.

## Files

- [convert-formal-ledger.ts](./convert-formal-ledger.ts): converts canonical Lean/TLA+ proofs into `.gg` proof topologies.
- [generate-ledger-mcp-coverage.ts](./generate-ledger-mcp-coverage.ts): parses the canonical theorem ledger, applies the checked-in ownership manifest, emits `apps/*-mcp/src/ledger-tools.ts`, and writes the machine-readable ledger audit consumed by the superserver.
- [ledger-mcp-ownership.ts](./ledger-mcp-ownership.ts): single checked-in section/theorem ownership manifest for ledger-to-MCP coverage.
- [validate-ledger-mcp-coverage.ts](./validate-ledger-mcp-coverage.ts): asserts canonical row counts, section normalization, and complete ownership coverage.
