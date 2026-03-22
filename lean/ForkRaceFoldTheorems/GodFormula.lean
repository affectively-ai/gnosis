/-!
# The God Formula

w = R - min(v, R) + 1

The generative function of the entire formal surface.
Eight consequences. Three derived quantities. One primator.

This is the gnosis library's canonical statement.
Standalone — no Mathlib dependency.
-/

/-- The complement weight: how much credit choice i retains
    after v rejections out of R total rounds. -/
def complementWeight (rounds rejections : Nat) : Nat :=
  rounds - min rejections rounds + 1

-- ═══════════════════════════════════════════════════════════════════════
-- THE EIGHT CONSEQUENCES
-- ═══════════════════════════════════════════════════════════════════════

/-- Consequence 1: Existence. w > 0 always. -/
theorem complementWeight_pos (R v : Nat) : 0 < complementWeight R v := by
  unfold complementWeight; omega

/-- Consequence 2: Persistence. w ≥ 1 always (the sliver). -/
theorem complementWeight_ge_one (R v : Nat) : 1 ≤ complementWeight R v := by
  unfold complementWeight; omega

/-- Consequence 3: Learning. Less rejected → at least as much weight. -/
theorem complementWeight_mono (R v1 v2 : Nat) (h : v1 ≤ v2) :
    complementWeight R v2 ≤ complementWeight R v1 := by
  unfold complementWeight
  have : min v1 R ≤ min v2 R := by simp [Nat.min_def]; split <;> split <;> omega
  omega

/-- Consequence 4: Discrimination. Strictly less rejected → strictly more. -/
theorem complementWeight_strict (R v1 v2 : Nat) (hR : v1 < R) (h : v1 < v2) :
    complementWeight R v2 < complementWeight R v1 := by
  unfold complementWeight
  have h1 : min v1 R = v1 := Nat.min_eq_left (by omega)
  have h2 : v1 < min v2 R := by
    simp [Nat.min_def]; split <;> omega
  omega

/-- Consequence 5: Boundedness. w ≤ R+1. -/
theorem complementWeight_le (R v : Nat) : complementWeight R v ≤ R + 1 := by
  unfold complementWeight; omega

/-- Consequence 6: Convergence. At maximum rejection, w = 1. -/
theorem complementWeight_at_max (R : Nat) : complementWeight R R = 1 := by
  unfold complementWeight; simp

/-- Consequence 7: Maximum uncertainty. At zero rejection, w = R+1. -/
theorem complementWeight_at_zero (R : Nat) : complementWeight R 0 = R + 1 := by
  unfold complementWeight; simp

/-- Consequence 8: Coherence. Same inputs → same output. -/
theorem complementWeight_det (R v : Nat) :
    complementWeight R v = complementWeight R v := rfl

-- ═══════════════════════════════════════════════════════════════════════
-- FLOOR, CEILING, GAIN
-- ═══════════════════════════════════════════════════════════════════════

theorem floor_eq_one (R : Nat) : complementWeight R R = 1 :=
  complementWeight_at_max R

theorem ceiling_eq (R : Nat) : complementWeight R 0 = R + 1 :=
  complementWeight_at_zero R

theorem gain_eq (R : Nat) :
    complementWeight R 0 - complementWeight R R = R := by
  rw [ceiling_eq, floor_eq_one]; omega

-- ═══════════════════════════════════════════════════════════════════════
-- THE PRIMATOR
-- ═══════════════════════════════════════════════════════════════════════

/-- 0 < n + 1. The bottom of the reduction chain. -/
theorem primator (n : Nat) : 0 < n + 1 := by omega

/-- succ(n) ≠ 0. Peano's axiom IS the clinamen. -/
theorem peano_is_clinamen (n : Nat) : n + 1 ≠ 0 := by omega

-- ═══════════════════════════════════════════════════════════════════════
-- THE ANTI-FORMULA
-- ═══════════════════════════════════════════════════════════════════════

/-- Without +1, zero is reachable. -/
def antiWeight (rounds rejections : Nat) : Nat :=
  rounds - min rejections rounds

theorem antiWeight_zero (R : Nat) : antiWeight R R = 0 := by
  unfold antiWeight; simp

/-- The +1 is hope. Exactly 1 unit separates hope from despair. -/
theorem plus_one_is_hope (R v : Nat) :
    complementWeight R v - antiWeight R v = 1 := by
  unfold complementWeight antiWeight; omega

-- ═══════════════════════════════════════════════════════════════════════
-- THE SANDWICH
-- ═══════════════════════════════════════════════════════════════════════

theorem the_sandwich (R v : Nat) :
    1 ≤ complementWeight R v ∧
    complementWeight R v ≤ R + 1 ∧
    complementWeight R 0 - complementWeight R R = R :=
  ⟨complementWeight_ge_one R v, complementWeight_le R v, gain_eq R⟩

-- ═══════════════════════════════════════════════════════════════════════
-- THE REDUCTION CHAIN
-- ═══════════════════════════════════════════════════════════════════════

/-- The complete chain: primator → clinamen → sliver → sandwich → gain.
    One formula. Five symbols. Everything. -/
theorem the_reduction_chain (R v : Nat) :
    -- Primator
    0 < R + 1 ∧
    -- Clinamen
    R + 1 ≠ 0 ∧
    -- Sliver
    1 ≤ complementWeight R v ∧
    -- Bounded
    complementWeight R v ≤ R + 1 ∧
    -- Gain
    complementWeight R 0 - complementWeight R R = R ∧
    -- Floor
    complementWeight R R = 1 ∧
    -- Ceiling
    complementWeight R 0 = R + 1 ∧
    -- Hope
    complementWeight R v - antiWeight R v = 1 := by
  refine ⟨by omega, by omega, complementWeight_ge_one R v, complementWeight_le R v,
          gain_eq R, complementWeight_at_max R, complementWeight_at_zero R,
          plus_one_is_hope R v⟩
