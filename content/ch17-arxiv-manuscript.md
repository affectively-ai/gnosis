# Chapter 17: The Geometry of Failure

This manuscript source closes the gap left by the earlier draft's monoidal aside. The point is no longer taxonomic hand-waving. We now fix a concrete execution category for the pure `fork` / `race` / `fold` fragment, state the laws that matter, and point to the exact Lean theorems that discharge them in [`GnosisProofs.lean`](../GnosisProofs.lean). Just as importantly, we locate that pure fragment inside the larger `fork` / `race` / `fold` / `vent` execution surface actually used by the compiler and companion proofs. The algebraic result is therefore not "everything is already pure." It is that pure `fork` / `race` / `fold` is the algebraic floor, while `INTERFERE`, `VENT`, repair debt, and stochastic stability live above it in the same formal stack.

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

## FRF Is Only The Algebraic Floor

The earlier draft blurred two different claims:

- the algebraic claim that `fork`, `race`, and `fold` have a coherent denotation under fixed choice and fold algebras,
- and the operational claim that a system may safely collapse a live multiplicity to a single answer.

This chapter now separates them.

`fork` creates multiplicity. `race` chooses a provisional winner under a fixed priority discipline. `fold` specifies how disagreement is collapsed. None of those facts, by themselves, say that the winner is truthful, that discarded branches were semantically harmless, or that deterministic single-survivor collapse is free. Those are `INTERFERE` / `VENT` / repair-debt questions, not mere coherence questions.

The right reading is therefore:

- `race` yields a selected branch, not a correctness certificate;
- `fold` yields a collapse law, not a guarantee that collapse preserves the distinctions one cares about;
- `vent` records paid loss or discarded branch mass when multiplicity is not retained;
- `interfere` marks the point where one branch changes the meaning, viability, or observability of another.

## Failure Is Not Just Bad Bracketing

Once the pure algebraic floor is fixed, the actual failure geometry becomes visible.

First, not every fold is equally truthful. The companion boundary theorems in the shared [Formal Theorem Ledger](../../aeon/docs/ebooks/145-log-rolling-pipelined-prefill/companion-tests/formal/THEOREM_LEDGER.md) make this explicit: linear aggregation preserves the cancellation-sensitive families that nonlinear winner-selection and early-stop folds can miss. In other words, a race winner can be stably wrong if the collapse law counterfeits certainty rather than recombining evidence exactly.

Second, deterministic collapse is not free. The same companion surface proves a no-free-collapse boundary: from a nontrivial fork, a deterministic single survivor requires either vented loss or repair debt. That is the formal content behind the paper's geometry-of-failure claim. The topology is not merely about what executes; it is also about what gets paid when multiplicity is forcibly removed.

Third, single-winner collapse is not always the legal endpoint. The failure-action frontier includes `keep-multiplicity` as a first-class outcome alongside `pay-vent` and `pay-repair`. The theory therefore does not identify "resolved" with "collapsed to one survivor." Sometimes the truthful endpoint is preserved ambiguity rather than counterfeit certainty.

On the measurable queue side, the companion proof surface now also packages the emitted deterministic laminar kernel into standard metric claims: after the certified bound, the Lévy-Prokhorov distance between the runtime law and the laminar reference law is exactly zero, the emitted kernel therefore satisfies a post-burn-in geometric decay inequality in the same metric, and that decay is finally re-packaged as an abstract geometric-ergodicity witness. That is still specialized to the compiler-emitted queue kernel, not an abstract arbitrary-kernel ergodicity theorem from drift and minorization alone, but it closes the metric endpoint honestly for the executable queue family and clarifies the exact theorem shape that future abstract work should target.

## Regime Boundaries Matter

The formal surface is not limited to existence witnesses. The companion proofs already expose phase boundaries and controller thresholds:

- warm-up is worth paying for only past an explicit burden threshold;
- dynamic cooling can return a turbulent system to a laminar regime under explicit drift and fairness assumptions;
- controller redlines separate expand, constrain, and shed-load regions;
- crossover theorems mark where more sharding or more warm-up stops helping.

So the semantic space is not just "good topology" versus "bad topology." It has measurable regime changes.

## What This Buys

The value is no longer just taxonomic. The `fork` / `race` / `fold` fragment now has a concrete symmetric monoidal semantics with an explicit unit object, explicit associator and unitor isomorphisms, and a proved interchange law. That is enough to import standard coherence reasoning instead of merely gesturing at it. In practical terms:

- Different bracketings of the same `fold` tree are definitionally harmless once the fold algebra is associative.
- Different bracketings of the same ordered `race` tree are harmless once the priority discipline is fixed.
- The manuscript can cite actual mechanized theorems instead of an unproved categorical analogy.
- The paper can cleanly distinguish a provisional race winner from a truthful collapse.
- The same vocabulary can talk about preserved multiplicity, paid collapse, and regime thresholds instead of collapsing all of that into one informal failure bucket.

## The Proof Surface Is Layered

The current formal story is easiest to understand as a stack.

1. `fork` / `race` / `fold` coherence in [`GnosisProofs.lean`](../GnosisProofs.lean) gives the algebraic floor.
2. Fold-boundary and failure-boundary theorems in the companion [Formal Theorem Ledger](../../aeon/docs/ebooks/145-log-rolling-pipelined-prefill/companion-tests/formal/THEOREM_LEDGER.md) explain when collapse preserves truth, when it counterfeits certainty, and when it necessarily pays vent or debt.
3. Spectral, recurrence, and geometric-stability theorems lift emitted Gnosis kernels beyond pure denotational semantics into finite and countable dynamics.
4. Queueing, adaptive-routing, and measurable-kernel results extend that same surface toward stochastic and state-dependent settings.
5. Runtime witness export bridges the theorem layer back into executable artifacts, so boundary claims can be tested as concrete witnesses rather than left as Lean-only prose.

## Runtime Witness Bridge

The formal story is no longer Lean-only. The shared workspace exports concrete witness catalogs for the boundary theorems, and the executable test surface consumes those witnesses directly. That matters methodologically: the paper's impossibility and boundary claims are not only machine-checked as abstract theorems, but also reified as concrete runtime artifacts that can be inspected and exercised.

## Current Boundary

This is still a scoped result. It does not claim that every Gnosis topology is already captured by the pure `Type` semantics, and it does not yet close the full measurable-state Harris story in complete generality.

What is already inside the proof surface is substantial:

- the pure algebraic `fork` / `race` / `fold` floor;
- finite-state spectral certification for emitted kernels;
- countable-state drift-to-small-set recurrence;
- queue-shaped bridges from compiler witnesses to countable and measurable kernels;
- quantitative atom-hitting and geometric-envelope endpoints for the emitted queue families.

The shared Lean workspace exposes a `CertifiedKernel` object carrying the transition matrix together with drift data, proves finite-state spectral stability for the concrete kernel families Betti emits today, proves finite return to the compiler's designated small set by support-path recurrence, and pushes that same pattern outward through countable-state drift witnesses and queue-shaped measurable Harris scaffolding.

What remains genuinely open is the final lift from these emitted finite/countable/queue-shaped kernels to the full class of measurable kernels satisfying the abstract Harris hypotheses. The broader companion package also still distinguishes between constructive theorems and assumption-parameterized schemas. That boundary should be stated explicitly rather than blurred.

So the corrected claim of this chapter is narrow and strong: it provides the missing algebraic floor for deterministic `fork` / `race` / `fold`, shows how that floor connects to interference, vent, paid collapse, and dynamic stability in the shared proof stack, and states honestly where the general measurable-state frontier still begins.
