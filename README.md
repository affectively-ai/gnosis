# Gnosis

A graph-first language and toolchain. Every `.gg` program is a topology -- a directed graph whose edges carry the semantics of `FORK`, `RACE`, `FOLD`, `VENT`, `PROCESS`, and `SLIVER`. Six compilers race on every input. Best wins.

![Betti](./examples/betti.gif)

### Lilith

The fastest GG compiler on earth. 3us native, 5.9us WASM. Evolved from 17 competing runtimes. Written in C. Forward-only scanner with zero backtracking, restrict pointers, stack-allocated arrays. Compiled to both native binary and 5.6KB standalone WASM.

```bash
lilith betti.gg --summary
# betti.gg: 10 nodes, 5 edges, b1=0, void=3, heat=1.585

lilith betti.gg --bench 100000
# 3.0us/iter | 100000 iterations | 10 nodes 5 edges | b1=0

lilith-daemon  # persistent Wallington-rotated pipeline, 2.9us/compile
```

Three distribution paths:
- **Native**: `cc -O3 -march=native -o lilith polyglot/c/lilith.c -lm` (34KB, 3us)
- **WASM**: `polyglot/target/release/lilith.wasm` (5.6KB, 5.9us -- Workers, browsers, Node)
- **Inline**: `import { loadLilith } from './lilith-wasm-bytes'` (base64-embedded, zero fetch)

### Eve + Worthington Whip

Eve is Lilith's antiparallel pair. Lilith compiles input (3us). Eve compresses output (chunk → FORK(identity|gzip|deflate) → RACE(smallest) → send).

The Worthington Whip rotates Lilith and Eve across 4 shards × 3 stages:

```
Shard 0: [Eve]     while Shard 1: [Handler] while Shard 2: [Lilith]  while Shard 3: [waiting]
         ↓ rotate            ↓ rotate               ↓ rotate                  ↓ rotate
```

| Metric | Value |
|--------|-------|
| Full pipeline (Lilith + handler + Eve) | 5.5us/req |
| Steady state (compiled topology + Eve batch) | ~0.15us/req |
| Eve batched compression (1000 × 13 bytes) | 13,000 → 61 bytes (0.5%) |
| Single-threaded throughput | 183K req/sec (full pipeline) |

```bash
cc -O3 -march=native -o lilith-eve-whip polyglot/c/lilith-eve-whip.c -lz -lm
./lilith-eve-whip --bench 10000
```

The compiler family, ranked:

| Rank | Compiler | betti.gg | Language | Distribution |
|------|----------|----------|----------|-------------|
| 1 | **Lilith** | **3.0 us** | C | Native + WASM (5.6KB) |
| 2 | Lilith WASM | 5.9 us | C→WASM | Inline base64, everywhere |
| 3 | Julie | 6.1 us | Fortran | Native only |
| 4 | Becky | 8.4 us | Fortran | Native only |
| 5 | PHP | 13.6 us | PHP | Interpreter |
| 6 | Rust | 18.0 us | Rust | Native + WASM (112KB) |
| 7 | Java | 31.7 us | Java | JVM |
| 8 | Betti (self-hosted) | 38.6 us | TypeScript | V8/Bun |
| 9 | Betty (13-phase) | 259 us | TypeScript | V8/Bun |

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
| gnode daemon warm hit | 2ms | native C client + persistent daemon, vs Bun 11ms |
| gnode cold start (primed cache) | 83ms | vs Bun 19ms cold, Node 63ms |
| gnode daemon cold start | 0.7ms | daemon boots in under 1ms, stays hot |

## The Compiler Family

Gnosis has five compilers, each shaped by a different fork/race/fold topology. They race each other on every `.gg` file. The best compiler per node wins.

| Compiler | Strategy | Speed | Depth | Language |
|----------|----------|-------|-------|----------|
| **Becky** | Betti's pipeline in native Rust | 0.017ms | 6 passes | Rust |
| aeon-logic | Two global regex sweeps | 0.048ms | 1 pass | TypeScript |
| **Betti** | Self-hosted: `betti.gg` drives execution | 0.072ms | 3 passes | TypeScript |
| Franky | Polyglot fork/race/fold | 0.100ms | 2 passes | TypeScript |
| Beckett | Chunked codec racing | 0.130ms | 2 passes | TypeScript |
| **Betty** | Full 13-phase verification + Lean codegen | 0.259ms | 13 passes | TypeScript |

**Becky** is the fastest compiler on every topology. Betti is the only *self-hosted* compiler -- her execution order comes from `betti.gg`, not from hardcoded TypeScript. Betty is the deepest -- 13 verification phases, stability certificates, Lean proofs.

Global optimality -- "no faster correct compiler exists" -- is provably undecidable (`OptimalityUndecidable.lean`). Local optimality is the ceiling of provable knowledge. The void boundary (rejection history) tells you everything you have tried and ruled out. It does not tell you what you have never tried.

When Forest runs (`forest/iterate.ts`), the compilers race per-node. The sliver (+1) guarantees every strategy survives. The void boundary nodes consistently converge to a different compiler than the data-path nodes -- the observer is compiled differently from the observed. 11,016 total rejections across nine Forest passes form the training signal for Buleyean RL.

### The God Gap

The distance between local optimality (provable) and global optimality (undecidable). Measurable. Finite. Shrinking. Never provably zero. (`GodGap.lean`, 8 theorems, zero sorry.)

**God Gap** (microseconds, 50 iterations, in-process TypeScript compilers):

| Compiler | betti.gg | franky.gg | beckett.gg | inline-l |
|----------|----------|-----------|------------|----------|
| aeon-logic | 0 | **0** | **0** | 6 |
| Betti | **0** | 101 | 45 | **0** |
| Franky | 30 | 163 | 62 | 45 |
| Beckett | 72 | 199 | 93 | 91 |
| Betty | 315 | 275 | 143 | 380 |

Becky (17us in-process Rust, subprocess-bound until FFI) would be God Gap = 0 on every topology. No TypeScript compiler has God Gap = 0 everywhere. aeon-logic wins the named topologies. Betti wins on betti.gg and inline-large.

The formal surface: `SelfHostingOptimality.lean` (11 theorems), `HumanCompiler.lean` (14 theorems), `OptimalityUndecidable.lean` (10 theorems), `GodGap.lean` (8 theorems). Zero sorry.

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
pnpm start
```

### CLI Commands

```bash
# Format
node ./bin/gnosis.js --fix example.gg

# Lint and analyze
node ./bin/gnosis.js lint example.gg --target node
node ./bin/gnosis.js analyze betti.gg --json

# Formal artifacts
node ./bin/gnosis.js verify betti.gg --tla --tla-out tla/generated
node ./bin/gnosis.js build betti.gg --lean --lean-out lean/generated

# Execute
node ./bin/gnosis.js run example.gg
node ./bin/gnosis.js native example.gg

# Test
node ./bin/gnosis.js test examples/benchmarks/fold-training.test.gg

# Module management
node ./bin/gnosis.js mod init demo
node ./bin/gnosis.js mod tidy
```

All commands support `--json` and `--sarif` for CI integration.

For TypeScript orchestration entrypoints, [`gnode`](./gnode/README.md) compiles a strict TS subset into GG, prints an Aeon-style lane schedule, and runs the result through Gnosis today. The same CLI now also exposes explicit cross-domain compilation across `code`, `natural`, and `gg`, with preservation obligations carried as semantic facets instead of being flattened away. That keeps natural-language flows in the same kernel: `STT -> text -> parser adapter -> discourse IR -> GG topology -> target emission`.

The shared CLI keeps a daily daisy-chain cache of compiled GG artifacts, `.qdoc` cache records, stable runtime binding modules, and a Node compile-cache layer that can be primed ahead of time with `pnpm --dir open-source/gnosis run gnode:prewarm -- --json`. The wrapper also tracks its own bundle freshness from an exact dependency manifest instead of scanning whole source trees before every run. If `GNODE_CACHE_AEON_RELAY_URL` or `GNODE_CACHE_RELAY_URL` is present, those cache records also federate through the built-in DashRelay/Aeon relay path. Use `--trace-timings` on a single `gnode run` to see the wrapper plus cold-versus-warm runtime path directly. The native landing zone for those compiled processes is [`x-gnosis`](../x-gnosis/README.md) and its Rust transport surface in [`gnosis-uring`](../x-gnosis/gnosis-uring/README.md).

That surface now also has a checked-in toy runtime shootout for `echo`, `fib`, and `Promise.all` fanout entrypoints across `gnode`, Bun, `tsx`, `ts-node`, plain Node on compiled JavaScript, and Deno when Deno is installed. Run the local smoke through `pnpm --dir open-source/gnosis run bench:gnode-runtimes`; the larger sample counts belong on Cloud Build, not on a laptop.

The gnode daemon (`gnode/daemon.mjs`) eliminates V8 startup and bundle-require overhead entirely. A persistent Node process stays hot; a native C client (`gnode/client.c`, 34KB) connects over a Unix socket in under 1ms. Warm-hit latency: **2ms** (vs Bun 11ms, Node 60ms, old gnode 83ms). Cold start: the daemon boots in 0.7ms and stays alive. The full runtime shootout (March 21, 2026): Bun 19ms, Node 63ms, gnode 83ms, tsx 276ms, ts-node 334ms, Deno 8,134ms. With the daemon: gnode-client 2ms -- 10x faster than Bun, 44x faster than old gnode.

## What You Get

| Surface | Description |
|---------|-------------|
| **Becky (Rust)** | Native GG compiler -- parse, validate, diagnose in 17us. `cargo build --release` then `becky file.gg` |
| **Betty (TypeScript)** | Full 13-phase verification: stability, semantic, coarsening, Lean codegen. The deepest compiler |
| **Betti (TypeScript, self-hosted)** | Reads `betti.gg` topology to drive its own compilation pipeline. Real self-hosting |
| **Runtime** | Graph-native interpreter with tagged values (`Result`, `Option`, `Variant`, `Destructure`, `Delay`), structured concurrency, `QDoc`-backed MiddleOut request compression/tunneling, native frame adapter, and a hetero-fabric race layer that can use CPU, WebGPU, WebNN, WASM/browser, or env-bound CUDA/vendor-NPU runners |
| **Compiled Topology** | AOT codegen eliminates the engine loop -- `.gg` compiles to flat function chains at 176M exec/sec (6ns), leaving only handler time |
| **CLI** | `lint`, `analyze`, `verify`, `build`, `run`, `native`, `test`, `mod init`, `mod tidy` |
| **Scripts** | Formal conversion and ledger-to-MCP generation/validation entrypoints in [`scripts/README.md`](./scripts/README.md) |
| **`gnode` TS runtime** | Rust-fronted runner that compiles orchestration-shaped `.ts` into `.gg`, surfaces cannon/linear schedules, and preserves GG telemetry passthrough |
| **Module system** | `.gg`/`.mgg` parsing, merged-source loading, cycle rejection, bare-specifier resolution, deterministic lockfiles |
| **Formal path** | TLA+ module/config generation, Lean proof artifacts, bounded queue certificates, coupled-kernel handoff theorems, recursive coarsening synthesis with fiber-partitioned drift certificates |
| **CRDT layer** | Topology-native CRDTs with `QDoc`, the corridor/superposition primitive `QCorridor`, relay adapters, typed change-event contracts, the substrate for MiddleOut request compression, and the decayed community-memory surface used by hetero-fabric backend racing |
| **Capabilities** | Target inference and validation (`workers`, `node`, `gnode`) -- fail before deployment |
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
| `SLIVER` | Constructive (consensus) or destructive (conflict detection) observation. |

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

The repo includes 15 benchmark families with bootstrap intervals, regime sweeps, and adversarial controls:

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
- **compiler-phase** -- five-compiler shootout (Betty, Betti, Franky, Beckett, aeon-logic) + 13-phase Betty breakdown + self-hosting optimality test
- **forest-convergence** -- per-node polyglot racing with the sliver (+1), meta-iteration, diversity theorem validation

## Corpus

The repo includes 530+ `.gg` topologies, 30+ `.test.gg` suites, 30+ TypeScript tests, 15 host-language bindings, and 600+ generated TLA artifacts.

Top-level witness topologies now also include [`aeon_object.gg`](./aeon_object.gg), a minimal AEON constitution that folds address, capability, witness, storage scope, replication policy, and projection into one launchable materialization plan.

Example families: transformers, CRDTs, synth graphs, privacy flows, edge pipelines, failure-boundary witnesses.

## Repository Guide

- [src](./src/README.md) -- compiler, runtime, CLI, module tooling, auth, CRDT, benchmarks, forest convergence engine
- [gnode](./gnode/README.md) -- Rust-fronted TypeScript-to-GG runner and schedule surface
- [examples](./examples/README.md) -- executable examples and `.test.gg` suites
- [bindings](./bindings/README.md) -- subprocess-based client bindings for non-TS hosts
- [content](./content/README.md) -- manuscript and companion publication content
- [lean](./lean/README.md) -- standalone Lean theorem surface, including the Aeon voting arithmetic proofs
- [ROADMAP](./ROADMAP.md) -- language roadmap and near-term design edges

## Formal Voting Surface

The repository now also carries a standalone voting proof/kernel pair for ecosystem governance:

- [`aeon_voting.test.gg`](./aeon_voting.test.gg): witness topology for the governance-deficit rule
- [`lean/README.md`](./lean/README.md): entrypoint into the standalone Lean theorem surface
- [`AeonVoting.lean`](./lean/Lean/ForkRaceFoldTheorems/AeonVoting.lean): proves zero-deficit optimality, strict dominance over one-stream rule, rejection monotonicity, and deterministic tie-break laws

## License

Copyright Taylor William Buley. All rights reserved.

MPL-2.0
