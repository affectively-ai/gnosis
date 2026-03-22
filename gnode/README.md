# gnode

Parent: [Gnosis README](../README.md)

Child: [src](./src/README.md)
Child: [benchmarks](./benchmarks/README.md)

`gnode` is a Rust-fronted CLI for running TypeScript through Gnosis. It is meant to feel closer to `tsx` or `ts-node` than to an offline code generator: point it at a `.ts` file, compile the supported orchestration subset into `.gg`, expose the resulting laminar schedule, and execute the compiled topology through the Gnosis runtime.

It also now surfaces the generic cross-domain pipeline. That means `gnode` is no longer only "TS in, code out"; it can drive explicit `code`, `natural`, and `gg` artifacts through the same adapter registry and preservation checks.

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
gnode cross-compile ./request.txt --domain-from natural --lang-from en --domain-to gg --lang-to gg --preserve meaning,tone,affect
pnpm --dir open-source/gnosis run gnode:prewarm -- --json
```

## Scheduler Shape

The scheduler surface follows the same ideas used in [`@a0n/a0`](../../a0/README.md) and the Aeon scheduling notes:

- linear statements stay linear
- `Promise.all` becomes one laminar parallel wave
- joins become an explicit collapse wave
- `cannon` mode rotates branch placement across lanes instead of reusing lane zero forever

The default `gnode` bin now runs the bridge driver through Node's native TypeScript transform path instead of Bun. The Rust crate remains available as an alternate front-end, but the shared developer-facing command is `gnode`.

The hot path now has three precomputed layers:

- a bundled CommonJS bridge driver under [`dist/`](../dist/), with freshness tracked from the exact esbuild dependency manifest instead of recursively walking source trees on every invocation
- a daily daisy-chain artifact cache keyed by the source file plus bridge/compiler signature, storing the compiled GG topology, `.qdoc` head/artifact records, and a stable runtime bindings module so repeat `gnode` runs do not keep recompiling the same helix
- a Node compile-cache layer that can be primed ahead of time so `typescript`, `esbuild`, and the bundled driver do not pay the full parser/bootstrap tax on the first real request

`pnpm --dir open-source/gnosis run build` now ends by running `gnode:prewarm`, and you can call that script directly after installs or cache clears when you want the first user-facing request to land on the fast path immediately.

Set `GNODE_FORCE_TSX=1` to bypass the bundled driver when debugging the raw TypeScript bridge itself, and pass `--trace-timings` to print the wrapper, artifact-load, compile-cache, and execute-time breakdown for a single request.

The cache can also federate over the built-in relay surface when the env is present:

- `GNODE_CACHE_AEON_RELAY_URL` or `GNODE_CACHE_RELAY_URL` enables `QDoc`/DashRelay sync for cache records, with `DASH_RELAY_WS_URL` accepted as the shared repo fallback
- `GNODE_CACHE_AEON_RELAY_ROOM_PREFIX` or `GNODE_CACHE_RELAY_ROOM_PREFIX` controls the room namespace; the default is `gnode-cache`
- API key, client id, protocol, mode, product, and timeout follow the same `GNODE_CACHE_AEON_RELAY_*` / `GNODE_CACHE_RELAY_*` naming pattern
- `GNODE_COMPILE_CACHE_DIR` overrides where the Node compile cache is stored, and `GNODE_DISABLE_COMPILE_CACHE=1` disables the priming layer when you need to debug the true uncached path

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

- `gnode` with an empty compile cache: `1251.69ms` inside the runtime (`959.43ms` compile, `226.42ms` runtime-module emit, `4.36ms` execute), `1420.15ms` wrapper total
- `gnode` on the next fresh-process miss with the Node compile cache already primed: `414.47ms` inside the runtime, `458.24ms` wrapper total
- `gnode` after `pnpm --dir open-source/gnosis run gnode:prewarm -- --json`: `286.07ms` inside the runtime on the first real request, `303.01ms` wrapper total
- `gnode` warm hit on the same file: `9.96ms` inside the runtime, `45.56ms` wrapper total
- Bun direct on the same toy app via `bun -e "const mod = await import(...)"`: `490ms` cold, `120ms` warm
- Deno was not installed on this machine for the latest local smoke; the Cloud Build/runtime shootout still reports it when available

So the current state is:

- the true first-ever uncached process is still dominated by compiler bootstrap, which is why the shipped `gnode:prewarm` path exists
- once the compile cache is primed, `gnode` now beats the direct Bun smoke on both the first real request and the warm-hit path for this toy app
- the remaining cold-path tax is mostly in artifact synthesis, not the graph executor
