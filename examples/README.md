# Gnosis Examples

- Parent README: [../README.md](../README.md)
- Child README: [benchmarks/README.md](./benchmarks/README.md)
- Child README: [transformer/README.md](./transformer/README.md)

This directory contains topology examples, executable `.test.gg` suites, and benchmark modules for the Gnosis runtime.

## Notable Subtrees

- [benchmarks](./benchmarks/README.md): parameter-matched fold-boundary benchmark modules used by the Chapter 17 companion artifacts, covering the cancellation-sensitive affine learner, the one-path negative controls, the fine-grained near-control zoom, the continuous regime sweep, the adversarial controls, the harder mini-MoE routing learner, the four-stage Aeon-framed transformer triangle, and the direct MoA-vs-regular rotated transformer shootout, including the new `StructuredMoA` primitive form for compact sparse-transformer graphs.
- [transformer](./transformer/README.md): attention, FFN, norm, residual, and transformer composition examples, including the Aeon-framed Rotation/Whip companion topologies with internal head/feedforward whip.
- `crdt/`: CRDT topologies and the corresponding `.test.gg` verification suite.
- `synth/`: audio/signal-processing topologies.

## Standalone Examples

- `edge-pipeline-parallelism.gg`: models Aeon-style layer sharding where hidden-state relays let a 13B request fold across multiple capacity-bounded workers.
- `audio-token-privacy.gg`: forks semantic, prosodic, and biometric audio token lanes, injects noise into identity-bearing RVQ layers, and folds only the anonymized signal into a public mesh.
- `crdt-split-brain-prevention.gg`: models geographically separated replicas, nonce replay guards, and deterministic CRDT observation collapsing to one canonical state.
- `webgpu-graph-flattening.gg`: models the flattening pass that packs pointer-chasing graph state into a contiguous `Float32Array` before racing a WebGPU path against the scattered CPU walk.
- `impossible-systems.test.gg`: verification suite that exercises the four standalone examples as bounded safe topologies.
