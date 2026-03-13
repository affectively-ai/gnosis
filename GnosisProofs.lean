import Mathlib.Tactic
import Mathlib.Analysis.Matrix.Normed
import Mathlib.Analysis.Normed.Algebra.Spectrum
import Mathlib.LinearAlgebra.Matrix.Integer
import Mathlib.Probability.Kernel.Irreducible
import Mathlib.Probability.Kernel.Invariance

open scoped BigOperators ENNReal MeasureTheory ProbabilityTheory

namespace GnosisProofs

abbrev GHom (alpha beta : Type) := alpha -> beta

def gid : GHom alpha alpha := fun value => value

def gcomp (f : GHom alpha beta) (g : GHom beta gamma) : GHom alpha gamma :=
  fun value => g (f value)

def tensorHom (f : GHom alpha beta) (g : GHom gamma delta) :
    GHom (alpha × gamma) (beta × delta) :=
  fun
    | (left, right) => (f left, g right)

def tensorUnit : Type := PUnit

def assocLeftToRight : GHom ((alpha × beta) × gamma) (alpha × (beta × gamma)) :=
  fun
    | ((left, middle), right) => (left, (middle, right))

def assocRightToLeft : GHom (alpha × (beta × gamma)) ((alpha × beta) × gamma) :=
  fun
    | (left, (middle, right)) => ((left, middle), right)

def leftUnitor : GHom (tensorUnit × alpha) alpha :=
  fun
    | (_, value) => value

def leftUnitorInv : GHom alpha (tensorUnit × alpha) :=
  fun value => (PUnit.unit, value)

def rightUnitor : GHom (alpha × tensorUnit) alpha :=
  fun
    | (value, _) => value

def rightUnitorInv : GHom alpha (alpha × tensorUnit) :=
  fun value => (value, PUnit.unit)

def braid : GHom (alpha × beta) (beta × alpha) :=
  fun
    | (left, right) => (right, left)

def fork : GHom alpha (alpha × alpha) :=
  fun value => (value, value)

def race : GHom (Option alpha × Option alpha) (Option alpha) :=
  fun
    | (some value, _) => some value
    | (none, fallback) => fallback

def fold [Mul alpha] : GHom (alpha × alpha) alpha :=
  fun
    | (left, right) => left * right

def raceLeftTree : GHom ((Option alpha × Option alpha) × Option alpha) (Option alpha) :=
  fun
    | ((first, second), third) => race (race (first, second), third)

def raceRightTree : GHom (Option alpha × (Option alpha × Option alpha)) (Option alpha) :=
  fun
    | (first, (second, third)) => race (first, race (second, third))

def foldLeftTree [Mul alpha] : GHom ((alpha × alpha) × alpha) alpha :=
  fun
    | ((first, second), third) => fold (fold (first, second), third)

def foldRightTree [Mul alpha] : GHom (alpha × (alpha × alpha)) alpha :=
  fun
    | (first, (second, third)) => fold (first, fold (second, third))

theorem gcomp_assoc
    (f : GHom alpha beta)
    (g : GHom beta gamma)
    (h : GHom gamma delta) :
    gcomp (gcomp f g) h = gcomp f (gcomp g h) := by
  rfl

theorem gcomp_gid_left (f : GHom alpha beta) :
    gcomp gid f = f := by
  rfl

theorem gcomp_gid_right (f : GHom alpha beta) :
    gcomp f gid = f := by
  rfl

theorem assoc_roundtrip_left
    (alpha beta gamma : Type) :
    forall value : ((alpha × beta) × gamma),
      gcomp (@assocLeftToRight alpha beta gamma) (@assocRightToLeft alpha beta gamma) value = value := by
  intro value
  rcases value with ⟨⟨left, middle⟩, right⟩
  rfl

theorem assoc_roundtrip_right
    (alpha beta gamma : Type) :
    forall value : (alpha × (beta × gamma)),
      gcomp (@assocRightToLeft alpha beta gamma) (@assocLeftToRight alpha beta gamma) value = value := by
  intro value
  rcases value with ⟨left, middle, right⟩
  rfl

theorem left_unitor_roundtrip
    (alpha : Type) :
    forall value : alpha,
      gcomp (@leftUnitorInv alpha) (@leftUnitor alpha) value = value := by
  intro value
  rfl

theorem left_unitor_inverse_roundtrip
    (alpha : Type) :
    forall value : (tensorUnit × alpha),
      gcomp (@leftUnitor alpha) (@leftUnitorInv alpha) value = value := by
  intro value
  rcases value with ⟨unitValue, payload⟩
  cases unitValue
  rfl

theorem right_unitor_roundtrip
    (alpha : Type) :
    forall value : alpha,
      gcomp (@rightUnitorInv alpha) (@rightUnitor alpha) value = value := by
  intro value
  rfl

theorem right_unitor_inverse_roundtrip
    (alpha : Type) :
    forall value : (alpha × tensorUnit),
      gcomp (@rightUnitor alpha) (@rightUnitorInv alpha) value = value := by
  intro value
  rcases value with ⟨payload, unitValue⟩
  cases unitValue
  rfl

theorem braid_involutive
    (alpha beta : Type) :
    forall value : (alpha × beta),
      gcomp (@braid alpha beta) (@braid beta alpha) value = value := by
  intro value
  rcases value with ⟨left, right⟩
  rfl

theorem tensor_interchange
    (f : GHom alpha beta)
    (g : GHom gamma delta)
    (h : GHom beta epsilon)
    (k : GHom delta zeta) :
    gcomp (tensorHom f g) (tensorHom h k) =
      tensorHom (gcomp f h) (gcomp g k) := by
  rfl

theorem fork_natural (f : GHom alpha beta) :
    gcomp fork (tensorHom f f) = gcomp f fork := by
  rfl

theorem race_assoc
    (first second third : Option alpha) :
    race (race (first, second), third) =
      race (first, race (second, third)) := by
  cases first <;> rfl

theorem race_unit_left (value : Option alpha) :
    race (none, value) = value := by
  rfl

theorem race_unit_right (value : Option alpha) :
    race (value, none) = value := by
  cases value <;> rfl

theorem race_tree_coherence
    (alpha : Type) :
    forall value : ((Option alpha × Option alpha) × Option alpha),
      @raceLeftTree alpha value =
        gcomp (@assocLeftToRight (Option alpha) (Option alpha) (Option alpha)) (@raceRightTree alpha) value := by
  intro value
  rcases value with ⟨⟨first, second⟩, third⟩
  simp [raceLeftTree, raceRightTree, assocLeftToRight, gcomp, race_assoc]

theorem fold_assoc [Semigroup alpha]
    (first second third : alpha) :
    fold (fold (first, second), third) =
      fold (first, fold (second, third)) := by
  simpa [fold] using mul_assoc first second third

theorem fold_unit_left [Monoid alpha] (value : alpha) :
    fold (1, value) = value := by
  simp [fold]

theorem fold_unit_right [Monoid alpha] (value : alpha) :
    fold (value, 1) = value := by
  simp [fold]

theorem fold_comm [CommMonoid alpha]
    (left right : alpha) :
    fold (left, right) = fold (right, left) := by
  simpa [fold] using mul_comm left right

theorem fold_tree_coherence
    (alpha : Type)
    [Semigroup alpha] :
    forall value : ((alpha × alpha) × alpha),
      @foldLeftTree alpha _ value =
        gcomp (@assocLeftToRight alpha alpha alpha) (@foldRightTree alpha _) value := by
  intro value
  rcases value with ⟨⟨first, second⟩, third⟩
  simp [foldLeftTree, foldRightTree, assocLeftToRight, gcomp, fold_assoc]

theorem c3_deterministic_fold [Semigroup alpha]
    (first second third : alpha) :
    @foldLeftTree alpha _ ((first, second), third) =
      @foldRightTree alpha _ (first, (second, third)) := by
  simpa [foldLeftTree, foldRightTree] using fold_assoc first second third

theorem c3_deterministic_fold_commutative [CommMonoid alpha]
    (left right : alpha) :
    fold (left, right) = fold (right, left) := by
  simpa using fold_comm left right

structure DriftCertificate where
  gamma : Real
  arrivalRate : Real
  serviceRate : Real
  ventRate : Nat -> Real

def driftAt (certificate : DriftCertificate) (queueDepth : Nat) : Real :=
  certificate.arrivalRate - (certificate.serviceRate + certificate.ventRate queueDepth)

structure CertifiedKernel (nodeCount : Nat) where
  transition : Matrix (Fin nodeCount) (Fin nodeCount) Real
  topologyNodes : List String
  smallSetNodeIds : List String
  spectralCeiling : Real
  redline : Real
  geometricCeiling : Real
  drift : Option DriftCertificate

def rowMass (kernel : CertifiedKernel nodeCount) (source : Fin nodeCount) : Real :=
  ∑ target : Fin nodeCount, kernel.transition source target

def HasNonnegativeTransitions (kernel : CertifiedKernel nodeCount) : Prop :=
  forall source target : Fin nodeCount, 0 ≤ kernel.transition source target

def RowMassContractive
    (kernel : CertifiedKernel nodeCount)
    (rowBound : Fin nodeCount -> Real) : Prop :=
  (forall source : Fin nodeCount, rowMass kernel source = rowBound source) ∧
    (forall source : Fin nodeCount, rowBound source < 1)

def RankAcyclic
    (kernel : CertifiedKernel nodeCount)
    (rank : Fin nodeCount -> Nat) : Prop :=
  forall source target : Fin nodeCount,
    kernel.transition source target ≠ 0 -> rank source < rank target

inductive SupportPath (kernel : CertifiedKernel nodeCount) :
    Fin nodeCount -> Fin nodeCount -> Nat -> Prop
  | zero (state : Fin nodeCount) :
      SupportPath kernel state state 0
  | step {source via target : Fin nodeCount} {steps : Nat} :
      0 < kernel.transition source via ->
      SupportPath kernel via target steps ->
      SupportPath kernel source target steps.succ

def SmallSetDistanceWitness
    (kernel : CertifiedKernel nodeCount)
    (smallSet : Fin nodeCount -> Prop)
    (distance : Fin nodeCount -> Nat)
    (next : Fin nodeCount -> Fin nodeCount) : Prop :=
  (forall state : Fin nodeCount, smallSet state ↔ distance state = 0) ∧
    (forall state : Fin nodeCount, distance state <= nodeCount) ∧
    (forall state : Fin nodeCount,
      ¬ smallSet state ->
        0 < kernel.transition state (next state) ∧
          distance (next state) + 1 = distance state)

def FiniteSmallSetRecurrent
    (kernel : CertifiedKernel nodeCount)
    (smallSet : Fin nodeCount -> Prop) : Prop :=
  forall state : Fin nodeCount,
    ∃ steps target,
      steps <= nodeCount ∧
        SupportPath kernel state target steps ∧
        smallSet target

structure CountableCertifiedKernel (state : Type) [Countable state] where
  transition : state -> state -> Real
  smallSet : Set state

inductive CountableSupportPath
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state) :
    state -> state -> Nat -> Prop
  | zero (current : state) :
      CountableSupportPath kernel current current 0
  | step {source via target : state} {steps : Nat} :
      0 < kernel.transition source via ->
      CountableSupportPath kernel via target steps ->
      CountableSupportPath kernel source target steps.succ

inductive CountableWeightedSupportPath
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state) :
    state -> state -> Nat -> Real -> Prop
  | zero (current : state) :
      CountableWeightedSupportPath kernel current current 0 1
  | step {source via target : state} {steps : Nat} {weight : Real} :
      0 < kernel.transition source via ->
      CountableWeightedSupportPath kernel via target steps weight ->
      CountableWeightedSupportPath
        kernel
        source
        target
        steps.succ
        (kernel.transition source via * weight)

def CountableDriftToSmallSetWitness
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (potential : state -> Nat)
    (next : state -> state) : Prop :=
  (forall current : state, current ∈ kernel.smallSet ↔ potential current = 0) ∧
    (forall current : state,
      current ∉ kernel.smallSet ->
        0 < kernel.transition current (next current) ∧
          potential (next current) + 1 = potential current)

def CountableSmallSetRecurrent
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state) : Prop :=
  forall current : state,
    ∃ steps target,
      CountableSupportPath kernel current target steps ∧
        target ∈ kernel.smallSet

def CountableUniformPredecessorMinorized
    (kernel : CountableCertifiedKernel Nat)
    (boundary : Nat)
    (epsilon : Real) : Prop :=
  0 < epsilon ∧
    forall current : Nat,
      boundary < current ->
        epsilon <= kernel.transition current (current - 1)

def CountableAtomicSmallSetMinorized
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (epsilon : Real) : Prop :=
  atom ∈ kernel.smallSet ∧
    0 < epsilon ∧
      forall current : Nat,
        current ∈ kernel.smallSet ->
          epsilon <= kernel.transition current atom

def CountableAtomAccessible
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat) : Prop :=
  forall current : Nat,
    ∃ steps : Nat, CountableSupportPath kernel current atom steps

def CountablePsiIrreducibleAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat) : Prop :=
  forall current : Nat, forall targetSet : Set Nat,
    atom ∈ targetSet ->
      ∃ steps target,
        CountableSupportPath kernel current target steps ∧
          target ∈ targetSet

def CountableHarrisPreludeAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real) : Prop :=
  CountableAtomicSmallSetMinorized kernel atom smallSetEpsilon ∧
    CountableUniformPredecessorMinorized kernel boundary stepEpsilon ∧
      CountablePsiIrreducibleAtAtom kernel atom

def CountableHarrisRecurrentClassAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat) : Prop :=
  CountableSmallSetRecurrent kernel ∧
    CountablePsiIrreducibleAtAtom kernel atom

def CountableAtomHittingBoundAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat) : Prop :=
  forall current : Nat,
    ∃ steps : Nat,
      steps <= current - boundary + 1 ∧
        CountableSupportPath kernel current atom steps

def CountableGeometricEnvelopeAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real) : Prop :=
  CountableHarrisPreludeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon ∧
    CountableHarrisRecurrentClassAtAtom kernel atom ∧
      CountableAtomHittingBoundAtAtom kernel atom boundary

def CountableAtomGeometricHitLowerBoundAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real) : Prop :=
  forall current : Nat,
    ∃ steps : Nat,
      ∃ weight : Real,
        CountableWeightedSupportPath kernel current atom steps weight ∧
          steps <= current - boundary + 1 ∧
            smallSetEpsilon * stepEpsilon ^ (current - boundary) <= weight

def CountableQuantitativeGeometricEnvelopeAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real) : Prop :=
  CountableGeometricEnvelopeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon ∧
    CountableAtomGeometricHitLowerBoundAtAtom kernel atom boundary smallSetEpsilon stepEpsilon

def CountableLaminarGeometricStabilityAtAtom
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real) : Prop :=
  CountableQuantitativeGeometricEnvelopeAtAtom
    kernel
    atom
    boundary
    smallSetEpsilon
    stepEpsilon

def SpectrallyStable [NeZero nodeCount] (kernel : CertifiedKernel nodeCount) : Prop := by
  classical
  letI : NormedRing (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedRing
  letI : NormedAlgebra ℝ (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedAlgebra
  letI : NormOneClass (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linfty_opNormOneClass
  exact spectralRadius ℝ kernel.transition < 1

def HasNegativeDrift (kernel : CertifiedKernel nodeCount) : Prop :=
  match kernel.drift with
  | none => True
  | some certificate =>
      0 < certificate.gamma ∧
        forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma

def GeometricStability [NeZero nodeCount] (kernel : CertifiedKernel nodeCount) : Prop :=
  SpectrallyStable kernel ∧ HasNegativeDrift kernel

theorem certifiedKernel_stable
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    (h_spectral : SpectrallyStable kernel)
    (h_drift : HasNegativeDrift kernel) :
    GeometricStability kernel := by
  exact And.intro h_spectral h_drift

theorem spectralRadius_eq_zero_of_pow_eq_zero
    {A : Type*}
    [NormedRing A]
    [NormedAlgebra ℝ A]
    [CompleteSpace A]
    [NormOneClass A]
    {a : A}
    {power : Nat}
    (h_power : power ≠ 0)
    (h_nilpotent : a ^ power = 0) :
    spectralRadius ℝ a = 0 := by
  have hle : spectralRadius ℝ a ^ power ≤ spectralRadius ℝ (a ^ power) :=
    spectrum.spectralRadius_pow_le (𝕜 := ℝ) a power h_power
  have hpow_zero : spectralRadius ℝ a ^ power = 0 := by
    refine le_antisymm ?_ bot_le
    simpa [h_nilpotent] using hle
  by_cases h_radius : spectralRadius ℝ a = 0
  · exact h_radius
  · exfalso
    exact (pow_ne_zero power h_radius) hpow_zero

theorem spectrallyStable_of_nilpotent
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    {power : Nat}
    (h_power : power ≠ 0)
    (h_nilpotent : kernel.transition ^ power = 0) :
    SpectrallyStable kernel := by
  classical
  letI : NormedRing (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedRing
  letI : NormedAlgebra ℝ (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedAlgebra
  letI : NormOneClass (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linfty_opNormOneClass
  dsimp [SpectrallyStable]
  have h_radius_zero :=
    spectralRadius_eq_zero_of_pow_eq_zero (a := kernel.transition) h_power h_nilpotent
  simp [h_radius_zero]

theorem spectrallyStable_of_rowMass
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    (h_nonnegative : HasNonnegativeTransitions kernel)
    (rowBound : Fin nodeCount -> Real)
    (h_row : RowMassContractive kernel rowBound) :
    SpectrallyStable kernel := by
  classical
  letI : NormedRing (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedRing
  letI : NormedAlgebra ℝ (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linftyOpNormedAlgebra
  letI : NormOneClass (Matrix (Fin nodeCount) (Fin nodeCount) Real) :=
    Matrix.linfty_opNormOneClass
  rcases h_row with ⟨h_row_eq, h_row_lt⟩
  dsimp [SpectrallyStable]
  refine lt_of_le_of_lt (spectrum.spectralRadius_le_nnnorm (𝕜 := ℝ) kernel.transition) ?_
  have h_norm_lt_real : ‖kernel.transition‖ < 1 := by
    calc
      ‖kernel.transition‖ =
          (((Finset.univ : Finset (Fin nodeCount)).sup
            fun source : Fin nodeCount =>
              ∑ target : Fin nodeCount, ‖kernel.transition source target‖₊) : NNReal) := by
            simpa using Matrix.linfty_opNorm_def kernel.transition
      _ < 1 := by
        exact_mod_cast
          ((Finset.sup_lt_iff (show (0 : NNReal) < 1 by norm_num)).2
            (fun source _ => by
              have h_sum_eq :
                  (((∑ target : Fin nodeCount, ‖kernel.transition source target‖₊) : NNReal) :
                    Real) = rowBound source := by
                calc
                  (((∑ target : Fin nodeCount, ‖kernel.transition source target‖₊) : NNReal) :
                      Real)
                    = ∑ target : Fin nodeCount, ‖kernel.transition source target‖ := by
                        simp [NNReal.coe_sum]
                  _ = ∑ target : Fin nodeCount, kernel.transition source target := by
                        refine Finset.sum_congr rfl ?_
                        intro target _
                        exact Real.norm_of_nonneg (h_nonnegative source target)
                  _ = rowBound source := h_row_eq source
              have h_sum_lt_real :
                  (((∑ target : Fin nodeCount, ‖kernel.transition source target‖₊) : NNReal) :
                    Real) < 1 := by
                simpa [h_sum_eq] using h_row_lt source
              exact NNReal.coe_lt_coe.mp h_sum_lt_real))
  have h_norm_lt_coe_real : ((‖kernel.transition‖₊ : NNReal) : Real) < 1 := by
    simpa using h_norm_lt_real
  exact_mod_cast h_norm_lt_coe_real

theorem supportPath_reachesSmallSet_of_distanceWitness
    (kernel : CertifiedKernel nodeCount)
    (smallSet : Fin nodeCount -> Prop)
    (distance : Fin nodeCount -> Nat)
    (next : Fin nodeCount -> Fin nodeCount)
    (h_witness : SmallSetDistanceWitness kernel smallSet distance next) :
    forall state : Fin nodeCount,
      ∃ target,
        SupportPath kernel state target (distance state) ∧
          smallSet target := by
  rcases h_witness with ⟨h_small, _, h_step⟩
  intro state
  induction h_distance : distance state generalizing state with
  | zero =>
      use state
      constructor
      · simpa [h_distance] using SupportPath.zero (kernel := kernel) state
      · exact (h_small state).2 h_distance
  | succ remaining ih =>
      have h_not_small : ¬ smallSet state := by
        intro h_state_small
        have h_zero : distance state = 0 := (h_small state).1 h_state_small
        omega
      rcases h_step state h_not_small with ⟨h_edge, h_next⟩
      let successor := next state
      have h_successor_distance : distance successor = remaining := by
        dsimp [successor] at h_next ⊢
        omega
      rcases ih successor h_successor_distance with ⟨target, h_path, h_target_small⟩
      use target
      constructor
      · simpa [h_distance, successor] using
          SupportPath.step (kernel := kernel) h_edge h_path
      · exact h_target_small

theorem finiteSmallSetRecurrent_of_distanceWitness
    (kernel : CertifiedKernel nodeCount)
    (smallSet : Fin nodeCount -> Prop)
    (distance : Fin nodeCount -> Nat)
    (next : Fin nodeCount -> Fin nodeCount)
    (h_witness : SmallSetDistanceWitness kernel smallSet distance next) :
    FiniteSmallSetRecurrent kernel smallSet := by
  have h_bound : forall state : Fin nodeCount, distance state <= nodeCount := h_witness.2.1
  intro state
  rcases
      supportPath_reachesSmallSet_of_distanceWitness
        kernel
        smallSet
        distance
        next
        h_witness
        state with
    ⟨target, h_path, h_target_small⟩
  exact ⟨distance state, target, h_bound state, h_path, h_target_small⟩

theorem countableSupportPath_reachesSmallSet_of_driftWitness
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (potential : state -> Nat)
    (next : state -> state)
    (h_witness : CountableDriftToSmallSetWitness kernel potential next) :
    forall current : state,
      ∃ target,
        CountableSupportPath kernel current target (potential current) ∧
          target ∈ kernel.smallSet := by
  rcases h_witness with ⟨h_small, h_step⟩
  intro current
  induction h_potential : potential current generalizing current with
  | zero =>
      use current
      constructor
      · simpa [h_potential] using
          CountableSupportPath.zero (kernel := kernel) current
      · exact (h_small current).2 h_potential
  | succ remaining ih =>
      have h_not_small : current ∉ kernel.smallSet := by
        intro h_current_small
        have h_zero : potential current = 0 := (h_small current).1 h_current_small
        omega
      rcases h_step current h_not_small with ⟨h_edge, h_next⟩
      let successor := next current
      have h_successor_potential : potential successor = remaining := by
        dsimp [successor] at h_next ⊢
        omega
      rcases ih successor h_successor_potential with ⟨target, h_path, h_target_small⟩
      use target
      constructor
      · simpa [h_potential, successor] using
          CountableSupportPath.step (kernel := kernel) h_edge h_path
      · exact h_target_small

theorem countableSmallSetRecurrent_of_driftWitness
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (potential : state -> Nat)
    (next : state -> state)
    (h_witness : CountableDriftToSmallSetWitness kernel potential next) :
    CountableSmallSetRecurrent kernel := by
  intro current
  rcases
      countableSupportPath_reachesSmallSet_of_driftWitness
        kernel
        potential
        next
        h_witness
        current with
    ⟨target, h_path, h_target_small⟩
  exact ⟨potential current, target, h_path, h_target_small⟩

theorem countableSupportPath_append
    {state : Type} [Countable state]
    {kernel : CountableCertifiedKernel state}
    {source via target : state}
    {left right : Nat}
    (h_left : CountableSupportPath kernel source via left)
    (h_right : CountableSupportPath kernel via target right) :
    CountableSupportPath kernel source target (left + right) := by
  induction h_left generalizing target right with
  | zero current =>
      simpa using h_right
  | step h_edge h_rest ih =>
      have h_combined := ih h_right
      simpa [Nat.succ_add] using
        CountableSupportPath.step (kernel := kernel) h_edge h_combined

theorem natSmallSetRecurrent_of_stepDown
    (kernel : CountableCertifiedKernel Nat)
    (boundary : Nat)
    (next : Nat -> Nat)
    (h_small :
      kernel.smallSet = {current : Nat | current <= boundary})
    (h_step :
      forall current : Nat,
        boundary < current ->
          0 < kernel.transition current (next current) ∧
            next current + 1 = current) :
    CountableSmallSetRecurrent kernel := by
  let witnessNext : Nat -> Nat :=
    fun current => if current <= boundary then current else next current
  apply countableSmallSetRecurrent_of_driftWitness
    (kernel := kernel)
    (potential := fun current => current - boundary)
    (next := witnessNext)
  constructor
  · intro current
    rw [h_small, Set.mem_setOf_eq]
    exact (Nat.sub_eq_zero_iff_le).symm
  · intro current h_not_small
    have h_current_gt : boundary < current := by
      rw [h_small, Set.mem_setOf_eq] at h_not_small
      exact Nat.lt_of_not_ge h_not_small
    have h_current_not_le : ¬ current ≤ boundary := Nat.not_le_of_gt h_current_gt
    rcases h_step current h_current_gt with ⟨h_edge, h_step_down⟩
    constructor
    · simpa [witnessNext, h_current_not_le] using h_edge
    · have h_step_down' : witnessNext current + 1 = current := by
        simpa [witnessNext, h_current_not_le] using h_step_down
      have h_potential_step :
          next current - boundary + 1 = current - boundary := by
        omega
      simpa [witnessNext, h_current_not_le] using h_potential_step

theorem natSmallSetRecurrent_of_uniformPredecessorMinorization
    (kernel : CountableCertifiedKernel Nat)
    (boundary : Nat)
    (epsilon : Real)
    (h_small :
      kernel.smallSet = {current : Nat | current <= boundary})
    (h_minorized :
      CountableUniformPredecessorMinorized kernel boundary epsilon) :
    CountableSmallSetRecurrent kernel := by
  rcases h_minorized with ⟨h_epsilon_pos, h_lower⟩
  apply natSmallSetRecurrent_of_stepDown
    (kernel := kernel)
    (boundary := boundary)
    (next := fun current => current - 1)
  · exact h_small
  · intro current h_current_gt
    constructor
    · exact lt_of_lt_of_le h_epsilon_pos (h_lower current h_current_gt)
    · omega

theorem countableAtomicSmallSetMinorized_one_of_collapse
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (h_atom_small : atom ∈ kernel.smallSet)
    (h_collapse :
      forall current : Nat,
        current ∈ kernel.smallSet ->
          kernel.transition current atom = 1) :
    CountableAtomicSmallSetMinorized kernel atom 1 := by
  refine ⟨h_atom_small, by norm_num, ?_⟩
  intro current h_current_small
  have h_mass : kernel.transition current atom = 1 := h_collapse current h_current_small
  simp [h_mass]

theorem countableAtomAccessible_of_smallSetRecurrence_and_atomicMinorization
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (epsilon : Real)
    (h_recurrent : CountableSmallSetRecurrent kernel)
    (h_minorized : CountableAtomicSmallSetMinorized kernel atom epsilon) :
    CountableAtomAccessible kernel atom := by
  rcases h_minorized with ⟨_, h_epsilon_pos, h_small_step⟩
  intro current
  rcases h_recurrent current with ⟨steps, target, h_path, h_target_small⟩
  have h_edge_lower : epsilon <= kernel.transition target atom := h_small_step target h_target_small
  have h_edge_pos : 0 < kernel.transition target atom := lt_of_lt_of_le h_epsilon_pos h_edge_lower
  let h_atom_path : CountableSupportPath kernel target atom 1 :=
    CountableSupportPath.step
      (kernel := kernel)
      h_edge_pos
      (CountableSupportPath.zero (kernel := kernel) atom)
  use steps + 1
  simpa [h_atom_path] using
    countableSupportPath_append (kernel := kernel) h_path h_atom_path

theorem countablePsiIrreducibleAtAtom_of_atomAccessible
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (h_accessible : CountableAtomAccessible kernel atom) :
    CountablePsiIrreducibleAtAtom kernel atom := by
  intro current targetSet h_atom_mem
  rcases h_accessible current with ⟨steps, h_path⟩
  exact ⟨steps, atom, h_path, h_atom_mem⟩

theorem countableHarrisPreludeAtAtom_of_components
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_small : CountableAtomicSmallSetMinorized kernel atom smallSetEpsilon)
    (h_step : CountableUniformPredecessorMinorized kernel boundary stepEpsilon)
    (h_psi : CountablePsiIrreducibleAtAtom kernel atom) :
    CountableHarrisPreludeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon := by
  exact ⟨h_small, h_step, h_psi⟩

theorem countableHarrisRecurrentClassAtAtom_of_recurrence_and_prelude
    (kernel : CountableCertifiedKernel Nat)
    (atom : Nat)
    (boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_recurrent : CountableSmallSetRecurrent kernel)
    (h_prelude : CountableHarrisPreludeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon) :
    CountableHarrisRecurrentClassAtAtom kernel atom := by
  exact ⟨h_recurrent, h_prelude.2.2⟩

theorem countableAtomHittingBoundAtAtom_of_minorization
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_small :
      kernel.smallSet = {current : Nat | current <= boundary})
    (h_small_minorized : CountableAtomicSmallSetMinorized kernel atom smallSetEpsilon)
    (h_step_minorized : CountableUniformPredecessorMinorized kernel boundary stepEpsilon) :
    CountableAtomHittingBoundAtAtom kernel atom boundary := by
  rcases h_small_minorized with ⟨_, h_small_epsilon_pos, h_small_step⟩
  rcases h_step_minorized with ⟨h_step_epsilon_pos, h_step_lower⟩
  intro current
  induction h_distance : current - boundary generalizing current with
  | zero =>
      have h_current_le : current <= boundary := Nat.sub_eq_zero_iff_le.mp h_distance
      have h_current_small : current ∈ kernel.smallSet := by
        rwa [h_small, Set.mem_setOf_eq]
      have h_edge_lower : smallSetEpsilon <= kernel.transition current atom :=
        h_small_step current h_current_small
      have h_edge_pos : 0 < kernel.transition current atom := by
        exact lt_of_lt_of_le h_small_epsilon_pos h_edge_lower
      refine ⟨1, ?_, ?_⟩
      · omega
      · exact
          CountableSupportPath.step
            (kernel := kernel)
            h_edge_pos
            (CountableSupportPath.zero (kernel := kernel) atom)
  | succ remaining ih =>
      have h_current_gt : boundary < current := by
        omega
      have h_edge_lower : stepEpsilon <= kernel.transition current (current - 1) :=
        h_step_lower current h_current_gt
      have h_edge_pos : 0 < kernel.transition current (current - 1) := by
        exact lt_of_lt_of_le h_step_epsilon_pos h_edge_lower
      have h_predecessor_distance : current - 1 - boundary = remaining := by
        omega
      rcases ih (current - 1) h_predecessor_distance with ⟨steps, h_bound, h_path⟩
      refine ⟨steps.succ, ?_, ?_⟩
      · omega
      · exact CountableSupportPath.step (kernel := kernel) h_edge_pos h_path

theorem countableGeometricEnvelopeAtAtom_of_harrisPrelude_and_bound
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_prelude : CountableHarrisPreludeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon)
    (h_class : CountableHarrisRecurrentClassAtAtom kernel atom)
    (h_bound : CountableAtomHittingBoundAtAtom kernel atom boundary) :
    CountableGeometricEnvelopeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon := by
  exact ⟨h_prelude, h_class, h_bound⟩

theorem countableAtomGeometricHitLowerBoundAtAtom_of_minorization
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_small :
      kernel.smallSet = {current : Nat | current <= boundary})
    (h_small_minorized : CountableAtomicSmallSetMinorized kernel atom smallSetEpsilon)
    (h_step_minorized : CountableUniformPredecessorMinorized kernel boundary stepEpsilon) :
    CountableAtomGeometricHitLowerBoundAtAtom
      kernel atom boundary smallSetEpsilon stepEpsilon := by
  rcases h_small_minorized with ⟨_, h_small_epsilon_pos, h_small_step⟩
  rcases h_step_minorized with ⟨h_step_epsilon_pos, h_step_lower⟩
  intro current
  induction h_distance : current - boundary generalizing current with
  | zero =>
      have h_current_le : current <= boundary := Nat.sub_eq_zero_iff_le.mp h_distance
      have h_current_small : current ∈ kernel.smallSet := by
        rwa [h_small, Set.mem_setOf_eq]
      have h_edge_lower : smallSetEpsilon <= kernel.transition current atom :=
        h_small_step current h_current_small
      have h_edge_pos : 0 < kernel.transition current atom := by
        exact lt_of_lt_of_le h_small_epsilon_pos h_edge_lower
      let path :
          CountableWeightedSupportPath
            kernel
            current
            atom
            1
            (kernel.transition current atom * 1) :=
        CountableWeightedSupportPath.step
          (kernel := kernel)
          h_edge_pos
          (CountableWeightedSupportPath.zero (kernel := kernel) atom)
      refine ⟨1, kernel.transition current atom * 1, path, ?_, ?_⟩
      · omega
      ·
        simpa using h_edge_lower
  | succ remaining ih =>
      have h_current_gt : boundary < current := by
        omega
      have h_edge_lower : stepEpsilon <= kernel.transition current (current - 1) :=
        h_step_lower current h_current_gt
      have h_edge_pos : 0 < kernel.transition current (current - 1) := by
        exact lt_of_lt_of_le h_step_epsilon_pos h_edge_lower
      have h_predecessor_distance : current - 1 - boundary = remaining := by
        omega
      rcases ih (current - 1) h_predecessor_distance with
        ⟨steps, weight, path, h_steps_bound, h_path_lower⟩
      let extendedPath :
          CountableWeightedSupportPath
            kernel
            current
            atom
            steps.succ
            (kernel.transition current (current - 1) * weight) :=
        CountableWeightedSupportPath.step (kernel := kernel) h_edge_pos path
      refine ⟨steps.succ, kernel.transition current (current - 1) * weight, extendedPath, ?_, ?_⟩
      · omega
      ·
        have h_step_nonneg : 0 <= stepEpsilon := le_of_lt h_step_epsilon_pos
        have h_small_nonneg : 0 <= smallSetEpsilon := le_of_lt h_small_epsilon_pos
        have h_pow_nonneg : 0 <= stepEpsilon ^ remaining := pow_nonneg h_step_nonneg remaining
        have h_lower_nonneg : 0 <= smallSetEpsilon * stepEpsilon ^ remaining := by
          exact mul_nonneg h_small_nonneg h_pow_nonneg
        have h_transition_nonneg : 0 <= kernel.transition current (current - 1) := le_of_lt h_edge_pos
        have h_mul :
            stepEpsilon * (smallSetEpsilon * stepEpsilon ^ remaining) <=
              kernel.transition current (current - 1) * weight := by
          exact mul_le_mul h_edge_lower h_path_lower h_lower_nonneg h_transition_nonneg
        calc
          smallSetEpsilon * stepEpsilon ^ (remaining + 1)
              = stepEpsilon * (smallSetEpsilon * stepEpsilon ^ remaining) := by
                  rw [pow_succ']
                  ring
          _ <= kernel.transition current (current - 1) * weight := h_mul

theorem countableQuantitativeGeometricEnvelopeAtAtom_of_components
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_envelope : CountableGeometricEnvelopeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon)
    (h_lower : CountableAtomGeometricHitLowerBoundAtAtom kernel atom boundary smallSetEpsilon stepEpsilon) :
    CountableQuantitativeGeometricEnvelopeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon := by
  exact ⟨h_envelope, h_lower⟩

theorem countableLaminarGeometricStabilityAtAtom_of_components
    (kernel : CountableCertifiedKernel Nat)
    (atom boundary : Nat)
    (smallSetEpsilon stepEpsilon : Real)
    (h_envelope : CountableGeometricEnvelopeAtAtom kernel atom boundary smallSetEpsilon stepEpsilon)
    (h_lower : CountableAtomGeometricHitLowerBoundAtAtom kernel atom boundary smallSetEpsilon stepEpsilon) :
    CountableLaminarGeometricStabilityAtAtom
      kernel atom boundary smallSetEpsilon stepEpsilon := by
  exact countableQuantitativeGeometricEnvelopeAtAtom_of_components
    kernel
    atom
    boundary
    smallSetEpsilon
    stepEpsilon
    h_envelope
    h_lower

def MeasurableSmallSetMinorized
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (smallSet : Set state)
    (reference : MeasureTheory.Measure state)
    (epsilon : ℝ≥0∞) : Prop :=
  MeasurableSet smallSet ∧
    0 < epsilon ∧
      forall current : state,
        current ∈ smallSet ->
          epsilon • reference <= kernel current

def MeasurableHarrisPrelude
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞) : Prop :=
  ProbabilityTheory.Kernel.IsIrreducible reference kernel ∧
    ProbabilityTheory.Kernel.Invariant kernel invariantMeasure ∧
      MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon

def MeasurableSmallSetAccessible
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (smallSet : Set state) : Prop :=
  forall current : state,
    ∃ n : ℕ, (kernel ^ n) current smallSet > 0

def MeasurableReferencePositiveAccessible
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state) : Prop :=
  forall measurableSet : Set state,
    MeasurableSet measurableSet ->
      reference measurableSet > 0 ->
        forall current : state,
          ∃ n : ℕ, (kernel ^ n) current measurableSet > 0

def MeasurableAtomAccessible
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state) : Prop :=
  forall current : state,
    ∃ n : ℕ, (kernel ^ n) current ({atom} : Set state) > 0

def MeasurableHarrisCertified
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞) : Prop :=
  MeasurableHarrisPrelude
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon ∧
      MeasurableSmallSetAccessible kernel smallSet ∧
        MeasurableReferencePositiveAccessible kernel reference

theorem measurableHarrisPrelude_of_components
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_irreducible : ProbabilityTheory.Kernel.IsIrreducible reference kernel)
    (h_invariant : ProbabilityTheory.Kernel.Invariant kernel invariantMeasure)
    (h_small : MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon) :
    MeasurableHarrisPrelude
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  exact ⟨h_irreducible, h_invariant, h_small⟩

theorem measurableHarrisPrelude_of_reversible
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    [ProbabilityTheory.IsMarkovKernel kernel]
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_irreducible : ProbabilityTheory.Kernel.IsIrreducible reference kernel)
    (h_reversible : ProbabilityTheory.Kernel.IsReversible kernel invariantMeasure)
    (h_small : MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon) :
    MeasurableHarrisPrelude
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  exact measurableHarrisPrelude_of_components
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    h_irreducible
    (ProbabilityTheory.Kernel.IsReversible.invariant h_reversible)
    h_small

theorem measurableHarrisPrelude_of_le_referenceMeasure
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    {reference smallerReference invariantMeasure minorizationMeasure :
      MeasureTheory.Measure state}
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_reference : smallerReference <= reference)
    (h_prelude :
      MeasurableHarrisPrelude
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon) :
    MeasurableHarrisPrelude
      kernel
      smallerReference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  rcases h_prelude with ⟨h_irreducible, h_invariant, h_small⟩
  letI : ProbabilityTheory.Kernel.IsIrreducible reference kernel := h_irreducible
  exact ⟨
    ProbabilityTheory.Kernel.isIrreducible_of_le_measure h_reference,
    h_invariant,
    h_small
  ⟩

theorem measurableSmallSetAccessible_of_irreducible
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (smallSet : Set state)
    (h_irreducible : ProbabilityTheory.Kernel.IsIrreducible reference kernel)
    (h_small_measurable : MeasurableSet smallSet)
    (h_small_positive : reference smallSet > 0) :
    MeasurableSmallSetAccessible kernel smallSet := by
  intro current
  exact h_irreducible.irreducible h_small_measurable h_small_positive current

theorem measurableReferencePositiveAccessible_of_irreducible
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (h_irreducible : ProbabilityTheory.Kernel.IsIrreducible reference kernel) :
    MeasurableReferencePositiveAccessible kernel reference := by
  intro measurableSet h_measurableSet h_positive current
  exact h_irreducible.irreducible h_measurableSet h_positive current

theorem measurableHarrisCertified_of_prelude
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_prelude :
      MeasurableHarrisPrelude
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon)
    (h_small_positive : reference smallSet > 0) :
    MeasurableHarrisCertified
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  rcases h_prelude with ⟨h_irreducible, h_invariant, h_small⟩
  refine ⟨⟨h_irreducible, h_invariant, h_small⟩, ?_, ?_⟩
  · exact measurableSmallSetAccessible_of_irreducible
      kernel
      reference
      smallSet
      h_irreducible
      h_small.1
      h_small_positive
  · exact measurableReferencePositiveAccessible_of_irreducible
      kernel
      reference
      h_irreducible

theorem measurableIrreducible_dirac_of_atomAccessible
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (h_accessible : MeasurableAtomAccessible kernel atom) :
    ProbabilityTheory.Kernel.IsIrreducible (MeasureTheory.Measure.dirac atom) kernel := by
  constructor
  intro measurableSet h_measurableSet h_positive current
  have h_atom_mem : atom ∈ measurableSet := by
    by_contra h_atom_not_mem
    have h_zero : MeasureTheory.Measure.dirac atom measurableSet = 0 := by
      simp [h_atom_not_mem]
    exact (not_lt_of_ge (by simp [h_zero])) h_positive
  rcases h_accessible current with ⟨n, h_hit_atom⟩
  refine ⟨n, lt_of_lt_of_le h_hit_atom ?_⟩
  exact MeasureTheory.measure_mono (by
    intro point h_point
    have h_point_eq : point = atom := by
      simpa using h_point
    simpa [h_point_eq] using h_atom_mem)

theorem measurableHarrisCertified_of_atomAccessible
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_atom_small : atom ∈ smallSet)
    (h_accessible : MeasurableAtomAccessible kernel atom)
    (h_invariant : ProbabilityTheory.Kernel.Invariant kernel invariantMeasure)
    (h_small : MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon) :
    MeasurableHarrisCertified
      kernel
      (MeasureTheory.Measure.dirac atom)
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  have h_irreducible :
      ProbabilityTheory.Kernel.IsIrreducible (MeasureTheory.Measure.dirac atom) kernel :=
    measurableIrreducible_dirac_of_atomAccessible kernel atom h_accessible
  have h_prelude :
      MeasurableHarrisPrelude
        kernel
        (MeasureTheory.Measure.dirac atom)
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon :=
    measurableHarrisPrelude_of_components
      kernel
      (MeasureTheory.Measure.dirac atom)
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      h_irreducible
      h_invariant
      h_small
  have h_small_positive : MeasureTheory.Measure.dirac atom smallSet > 0 := by
    simp [h_atom_small]
  exact measurableHarrisCertified_of_prelude
    kernel
    (MeasureTheory.Measure.dirac atom)
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    h_prelude
    h_small_positive

theorem measurableSmallSetAccessible_of_atomAccessible
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_atom_small : atom ∈ smallSet)
    (h_accessible : MeasurableAtomAccessible kernel atom)
    (h_invariant : ProbabilityTheory.Kernel.Invariant kernel invariantMeasure)
    (h_small : MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon) :
    MeasurableSmallSetAccessible kernel smallSet := by
  exact
    (measurableHarrisCertified_of_atomAccessible
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      h_atom_small
      h_accessible
      h_invariant
      h_small).2.1

theorem measurableContainingAtomAccessible_of_atomAccessible
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet measurableSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_atom_small : atom ∈ smallSet)
    (h_accessible : MeasurableAtomAccessible kernel atom)
    (h_invariant : ProbabilityTheory.Kernel.Invariant kernel invariantMeasure)
    (h_small : MeasurableSmallSetMinorized kernel smallSet minorizationMeasure epsilon)
    (h_measurableSet : MeasurableSet measurableSet)
    (h_atom_mem : atom ∈ measurableSet) :
    forall current : state,
      ∃ n : ℕ, (kernel ^ n) current measurableSet > 0 := by
  have h_dirac_accessible : MeasurableReferencePositiveAccessible kernel (MeasureTheory.Measure.dirac atom) :=
    (measurableHarrisCertified_of_atomAccessible
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      h_atom_small
      h_accessible
      h_invariant
      h_small).2.2
  have h_positive : MeasureTheory.Measure.dirac atom measurableSet > 0 := by
    simp [h_atom_mem]
  exact h_dirac_accessible measurableSet h_measurableSet h_positive

theorem natSmallSetRecurrent_of_margin_step
    (kernel : CountableCertifiedKernel Nat)
    (boundary : Nat)
    (lam mu : Real)
    (alpha : Nat -> Real)
    (h_small :
      kernel.smallSet = {current : Nat | current <= boundary})
    (h_margin_positive :
      forall current : Nat,
        boundary < current ->
          0 < mu + alpha current - lam)
    (h_step_from_margin :
      forall current : Nat,
        boundary < current ->
          0 < mu + alpha current - lam ->
            0 < kernel.transition current (current - 1)) :
    CountableSmallSetRecurrent kernel := by
  apply natSmallSetRecurrent_of_stepDown
    (kernel := kernel)
    (boundary := boundary)
    (next := fun current => current - 1)
  · exact h_small
  · intro current h_current_gt
    constructor
    · have h_margin_pos : 0 < mu + alpha current - lam := by
        exact h_margin_positive current h_current_gt
      exact h_step_from_margin current h_current_gt h_margin_pos
    · omega

theorem certifiedKernel_stable_of_supremum
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    (h_spectral : SpectrallyStable kernel)
    (h_no_drift : kernel.drift = none) :
    GeometricStability kernel := by
  apply certifiedKernel_stable
  · exact h_spectral
  · simp [HasNegativeDrift, h_no_drift]

theorem certifiedKernel_stable_of_drift_certificate
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    (certificate : DriftCertificate)
    (h_kernel : kernel.drift = some certificate)
    (h_spectral : SpectrallyStable kernel)
    (h_gamma : 0 < certificate.gamma)
    (h_floor : forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma) :
    GeometricStability kernel := by
  apply certifiedKernel_stable
  · exact h_spectral
  · simpa [HasNegativeDrift, h_kernel] using And.intro h_gamma h_floor

def WorkspaceReady : Prop := True

theorem workspace_ready : WorkspaceReady := by
  trivial

end GnosisProofs
