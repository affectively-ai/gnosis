# Crypto Examples

- Parent README: [../README.md](../README.md)

This directory contains bounded crypto-analysis topologies for the `aeon-logic`
cover-space audit surface.

Families included:

- `ucan-zk-*`: UCAN issuance/verification/delegation plus ZK envelope gating.
- `aead-kem-*`: KDF, session-key, nonce, encrypt/decrypt, and envelope flows.
- `password-digest-*`: offline-risk password digest surfaces for slow/salted, fast/unsalted, and toy reduced-strength comparisons.
- `recovery-trust-*`: socio-technical recovery, approval, audit, trust-freshness, and helpdesk-boundary topologies.
- `signing-custodial-*`: authorization plus custodial signing boundaries.

Each family ships three variants:

- `*-secure.gg`: intended to satisfy the default security claims.
- `*-weak.gg`: intentionally weak but still structurally valid.
- `*-toy.gg`: reduced-strength calibration variant that may produce bounded
  `toy_break` findings.

The corresponding [crypto-cover-space.test.gg](./crypto-cover-space.test.gg)
suite verifies the corpus as GG modules.
