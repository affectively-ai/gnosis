# Gnosis

You already know what you want to build, and Gnosis helps you express that idea elegantly.

With algorithmic convergence upon us, the optional shape of computation [`fork/race/fold/vent`](https://forkracefoldvent.com) is now known and offers a new way to understand the beauty of computation by knowing its inverse: computational waste. We have discovered what ugly looks like -- essentially, the gap between best-case and actual execution -- and by measuring it, we can now optimize for its inverse: computational beauty.

Gnosis _guarantees_ beautiful code. Logically, mathematically and aesthetically.

Gnosis is a functional, logic-based quantum programming language and compiler built on the **[Wallington Rotation](https://www.youtube.com/watch?v=xD5Lc3-5iDs&t=9s)** and topological pipeline primitives (`FORK`, `RACE`, `FOLD`, `VENT`). It eliminates traditional imperative control flow in favor of pure computational topology. The language is the topology and the AST is the graph. The result is a system where the structure of the program is its own execution model, and where the boundaries between logic, data, and control are dissolved into pure bytecode encapsulated 10-byte frames over the wire. Narrow UFCS sugar such as `func(value)` and `value.func()` now lowers to the same `PROCESS` topology as explicit edges, so linear call chains stay zero-cost.

# She's A Beauty

![Betti](https://github.com/affectively-ai/gnosis/blob/main/examples/betti.gif?raw=true)

> Oh my God, Betti! Look at the size of her Bule.
>
> It is so big. [scoff]
>
> She looks like none of those graph guys' girlfriends.

Baby got Buley? [Tap that graph](https://www.explainxkcd.com/wiki/index.php/398:_Tap_That_Ass).

## Why Gnosis?

It is a language that is both a programming language and a programming paradigm. It's a purpose-built tool designed to express computation as pure data flow, to unify a programs structure and execution model, and dissolve the boundaries between logic, data, and control. Its syntax and systems are an explicit attempt to express the chaotic beauty of pure data flow through topological computation.

Gnosis is self-hosted, meaning the compiler is written in Gnosis itself and the system is closed under self-application. This self-hosting capability is what makes Gnosis unique and powerful: it guarantees that anything that can be expressed computationally can be expressed functionally, flexibly, and efficiently without Garbage Collection or runtime overhead. Add runtime-level guarantees of correctness and built-in diagnostic of computational waste and Gnosis takes the drudgery out of functional and concurrent programming.

Gnosis is a _fractal_ programming language. It's a deceivingly simple yet computationally gorgeous language designed to express beautiful ideas without accidentally reshaping them. Because Gnosis programs are written in pure topology, they are their own unit tests: verified at compile time, they transpile to TLA+ for formal verification, ensuring correctness and eliminate bugs before deployment. It is a quantum topological engine capable of orchestrating the next generation of software.

Everything -- from the compiler to the application's reactive core -- is now pure logic expressed as a graph. It's fractal, and turtles all the way down. You just have to network things together and write integration tests.

| Property                                                 | Why it’s cool                                                                                                                                                                                                                 | Evidence                                                                                                                                                                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Topology-native language (not imperative syntax sugar)   | Gnosis treats graph topology as the program model and explicitly rejects imperative keywords in parsing.                                                                                                                      | [compiler.ts:14](open-source/gnosis/src/betty/compiler.ts:14), [compiler.ts:97](open-source/gnosis/src/betty/compiler.ts:97)                                                                                                                        |
| Built-in topological complexity tracking                 | Compiler/runtime track superposition pressure (`beta1`), compute a Buley metric in bules, surface frontier-fill steering as the Wallace metric in wallys, and keep runtime wall/CPU time telemetry separate in microCharleys. | [compiler.ts:61](open-source/gnosis/src/betty/compiler.ts:61), [compiler.ts:217](open-source/gnosis/src/betty/compiler.ts:217), [analysis.ts:131](open-source/gnosis/src/analysis.ts:131)                                                           |
| Runtime semantics are graph-native                       | Engine prioritizes/controls `FORK/RACE/FOLD/OBSERVE/ENTANGLE/SUPERPOSE/EVOLVE/VENT` as first-class execution flow, not library callbacks.                                                                                     | [engine.ts:111](open-source/gnosis/src/runtime/engine.ts:111), [engine.ts:121](open-source/gnosis/src/runtime/engine.ts:121), [engine.ts:224](open-source/gnosis/src/runtime/engine.ts:224)                                                         |
| Formal checks are integrated into CLI workflow           | `lint/verify/analyze` are native commands, and `run/native` perform formal checks before execution.                                                                                                                           | [index.ts:224](open-source/gnosis/src/index.ts:224), [index.ts:393](open-source/gnosis/src/index.ts:393)                                                                                                                                            |
| TLA+ bridge is first-class                               | You can generate `.tla/.cfg` from `.gg`, including invariants/liveness properties and stats.                                                                                                                                  | [tla-bridge.ts:175](open-source/gnosis/src/tla-bridge.ts:175), [tla-bridge.ts:217](open-source/gnosis/src/tla-bridge.ts:217), [index.ts:250](open-source/gnosis/src/index.ts:250)                                                                   |
| Capability-aware portability gates                       | Gnosis infers required host capabilities from topology and validates compatibility per target (`workers/node/bun`).                                                                                                           | [inference.ts:277](open-source/gnosis/src/capabilities/inference.ts:277), [validate.ts:14](open-source/gnosis/src/capabilities/validate.ts:14), [profiles.ts:22](open-source/gnosis/src/capabilities/profiles.ts:22)                                |
| Security is modeled as topology + enforced at edge level | UCAN/ZK/HALT labels are built-ins; edge execution can be denied if required capabilities are missing; sensitive flows get auto ZK wrappers.                                                                                   | [core.ts:239](open-source/gnosis/src/auth/core.ts:239), [engine.ts:113](open-source/gnosis/src/runtime/engine.ts:113), [handlers.ts:750](open-source/gnosis/src/auth/handlers.ts:750), [auto-zk.ts:199](open-source/gnosis/src/auth/auto-zk.ts:199) |
| Native frame runtime with graceful fallback              | Can use `gnosis_runtime` WASM for frame processing, but degrades deterministically with internal metrics/trace if unavailable.                                                                                                | [native-runtime.ts:123](open-source/gnosis/src/runtime/native-runtime.ts:123), [native-runtime.ts:136](open-source/gnosis/src/runtime/native-runtime.ts:136), [native-runtime.ts:190](open-source/gnosis/src/runtime/native-runtime.ts:190)         |
| 3D renderer topology compatibility                       | Renderer path supports budget-aware venting and configurable collapse strategy (`fold`/`race`) with aeon-3d fallback.                                                                                                         | [renderer-compat.ts:152](open-source/gnosis/src/runtime/renderer-compat.ts:152), [renderer-compat.ts:198](open-source/gnosis/src/runtime/renderer-compat.ts:198), [renderer-compat.ts:266](open-source/gnosis/src/runtime/renderer-compat.ts:266)   |
| `.gg`-native neural runtime                              | Neural engine verifies topology with model checking before load/compile and can switch between GPU/WebNN backends.                                                                                                            | [neural-compat.ts:742](open-source/gnosis/src/neural-compat.ts:742), [neural-compat.ts:821](open-source/gnosis/src/neural-compat.ts:821), [neural-compat.ts:833](open-source/gnosis/src/neural-compat.ts:833)                                       |

## Who Cares? Engineer Edition

| Property                                                                   | Engineer Give-a-shit Factor (1-10) | Why you care in day-to-day work                                                                        | Evidence                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ---------------------------------: | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formal verification gates in CLI + pre-run check                           |                              10/10 | Stops shipping/executing broken topologies early; catches failures before runtime debugging.           | [index.ts:224](open-source/gnosis/src/index.ts:224), [index.ts:393](open-source/gnosis/src/index.ts:393)                                                                                                             |
| Runtime target capability validation (`workers/node/bun`)                  |                              10/10 | Prevents “works on my machine” deploy failures by failing incompatible effects up front.               | [inference.ts:277](open-source/gnosis/src/capabilities/inference.ts:277), [validate.ts:14](open-source/gnosis/src/capabilities/validate.ts:14), [profiles.ts:22](open-source/gnosis/src/capabilities/profiles.ts:22) |
| Edge-level UCAN authorization                                              |                               9/10 | Gives enforceable least-privilege at execution edge granularity, not just coarse API checks.           | [core.ts:239](open-source/gnosis/src/auth/core.ts:239), [engine.ts:113](open-source/gnosis/src/runtime/engine.ts:113)                                                                                                |
| Auto ZK envelope injection for sensitive flows                             |                               9/10 | Reduces security footguns by defaulting sensitive sync/materialization paths into protected wrappers.  | [auto-zk.ts:199](open-source/gnosis/src/auth/auto-zk.ts:199), [engine.ts:31](open-source/gnosis/src/runtime/engine.ts:31)                                                                                            |
| Native runtime with deterministic fallback                                 |                               8/10 | You can ship one code path that still works when WASM runtime is missing/broken, with traceability.    | [native-runtime.ts:123](open-source/gnosis/src/runtime/native-runtime.ts:123), [native-runtime.ts:190](open-source/gnosis/src/runtime/native-runtime.ts:190)                                                         |
| Explicit graph execution semantics (`FORK/RACE/FOLD/...`)                  |                               8/10 | Easier reasoning about concurrency/merge behavior than hidden callback spaghetti.                      | [engine.ts:111](open-source/gnosis/src/runtime/engine.ts:111), [engine.ts:224](open-source/gnosis/src/runtime/engine.ts:224)                                                                                         |
| TLA+ bridge generation from `.gg`                                          |                               8/10 | Turns topology into inspectable model-check artifacts for audits and high-risk workflows.              | [tla-bridge.ts:175](open-source/gnosis/src/tla-bridge.ts:175), [index.ts:250](open-source/gnosis/src/index.ts:250)                                                                                                   |
| Topology-native test runner (`.test.gg`) with parallel module verification |                               7/10 | Keeps tests close to topology intent; parallel verification speeds feedback loops.                     | [gg-test-runner.ts:4](open-source/gnosis/src/gg-test-runner.ts:4), [gg-test-runner.ts:162](open-source/gnosis/src/gg-test-runner.ts:162), [gg-test-runner.ts:250](open-source/gnosis/src/gg-test-runner.ts:250)      |
| Renderer topology compat with vent/race/fold budget control                |                               6/10 | Practical for perf budgeting in render workloads; less generally critical unless doing 3D-heavy flows. | [renderer-compat.ts:152](open-source/gnosis/src/runtime/renderer-compat.ts:152), [renderer-compat.ts:266](open-source/gnosis/src/runtime/renderer-compat.ts:266)                                                     |
| `.gg`-native neural engine with topology verification                      |                               6/10 | Useful if you’re building neural workflows in this stack; lower value for non-ML product code.         | [neural-compat.ts:742](open-source/gnosis/src/neural-compat.ts:742), [neural-compat.ts:821](open-source/gnosis/src/neural-compat.ts:821)                                                                             |

Scale: **10 = directly saves engineering time/risk**, **1 = mostly demo value**.

## Who Cares? User Edition

| Property                                                           | Give-a-shit (User) | Why they care                                                                                       | Evidence                                                                                                                                                                                   |
| ------------------------------------------------------------------ | -----------------: | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fail-closed execution security (UCAN + ZK gate + HALT attestation) |              10/10 | Prevents unauthorized or replayed actions and blocks bad confidential execution paths.              | [core.ts:239](open-source/gnosis/src/auth/core.ts:239), [handlers.ts:1163](open-source/gnosis/src/auth/handlers.ts:1163), [handlers.ts:1197](open-source/gnosis/src/auth/handlers.ts:1197) |
| Automatic ZK protection for sensitive flows                        |              10/10 | User data gets encrypted by default in risky sync/materialization paths, reducing privacy mistakes. | [auto-zk.ts:199](open-source/gnosis/src/auth/auto-zk.ts:199), [handlers.ts:1098](open-source/gnosis/src/auth/handlers.ts:1098)                                                             |
| Formal verification before execution                               |               9/10 | Fewer weird runtime bugs and production surprises; more predictable app behavior.                   | [index.ts:393](open-source/gnosis/src/index.ts:393), [analysis.ts:210](open-source/gnosis/src/analysis.ts:210)                                                                             |
| Runtime target compatibility checks                                |               8/10 | Fewer “feature works here but not there” failures across environments.                              | [inference.ts:277](open-source/gnosis/src/capabilities/inference.ts:277), [validate.ts:14](open-source/gnosis/src/capabilities/validate.ts:14)                                             |
| Native runtime + graceful fallback                                 |               8/10 | App still works when native acceleration is unavailable instead of hard-failing.                    | [native-runtime.ts:123](open-source/gnosis/src/runtime/native-runtime.ts:123), [native-runtime.ts:190](open-source/gnosis/src/runtime/native-runtime.ts:190)                               |
| Budget-aware 3D topology rendering                                 |               7/10 | Smoother rendering and fewer frame drops on heavy scenes.                                           | [renderer-compat.ts:152](open-source/gnosis/src/runtime/renderer-compat.ts:152), [renderer-compat.ts:266](open-source/gnosis/src/runtime/renderer-compat.ts:266)                           |
| Explicit concurrency/collapse semantics                            |               7/10 | Better consistency under concurrent actions (less stale/contradictory UI behavior).                 | [engine.ts:111](open-source/gnosis/src/runtime/engine.ts:111), [engine.ts:121](open-source/gnosis/src/runtime/engine.ts:121)                                                               |
| Strong topology test model                                         |               6/10 | Higher release quality over time (fewer regressions users encounter).                               | [gg-test-runner.ts:4](open-source/gnosis/src/gg-test-runner.ts:4), [gg-test-runner.ts:150](open-source/gnosis/src/gg-test-runner.ts:150)                                                   |
| `.gg`-native neural runtime                                        |               5/10 | Useful when user-facing AI/ML features are present; otherwise mostly invisible.                     | [neural-compat.ts:742](open-source/gnosis/src/neural-compat.ts:742), [neural-compat.ts:774](open-source/gnosis/src/neural-compat.ts:774)                                                   |
| REPL/authoring UX                                                  |               2/10 | End-users usually never see it; this is mainly a developer productivity surface.                    | [repl.tsx:151](open-source/gnosis/src/repl.tsx:151), [repl.tsx:473](open-source/gnosis/src/repl.tsx:473)                                                                                   |

Scale: **10 = user feels this immediately in trust/speed/reliability**, **1 = mostly internal/dev-facing**.

# Why CRDTs?

The only shared state is the quantum wave function itself, which is managed by the runtime. There is.single entanglement primitive -- a persistent, append-only CDRT (Computational Data Response Tree) log -- that coordinates all nodes seamlessly, mathematically and verifiably without the eventual consistency pitfalls of other distributed systems.

| Property                        | Why it’s cool                                                                                             | Evidence                                                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Superposition (`β₁`)            | Concurrent edits are represented explicitly, not hidden; collapse is a first-class operation.             | [qdoc.ts:213](open-source/gnosis/src/crdt/qdoc.ts:213), [qregister.gg:11](open-source/gnosis/examples/crdt/qregister.gg:11)                                                                                             |
| Topology-as-state (append-only) | Full causal history is preserved; no shrinking state model.                                               | [qdoc.ts:91](open-source/gnosis/src/crdt/qdoc.ts:91), [QuantumCRDT.tla:112](open-source/gnosis/tla/QuantumCRDT.tla:112)                                                                                                 |
| Strategy-driven convergence     | Different CRDT types collapse with explicit strategies (`lww`, `ot-transform`, `fold-sum`, `per-key`).    | [qdoc.ts:122](open-source/gnosis/src/crdt/qdoc.ts:122), [qcounter.gg:16](open-source/gnosis/examples/crdt/qcounter.gg:16), [qmap.gg:15](open-source/gnosis/examples/crdt/qmap.gg:15)                                    |
| Presence as interference        | Presence is modeled separately from content merge, so cursors/status can coexist without forced collapse. | [qdoc.ts:409](open-source/gnosis/src/crdt/qdoc.ts:409), [entanglement.gg:16](open-source/gnosis/examples/crdt/entanglement.gg:16)                                                                                       |
| Native delta sync + relay       | Incremental deltas and full-state sync are built in, with replica/clock metadata and relay transport.     | [qdoc.ts:281](open-source/gnosis/src/crdt/qdoc.ts:281), [qdoc.ts:299](open-source/gnosis/src/crdt/qdoc.ts:299), [dashrelay-adapter.ts:37](open-source/gnosis/src/crdt/dashrelay-adapter.ts:37)                          |
| Formal + executable proofs      | Claims are backed by TLA+ specs and topology tests (not just comments).                                   | [QuantumCRDT.tla:8](open-source/gnosis/tla/QuantumCRDT.tla:8), [ObserveCollapse.tla:8](open-source/gnosis/tla/ObserveCollapse.tla:8), [gg-test-harness.test.ts:172](open-source/gnosis/src/gg-test-harness.test.ts:172) |

## Who Cares? Engineer Edition

| Property                        | Why it matters to engineers                                                                                                               | Evidence                                                                                                                                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Superposition (`β₁`)            | Concurrency is observable and debuggable. You can reason about branch pressure/collapse directly instead of guessing from side effects.   | [qdoc.ts:213](open-source/gnosis/src/crdt/qdoc.ts:213), [qregister.gg:11](open-source/gnosis/examples/crdt/qregister.gg:11)                                                                                             |
| Topology-as-state (append-only) | Great for replay, auditing, and postmortems. No hidden state compaction means fewer “where did that write go?” bugs.                      | [qdoc.ts:91](open-source/gnosis/src/crdt/qdoc.ts:91), [QuantumCRDT.tla:112](open-source/gnosis/tla/QuantumCRDT.tla:112)                                                                                                 |
| Strategy-driven convergence     | Merge behavior is explicit per type (`lww`, `ot-transform`, `fold-sum`, `per-key`), so behavior is reviewable, testable, and change-safe. | [qdoc.ts:122](open-source/gnosis/src/crdt/qdoc.ts:122), [qcounter.gg:16](open-source/gnosis/examples/crdt/qcounter.gg:16), [qmap.gg:15](open-source/gnosis/examples/crdt/qmap.gg:15)                                    |
| Presence as interference        | Separates ephemeral collaboration signals from durable content state, which prevents a lot of accidental merge coupling.                  | [qdoc.ts:409](open-source/gnosis/src/crdt/qdoc.ts:409), [entanglement.gg:16](open-source/gnosis/examples/crdt/entanglement.gg:16)                                                                                       |
| Native delta sync + relay       | Efficient incremental sync plus a concrete wire protocol/adapter path makes integration and ops much cleaner.                             | [qdoc.ts:281](open-source/gnosis/src/crdt/qdoc.ts:281), [qdoc.ts:299](open-source/gnosis/src/crdt/qdoc.ts:299), [dashrelay-adapter.ts:37](open-source/gnosis/src/crdt/dashrelay-adapter.ts:37)                          |
| Formal + executable proofs      | You get both model-level guarantees and runnable regression checks, which is strong protection against subtle CRDT regressions.           | [QuantumCRDT.tla:8](open-source/gnosis/tla/QuantumCRDT.tla:8), [ObserveCollapse.tla:8](open-source/gnosis/tla/ObserveCollapse.tla:8), [gg-test-harness.test.ts:172](open-source/gnosis/src/gg-test-harness.test.ts:172) |

## Who Care? User Edition

| Property                        | Why users care                                                                                                                                         | Evidence                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Superposition (`β₁`)            | Better real-time collaboration: concurrent edits don’t feel broken or lossy.                                                                           | [qdoc.ts:213](open-source/gnosis/src/crdt/qdoc.ts:213), [qregister.gg:11](open-source/gnosis/examples/crdt/qregister.gg:11)                                                                                             |
| Topology-as-state (append-only) | Higher trust: edit history is durable, and unexpected state loss is less likely.                                                                       | [qdoc.ts:91](open-source/gnosis/src/crdt/qdoc.ts:91), [QuantumCRDT.tla:112](open-source/gnosis/tla/QuantumCRDT.tla:112)                                                                                                 |
| Strategy-driven convergence     | Fewer confusing merge outcomes: behavior is consistent for maps/text/counters.                                                                         | [qdoc.ts:122](open-source/gnosis/src/crdt/qdoc.ts:122), [qcounter.gg:16](open-source/gnosis/examples/crdt/qcounter.gg:16), [qmap.gg:15](open-source/gnosis/examples/crdt/qmap.gg:15)                                    |
| Presence as interference        | Cursor/status presence stays responsive without corrupting document content. Viz [`@affectively/aeon-flux`](https://github.com/affectively/aeon-flux). | [qdoc.ts:409](open-source/gnosis/src/crdt/qdoc.ts:409), [entanglement.gg:16](open-source/gnosis/examples/crdt/entanglement.gg:16)                                                                                       |
| Native delta sync + relay       | Faster, smoother sync on real networks (less full-state churn, better incremental updates).                                                            | [qdoc.ts:281](open-source/gnosis/src/crdt/qdoc.ts:281), [qdoc.ts:299](open-source/gnosis/src/crdt/qdoc.ts:299), [dashrelay-adapter.ts:37](open-source/gnosis/src/crdt/dashrelay-adapter.ts:37)                          |
| Formal + executable proofs      | Fewer production regressions and edge-case sync bugs users have to suffer through.                                                                     | [QuantumCRDT.tla:8](open-source/gnosis/tla/QuantumCRDT.tla:8), [ObserveCollapse.tla:8](open-source/gnosis/tla/ObserveCollapse.tla:8), [gg-test-harness.test.ts:172](open-source/gnosis/src/gg-test-harness.test.ts:172) |

## The Core Primitives

Gnosis operates on the covering space of execution paths, tracking the system's state via its first Betti number ($\beta_1$).

- **`FORK`**: Branch execution into parallel superpositions. Increases $\beta_1$.
- **`RACE`**: Collapse to the fastest valid path. Maintains homotopy equivalence.
- **`FOLD` / `COLLAPSE`**: Deterministically merge independent paths back into a scalar state.
- **`VENT` / `TUNNEL`**: Dissipate waste heat by shedding unproductive paths.
- **`INTERFERE`**: Apply constructive or destructive interference between wave function amplitudes.

## A Complete System

Gnosis provides a unified architecture for high-performance, verified computation:

1.  **Gnosis Graph Language (GGL)**: A Cypher-inspired ASCII-art syntax for drawing execution graphs.
2.  **Betty/Betti Compiler**: A self-hosting compilation pipeline that translates graphs into binary flows.
3.  **Vectorized Runtime**: A "hella-optimized" Rust-based WebAssembly engine that evaluates topologies using the Aeon Flow 10-byte wire format with zero overhead.
4.  **Formal Verification**: Natively integrated with `aeon-logic` to prove topological invariants and quantum bounds ($\beta_1$) at compile time, and `build` / `verify` can now emit Lean 4 drift-proof artifacts for thermodynamic topologies.
5.  **Statistical Measurement**: Integrated with `twokeys` for Tukey-style Exploratory Data Analysis (EDA) inside the wave function.
6.  **3D Compatibility Runtime**: `Renderer` nodes can route 3D scene workloads through the `aeon-3d` topology compat layer (`fork/race/fold/vent`) to reduce sequential render-loop pressure.

## Real-World Topologies

Gnosis is capable of expressing the most complex software architectures as pure data flow:

- **Topological AI**: Full Transformer-style forward passes (Attention, Residuals, Softmax) implemented as fractal superpositions.
- **`.gg`-Native Neural Runtime**: `NeuralEngine` / `GPUEngine` / `WebNNEngine` run directly on `.gg` topology source. The canonical first module is [`topic_domain_transformer.gg`](./topic_domain_transformer.gg) for topic-domain transformer flows.
- **Learned Fold-Boundary Benchmarks**: parameter-matched `.gg` modules in [`examples/benchmarks/`](./examples/benchmarks/README.md) differ only in fold strategy (`linear`, `winner-take-all`, `early-stop`) and now drive the full Chapter 17 learned-evidence package: the cancellation-sensitive affine learner, the one-path negative controls, a continuous regime sweep that interpolates from parity to mandatory recombination, adversarial tasks that favor sparse nonlinear selection, and the harder four-expert mini-MoE routing learner.
- **Reactive Kernels**: The core server loops and navigation engines of `aeon-flux` and `aeon-shell` redefined as continuous topological transitions.
- **Self-Hosted Logic**: The Gnosis compiler is itself a Gnosis topology, proving the system is closed under self-application.
- **Native Auth Topologies**: UCAN issuance/verification/delegation, ZK encryption/decryption, and custodial action checks are available as native runtime labels.
- **Warm-Up Taxonomy Modules**: Toy `.gg` programs now model cache reuse, prefetch, online adaptation, probabilistic narrowing, amortized structure, physical warm-up, and human entrainment via [`warmup_taxonomy.test.gg`](./warmup_taxonomy.test.gg).
- **Warm-Up Controller Witnesses**: The warm-up controller theorem now has native `.gg` witnesses for underfilled/overprovisioned cases below redline, above redline, and at the boundary tie via [`warmup_controller.test.gg`](./warmup_controller.test.gg).
- **Warm-Up Inversion Modules**: Companion anti-topologies invert those same mechanisms into cache poisoning, misprefetch, policy drift, false-positive fanout, compaction debt, overwarm fatigue, and social misalignment via [`warmup_inversion.test.gg`](./warmup_inversion.test.gg).
- **Failure Trilemma Witnesses**: Native `.gg` witnesses now cover free-collapse blocking, vent-paid collapse, repair-paid collapse, and contagious zero-vent repair pressure via [`failure_trilemma.test.gg`](./failure_trilemma.test.gg).
- **Failure Composition Witnesses**: Native `.gg` witnesses now carry the no-free-collapse boundary across multiple stages, including vent-paid, repair-paid, unpaid-prefix, and contagious paid-stage pipelines via [`failure_composition.test.gg`](./failure_composition.test.gg).
- **Failure Universality Witnesses**: Native `.gg` witnesses now cover arbitrary-depth normalized collapse paths, the exact min-cost floor, deeper paid prefixes, unpaid free-prefix blocks, and contagious depth via [`failure_universality.test.gg`](./failure_universality.test.gg).
- **Wallace Boundary Walker**: [`wallace_monitor.gg`](./wallace_monitor.gg) and [`wallace_monitor_drift.gg`](./wallace_monitor_drift.gg) express occupancy-deficit monitoring directly in `.gg`, using `GradientStep` for `seqCap - busy` and `MeanSquaredError` to surface residual drift against `InvOccupancyDeficitEqualsTurbulentIdle`.
- **UCAN Boundary-Walk Rights**: steering runs, trace appends, relay joins, and apply intent can now be wrapped in resource-scoped UCAN capabilities instead of relying only on edge-level grants.

## Source Tree

- [ROADMAP](./ROADMAP.md): Narrow language roadmap for effects, ADTs, explicit error values, structured concurrency, module tooling, and destructuring.
- [content](./content/README.md): Chapter manuscript sources, companion verification notes, and publish-proof metadata for the forkracefold research surface.
- [src](./src/README.md): Compiler, runtime, and module tooling internals, including native `Result`/`Option`/`Destructure` runtime primitives.
- [examples](./examples/README.md): topology examples, `.test.gg` suites, and the fold-boundary benchmark modules.
- [bindings](./bindings/README.md): Multi-language CLI bindings (TIOBE-heavy + Lua/Haskell/Erlang) for embedding Gnosis in non-TS runtimes.

## Language Bindings

Gnosis ships subprocess-based bindings for:

- Python
- Go
- Java
- C#
- Rust
- C
- C++
- PHP
- Ruby
- Swift
- Kotlin
- Lua
- Haskell
- Erlang

See [bindings/README.md](./bindings/README.md) for the shared command contract and per-language client files.

## Getting Started

### Lean Proof Workspace

`open-source/gnosis` now includes a local Lean 4 / Lake workspace pinned by [`lean-toolchain`](./lean-toolchain) and [`lakefile.lean`](./lakefile.lean). Betti-generated proof artifacts use this workspace so Mathlib-backed drift proofs resolve through `lake env lean` instead of relying on a global Lean search path. The shared proof module [`GnosisProofs.lean`](./GnosisProofs.lean) now also formalizes the monoidal execution fragment for `fork` / `race` / `fold` and lifts the thermodynamic layer into a shared `CertifiedKernel` semantics. For the finite kernels Betti emits today, the spectral side is no longer just a ceiling certificate: acyclic kernels are discharged by nilpotence, row-contractive kernels are discharged by a mechanized `ρ(P) ≤ ‖P‖∞ < 1` argument, and support-graph return to the compiler’s small set is discharged by a finite-state recurrence witness. The proof workspace now also contains a countable-state drift-to-small-set layer and a reneging-queue bridge: `stability.ts` emits a structured `countableQueue` witness for queue-like thermodynamic topologies, including a laminar representative atom, and Betti uses that witness to synthesize a concrete `queueKernel` over `Nat` queue depths plus both a common-atom small-set minorization theorem and a uniform predecessor minorization theorem outside the small set. Countable recurrence, shared laminar-atom accessibility, an explicit atom-based ψ-irreducibility theorem, a bundled Harris-prelude theorem, a recurrent-class theorem, a quantitative atom-hitting / geometric-envelope theorem, and a single `CountableLaminarGeometricStabilityAtAtom` endpoint are then derived from those witnesses. That endpoint is now also carried back into compiler/runtime stability metadata as a named laminar theorem with its queue boundary and representative atom. Beyond the emitted queue family, the Lean workspace now also has a real measurable-kernel Harris prelude built on Mathlib’s `ProbabilityTheory.Kernel`, `Kernel.IsIrreducible`, and `Kernel.Invariant`, together with the first honest bridges that matter for the emitted queue proofs: irreducibility gives accessibility of every measurable set with positive reference mass, atom accessibility upgrades directly to irreducibility with respect to the Dirac measure at the laminar atom, and from that certified atom-based measurable theorem surface we can now recover both measurable small-set accessibility and finite-step accessibility of any measurable set containing the laminar atom. The remaining recurrence gap is still the hard one: a mechanized theorem from those measurable hypotheses to Harris recurrence or geometric ergodicity, and a compiler bridge from Betti’s symbolic queue families into those hypotheses.

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

The REPL and `lint` / `verify` / `analyze` output now also surface a steering block:

- `topologyDeficit`: structural beta gap between the source topology and explored graph
- `frontierFill`: how full the checker wavefront stayed over time
- `wallaceNumber`: the canonical Wallace metric / frontier-underfill statistic
- `frontierDeficit`: descriptive alias for the same Wallace metric
- `wally`: short-form alias and unit label for `wallaceNumber`
- `boundaryWalkBias`: signed boundary-walk bias from the Wallace surface (`+` = lean in, `-` = pull back)
- `leanInBias`: coarse steering posture (`lean-in`, `neutral`, `pull-back`)
- `failureBoundary.collapseCostAction`: deterministic collapse must pay by vent or repair, or keep multiplicity alive
- `failureBoundary.totalVentCost` / `failureBoundary.totalRepairDebt`: aggregate vent and repair payment across the observed trajectory
- `failureBoundary.totalPaidCost`: total deterministic-collapse payment across the trajectory
- `failureBoundary.paidStageCount`: how many stages actually pay vent or repair
- `failureBoundary.collapseCostFloor`: the exact minimum collapse floor implied by the peak live frontier
- `failureBoundary.collapseCostMargin`: observed payment minus that exact floor
- `failureBoundary.prefixCostDeficit`: unpaid shortfall on the worst finite collapse prefix
- `failureBoundary.zeroWasteCollapseRisk`: the no-free-collapse boundary is active on the current topology
- `failureBoundary.freeCollapsePrefixRisk`: some finite prefix tries to beat the collapse floor before enough payment accumulates
- `telemetry.wallMicroCharleys` / `telemetry.cpuMicroCharleys`: observed wall and CPU execution time in microCharleys
- `telemetry.wallToCpuRatio`: wall-vs-CPU skew for the run
- `eda`: Tukey-style frontier and graph summaries from `twokeys`
- `recommendedAction`: shown in `suggest` / `apply` modes only

Migration note: `wallaceNumber` is the canonical steering name. `wally` and `frontierDeficit` remain as aliases. The legacy `charleyNumber` surface has been removed rather than kept as a hidden compatibility alias.

Steering modes:

- `off`: suppress steering surfaces
- `report`: show metrics only
- `suggest`: show metrics plus recommended action
- `apply`: expose apply intent in the contract, but execution remains manual until steering actuators exist

Default mode is `suggest`, so steering is visible by default while auto-apply stays disabled.

Runtime executions now stream steering traces through a `QDoc`-backed CDRT store instead of a flat file. Each `run` / `native` appends one record, cohorts the record by topology/workload/executor/runtime, and prints a bounded `twokeys` summary for that comparable slice without rescanning the full trace. When an Aeon-compatible relay is configured and connected, the trace becomes distributed and durable across nodes; otherwise it remains local to the current session. DashRelay is one compatible backend, not the only one. Execution failures, invalid CRDT events, relay disconnects, and UCAN-denied boundary walks are recorded and surfaced loudly as `STEERING FAILURE` / `STEERING FAILURES` / `STEERING ALERT`, rather than being dropped from the empirical dataset.

### The CLI Runner

Execute `.gg` files directly through the bare-metal runtime:

```bash
bun ./bin/gnosis.js run your_app.gg
```

Easter egg aliases:

```bash
bun ./bin/gnosis.js crank your_app.gg
bun ./bin/gnosis.js stank your_app.gg
bun run failure:frontier
```

`crank` now prints `Wallace metric: X wallys` and, when relevant, the failure-boundary collapse cost implied by `THM-FAIL-TRILEMMA`.
`failure:frontier` mutates generated `.gg` failure candidates, runs the live Wallace/Buley/failure analysis, rejects unpaid free-prefix paths, and emits the Pareto survivors over `(wallace, buley, ventCost, repairDebt)`.

Execute with the native frame runtime (`gnosis_runtime` WASM) enabled:

```bash
bun ./bin/gnosis.js native your_app.gg
# or
bun ./bin/gnosis.js run your_app.gg --native
```

Configure or disable distributed steering trace sync against any Aeon-compatible relay:

```bash
bun ./bin/gnosis.js native your_app.gg \
  --steering-trace-window 128 \
  --steering-relay-url wss://relay.dashrelay.com/relay/sync \
  --steering-relay-room gnosis:steering:my-system \
  --steering-relay-protocol dashrelay-v1 \
  --steering-relay-product dashrelay

bun ./bin/gnosis.js run your_app.gg --no-steering-trace
```

Provide a verified execution-auth envelope when you want the boundary walk itself to be capability-gated:

```bash
bun ./bin/gnosis.js run your_app.gg \
  --execution-auth-file ./boundary-walk-auth.json
```

### Testing Topologies

Execute `.gg` test files with the built-in test runner:

```bash
bun ./bin/gnosis.js test path/to/topology.test.gg
bun ./bin/gnosis.js test topic_domain_transformer.test.gg
bun ./bin/gnosis.js test warmup_taxonomy.test.gg
bun ./bin/gnosis.js test warmup_controller.test.gg
bun ./bin/gnosis.js test warmup_inversion.test.gg
bun ./bin/gnosis.js test failure_trilemma.test.gg
bun ./bin/gnosis.js test failure_composition.test.gg
bun ./bin/gnosis.js test failure_universality.test.gg
bun run warmup:diff
bun run failure:frontier
```

The three warm-up suites are meant to be read together: the taxonomy shows the shape that gets better after first use, the controller witnesses show the redline decision surface, and the inversion suite shows how the same mechanism degrades when the race winner, fold policy, or feedback channel is wrong.

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

# Build + write TLA+ bridge artifacts (defaults to tla/generated)
gnosis build path/to/topology.gg

# Verify + generate TLA+ bridge artifacts
gnosis verify path/to/topology.gg --tla-out tla/generated

# Print generated TLA+ spec and TLC config to stdout
gnosis verify path/to/topology.gg --tla

# Batch-build the discovered toy systems and record logical-opposite pairings
bun run build:toy-tla

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

`gnosis build` is the batch-friendly alias of `verify`: it generates `.tla/.cfg` files by default, writing to `tla/generated` unless `--tla-out` overrides the destination.

`bun run build:toy-tla` discovers the checked-in toy `.gg` systems, emits TLA+/TLC artifacts for each one, and writes `tla/generated/manifest.{json,md}`. Logical-opposite pairings are currently inferred only for explicit `warmup_*` and `warmup_invert_*` naming pairs, and logical-check failures are retained in the manifest when TLA emission still succeeds.

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

`UCANVerify` can emit `executionAuth` into the payload. The runtime now normalizes that context once and keeps it alive across payload-replacing handlers. For CLI/REPL boundary walks, Gnosis also runs a narrow bootstrap preflight across root-connected native auth/value-shaping nodes so a topology can issue/verify its own UCAN before the full run starts. When `executionAuth.enforce=true`, runtime edge execution is capability-checked at primitive level (`fork`, `race`, `fold`, `vent`, etc.) using resource-scoped UCAN capabilities, and steering/boundary-walk surfaces can additionally require:

- `gnosis/steering.run` on `aeon://steering/topology/<topologyFingerprint>`
- `gnosis/steering.trace.append` on `aeon://steering-trace/cohort/<cohortKey>`
- `gnosis/steering.relay.connect` on `aeon://steering-relay/room/<roomName>`
- `gnosis/steering.apply` on `aeon://steering/topology/<topologyFingerprint>`

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

## License

Gnosis is licensed under [MPL-2.0](./LICENSE).

Commercial use is allowed. If you distribute modified Gnosis source files, those
covered files must remain under MPL-2.0 and their source must be made available
to the recipients of that distribution. Larger works that merely use, compile,
or bundle Gnosis may be licensed separately.

Using Gnosis to write or compile your own programs does not by itself place
those programs under MPL-2.0.

Use of the `Gnosis` name, logos, mascot, and attribution language is governed
separately by [TRADEMARKS.md](./TRADEMARKS.md).
