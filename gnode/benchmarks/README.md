# gnode Benchmarks

Parent: [gnode README](../README.md)

## Scope

Toy workload and runtime-comparison surfaces for the shared `gnode` TypeScript-to-GG bridge.

## Files

- `runtime-shootout.mjs` benchmarks the same small TS entrypoints across `gnode`, Bun, `tsx`, `ts-node`, plain Node on ahead-of-time compiled JavaScript, and Deno when it is installed. The harness stays in Node/MJS because it coordinates those runtimes rather than being one of the measured TS entrypoints itself.
- `invoke-app.mjs` is the generic launcher used by the non-`gnode` runtimes.
- `echo.ts` is the smallest string-returning entrypoint.
- `fib.ts` is the Fibonacci toy workload.
- `fanout.ts` is the `Promise.all` fork/join toy workload that mirrors the execution shape `gnode` lowers into GG.
