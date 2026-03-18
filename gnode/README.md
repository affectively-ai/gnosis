# gnode

Parent: [Gnosis README](../README.md)

Child: [src](./src/README.md)
Child: [benchmarks](./benchmarks/README.md)

`gnode` is a Rust-fronted CLI for running TypeScript through Gnosis. It is meant to feel closer to `tsx` or `ts-node` than to an offline code generator: point it at a `.ts` file, compile the supported orchestration subset into `.gg`, expose the resulting laminar schedule, and execute the compiled topology through the Gnosis runtime.

The current bridge is intentionally honest about scope. It accepts a topology-friendly TypeScript subset:

- top-level function entrypoints
- explicit variable assignments
- identifier call expressions
- `await`
- `Promise.all([...])` fan-out / join regions
- explicit `return`

Broader TypeScript control flow still fails closed with a compile error instead of pretending we have a whole-language compiler.

## Commands

```bash
gnode run ./app.ts
gnode compile ./app.ts
gnode schedule ./app.ts --lanes 4 --strategy cannon
```

## Scheduler Shape

The scheduler surface follows the same ideas used in [`@a0n/a0`](../../a0/README.md) and the Aeon scheduling notes:

- linear statements stay linear
- `Promise.all` becomes one laminar parallel wave
- joins become an explicit collapse wave
- `cannon` mode rotates branch placement across lanes instead of reusing lane zero forever

The default `gnode` bin now runs the bridge driver through Node's native TypeScript transform path instead of Bun. The Rust crate remains available as an alternate front-end, but the shared developer-facing command is `gnode`.

The hot path now has two precomputed layers:

- a bundled CommonJS bridge driver under [`dist/`](../dist/), with freshness tracked from the exact esbuild dependency manifest instead of recursively walking source trees on every invocation
- a daily daisy-chain artifact cache keyed by the source file plus bridge/compiler signature, storing the compiled GG topology and a stable runtime bindings module so repeat `gnode` runs do not keep recompiling the same helix

Set `GNODE_FORCE_TSX=1` to bypass the bundled driver when debugging the raw TypeScript bridge itself, and pass `--trace-timings` to print the artifact-load versus execute-time breakdown for a single request.

The intended next host is [`x-gnosis`](../../x-gnosis/README.md): `gnode` remains the developer-facing binary, while `x-gnosis` and [`gnosis-uring`](../../x-gnosis/gnosis-uring/README.md) become the native place to run the compiled GG process graph with the same telemetry and scheduler semantics.

## Runtime Shootout

```bash
# Small local smoke
pnpm --dir open-source/gnosis run bench:gnode-runtimes -- --iterations=2

# Heavier run on Cloud Build
gcloud builds submit --config=open-source/gnosis/gnode/cloudbuild-runtime-shootout.yaml --ignore-file=open-source/gnosis/gnode/cloudbuild-benchmark.gcloudignore .
```

That shootout measures the same checked-in toy TypeScript entrypoints across `gnode`, Bun, `tsx`, `ts-node`, plain Node on ahead-of-time compiled JavaScript, and Deno when Deno is installed. The benchmark driver itself remains a plain Node/MJS harness because it owns multi-runtime process orchestration; the measured TypeScript execution legs are the dogfood target. Missing runtimes are reported explicitly instead of being silently skipped.

### Single-Request Snapshot

On March 18, 2026, a one-request local smoke with the same toy `app.ts` (`internalStep(input) => input + 2`) produced this shape on this machine:

- `gnode` cold miss via `node open-source/gnosis/bin/gnode.js ... --trace-timings`: `294.37ms` inside the runtime (`284.62ms` artifact build/load, `9.11ms` execute)
- `gnode` warm hit on the same file: `25.01ms` inside the runtime (`5.33ms` artifact lookup, `19.11ms` execute)
- Bun direct via `bun run.ts`: `82.05ms` cold, `57.96ms` warm
- Deno in this environment was only available via `pnpm dlx deno run`, which measured `5681.05ms` cold and `2225.87ms` warm; that path includes `pnpm dlx` wrapper overhead and should not be treated as a clean direct-Deno baseline

So the current state is:

- Bun is still faster than `gnode` on the cold path
- `gnode` warm-hit execution is now materially faster than the direct Bun smoke on the same toy app because the GG artifact and runtime binding module are precomputed
- the remaining cold-path tax is in artifact synthesis, not the graph executor
