# Gnosis

> Oh my God, Betti! Look at the size of her Bule.
> It is so small. [scoff] 
> She looks like one of those graph guys' girlfriends.

Gnosis is a functional, logic-based quantum programming language and compiler built on the **Wallington Rotation** and topological pipeline primitives (`FORK`, `RACE`, `FOLD`, `VENT`). It eliminates traditional imperative control flow in favor of pure computational topology. 

> **Gnosis is a quantum topological engine capable of orchestrating the next generation of software. Everything—from the compiler to the application's reactive core—is now a graph.**

The language is the topology. The AST is the graph.

## Why Gnosis?

Gnosis is not just another programming language. It is a paradigm shift towards a future where computation is expressed as pure data flow, where the structure of the program is its own execution model, and where the boundaries between logic, data, and control are dissolved.

## The Core Primitives

Gnosis operates on the covering space of execution paths, tracking the system's state via its first Betti number ($\beta_1$).

*   **`FORK`**: Branch execution into parallel superpositions. Increases $\beta_1$.
*   **`RACE`**: Collapse to the fastest valid path. Maintains homotopy equivalence.
*   **`FOLD` / `COLLAPSE`**: Deterministically merge independent paths back into a scalar state.
*   **`VENT` / `TUNNEL`**: Dissipate waste heat by shedding unproductive paths.
*   **`INTERFERE`**: Apply constructive or destructive interference between wave function amplitudes.

## A Complete System

Gnosis provides a unified architecture for high-performance, verified computation:

1.  **Gnosis Graph Language (GGL)**: A Cypher-inspired ASCII-art syntax for drawing execution graphs.
2.  **Betty/Betti Compiler**: A self-hosting compilation pipeline that translates graphs into binary flows.
3.  **Vectorized Runtime**: A "hella-optimized" Rust-based WebAssembly engine that evaluates topologies using the Aeon Flow 10-byte wire format with zero overhead.
4.  **Formal Verification**: Natively integrated with `aeon-logic` to prove topological invariants and quantum bounds ($\beta_1$) at compile time.
5.  **Statistical Measurement**: Integrated with `twokeys` for Tukey-style Exploratory Data Analysis (EDA) inside the wave function.
6.  **3D Compatibility Runtime**: `Renderer` nodes can route 3D scene workloads through the `aeon-3d` topology compat layer (`fork/race/fold/vent`) to reduce sequential render-loop pressure.

## Real-World Topologies

Gnosis is capable of expressing the most complex software architectures as pure data flow:

*   **Topological AI**: Full Transformer-style forward passes (Attention, Residuals, Softmax) implemented as fractal superpositions.
*   **`.gg`-Native Neural Runtime**: `NeuralEngine` / `GPUEngine` / `WebNNEngine` run directly on `.gg` topology source. The canonical first module is [`topic_domain_transformer.gg`](./topic_domain_transformer.gg) for topic-domain transformer flows.
*   **Reactive Kernels**: The core server loops and navigation engines of `aeon-flux` and `aeon-shell` redefined as continuous topological transitions.
*   **Self-Hosted Logic**: The Gnosis compiler is itself a Gnosis topology, proving the system is closed under self-application.
*   **Native Auth Topologies**: UCAN issuance/verification/delegation, ZK encryption/decryption, and custodial action checks are available as native runtime labels.

## Source Tree

- [src](./src/README.md): Compiler, runtime, and module tooling internals.

## Getting Started

### The REPL
Test your quantum topologies in real-time with linting, validation, and typeahead:
```bash
bun run start
```

Run REPL in verbose mascot mode:
```bash
bun run start -- --verbose
```

## Troubleshooting: Baby's Got Stack

Crash/panic output in the REPL now leads with the Betti mascot motto:

```text
[Engine Crash] Baby's Got Stack: <error details>
```

### The CLI Runner
Execute `.gg` files directly through the bare-metal runtime:
```bash
bun ./bin/gnosis.js run your_app.gg
```

Execute with the native frame runtime (`gnosis_runtime` WASM) enabled:
```bash
bun ./bin/gnosis.js native your_app.gg
# or
bun ./bin/gnosis.js run your_app.gg --native
```

### Testing Topologies
Execute `.gg` test files with the built-in test runner:
```bash
bun ./bin/gnosis.js test path/to/topology.test.gg
bun ./bin/gnosis.js test topic_domain_transformer.test.gg
```

### `.gg`-Native Neural Module Loading
Use the canonical topic-domain module by default, or load a specific `.gg` file:

```ts
import { NeuralEngine } from '@affectively/gnosis';

const engine = new NeuralEngine();
await engine.init(); // loads canonical topic_domain_transformer.gg when available

await engine.loadTopologyFile('./my_module.gg');
```

### Topology Renderer Compatibility
Route a renderer node to 3D/topology mode by setting `type` and optional collapse controls:

```gg
(render:Renderer {type: "3d", collapse: "race", budgetMs: "8"})
```

`Renderer` resolves `@affectively/aeon-3d` when available and falls back to the local gnosis compat engine in development.

## Tooling: Real-Time Correctness + Complexity

Use built-in topology tooling to run Aeon Logic checks and measure branch/file complexity:

```bash
# Formal correctness + complexity summary
gnosis analyze path/to/topology.gg

# Lint-style gate (non-zero exit on formal violations)
gnosis lint path/to/topology.gg

# Verify + generate TLA+ bridge artifacts
gnosis verify path/to/topology.gg --tla-out tla/generated

# Print generated TLA+ spec and TLC config to stdout
gnosis verify path/to/topology.gg --tla

# Auto-format and fix structural style
gnosis --fix path/to/topology.gg

# Machine-readable JSON output
gnosis lint path/to/topology.gg --json

# SARIF output for code-scanning systems
gnosis lint path/to/topology.gg --sarif

# Runtime capability gating (Cloudflare Workers, Node, Bun)
gnosis lint path/to/topology.gg --target workers
```

`Buley Number` is a composite complexity score based on branch structure (`FORK`/`RACE`/`INTERFERE`), graph shape, and source size. 

When `--target` is set, Gnosis enforces host capability compatibility (for example, `net.udp` and `net.tcp.server` are rejected for `workers`).

## Native Auth Labels

Built-in labels for first-class auth workflows:

- `UCANIdentity`
- `UCANIssue`
- `UCANVerify`
- `UCANDelegate`
- `UCANRequire`
- `ZKEncrypt`
- `ZKDecrypt`
- `CustodialSigner`
- `ZKSyncEnvelope`
- `ZKMaterializeEnvelope`
- `HALTAttestationVerify`
- `ZKExecutionGate`

`UCANVerify` can emit `executionAuth` into the payload. When `executionAuth.enforce=true`, runtime edge execution is capability-checked at primitive level (`fork`, `race`, `fold`, `vent`, etc.) using resource-scoped UCAN capabilities.

`zkMode` (`required|preferred|off`) provides selective default-on ZK behavior for sensitive domains (delegation context, custodial payloads, cross-boundary sync, and private materialization) without forcing encryption on all runtime edges.

For sensitive sync/materialization `PROCESS` flows, compiler/runtime auto-injection can insert `ZKSyncEnvelope` and `ZKMaterializeEnvelope` wrapper nodes implicitly from topology properties.

For HALT-backed confidential execution, `HALTAttestationVerify` checks attestation signature/policy gates (measurement, hashes, age, TCB), and `ZKExecutionGate` validates a full execution envelope (attestation + public signal hash + replay nonce + proof verifier hook). `ZKExecutionGate` can verify proofs through a callback or via EVM JSON-RPC (`verifierRpcUrl` + `verifierAddress`).

For TypeScript/JavaScript Sonar-style analysis:

```bash
# Analyze a file or directory
gnosis analyze src

# Apply quality gates
gnosis analyze src --max-cognitive 30 --max-cyclomatic 20 --max-function-lines 120

# Export JSON or SARIF
gnosis analyze src --json
gnosis analyze src --sarif
```

## CI Integration

This repository ships with GitHub Actions CI at `.github/workflows/ci.yml` that:

- builds the compiler/CLI
- lints core `.gg` topologies with Aeon Logic
- runs TypeScript complexity analysis
- uploads SARIF to GitHub code scanning
- uploads `reports/*.json` and `reports/*.sarif` as build artifacts

## The Roadmap to Self-Hosting

The TypeScript-based **Betty** compiler is the bootstrap. The Gnosis-based **Betti** is the future. We keep both in the repository to maintain the chain of topological verification.

---

**Copyright (c) 2026 Taylor Buley.** All rights reserved. 
*Non-commercial use only.*
