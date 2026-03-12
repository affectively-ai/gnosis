# Auth Core

Parent: [Gnosis Source](../README.md)

Native UCAN/ZK/custodial integration helpers for Gnosis runtime authorization.

## Files

- [core.ts](./core.ts): UCAN issuance/verification/delegation and edge authorization helpers.
- [handlers.ts](./handlers.ts): Built-in runtime handlers (`UCAN*`, `ZK*`, `CustodialSigner`).
- [index.ts](./index.ts): Public exports.

## Edge Capability Contract

When `executionAuth.enforce=true`, runtime edges require UCAN capabilities:

- `FORK` -> `aeon/fork`
- `RACE` -> `aeon/race`
- `FOLD` / `COLLAPSE` -> `aeon/fold`
- `VENT` / `TUNNEL` -> `aeon/vent`
- `OBSERVE` -> `aeon/observe`
- `INTERFERE` -> `aeon/interfere`
- `ENTANGLE` -> `aeon/entangle`
- `SUPERPOSE` -> `aeon/superpose`
- `EVOLVE` -> `aeon/evolve`
- fallback -> `aeon/process`

Resource scope format:

- `aeon://edge/<action>/<sourceNodeId>-><targetNodeId>`

Wildcard examples:

- Action wildcard: `aeon/*`
- Resource wildcard: `aeon://edge/vent/branch-a->*`
