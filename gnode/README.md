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

The intended next host is [`x-gnosis`](../../x-gnosis/README.md): `gnode` remains the developer-facing binary, while `x-gnosis` and [`gnosis-uring`](../../x-gnosis/gnosis-uring/README.md) become the native place to run the compiled GG process graph with the same telemetry and scheduler semantics.

## Runtime Shootout

```bash
# Small local smoke
node ./gnode/benchmarks/runtime-shootout.mjs --iterations=2

# Heavier run on Cloud Build
gcloud builds submit --config=open-source/gnosis/gnode/cloudbuild-runtime-shootout.yaml --ignore-file=open-source/gnosis/gnode/cloudbuild-benchmark.gcloudignore .
```

That shootout measures the same checked-in toy TypeScript entrypoints across `gnode`, Bun, `tsx`, `ts-node`, plain Node on ahead-of-time compiled JavaScript, and Deno when Deno is installed. Missing runtimes are reported explicitly instead of being silently skipped.
