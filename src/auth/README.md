# Auth Core

Parent: [Gnosis Source](../README.md)

Native UCAN/ZK/custodial integration helpers for Gnosis runtime authorization.

## Files

- [core.ts](./core.ts): UCAN issuance/verification/delegation and edge authorization helpers.
- [handlers.ts](./handlers.ts): Built-in runtime handlers (`UCAN*`, `ZK*`, `CustodialSigner`, sync/materialization ZK envelopes).
- [auto-zk.ts](./auto-zk.ts): automatic AST injection for sensitive sync/materialization ZK envelope nodes.
- [tee-attestation.ts](./tee-attestation.ts): HALT attestation signing/verification, execution-envelope checks, and nonce replay protection.
- [zk-onchain-verifier.ts](./zk-onchain-verifier.ts): EVM `eth_call` proof-verifier adapter used by `ZKExecutionGate`.
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

## ZK Policy

Selective default-on ZK policy is implemented via `zkMode` (`required`, `preferred`, `off`):

- Delegation: defaults to `required` when confidential context is present.
- Custodial signer: defaults to `required` when a payload/signature is present.
- Sync envelopes: defaults to `required` for cross-device/cross-tenant boundaries.
- Materialization envelopes: defaults to `required` for private persistence flows.

Additional runtime labels:

- `ZKSyncEnvelope`
- `ZKMaterializeEnvelope`
- `HALTAttestationVerify`
- `ZKExecutionGate`

`ZKExecutionGate` proof verification sources:

- Explicit callback: `payload.proofVerifier(input) => boolean`
- EVM JSON-RPC adapter: set `verifierRpcUrl` and `verifierAddress` (optional `verifierMethodSelector`, `verifierBlockTag`, `verifierTimeoutMs`, `verifierProofEncoding`).

Compiler/runtime auto-injection:

- `PROCESS` edges with sensitive sync/materialization properties can be rewritten to include `ZKSyncEnvelope` / `ZKMaterializeEnvelope` wrapper nodes automatically.
