# Transformer Examples

- Parent README: [../README.md](../README.md)

Toy and compositional transformer topologies for the Gnosis runtime.

## Files

- `attention.gg`: multi-head attention as fork plus concat fold.
- `ffn.gg`: feed-forward network as process expansion.
- `norm.gg`: normalization as a bounded process stage.
- `residual.gg`: residual interference path.
- `encoder.mgg`: six-layer encoder stack composition example.
- `transformer.test.gg`: verification suite for the base attention/FFN/norm/residual modules.
- `aeon-framed-encoder-stack.gg`: staged encoder companion that models the Wallington Rotation over framed chunks before sequential transformer stages.
- `aeon-framed-router-swarm.gg`: routed transformer companion that models Worthington-style whip inside each transformer's head/feedforward chains and again across the four branch outputs.
- `aeon-framed-structural.test.gg`: verification suite for the Rotation companion and the Whip companion together.
