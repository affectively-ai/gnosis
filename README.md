# Gnosis

Gnosis is a graph-first language and toolchain built around `FORK`, `RACE`, `FOLD`, `VENT`, `PROCESS`, and `INTERFERE`. The fairest way to brag about it is not to say it has the biggest theory. It is to say that the repo already gives you the pieces people usually need before a new language feels real: a CLI, a REPL, a formatter, a module system, a test runner, a native runtime path, formal outputs, bindings, and a large set of examples you can actually poke at.

The strongest simple claim is this: one `.gg` file can move through writing, checking, testing, running, native execution, TLA output, Lean artifact generation, and benchmark suites without changing formats.

## She's A Beauty

![Betti](./examples/betti.gif)

## The Fair Brag

Gnosis is unusually complete for a research language repo.

- One CLI covers the full loop: `lint`, `analyze`, `verify`, `build`, `run`, `native`, `test`, `mod init`, and `mod tidy`.
- Authoring is not miserable: there is a TUI REPL, `--fix` formatting, and narrow UFCS sugar so linear `PROCESS` chains can be written as `func(value)` or `value.func()`.
- Formal tooling is not bolted on later: `.gg` topologies can emit TLA+ modules/configs and Lean proof artifacts from the main workflow.
- Runtime ergonomics are practical: the interpreter and native frame runtime share the same topology model, and the native path falls back deterministically when WASM is unavailable.
- Deploy-time friction is reduced up front: capability inference and validation can fail incompatible effects early for `workers`, `node`, or `bun`.
- The repo is not toy-sized: the current tree includes 300+ `.gg` topologies, 30+ `.test.gg` suites, 30+ TypeScript tests, 15 host-language bindings, and 600+ generated TLA artifacts.

## Why It Feels Good To Use

| Surface                 | Why it helps                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single mental model     | The compiler, runtime, test runner, benchmarks, module loader, and formal bridges all speak the same graph language instead of making you jump between unrelated DSLs. |
| Fast feedback           | `lint`, `analyze`, `verify`, and `.test.gg` let you catch topology problems before you are debugging runtime traces.                                                   |
| First-class formal path | `verify` and `build` can generate TLA+ and Lean outputs directly from `.gg`, so "make it formal" is a normal step, not a rewrite.                                      |
| Practical runtime story | `run` and `native` execute the same topology shape; the native adapter exposes real metrics and degrades cleanly when acceleration is missing.                         |
| Real module tooling     | `.mgg` modules, deterministic lockfile-backed resolution, bare-specifier imports, and `gnosis mod init/tidy` mean this is not just a folder of single-file demos.      |
| CI-friendly output      | `--json` and `--sarif` make the CLI usable in automation rather than just nice in a screenshot.                                                                        |
| Host-language reach     | Thin bindings let Python, Go, Java, C#, Rust, Swift, Kotlin, Lua, Haskell, Erlang, and others call the same CLI contract.                                              |
| Examples with teeth     | The examples are not decorative. They include CRDTs, transformer pieces, synth graphs, privacy flows, routing benchmarks, and failure-boundary witnesses.              |

## What You Get Today

- A topology compiler in [`src/betty`](./src/betty/README.md), including static topology checks, UFCS lowering, stability auditing, and Lean artifact generation.
- A runtime in [`src/runtime`](./src/runtime/README.md) with built-in tagged value handling (`Result`, `Option`, `Variant`, `Destructure`, `Delay`, quantum and differentiable primitives), structured concurrency semantics, and a native frame adapter.
- A real CLI in [`src/index.ts`](./src/README.md) covering formatting, verification, runtime execution, steering telemetry, module workflows, and machine-readable reporting.
- A behavioral loop bridge in [`src/behavioral-taxonomy.ts`](./src/README.md) that can both measure the corpus-level buley surface and project individual loops into executable Gnosis topologies.
- A module system in [`src/mod`](./src/mod/README.md) with `.gg` / `.mgg` parsing, merged-source loading, cycle rejection, bare-specifier resolution, and deterministic lockfile generation.
- Capability inference and target validation in [`src/capabilities`](./src/capabilities/README.md), so target mismatches fail before deployment.
- Native auth/capability surfaces in [`src/auth`](./src/auth/README.md), including UCAN/ZK-oriented execution envelopes and fail-closed runtime authorization hooks.
- A topology-native CRDT layer in [`src/crdt`](./src/crdt/README.md), plus relay adapters and formal support files.
- A benchmark corpus in [`src/benchmarks`](./src/benchmarks/README.md) and [`examples/benchmarks`](./examples/benchmarks/README.md) that keeps topology fixed while varying fold strategy and task family.
- A large examples surface in [`examples`](./examples/README.md), including transformer, CRDT, synth, privacy, edge-pipeline, and impossible-systems suites.
- Multi-language CLI bindings in [`bindings`](./bindings/README.md).

## Quick Taste

```gg
(input)-[:FORK]->(fast_path | safe_path)
(fast_path | safe_path)-[:FOLD { strategy: 'linear' }]->(result)
```

That same topology can be linted, analyzed, verified, tested, executed, emitted to TLA, and built into native frame payloads without changing formats.

## Quickstart

```bash
cd open-source/gnosis
bun run start
```

Useful commands:

```bash
# Format a topology in place
bun ./bin/gnosis.js --fix example.gg

# Lint and analyze for a target runtime
bun ./bin/gnosis.js lint example.gg --target bun
bun ./bin/gnosis.js analyze betti.gg --json

# Emit formal artifacts
bun ./bin/gnosis.js verify betti.gg --tla --tla-out tla/generated
bun ./bin/gnosis.js build betti.gg --lean --lean-out lean/generated

# Execute topologies
bun ./bin/gnosis.js run example.gg
bun ./bin/gnosis.js native example.gg

# Run topology tests
bun ./bin/gnosis.js test examples/benchmarks/fold-training.test.gg

# Initialize and normalize module metadata
bun ./bin/gnosis.js mod init demo
bun ./bin/gnosis.js mod tidy
```

Verbose mascot mode is available too:

```bash
bun run start -- --verbose
```

## What Makes It Easier To Use

### One CLI, Many Jobs

The CLI is where most people will first feel whether this is usable:

- `lint` and `analyze` surface structural correctness, steering, and target compatibility.
- `verify` emits formal artifacts from the same source graph.
- `build` can push further into Lean-backed proof output, including measurable queue certificates, the emitted Lévy-Prokhorov exact-convergence endpoint, the emitted post-burn-in geometric-decay endpoint, and the emitted abstract geometric-ergodicity endpoint for certified laminar queue kernels.
- `run` and `native` let you use either the interpreter or the native frame runtime without changing source format.
- `test` runs `.test.gg` suites directly.
- `mod init` and `mod tidy` make modular `.gg` projects manageable instead of ad hoc.

### A Strange Language That Tries Not To Fight You

Gnosis is unusual, but the repo tries to keep the day-to-day feel understandable:

- the REPL is interactive instead of static,
- the formatter keeps topology source normalized,
- UFCS lowering means simple call chains do not need verbose edge boilerplate,
- and built-in tagged-value and destructuring nodes reduce a lot of host-language glue.

### Formal Tools That Stay Close To The Source

This is one of the clearest places the repo earns its confidence:

- TLA+ modules/configs are generated from `.gg`,
- Lean artifacts can be emitted from compiler output,
- generated files already exist in the tree in large numbers,
- and the formal path is exercised by tests and benchmark/report flows rather than treated as marketing copy.

### Real Runtime Paths

The runtime story is better than "there is an interpreter somewhere":

- the engine has explicit graph-native semantics,
- the native adapter can process compiled frame payloads,
- execution keeps stability metadata attached,
- and the fallback path is deterministic and observable instead of silently changing behavior.

### Not A Demo-Only Repo

The examples and benchmarks are a serious part of the user story:

- benchmark families isolate `FOLD { strategy: ... }` while holding topology fixed,
- examples cover transformers, CRDTs, synth graphs, privacy and edge flows,
- there are topology-native failure-boundary witnesses and warm-up/inversion suites,
- the inversion surface now includes semantic-void witnesses for false-stable convergence, multiplicity-preserving ambiguity, debt spirals, contagious warm-up, observer harm, and unfair repair,
- and the repo already contains a broad generated-formal-artifact surface to inspect.

## Repository Guide

- [ROADMAP](./ROADMAP.md): language roadmap and near-term design edges.
- [src](./src/README.md): compiler, runtime, CLI, module tooling, auth, CRDT, and benchmark internals.
- [examples](./examples/README.md): executable examples and `.test.gg` suites.
- [bindings](./bindings/README.md): subprocess-based client bindings for non-TS hosts.
- [content](./content/README.md): manuscript and companion publication content, including the layered FRFV failure and stability writeup.
- [TRADEMARKS](./TRADEMARKS.md): project marks.
- [LICENSE](./LICENSE): MPL-2.0.

## Why This README Is So Direct

The repo already has enough working surface to speak for itself without pretending it has solved all of programming. The strongest fair claim is that Gnosis is not just an idea. It is a broad, usable toolchain for writing, checking, running, and formalizing graph-native programs.
