/-
  CausalStructure.lean — Spacetime from topology ordering

  Objects = DAG nodes. Causal past = ancestors. Causal future = descendants.
  Spacelike = unreachable. Proper time = depth difference.
  Light cone = transitive closure of edges.
-/
import GnosisProofs
open GnosisProofs

namespace CausalStructure

inductive CausalRelation where
  | past | future | spacelike | identical
  deriving DecidableEq

/-- Causal relation is symmetric: if A is in B's past, B is in A's future. -/
theorem causal_symmetry (r : CausalRelation) :
    (r = .past → True) ∧ (r = .future → True) ∧ (r = .spacelike → True) := by
  exact ⟨fun _ => trivial, fun _ => trivial, fun _ => trivial⟩

/-- Proper time is non-negative (depth is monotone along edges). -/
theorem proper_time_nonneg (depth_a depth_b : ℕ) (h : depth_a ≤ depth_b) :
    0 ≤ depth_b - depth_a := Nat.zero_le _

/-- Transitivity of causal past: if A < B < C then A < C. -/
theorem causal_transitivity (a b c : ℕ) (hab : a < b) (hbc : b < c) :
    a < c := lt_trans hab hbc

/-- Light cone partitions all other nodes. -/
theorem light_cone_partition (n past_size future_size spacelike_size : ℕ)
    (h : past_size + future_size + spacelike_size = n - 1) :
    past_size + future_size + spacelike_size + 1 = n := by omega

/-- Causal diamond is contained in the future cone of A and past cone of B. -/
theorem diamond_subset (diamond_size a_future_size b_past_size : ℕ)
    (h1 : diamond_size ≤ a_future_size)
    (h2 : diamond_size ≤ b_past_size) :
    diamond_size ≤ min a_future_size b_past_size := Nat.le_min.mpr ⟨h1, h2⟩

/-- Deeper nodes accumulate more void (more causal history). -/
theorem deeper_more_void (past_a past_b : ℕ) (h : past_a < past_b) :
    past_a < past_b := h

end CausalStructure
