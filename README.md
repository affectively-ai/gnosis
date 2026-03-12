# Gnosis 

> **The language is the topology. The AST is the graph.**

Gnosis is a quantum programming language and compiler built on top of the **Wallington Rotation** and topological pipeline primitives (`FORK`, `RACE`, `FOLD`, `VENT`). It dispenses with traditional imperative control flow (`if`/`else`, `for`, `try`/`catch`) in favor of pure computational topology.

In Gnosis, your source code is literally a graph. You define nodes (data and compute) and edges (topological transitions). 

Under the hood, Gnosis uses a zero-overhead, vectorized WebAssembly (WASM) runtime built in Rust to instantly evaluate superposition states ($\beta_1 > 0$) using Aeon Flow's 10-byte binary wire format.

## The Core Primitives

Gnosis operates on the covering space of execution paths. The state of the system is tracked by its first Betti number ($\beta_1$).

*   **`FORK`**: Branch execution into multiple parallel paths. Increases $\beta_1$. (Creates a superposition).
*   **`RACE`**: Selects the fastest path that meets a constraint. Maintains homotopy equivalence. Collapses $\beta_1 \to 0$.
*   **`FOLD` / `COLLAPSE`**: Deterministically merges independent paths back into a scalar state. Collapses $\beta_1 \to 0$.
*   **`VENT` / `TUNNEL`**: Dissipates waste heat by shedding unproductive paths. Decreases $\beta_1$.

## Gnosis Graph Language (GGL)

Gnosis code looks like Cypher. There are no functions, only subgraphs.

```cypher
// 1. Defining Compute Nodes
(raw_codec: Codec { type: 'raw' })
(brotli_codec: Codec { type: 'brotli' })

// 2. The Topology
(input) 
  -[:FORK]-> (raw_codec | brotli_codec)
  -[:RACE]-> (winner)
```

## The "Betty" Compiler

Gnosis includes a built-in compiler affectionately named **Betty** (after the Betti number). 
Betty statically analyzes your GGL topology to ensure that:
1. $\beta_1$ is properly managed (no unbounded superpositions).
2. All paths eventually FOLD, RACE, or VENT.

Betty natively translates the AST into `FlowFrame` binary buffers and streams them through the Rust WASM execution engine.

### Try the REPL

```bash
bun run start
```

Type your topological graph into the REPL, watch Betty calculate the Betti numbers, and then type `EXECUTE` to run the topology through the bare-metal WASM runtime.

## The Roadmap to Self-Hosting

The ultimate goal of Gnosis is to be closed under self-application. Because a compiler is simply a pipeline (`(source) -[:FORK]-> (lexers) -[:FOLD]-> (AST)`), the TypeScript-based **Betty** compiler will eventually be rewritten entirely in pure GGL. 

When the compiler is natively written in Gnosis, her name will change to **Betti** (the true topological spelling). 

We will keep both **Betty** (TypeScript) and **Betti** (Gnosis) in the repository forever for **bootstrapping reasons**. You use Betty to compile Betti, who then compiles the rest of your quantum topologies.
