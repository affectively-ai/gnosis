# Chapter 17: The Geometry of Failure

This manuscript source closes the gap left by the earlier draft's monoidal aside. The point is no longer taxonomic hand-waving. We now fix a concrete execution category for the `fork` / `race` / `fold` fragment, state the laws that matter, and point to the exact Lean theorems that discharge them in [`GnosisProofs.lean`](../GnosisProofs.lean).

## A Scoped Execution Category

Let `G` be the category whose objects are typed interfaces and whose morphisms are total deterministic denotations `A -> B`.

- Sequential composition is ordinary function composition.
- The tensor product on objects is cartesian product: `A tensor B := A x B`.
- The tensor unit is the empty computation `I := PUnit`.
- Tensor on morphisms is pointwise product:

```text
(f tensor g) (a, c) = (f a, g c)
```

In [`GnosisProofs.lean`](../GnosisProofs.lean), this is the `GHom` / `gcomp` / `tensorHom` fragment. The laws needed for a monoidal execution model are proved as concrete equalities:

- `gcomp_assoc`
- `gcomp_gid_left`
- `gcomp_gid_right`
- `assoc_roundtrip_left`
- `assoc_roundtrip_right`
- `left_unitor_roundtrip`
- `left_unitor_inverse_roundtrip`
- `right_unitor_roundtrip`
- `right_unitor_inverse_roundtrip`
- `braid_involutive`
- `tensor_interchange`

These theorems give a symmetric monoidal semantics for typed, effect-free Gnosis denotations. The paper does not need a new coherence proof from scratch because this fragment lands in the standard symmetric monoidal category of types and functions. Mac Lane coherence therefore applies after strictification: once the associator and unitors are fixed, parenthesization is semantically irrelevant.

## Interpreting `fork`, `race`, and `fold`

Within this execution category, the primitives become ordinary morphisms.

### `fork`

`fork_A : A -> A x A` is the diagonal map:

```text
fork_A(a) = (a, a)
```

The theorem `fork_natural` proves that `fork` commutes with relabeling of values:

```text
fork >>> (f tensor f) = f >>> fork
```

So `fork` is not an operational side effect in this model; it is the canonical way to duplicate a value into the product tensor.

### `race`

For the deterministic priority-preserving fragment, `race_A` is modeled as left-biased choice on `Option A`:

```text
race_A(Some a, _) = Some a
race_A(None, b)   = b
```

This is the exact behavior proved in Lean by:

- `race_assoc`
- `race_unit_left`
- `race_unit_right`
- `race_tree_coherence`

The important point is narrow but strong: reassociating a fixed priority order does not change the result. The construction is deliberately not commutative, because priority order is semantic information. If a future routing layer wants commutative competition, it must supply a different algebra than left-biased choice.

### `fold`

`fold_M : M x M -> M` is interpreted as multiplication in a target algebra `M`:

```text
fold_M(x, y) = x * y
```

The laws now become standard algebraic obligations:

- `fold_assoc` when `M` is a semigroup
- `fold_unit_left` and `fold_unit_right` when `M` is a monoid
- `fold_comm` when `M` is a commutative monoid
- `fold_tree_coherence`
- `c3_deterministic_fold`
- `c3_deterministic_fold_commutative`

This isolates the exact condition behind C3. Deterministic fold is not magic and it is not folklore. It is the statement that the target fold algebra is associative; if order-insensitivity is also desired, the algebra must be commutative as well.

## The Strengthened C3 Statement

The earlier draft claimed, without proof, that monoidal coherence should imply a stronger form of deterministic fold. The precise statement is:

> For any fixed leaf order, any two parenthesizations of a `fork` / `race` / `fold` expression have the same denotation whenever each `race` node uses the same ordered choice algebra and each `fold` node uses the same associative fold algebra.

The Lean witnesses are `race_tree_coherence` and `fold_tree_coherence`. For `fold`, commutativity upgrades this from bracketing invariance to permutation invariance. That is the exact categorical strengthening of C3 that the manuscript wanted but did not previously earn.

## What This Buys

The value is no longer just taxonomic. The `fork` / `race` / `fold` fragment now has a concrete symmetric monoidal semantics with an explicit unit object, explicit associator and unitor isomorphisms, and a proved interchange law. That is enough to import standard coherence reasoning instead of merely gesturing at it. In practical terms:

- Different bracketings of the same `fold` tree are definitionally harmless once the fold algebra is associative.
- Different bracketings of the same ordered `race` tree are harmless once the priority discipline is fixed.
- The manuscript can cite actual mechanized theorems instead of an unproved categorical analogy.

This is still a scoped result. It does not claim that every Gnosis topology is already captured by the pure `Type` semantics, and it does not yet mechanize the full Harris-recurrence story. But the thermodynamic `vent` / drift / spectral layer is no longer treated as a separate after-the-fact note: the shared Lean workspace now exposes a `CertifiedKernel` object that carries the transition matrix together with drift data, the finite-state spectral side is proved in the concrete kernel families Betti emits today, and finite return to the compiler’s designated small set is likewise mechanized by a support-path recurrence theorem. Beyond that finite layer, the proof workspace now also contains a countable-state drift-to-small-set theorem and a queue-specific reneging bridge: if a countable kernel carries a Nat-valued potential that decreases along a positive-probability support edge until a designated small set is reached, then the chain returns to that small set in finitely many support steps; and if a queue family has eventual positive margin `mu + alpha(n) - lam > 0`, Betti now records a structured `countableQueue` witness in the compiler output, emits a concrete `queueKernel` skeleton over `Nat`-indexed queue states, collapses the certified laminar band to a representative atom, proves a common-atom small-set minorization theorem, proves a uniform predecessor minorization theorem outside the small set, derives recurrence from those witnesses, proves that every queue state reaches the shared laminar atom through positive-support steps, packages that irreducibility-style fact into an explicit atom-based ψ-irreducibility theorem and bundled Harris prelude for the emitted proof kernel, discharges a recurrent-class theorem on top of that prelude, proves a quantitative atom-hitting bound / geometric envelope, and then packages those quantitative results into a single `CountableLaminarGeometricStabilityAtAtom` endpoint for the emitted queue family. The proof surface now also includes an honest measurable-kernel Harris prelude on top of Mathlib’s `ProbabilityTheory.Kernel`: measurable-state small-set minorization, `Kernel.IsIrreducible`, and `Kernel.Invariant` are bundled directly at that level, reversibility can be used to discharge the invariant-measure component, positive reference mass of the small set yields an actual finite-step positive-probability hit theorem for that measurable set, irreducibility is repackaged as accessibility of every measurable set with positive reference mass, atom accessibility implies irreducibility with respect to the Dirac measure at the laminar atom, and that atom-based measurable certification now yields two operational corollaries rather than just a bundled hypothesis surface: the designated measurable small set is finitely reachable from every state, and every measurable set containing the laminar atom is likewise finitely reachable from every state. Acyclic kernels are discharged by nilpotence, row-contractive kernels are discharged by a mechanized `ρ(P) ≤ ‖P‖∞ < 1` bound, finite-state recurrence is discharged by a decreasing distance-to-small-set witness, and countable-state recurrence is discharged by the same idea over an arbitrary countable state space. What remains separate is the broader analytic layer around full Harris recurrence: a theorem from those measurable hypotheses to Harris recurrence or geometric ergodicity, and the symbolic or infinite-state compiler bridge into those hypotheses. What this section provides is the missing algebraic floor for the deterministic `fork` / `race` / `fold` core and the bridge that lets the thermodynamic auditor live inside the same proof surface.
