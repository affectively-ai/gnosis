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

## What You Get

| Surface | Description |
|---------|-------------|
| **Compiler (Betty)** | Static topology checks, UFCS lowering, stability auditing, Lean artifact generation, Betti number computation |
| **Runtime** | Graph-native interpreter with tagged values (`Result`, `Option`, `Variant`, `Destructure`, `Delay`), structured concurrency, native frame adapter |
| **CLI** | `lint`, `analyze`, `verify`, `build`, `run`, `native`, `test`, `mod init`, `mod tidy` |
| **Module system** | `.gg`/`.mgg` parsing, merged-source loading, cycle rejection, bare-specifier resolution, deterministic lockfiles |
| **Formal path** | TLA+ module/config generation, Lean proof artifacts, bounded queue certificates, coupled-kernel handoff theorems |
| **CRDT layer** | Topology-native CRDTs with relay adapters |
| **Capabilities** | Target inference and validation (`workers`, `node`, `bun`) -- fail before deployment |
| **Auth** | UCAN/ZK execution envelopes, fail-closed runtime authorization |
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
- `StructuredMoA` -- sparse expert routing across attention blocks

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

Example families: transformers, CRDTs, synth graphs, privacy flows, edge pipelines, failure-boundary witnesses.

## Repository Guide

- [src](./src/README.md) -- compiler, runtime, CLI, module tooling, auth, CRDT, benchmarks
- [examples](./examples/README.md) -- executable examples and `.test.gg` suites
- [bindings](./bindings/README.md) -- subprocess-based client bindings for non-TS hosts
- [content](./content/README.md) -- manuscript and companion publication content
- [ROADMAP](./ROADMAP.md) -- language roadmap and near-term design edges

## License

MPL-2.0
