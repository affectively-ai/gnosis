# Gnosis Runtime

Parent: [Gnosis Source](../README.md)

Runtime execution surfaces for graph traversal and handler dispatch.

## Stability Metadata Surface

The native runtime snapshot path now carries more than a generic stability flag bundle.

- `countableQueue` marks the emitted `Nat` queue witness used for queue-support-kernel proofs.
- `continuousHarris` now means a bounded affine queue-family witness, not an arbitrary continuous-state certificate.
- The payload includes the observable kind, the emitted observable/Lyapunov expressions, the bounded drift gap, and the generated theorem names for `*_measurable_observable_drift` and `*_measurable_continuous_harris_certified`.

The honest boundary is the same as the compiler boundary: runtime metadata can surface the emitted queue-family measurable witness package, but it does not mean Betti has synthesized a measurable small set, minorization witness, or non-queue continuous kernel from syntax.

## Files

- [registry.ts](./registry.ts): Label-to-handler registration map.
- [engine.ts](./engine.ts): Topology execution engine for `FORK/RACE/FOLD/VENT` graphs with persistent execution-auth context, fail-closed UCAN edge authorization, case-aware routing from native `.gg` payloads, structured cancellation/timeout semantics for concurrent collapse edges, and programmatic `executeWithResult()` access to final payloads for internal GG-native subsystems.
- [structured-concurrency.ts](./structured-concurrency.ts): Internal branch-pool core for the Gnosis multiprocessing analogue, owning cancellation, race/fold resolution, and vent/shield outcome normalization for `FORK/RACE/FOLD` execution.
- [core-handlers.ts](./core-handlers.ts): Built-in `Result`, `Option`, `Variant`, `Destructure`, `Delay`, quantum, and differentiable handlers for native `.gg` data-shaping and execution, including path-aware record destructuring and explicit tuple unpacking.
- [native-runtime.ts](./native-runtime.ts): Native `.gg` frame runtime adapter over `gnosis_runtime` WASM, with deterministic fallback metrics when WASM is unavailable and compiler-supplied stability metadata attached to emitted frame payloads/snapshots, including the countable queue certificate, the emitted laminar-geometric theorem name, the emitted measurable-Harris theorem name, the emitted measurable-laminar endpoint theorem name, the emitted measurable-quantitative laminar theorem name, the emitted measurable-quantitative Harris theorem name, the emitted measurable witness quantitative Harris theorem name, the emitted measurable abstract Harris-recurrent theorem name, the emitted measurable finite-time geometric-ergodic theorem name, the emitted measurable Lévy-Prokhorov exact-geometric theorem name, the emitted measurable Lévy-Prokhorov geometric-decay theorem name, the emitted measurable abstract Lévy-Prokhorov geometric-ergodic theorem name, the emitted measurable finite-time Harris theorem name, and the derived `continuousHarris` observable/Lyapunov witness package when Betti proves the bounded affine queue-family proof surface.
- [renderer-compat.ts](./renderer-compat.ts): 3D renderer compatibility layer targeting `@a0n/aeon-3d` with local fallback.
- [engine.test.ts](./engine.test.ts): Runtime engine behavior tests.
- [structured-concurrency.test.ts](./structured-concurrency.test.ts): Core branch-pool tests for race winners, fold venting, and direct cancellation semantics.
- [native-runtime.test.ts](./native-runtime.test.ts): Native runtime edge-processing and metrics tests.
- [renderer-compat.test.ts](./renderer-compat.test.ts): Topology renderer compatibility tests.

## Native Value And Execution Primitives

The runtime now treats four value-shaping labels as built-ins:

- `Result`: emits `{ kind: "ok", value }` or `{ kind: "err", error }`
- `Option`: emits `{ kind: "some", value }` or `{ kind: "none" }`
- `Variant`: emits closed ADT-like values such as `{ adt: "ReviewState", case: "retry", value }`
- `Destructure`: extracts named fields from object payloads, including nested paths from `FOLD` results and explicit tuple items from array payloads

Outgoing edges can route on those tagged values with properties such as `case`, `match`, `when`, `kind`, `variant`, or `status`.

`Result` and `Option` can also derive their case from a payload field via `kindFrom`, and can narrow the wrapped payload with `valueFrom` or `errorFrom`.

`Variant` nodes declare their closed cases with `cases`, derive the active case with `case` or `caseFrom`, and participate in the same case-aware edge routing as `Result` and `Option`.

`Destructure` now supports:

- `fields`: object and nested-path bindings such as `left.score:leftScore`
- `items`: explicit tuple/array bindings such as `0.id:firstId,2.id:thirdId`
- automatic payload unwrapping from `Result`, `Option`, and `Variant` values before binding

Quantum value primitives are also built in:

- `Qubit`: creates a qubit state from `state` / `basis`
- `Hadamard`: rotates a qubit into or out of superposition
- `PauliX`: flips `|0>` and `|1>`
- `Measure`: collapses to `{ kind: "zero" | "one", value, probabilities }`

Differentiable value primitives are also built in:

- `Scalar`: creates or forwards a scalar value node
- `Parameter`: creates or forwards a differentiable scalar parameter
- `Gradient`: creates or forwards a scalar gradient
- `GradientStep`: applies gradient descent using `learningRate`, `parameterKey`, and `gradientKey`
- `MeanSquaredError`: computes a scalar loss from folded `prediction` and `target` branches

Structured concurrency also has a native runtime surface:

- `Delay`: a cancellable timer node for `.gg` topologies and tests
- `RACE` losers are cancelled automatically
- `RACE` / `FOLD` / `COLLAPSE` edges can declare `failure: "cancel" | "vent" | "shield"`
- `timeoutMs` and `deadlineMs` become part of branch lifetime semantics instead of ambient runtime behavior

```gg
(source:Source)-[:PROCESS]->(decision:Result { kind: 'ok' })
(decision)-[:PROCESS { case: 'ok' }]->(extract:Destructure { from: 'value', fields: 'user,score' })
(decision)-[:PROCESS { case: 'err' }]->(fallback)
```

```gg
(betti_verifier)-[:PROCESS]->(verify_result:Result { kindFrom: 'verified' })
(verify_result)-[:PROCESS { case: 'ok' }]->(emit_ready:Destructure { from: 'value', fields: 'stats,buleyNumber' })
```

```gg
(source:Source)-[:PROCESS]->(state:Variant { adt: 'ReviewState', cases: 'ready,retry,timeout', caseFrom: 'status' })
(state)-[:PROCESS { case: 'retry' }]->(retry_payload:Destructure { fields: 'attempts,message' })
```

```gg
(seed:Forker)-[:FORK]->(left:Worker | right:Worker)
(left | right)-[:FOLD]->(extract:Destructure { fields: 'left.score:leftScore,right.meta.label:rightLabel' })
```

```gg
(seed:Source)-[:PROCESS]->(extract:Destructure { items: '0.id:firstId,2.id:thirdId' })
```

```gg
(seed:Qubit { state: '0' })-[:PROCESS]->(superposed:Hadamard)-[:PROCESS]->(collapse:Measure { force: '1' })
(collapse)-[:PROCESS { case: 'one' }]->(accept)
(collapse)-[:PROCESS { case: 'zero' }]->(retry)
```

```gg
(seed:Parameter { value: '2.0' })-[:FORK]->(param:Parameter | grad:Gradient { value: '1.5' })
(param | grad)-[:FOLD]->(update:GradientStep { learningRate: '0.1', parameterKey: 'param', gradientKey: 'grad' })
```

```gg
(seed:Scalar { value: '3.0' })-[:FORK]->(prediction:Scalar | target:Scalar { value: '1.0' })
(prediction | target)-[:FOLD]->(loss:MeanSquaredError { predictionKey: 'prediction', targetKey: 'target' })
```

```gg
(seed:Scalar { value: '0' })-[:FORK]->(fast:Delay { ms: '1', emit: 'ready' } | slow:Delay { ms: '25', emit: 'late' })
(fast | slow)-[:FOLD { timeoutMs: '5', failure: 'shield' }]->(sink)
```

When a run enters enforced UCAN mode, the engine now retains `executionAuth` outside the payload and passes it through `GnosisHandlerContext`, so labels like `UCANRequire` continue to work even after intermediate handlers replace the payload entirely.

For internal GG-native orchestration that needs more than log text, the engine also exposes `executeWithResult()`, which returns both the execution log and the final payload so host shims can delegate real control flow to `.gg` topologies without scraping strings back into data.
