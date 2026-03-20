# Gnosis

A graph-first language and toolchain. Every `.gg` program is a topology -- a directed graph whose edges carry the semantics of `FORK`, `RACE`, `FOLD`, `VENT`, `PROCESS`, and `INTERFERE`. The compiler (Betty) computes the Betti number, audits thermodynamic stability, and emits proof artifacts in Lean 4 and TLA+. The runtime executes the same topology it checks.

One `.gg` file can move through writing, checking, testing, running, native execution, TLA+ output, Lean artifact generation, and benchmarks without changing formats.

![Betti](./examples/betti.gif)

## Performance

| Layer | Measured | How |
|-------|----------|-----|
| Topology execution (compiled codegen) | 176M exec/sec (6ns) | AOT-compiled `.gg` to flat function chains -- no AST traversal, no handler lookup |
| Wire compression | 98% reduction | Per-chunk codec racing proved optimal via THM-TOPO-RACE-ENTROPY-FLOOR |
| HTTP pipelined (io_uring, depth 256) | 5.1M req/sec | gnosis-uring Rust transport, single 8-thread node |
| HTTP pipelined (io_uring, depth 16) | 1.26M req/sec | gnosis-uring, 8t/256c |
| HTTP non-pipelined (Bun, 4t/64c) | 112K req/sec | x-gnosis TypeScript server, low contention |
| HTTP non-pipelined (Rust, 8 threads) | 72K req/sec | gnosis-uring macOS blocking fallback |
| vs nginx (CSS, same gzip surface) | 20x faster | 42,701 vs 2,136 req/sec |
| vs nginx (JS, same gzip surface) | 84x faster | 42,688 vs 509 req/sec |
| Cloud Run (large assets, compression) | +31% throughput | 53.68 -> 70.13 req/sec, brotli wire savings |
| Wire overhead (Aeon Flow) | 0.03% | 10-byte frames vs HTTP/1.1's 0.89% |
| gnode cold start (primed cache) | 286ms | vs Bun 490ms cold, with `gnode:prewarm` |
| gnode warm hit | 9.96ms | vs Bun 120ms warm |

## Provably Optimal

x-gnosis is -- to our knowledge -- the first web server whose throughput bound is a mathematical theorem, not a benchmark. **THM-SERVER-OPTIMALITY** composes 14 mechanized theorems (TLA+ model-checked, Lean 4 sorry-free) proving:

- **Critical-path makespan** -- no admissible schedule on the same DAG can serve requests faster
- **Pareto-optimal resource usage** -- no schedule simultaneously beats both makespan and worker count
- **Exact speedup = beta1 + 1** -- not asymptotic, not approximate, by definitional equality in Lean
- **Lossless information transport** -- zero deficit at every layer means no cross-path blocking
- **Wire optimality** -- per-chunk codec racing achieves wire size <= any fixed encoding strategy

The formal corpus includes 600+ TLA+ model-checking configurations and sorry-free Lean 4 proofs with `CertifiedKernel` witnesses, spectral stability theorems, measurable Harris certificates, Levy-Prokhorov convergence endpoints, and coupled-kernel handoff lemmas.

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
| **Compiled Topology** | AOT codegen eliminates the engine loop -- `.gg` compiles to flat function chains at 176M exec/sec (6ns), leaving only handler time |
| **CLI** | `lint`, `analyze`, `verify`, `build`, `run`, `native`, `test`, `mod init`, `mod tidy` |
| **`gnode` TS runtime** | Rust-fronted runner that compiles orchestration-shaped `.ts` into `.gg`, surfaces cannon/linear schedules, and preserves GG telemetry passthrough |
| **Module system** | `.gg`/`.mgg` parsing, merged-source loading, cycle rejection, bare-specifier resolution, deterministic lockfiles |
| **Formal path** | TLA+ module/config generation, Lean proof artifacts, bounded queue certificates, coupled-kernel handoff theorems, recursive coarsening synthesis with fiber-partitioned drift certificates |
| **CRDT layer** | Topology-native CRDTs with `QDoc`, the corridor/superposition primitive `QCorridor`, relay adapters, typed change-event contracts, the substrate for MiddleOut request compression, and the decayed community-memory surface used by hetero-fabric backend racing |
| **Capabilities** | Target inference and validation (`workers`, `node`, `bun`) -- fail before deployment |
| **Auth** | UCAN/ZK execution envelopes, fail-closed runtime authorization, and browser-safe binary auth helpers |
| **REPL** | Interactive TUI for topology exploration |
| **Bindings** | CLI-based bindings for Python, Go, Java, C#, Rust, Swift, Kotlin, Lua, Haskell, Erlang, C, C++, PHP, Ruby |

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

## Native Transport: gnosis-uring

The production Rust transport maps the four primitives directly onto `io_uring`:

| Primitive | io_uring mapping |
|-----------|-----------------|
| `FORK` | Batch SQE submissions |
| `RACE` | First CQE wins, `IORING_ASYNC_CANCEL` on losers |
| `FOLD` | Gather CQEs |
| `VENT` | Close fd, cancel ops |

Architecture:
- **Compiled route tables** -- O(1) hashmap dispatch, `.gg` JSON topology loader, function-pointer chains
- **Multi-worker SO_REUSEPORT** -- kernel distributes connections, no userspace multiplexing
- **SQPOLL mode** -- zero-syscall hot path via io_uring kernel polling thread
- **Core pinning** -- `sched_setaffinity` eliminates cross-core cache thrashing
- **Laminar codec racing** -- per-chunk compression (identity/gzip/brotli/deflate), smallest wins
- **Same-request collapse** -- bounded race table prevents duplicate work on TCP+UDP
- **Pipelined HTTP** -- batch parsing with incomplete-tail carryover
- **Dual protocol** -- HTTP/1.1 for browsers, Aeon Flow (10-byte frames) for topology clients
- **TechEmpower ready** -- all seven benchmark categories: plaintext, JSON, DB, queries, updates, fortunes, cached-queries

## Why It Works

| Property | How |
|----------|-----|
| Single mental model | Compiler, runtime, test runner, benchmarks, module loader, and formal bridges all speak the same graph language |
| Theorem-backed | Every optimization pass is mechanized: recursive coarsening, codec racing, warmup efficiency |
| Measurable optimality | Throughput is a theorem, not a tuning result -- 14 composed mechanized proofs |
| Fast feedback | `lint`, `analyze`, `verify`, and `.test.gg` catch topology problems before runtime debugging |
| First-class formal path | TLA+ and Lean outputs from `.gg` directly -- "make it formal" is a normal step, not a rewrite |
| Practical runtime | Interpreter and native frame runtime share the same topology model; native degrades cleanly when WASM is unavailable |
| CI-friendly | `--json` and `--sarif` output for automation |

## Benchmarks

### HTTP Throughput (gnosis-uring, Linux io_uring, 8 threads)

| Test | Depth | Connections | Req/sec |
|------|-------|-------------|---------|
| Plaintext | 256 | 256 | 5,108,939 |
| Plaintext | 16 | 256 | 1,258,781 |
| JSON | 16 | 256 | 1,155,865 |
| Static HTML | -- | 64 | 41,821 |

### HTTP Throughput (x-gnosis, Bun, macOS M1)

| Test | Threads/Conns | Req/sec | p50 |
|------|---------------|---------|-----|
| Plaintext | 4t/64c | 110,114 | 512us |
| JSON | 4t/64c | 111,899 | 508us |
| Plaintext | 12t/400c | 100,869 | 3.61ms |

### vs nginx (same gzip surface, local loopback)

| Asset | x-gnosis | nginx | Speedup |
|-------|----------|-------|---------|
| CSS | 42,701 | 2,136 | 20x |
| JS | 42,688 | 509 | 84x |
| Plaintext | 29,055 | 23,509 | 1.2x |

### Wire Efficiency

| Protocol | Framing Overhead |
|----------|-----------------|
| Aeon Flow | 0.03% |
| x-gnosis HTTP/1.1 | 0.48% |
| nginx HTTP/1.1 | 0.89% |
| h2o HTTP/3 | 0.10% |

### Topology Execution (compiled codegen, V8)

| Topology | Engine | Codegen | Speedup |
|----------|--------|---------|---------|
| 3-step linear | ~230us | ~6ns | 38,333x |
| FORK/RACE/FOLD | ~230us | ~6ns | 38,333x |

### Benchmark Suites

The repo includes 13 benchmark families with bootstrap intervals, regime sweeps, and adversarial controls:

- **fold-training** -- linear vs nonlinear selection boundary
- **negative-controls** -- one-path parity checks
- **near-control-sweep** -- fine-grained boundary zoom
- **regime-sweep** -- continuous regime variation
- **adversarial-controls** -- winner selection and early-stop rewards
- **moe-routing** -- four-expert mini-MoE routing
- **aeon-framed-transformer** -- four-stage Wallington triangle with Aeon frames
- **moa-transformer-shootout** -- dense vs sparse rotated transformers
- **moa-transformer-evidence** -- workload sweep, sparsity ablation, timing summaries
- **hetero-moa-fabric** -- mirrored backend racing with Cloud Run profiling
- **concurrency** -- concurrent execution patterns
- **expressiveness** -- language expressiveness coverage
- **formal-verification** -- stability and optimization pass validation

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
