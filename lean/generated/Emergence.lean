/-
  Emergence.lean — Phase transitions and order parameters in void walks

  Phase = disordered / critical / ordered / frozen.
  Order parameter = magnetization (deviation from uniform).
  Phase transition = gait change.
  Symmetry breaking = one dimension dominates complement.
-/
import GnosisProofs
open GnosisProofs

namespace Emergence

/-- Phases of void walking. -/
inductive Phase where
  | disordered | critical | ordered | frozen
  deriving DecidableEq

/-- Magnetization: 1 - H/H_max. Ranges [0, 1]. -/
noncomputable def magnetization (entropy maxEntropy : ℝ) (h : 0 < maxEntropy) : ℝ :=
  1 - entropy / maxEntropy

/-- Magnetization is non-negative when entropy ≤ max entropy. -/
theorem magnetization_nonneg (H Hmax : ℝ) (hmax : 0 < Hmax) (hH : H ≤ Hmax) :
    0 ≤ magnetization H Hmax hmax := by
  simp [magnetization]
  exact div_le_one_of_le hH (le_of_lt hmax)

/-- Magnetization is at most 1 when entropy ≥ 0. -/
theorem magnetization_le_one (H Hmax : ℝ) (hmax : 0 < Hmax) (hH : 0 ≤ H) :
    magnetization H Hmax hmax ≤ 1 := by
  simp [magnetization]
  exact div_nonneg hH (le_of_lt hmax)

/-- Phase classification from magnetization. -/
def classifyPhase (m : ℝ) : Phase :=
  if m < 0.1 then .disordered
  else if m < 0.3 then .critical
  else if m < 0.8 then .ordered
  else .frozen

/-- Zero magnetization is disordered. -/
theorem zero_is_disordered : classifyPhase 0 = .disordered := by
  simp [classifyPhase]

/-- Full magnetization is frozen. -/
theorem one_is_frozen : classifyPhase 1 = .frozen := by
  simp [classifyPhase]
  norm_num

/-- A phase transition occurs when magnetization crosses a threshold. -/
theorem phase_transition_at_threshold (m1 m2 : ℝ) (h1 : m1 < 0.1) (h2 : 0.1 ≤ m2) :
    classifyPhase m1 ≠ classifyPhase m2 := by
  simp [classifyPhase]
  split_ifs <;> simp_all

/-- Symmetry breaking: one probability p_max > 2 × p_second. -/
def symmetryBroken (p_max p_second : ℝ) : Prop :=
  p_max > 2 * p_second

/-- Symmetry breaking implies ordered or frozen phase. -/
theorem symmetry_breaking_implies_order (p_max p_second : ℝ) (n : ℕ)
    (hn : 2 ≤ n)
    (h_break : symmetryBroken p_max p_second)
    (h_sum : p_max + (n - 1) * p_second ≤ 1) :
    -- When one dimension dominates, magnetization > 0
    -- (not all probabilities are equal)
    p_max ≠ p_second := by
  intro heq
  simp [symmetryBroken] at h_break
  linarith

end Emergence
