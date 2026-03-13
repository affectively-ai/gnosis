# Gnosis Language Bindings

Parent: [Gnosis README](../README.md)

This directory contains thin client bindings for invoking the `gnosis` CLI from many host languages.

The bindings are intentionally subprocess-based so they stay dependency-light and work the same way across runtimes.

## Command Contract

The shared command shape is documented in [binding-contract.json](./binding-contract.json).

All bindings expose helpers for:

- `lint <topology.gg> [--target <workers|node|bun|agnostic>] [--json]`
- `analyze <path> [--json]`
- `verify <topology.gg> [--tla-out <dir>]`
- `run <topology.gg> [--native]`
- `test <topology.test.gg>`

Each helper returns process status and output (`exit_code`, `stdout`, `stderr`) or the closest equivalent supported by that language runtime.

## Binding Files

- [Python](./gnosis_client.py)
- [Go](./gnosis_client.go)
- [Java](./GnosisClient.java)
- [C#](./GnosisClient.cs)
- [Rust](./gnosis_client.rs)
- [C](./gnosis_client.c) + [header](./gnosis_client.h)
- [C++](./gnosis_client.cpp)
- [PHP](./gnosis_client.php)
- [Ruby](./gnosis_client.rb)
- [Swift](./GnosisClient.swift)
- [Kotlin](./GnosisClient.kt)
- [Lua](./gnosis_client.lua)
- [Haskell](./GnosisClient.hs)
- [Erlang](./gnosis_client.erl)
