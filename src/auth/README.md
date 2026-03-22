# Auth Core

Parent: [Gnosis Source](../README.md)

Native UCAN/ZK/custodial integration helpers for Gnosis runtime authorization.

## Files

- [core.ts](./core.ts): UCAN issuance/verification/delegation, execution-auth normalization, and capability authorization helpers for runtime edges plus steering/boundary-walk surfaces.
- [bootstrap.ts](./bootstrap.ts): topology-local auth bootstrap pass that preflights native UCAN/value-shaping nodes to derive `executionAuth` before the main boundary-walk gate.
- [handlers.ts](./handlers.ts): Built-in runtime handlers (`UCAN*`, `ZK*`, `CustodialSigner`, sync/materialization ZK envelopes).
- [auto-zk.ts](./auto-zk.ts): automatic AST injection for sensitive sync/materialization ZK envelope nodes.
- [encoding.ts](./encoding.ts): runtime-neutral Base64/Base64URL/hex codecs used by auth surfaces that need to run in browser, Bun, and Node without a hard `Buffer` dependency.
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
- `SLIVER` -> `aeon/interfere`
- `ENTANGLE` -> `aeon/entangle`
- `SUPERPOSE` -> `aeon/superpose`
- `EVOLVE` -> `aeon/evolve`
- fallback -> `aeon/process`

Resource scope format:

- `aeon://edge/<action>/<sourceNodeId>-><targetNodeId>`

Wildcard examples:

- Action wildcard: `aeon/*`
- Resource wildcard: `aeon://edge/vent/branch-a->*`

## Steering Capability Contract

Once a run has adopted `executionAuth.enforce=true`, boundary walks can also require steering-specific UCAN capabilities:

- `gnosis/steering.run` -> `aeon://steering/topology/<topologyFingerprint>`
- `gnosis/steering.trace.append` -> `aeon://steering-trace/cohort/<cohortKey>`
- `gnosis/steering.relay.connect` -> `aeon://steering-relay/room/<roomName>`
- `gnosis/steering.apply` -> `aeon://steering/topology/<topologyFingerprint>`

The runtime now normalizes execution auth once and keeps it in engine/store context so payload-replacing handlers do not silently drop authorization mid-run.

For CLI/REPL boundary walks, Gnosis also performs a narrow bootstrap preflight over root-connected native auth nodes (`UCAN*`, `Result`, `Option`, `Variant`, `Destructure`). That lets a topology issue/verify its own UCAN and still gate steering before the full run begins.

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

Browser/runtime compatibility note:

- `tee-attestation.ts` and `zk-onchain-verifier.ts` now route binary encoding through `encoding.ts` so browser bundles can import the auth surface without pulling `node:buffer`.

Compiler/runtime auto-injection:

- `PROCESS` edges with sensitive sync/materialization properties can be rewritten to include `ZKSyncEnvelope` / `ZKMaterializeEnvelope` wrapper nodes automatically.
