# Gnosis

A graph-first language and toolchain. Every `.gg` program is a topology -- a directed graph whose edges carry the semantics of `FORK`, `RACE`, `FOLD`, `VENT`, `PROCESS`, and `INTERFERE`. The compiler (Betty) computes the Betti number, audits thermodynamic stability, and emits proof artifacts in Lean 4 and TLA+. The runtime executes the same topology it checks.

One `.gg` file can move through writing, checking, testing, running, native execution, TLA+ output, Lean artifact generation, and benchmarks without changing formats.

![Betti](./examples/betti.gif)

## Quick Taste

```gg
(input)-[:FORK]->(fast_path | safe_path)
(fast_path | safe_path)-[:FOLD { strategy: 'linear' }]->(result)
```

```gg
(data)-[:FORK]->(agent_a | agent_b | agent_c)
(agent_a | agent_b | agent_c)-[:RACE]->(winner)
(winner)-[:PROCESS { fn: 'validate' }]->(output)
```

## Getting Started

```bash
cd open-source/gnosis
bun run start
```

### CLI Commands

```bash
# Format
bun ./bin/gnosis.js --fix example.gg

# Lint and analyze
bun ./bin/gnosis.js lint example.gg --target bun
bun ./bin/gnosis.js analyze betti.gg --json

# Formal artifacts
bun ./bin/gnosis.js verify betti.gg --tla --tla-out tla/generated
bun ./bin/gnosis.js build betti.gg --lean --lean-out lean/generated

# Execute
bun ./bin/gnosis.js run example.gg
bun ./bin/gnosis.js native example.gg

# Test
bun ./bin/gnosis.js test examples/benchmarks/fold-training.test.gg

# Module management
bun ./bin/gnosis.js mod init demo
bun ./bin/gnosis.js mod tidy
```

All commands support `--json` and `--sarif` for CI integration.

For TypeScript orchestration entrypoints, [`gnode`](./gnode/README.md) compiles a strict TS subset into GG, prints an Aeon-style lane schedule, and runs the result through Gnosis today. The shared CLI now keeps a daily daisy-chain cache of compiled GG artifacts, `.qdoc` cache records, stable runtime binding modules, and a Node compile-cache layer that can be primed ahead of time with `pnpm --dir open-source/gnosis run gnode:prewarm -- --json`. The wrapper also tracks its own bundle freshness from an exact dependency manifest instead of scanning whole source trees before every run. If `GNODE_CACHE_AEON_RELAY_URL` or `GNODE_CACHE_RELAY_URL` is present, those cache records also federate through the built-in DashRelay/Aeon relay path. Use `--trace-timings` on a single `gnode run` to see the wrapper plus cold-versus-warm runtime path directly. The native landing zone for those compiled processes is [`x-gnosis`](../x-gnosis/README.md) and its Rust transport surface in [`gnosis-uring`](../x-gnosis/gnosis-uring/README.md).

That surface now also has a checked-in toy runtime shootout for `echo`, `fib`, and `Promise.all` fanout entrypoints across `gnode`, Bun, `tsx`, `ts-node`, plain Node on compiled JavaScript, and Deno when Deno is installed. Run the local smoke through `pnpm --dir open-source/gnosis run bench:gnode-runtimes`; the larger sample counts belong on Cloud Build, not on a laptop.

The current single-request snapshot is also documented in [`gnode/README.md`](./gnode/README.md): on March 18, 2026, the toy direct smoke measured `gnode` at `286.07ms` on the first real request after `gnode:prewarm`, `414.47ms` on a fresh-process miss with a primed compile cache, `1251.69ms` on the true empty-compile-cache path, and `9.96ms` warm via `--trace-timings`, versus Bun at `490ms` cold and `120ms` warm on the same app. The warm-hit story is now real, and the shipped prewarm path finally moves the first-request developer experience onto the fast side too.

## What You Get

| Surface | Description |
|---------|-------------|
| **Compiler (Betty)** | Static topology checks, UFCS lowering, stability auditing, coarsening synthesis, Lean artifact generation, Betti number computation |
| **Runtime** | Graph-native interpreter with tagged values (`Result`, `Option`, `Variant`, `Destructure`, `Delay`), structured concurrency, `QDoc`-backed MiddleOut request compression/tunneling, native frame adapter, and a hetero-fabric race layer that can use CPU, WebGPU, WebNN, WASM/browser, or env-bound CUDA/vendor-NPU runners |
| **CLI** | `lint`, `analyze`, `verify`, `build`, `run`, `native`, `test`, `mod init`, `mod tidy` |
| **`gnode` TS runtime** | Rust-fronted runner that compiles orchestration-shaped `.ts` into `.gg`, surfaces cannon/linear schedules, and preserves GG telemetry passthrough |
| **Module system** | `.gg`/`.mgg` parsing, merged-source loading, cycle rejection, bare-specifier resolution, deterministic lockfiles |
| **Formal path** | TLA+ module/config generation, Lean proof artifacts, bounded queue certificates, coupled-kernel handoff theorems, recursive coarsening synthesis with fiber-partitioned drift certificates |
| **CRDT layer** | Topology-native CRDTs with `QDoc`, the corridor/superposition primitive `QCorridor`, relay adapters, typed change-event contracts, the substrate for MiddleOut request compression, and the decayed community-memory surface used by hetero-fabric backend racing |
| **Capabilities** | Target inference and validation (`workers`, `node`, `bun`) -- fail before deployment |
| **Auth** | UCAN/ZK execution envelopes, fail-closed runtime authorization, and browser-safe binary auth helpers |
| **REPL** | Interactive TUI for topology exploration |
| **Bindings** | CLI-based bindings for Python, Go, Java, C#, Rust, Swift, Kotlin, Lua, Haskell, Erlang |

## Language Primitives

| Edge type | What it does |
|-----------|-------------|
| `FORK` | Split into N parallel paths. Beta-1 increases by N-1. |
| `RACE` | First path to complete wins. Losers are vented. |
| `FOLD` | Wait for all paths, merge via strategy (linear, quorum, consensus, weighted). |
| `VENT` | Prune a path. Propagates down, never across. |
| `PROCESS` | Transform data through a function. |
| `INTERFERE` | Constructive (consensus) or destructive (conflict detection) observation. |

### Structured Primitives

Higher-order graph shapes for recurring patterns:

- `WallingtonRotation` -- chunk-level pipelined processing
- `WorthingtonWhip` -- shard-level fork/rotate/fold
- `StructuredMoA` -- sparse expert routing across attention blocks, now lowered with explicit corridor/trace/vent request-compression boundaries
- `HeteroMoAFabric` -- backend-diverse mirrored `StructuredMoA` lanes with per-layer cannon/helix rotation, paired-kernel race/adjudication, one laminar global collapse, and a runtime plan that can bind to CPU, WebGPU, WebNN, WASM/browser, and env-driven CUDA or vendor-NPU runners while learning slowest-to-fastest cross-layer launch staggering from community memory

### UFCS Sugar

Linear `PROCESS` chains can be written in either direction:

```gg
(x)-[:PROCESS { fn: 'double' }]->(y)
// or equivalently:
x.double()
```

## Why It Works

| Property | How |
|----------|-----|
| Single mental model | Compiler, runtime, test runner, benchmarks, module loader, and formal bridges all speak the same graph language |
| Fast feedback | `lint`, `analyze`, `verify`, and `.test.gg` catch topology problems before runtime debugging |
| First-class formal path | TLA+ and Lean outputs from `.gg` directly -- "make it formal" is a normal step, not a rewrite |
| Practical runtime | Interpreter and native frame runtime share the same topology model; native degrades cleanly when WASM is unavailable |
| CI-friendly | `--json` and `--sarif` output for automation |

## Corpus

The repo includes 300+ `.gg` topologies, 30+ `.test.gg` suites, 30+ TypeScript tests, 15 host-language bindings, and 600+ generated TLA artifacts.

Top-level witness topologies now also include [`aeon_object.gg`](./aeon_object.gg), a minimal AEON constitution that folds address, capability, witness, storage scope, replication policy, and projection into one launchable materialization plan.

Example families: transformers, CRDTs, synth graphs, privacy flows, edge pipelines, failure-boundary witnesses.

## Repository Guide

- [src](./src/README.md) -- compiler, runtime, CLI, module tooling, auth, CRDT, benchmarks
- [gnode](./gnode/README.md) -- Rust-fronted TypeScript-to-GG runner and schedule surface
- [examples](./examples/README.md) -- executable examples and `.test.gg` suites
- [bindings](./bindings/README.md) -- subprocess-based client bindings for non-TS hosts
- [content](./content/README.md) -- manuscript and companion publication content
- [ROADMAP](./ROADMAP.md) -- language roadmap and near-term design edges

## License

Copyright Taylor William Buley. All rights reserved.

MPL-2.0
