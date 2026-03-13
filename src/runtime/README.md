# Gnosis Runtime

Parent: [Gnosis Source](../README.md)

Runtime execution surfaces for graph traversal and handler dispatch.

## Files

- [registry.ts](./registry.ts): Label-to-handler registration map.
- [engine.ts](./engine.ts): Topology execution engine for `FORK/RACE/FOLD/VENT` graphs with optional UCAN edge authorization and case-aware routing from native `.gg` payloads.
- [core-handlers.ts](./core-handlers.ts): Built-in `Result`, `Option`, and `Destructure` handlers for native `.gg` data-shaping and branch selection.
- [native-runtime.ts](./native-runtime.ts): Native `.gg` frame runtime adapter over `gnosis_runtime` WASM, with deterministic fallback metrics when WASM is unavailable.
- [renderer-compat.ts](./renderer-compat.ts): 3D renderer compatibility layer targeting `@affectively/aeon-3d` with local fallback.
- [engine.test.ts](./engine.test.ts): Runtime engine behavior tests.
- [native-runtime.test.ts](./native-runtime.test.ts): Native runtime edge-processing and metrics tests.
- [renderer-compat.test.ts](./renderer-compat.test.ts): Topology renderer compatibility tests.

## Native Value Primitives

The runtime now treats three value-shaping labels as built-ins:

- `Result`: emits `{ kind: "ok", value }` or `{ kind: "err", error }`
- `Option`: emits `{ kind: "some", value }` or `{ kind: "none" }`
- `Destructure`: extracts named fields from object payloads, including `Result.value` and `Option.value`

Outgoing edges can route on those tagged values with properties such as `case`, `match`, `when`, `kind`, `variant`, or `status`.

`Result` and `Option` can also derive their case from a payload field via `kindFrom`, and can narrow the wrapped payload with `valueFrom` or `errorFrom`.

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
