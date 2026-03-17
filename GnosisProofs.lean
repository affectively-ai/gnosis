import Mathlib.Tactic
import Mathlib.Analysis.Matrix.Normed
import Mathlib.Analysis.Normed.Algebra.Spectrum
import Mathlib.LinearAlgebra.Matrix.Integer
import Mathlib.Probability.Kernel.Basic
import Mathlib.Probability.Kernel.Composition.CompMap
import Mathlib.Probability.Kernel.Irreducible
import Mathlib.Probability.Kernel.Invariance
import Mathlib.MeasureTheory.Measure.LevyProkhorovMetric

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

def CountableAtomicSmallSetMinorizedAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (epsilon : Real) : Prop :=
  atom ∈ kernel.smallSet ∧
    0 < epsilon ∧
      forall current : state,
        current ∈ kernel.smallSet ->
          epsilon <= kernel.transition current atom

def CountableAtomAccessibleAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state) : Prop :=
  forall current : state,
    ∃ steps : Nat, CountableSupportPath kernel current atom steps

def CountablePsiIrreducibleAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state) : Prop :=
  forall current : state, forall targetSet : Set state,
    atom ∈ targetSet ->
      ∃ steps target,
        CountableSupportPath kernel current target steps ∧
          target ∈ targetSet

def CountableHarrisPreludeAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (smallSetEpsilon : Real) : Prop :=
  CountableAtomicSmallSetMinorizedAt kernel atom smallSetEpsilon ∧
    CountablePsiIrreducibleAt kernel atom

def CountableHarrisRecurrentClassAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state) : Prop :=
  CountableSmallSetRecurrent kernel ∧
    CountablePsiIrreducibleAt kernel atom

def CountableAtomHittingBoundAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (hitBound : state -> Nat) : Prop :=
  forall current : state,
    ∃ steps : Nat,
      steps <= hitBound current ∧
        CountableSupportPath kernel current atom steps

def CountableGeometricEnvelopeAt
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (smallSetEpsilon : Real)
    (hitBound : state -> Nat) : Prop :=
  CountableHarrisPreludeAt kernel atom smallSetEpsilon ∧
    CountableHarrisRecurrentClassAt kernel atom ∧
      CountableAtomHittingBoundAt kernel atom hitBound

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

theorem countableAtomAccessibleAt_of_smallSetRecurrence_and_atomicMinorization
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (epsilon : Real)
    (h_recurrent : CountableSmallSetRecurrent kernel)
    (h_minorized : CountableAtomicSmallSetMinorizedAt kernel atom epsilon) :
    CountableAtomAccessibleAt kernel atom := by
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

theorem countablePsiIrreducibleAt_of_atomAccessible
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (h_accessible : CountableAtomAccessibleAt kernel atom) :
    CountablePsiIrreducibleAt kernel atom := by
  intro current targetSet h_atom_mem
  rcases h_accessible current with ⟨steps, h_path⟩
  exact ⟨steps, atom, h_path, h_atom_mem⟩

theorem countableHarrisPreludeAt_of_components
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (smallSetEpsilon : Real)
    (h_small : CountableAtomicSmallSetMinorizedAt kernel atom smallSetEpsilon)
    (h_psi : CountablePsiIrreducibleAt kernel atom) :
    CountableHarrisPreludeAt kernel atom smallSetEpsilon := by
  exact ⟨h_small, h_psi⟩

theorem countableHarrisRecurrentClassAt_of_recurrence_and_prelude
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (smallSetEpsilon : Real)
    (h_recurrent : CountableSmallSetRecurrent kernel)
    (h_prelude : CountableHarrisPreludeAt kernel atom smallSetEpsilon) :
    CountableHarrisRecurrentClassAt kernel atom := by
  exact ⟨h_recurrent, h_prelude.2⟩

theorem countableGeometricEnvelopeAt_of_harrisPrelude_and_bound
    {state : Type} [Countable state]
    (kernel : CountableCertifiedKernel state)
    (atom : state)
    (smallSetEpsilon : Real)
    (hitBound : state -> Nat)
    (h_prelude : CountableHarrisPreludeAt kernel atom smallSetEpsilon)
    (h_class : CountableHarrisRecurrentClassAt kernel atom)
    (h_bound : CountableAtomHittingBoundAt kernel atom hitBound) :
    CountableGeometricEnvelopeAt kernel atom smallSetEpsilon hitBound := by
  exact ⟨h_prelude, h_class, h_bound⟩

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

def MeasurableAtomHittingBoundAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (hitBound : state -> Nat) : Prop :=
  forall current : state,
    ∃ n : ℕ, n <= hitBound current ∧ (kernel ^ n) current ({atom} : Set state) > 0

def MeasurableReferencePositiveHittingBound
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  forall measurableSet : Set state,
    MeasurableSet measurableSet ->
      reference measurableSet > 0 ->
        forall current : state,
          ∃ n : ℕ, n <= hitBound current ∧ (kernel ^ n) current measurableSet > 0

theorem deterministic_pow_eq_deterministic_iterate
    {state : Type*}
    [MeasurableSpace state]
    [Countable state]
    [MeasurableSingletonClass state]
    (step : state -> state) :
    forall n : ℕ,
      (ProbabilityTheory.Kernel.deterministic step (measurable_of_countable step) ^ n) =
        ProbabilityTheory.Kernel.deterministic
          (step^[n])
          (measurable_of_countable (step^[n])) := by
  intro n
  induction n with
  | zero =>
      ext current measurableSet h_measurableSet
      change ProbabilityTheory.Kernel.id current measurableSet =
        (ProbabilityTheory.Kernel.deterministic
          (step^[0])
          (measurable_of_countable (step^[0])) current) measurableSet
      rw [ProbabilityTheory.Kernel.id_apply, ProbabilityTheory.Kernel.deterministic_apply]
      simp
  | succ n ih =>
      simpa [pow_succ, ih, Function.iterate_succ, Function.comp] using
        (ProbabilityTheory.Kernel.deterministic_comp_deterministic
          (f := step)
          (g := step^[n])
          (hf := measurable_of_countable step)
          (hg := measurable_of_countable (step^[n])))

theorem measurableAtomAccessible_of_deterministic_hit
    {state : Type*}
    [MeasurableSpace state]
    [Countable state]
    [MeasurableSingletonClass state]
    (step : state -> state)
    (atom : state)
    (h_hit : forall current : state, ∃ n : ℕ, (step^[n]) current = atom) :
    MeasurableAtomAccessible
      (ProbabilityTheory.Kernel.deterministic step (measurable_of_countable step))
      atom := by
  intro current
  rcases h_hit current with ⟨n, h_step⟩
  refine ⟨n, ?_⟩
  rw [deterministic_pow_eq_deterministic_iterate (step := step) n]
  simp [ProbabilityTheory.Kernel.deterministic_apply, h_step]

theorem nat_iterate_queueStep_hits_atom
    (boundary atom : Nat) :
    forall current : Nat,
      ((fun step : Nat => if step <= boundary then atom else step - 1)^[current - boundary + 1])
        current = atom := by
  intro current
  induction h_distance : current - boundary generalizing current with
  | zero =>
      have h_current_le : current <= boundary := Nat.sub_eq_zero_iff_le.mp h_distance
      simp [h_current_le]
  | succ remaining ih =>
      have h_current_gt : boundary < current := by
        omega
      have h_current_not_le : ¬ current ≤ boundary := Nat.not_le_of_gt h_current_gt
      have h_predecessor_distance : current - 1 - boundary = remaining := by
        omega
      calc
        ((fun step : Nat => if step <= boundary then atom else step - 1)^[remaining + 1 + 1])
            current
            =
          ((fun step : Nat => if step <= boundary then atom else step - 1)^[remaining + 1])
            ((fun step : Nat => if step <= boundary then atom else step - 1) current) := by
              rw [Function.iterate_succ_apply]
        _ =
          ((fun step : Nat => if step <= boundary then atom else step - 1)^[remaining + 1])
            (current - 1) := by
              simp [h_current_not_le]
        _ = atom := ih (current - 1) h_predecessor_distance

theorem natMeasurableAtomAccessible_of_queueStep
    (boundary atom : Nat) :
    MeasurableAtomAccessible
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      atom := by
  apply measurableAtomAccessible_of_deterministic_hit
  intro current
  exact ⟨current - boundary + 1, nat_iterate_queueStep_hits_atom boundary atom current⟩

theorem natMeasurableAtomHittingBound_of_queueStep
    (boundary atom : Nat) :
    MeasurableAtomHittingBoundAtAtom
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      atom
      (fun current : Nat => current - boundary + 1) := by
  intro current
  refine ⟨current - boundary + 1, le_rfl, ?_⟩
  have h_hit :
      ((fun current : Nat => if current <= boundary then atom else current - 1)^[current - boundary + 1])
        current = atom :=
    nat_iterate_queueStep_hits_atom boundary atom current
  rw [deterministic_pow_eq_deterministic_iterate
    (step := fun current : Nat => if current <= boundary then atom else current - 1)
    (n := current - boundary + 1)]
  rw [ProbabilityTheory.Kernel.deterministic_apply]
  simp [h_hit]

theorem natQueueSupportInvariantAtAtom
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    ProbabilityTheory.Kernel.Invariant
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom) := by
  unfold ProbabilityTheory.Kernel.Invariant
  rw [MeasureTheory.Measure.dirac_bind (ProbabilityTheory.Kernel.measurable _)]
  rw [ProbabilityTheory.Kernel.deterministic_apply]
  simp [h_atom_small]

theorem natQueueSupportSmallSetMinorized
    (boundary atom : Nat) :
    MeasurableSmallSetMinorized
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      {current : Nat | current <= boundary}
      (MeasureTheory.Measure.dirac atom)
      1 := by
  refine ⟨by simp, by norm_num, ?_⟩
  intro current h_current_small
  have h_current_le : current <= boundary := h_current_small
  simp [one_smul, ProbabilityTheory.Kernel.deterministic_apply, h_current_le]

noncomputable def natQueueWitnessKernel
    (boundary atom : Nat) :
    ProbabilityTheory.Kernel Nat Nat :=
  ProbabilityTheory.Kernel.ofFunOfCountable (fun current : Nat =>
    if current <= boundary then
      MeasureTheory.Measure.dirac atom
    else
      ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (current - 1)) +
        ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom))

theorem natQueueWitnessAtomMassPos
    (boundary atom current : Nat) :
    0 < natQueueWitnessKernel boundary atom current ({atom} : Set Nat) := by
  by_cases h_current : current <= boundary
  · change
      0 <
        (if current <= boundary then
          MeasureTheory.Measure.dirac atom
        else
          ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (current - 1)) +
            ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom))
          ({atom} : Set Nat)
    simp [h_current]
  · by_cases h_pred_atom : current - 1 = atom
    · change
        0 <
          (if current <= boundary then
            MeasureTheory.Measure.dirac atom
          else
            ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (current - 1)) +
              ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom))
            ({atom} : Set Nat)
      norm_num [h_current, h_pred_atom]
    · change
        0 <
          (if current <= boundary then
            MeasureTheory.Measure.dirac atom
          else
            ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (current - 1)) +
              ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom))
            ({atom} : Set Nat)
      norm_num [h_current, h_pred_atom]

theorem natMeasurableAtomAccessible_of_queueWitnessKernel
    (boundary atom : Nat) :
    MeasurableAtomAccessible
      (natQueueWitnessKernel boundary atom)
      atom := by
  intro current
  refine ⟨1, ?_⟩
  simpa using natQueueWitnessAtomMassPos boundary atom current

theorem natMeasurableAtomHittingBound_of_queueWitnessKernel
    (boundary atom : Nat) :
    MeasurableAtomHittingBoundAtAtom
      (natQueueWitnessKernel boundary atom)
      atom
      (fun _ : Nat => 1) := by
  intro current
  refine ⟨1, le_rfl, ?_⟩
  simpa using natQueueWitnessAtomMassPos boundary atom current

theorem natQueueWitnessInvariantAtAtom
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    ProbabilityTheory.Kernel.Invariant
      (natQueueWitnessKernel boundary atom)
      (MeasureTheory.Measure.dirac atom) := by
  unfold ProbabilityTheory.Kernel.Invariant
  rw [MeasureTheory.Measure.dirac_bind (ProbabilityTheory.Kernel.measurable _)]
  have h_kernel_atom :
      (natQueueWitnessKernel boundary atom) atom = MeasureTheory.Measure.dirac atom := by
    change
      (if atom <= boundary then
        MeasureTheory.Measure.dirac atom
      else
        ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (atom - 1)) +
          ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom)) =
        MeasureTheory.Measure.dirac atom
    simp [h_atom_small]
  ext measurableSet h_measurableSet
  rw [h_kernel_atom]

theorem natQueueWitnessSmallSetMinorized
    (boundary atom : Nat) :
    MeasurableSmallSetMinorized
      (natQueueWitnessKernel boundary atom)
      {current : Nat | current <= boundary}
      (MeasureTheory.Measure.dirac atom)
      1 := by
  refine ⟨by simp, by norm_num, ?_⟩
  intro current h_current_small
  have h_current_le : current <= boundary := h_current_small
  have h_kernel_current :
      (natQueueWitnessKernel boundary atom) current = MeasureTheory.Measure.dirac atom := by
    change
      (if current <= boundary then
        MeasureTheory.Measure.dirac atom
      else
        ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac (current - 1)) +
          ((1 / 2 : ℝ≥0∞) • MeasureTheory.Measure.dirac atom)) =
        MeasureTheory.Measure.dirac atom
    simp [h_current_le]
  simp [one_smul, h_kernel_current]

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

def MeasurableLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞) : Prop :=
  MeasurableHarrisCertified
    kernel
    (MeasureTheory.Measure.dirac atom)
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon ∧
      MeasurableAtomAccessible kernel atom

def MeasurableQuantitativeLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat) : Prop :=
  MeasurableLaminarCertifiedAtAtom
    kernel
    atom
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon ∧
      MeasurableAtomHittingBoundAtAtom kernel atom hitBound

def MeasurableQuantitativeHarrisCertified
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat) : Prop :=
  MeasurableHarrisCertified
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon ∧
      MeasurableReferencePositiveHittingBound kernel reference hitBound

def MeasurableRealObservableWitness
    {state : Type*}
    [MeasurableSpace state]
    (observable : state -> Real)
    (smallSet : Set state) : Prop :=
  Measurable observable ∧ MeasurableSet smallSet

def MeasurableLyapunovDriftWitness
    {state : Type*}
    [MeasurableSpace state]
    (expectedObservable lyapunov : state -> Real)
    (smallSet : Set state)
    (driftGap : Real) : Prop :=
  Measurable expectedObservable ∧
    Measurable lyapunov ∧
      MeasurableSet smallSet ∧
        0 < driftGap ∧
          ∀ current : state,
            current ∉ smallSet ->
              expectedObservable current <= lyapunov current - driftGap

/-
Packages the measurable queue-Harris surface used by Betti's emitted
observable/Lyapunov certificates: quantitative Harris recurrence together with
a measurable observable and a measurable drift witness.
-/
def MeasurableContinuousHarrisWitness
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (observable expectedObservable lyapunov : state -> Real)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (driftGap : Real) : Prop :=
  MeasurableQuantitativeHarrisCertified
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    hitBound ∧
      MeasurableRealObservableWitness observable smallSet ∧
        MeasurableLyapunovDriftWitness expectedObservable lyapunov smallSet driftGap

def MeasurableReferencePositiveRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state) : Prop :=
  forall measurableSet : Set state,
    MeasurableSet measurableSet ->
      reference measurableSet > 0 ->
        forall current : state,
          ∃ n : ℕ, (kernel ^ n) current measurableSet > 0

def MeasurableQuantitativeReferencePositiveRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  forall measurableSet : Set state,
    MeasurableSet measurableSet ->
      reference measurableSet > 0 ->
        forall current : state,
          ∃ n : ℕ, n <= hitBound current ∧ (kernel ^ n) current measurableSet > 0

def MeasurableReferencePositivePersistent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  forall measurableSet : Set state,
    MeasurableSet measurableSet ->
      reference measurableSet > 0 ->
        forall current : state,
          forall n : Nat,
            hitBound current <= n ->
              (kernel ^ n) current measurableSet > 0

def MeasurableEventuallyConvergesToReference
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  forall current : state,
    forall n : Nat,
      hitBound current <= n ->
        (kernel ^ n) current = reference

def MeasurableFiniteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat) : Prop :=
  MeasurableQuantitativeHarrisCertified
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    hitBound ∧
      MeasurableEventuallyConvergesToReference kernel reference hitBound

def MeasurableFiniteTimeGeometricStability
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  MeasurableEventuallyConvergesToReference kernel reference hitBound

def MeasurableFiniteTimeGeometricEnvelope
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  MeasurableQuantitativeReferencePositiveRecurrent
    kernel
    reference
    hitBound ∧
      MeasurableReferencePositivePersistent kernel reference hitBound ∧
        MeasurableFiniteTimeGeometricStability kernel reference hitBound

def MeasurableHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state) : Prop :=
  MeasurableReferencePositiveRecurrent kernel reference

def MeasurableFiniteTimeGeometricErgodic
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  MeasurableFiniteTimeGeometricEnvelope kernel reference hitBound

def MeasurableLevyProkhorovEventuallyZero
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  forall current : state,
    forall n : Nat,
      hitBound current <= n ->
        MeasureTheory.levyProkhorovDist ((kernel ^ n) current) reference = 0

def MeasurableFiniteTimeLevyProkhorovGeometricErgodic
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat) : Prop :=
  MeasurableFiniteTimeGeometricErgodic kernel reference hitBound ∧
    MeasurableLevyProkhorovEventuallyZero kernel reference hitBound

def MeasurableLevyProkhorovGeometricDecayAfterBurnIn
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat)
    (rate : ℝ) : Prop :=
  0 <= rate ∧
    rate < 1 ∧
      forall current : state,
        forall n : Nat,
          MeasureTheory.levyProkhorovDist
              ((kernel ^ (n + hitBound current)) current)
              reference <= rate ^ n

def MeasurableLevyProkhorovGeometricErgodic
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state) : Prop :=
  ∃ hitBound : state -> Nat,
    ∃ prefactor : state -> ℝ,
      ∃ rate : ℝ,
        (forall current : state, 0 <= prefactor current) ∧
          0 <= rate ∧
            rate < 1 ∧
              forall current : state,
                forall n : Nat,
                  MeasureTheory.levyProkhorovDist
                      ((kernel ^ (n + hitBound current)) current)
                      reference <= prefactor current * rate ^ n

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

theorem measurableReferencePositiveRecurrent_of_harrisCertified
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_certified :
      MeasurableHarrisCertified
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon) :
    MeasurableReferencePositiveRecurrent kernel reference := by
  intro measurableSet h_measurableSet h_positive current
  exact h_certified.2.2 measurableSet h_measurableSet h_positive current

theorem measurableHarrisRecurrent_of_harrisCertified
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_certified :
      MeasurableHarrisCertified
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon) :
    MeasurableHarrisRecurrent kernel reference := by
  exact measurableReferencePositiveRecurrent_of_harrisCertified
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    h_certified

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

theorem measurableLaminarCertifiedAtAtom_of_atomAccessible
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
    MeasurableLaminarCertifiedAtAtom
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon := by
  exact ⟨
    measurableHarrisCertified_of_atomAccessible
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      h_atom_small
      h_accessible
      h_invariant
      h_small,
    h_accessible
  ⟩

theorem measurableSmallSetAccessible_of_laminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_certified :
      MeasurableLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon) :
    MeasurableSmallSetAccessible kernel smallSet := by
  exact h_certified.1.2.1

theorem measurableContainingAtomAccessible_of_laminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet measurableSet : Set state)
    (epsilon : ℝ≥0∞)
    (h_certified :
      MeasurableLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon)
    (h_measurableSet : MeasurableSet measurableSet)
    (h_atom_mem : atom ∈ measurableSet) :
    forall current : state,
      ∃ n : ℕ, (kernel ^ n) current measurableSet > 0 := by
  have h_dirac_accessible :
      MeasurableReferencePositiveAccessible kernel (MeasureTheory.Measure.dirac atom) :=
    h_certified.1.2.2
  have h_positive : MeasureTheory.Measure.dirac atom measurableSet > 0 := by
    simp [h_atom_mem]
  exact h_dirac_accessible measurableSet h_measurableSet h_positive

theorem measurableQuantitativeLaminarCertifiedAtAtom_of_components
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_certified :
      MeasurableLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon)
    (h_bound : MeasurableAtomHittingBoundAtAtom kernel atom hitBound) :
    MeasurableQuantitativeLaminarCertifiedAtAtom
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound := by
  exact ⟨h_certified, h_bound⟩

theorem measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet measurableSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_certified :
      MeasurableQuantitativeLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound)
    (h_atom_mem : atom ∈ measurableSet) :
    forall current : state,
      ∃ n : ℕ, n <= hitBound current ∧ (kernel ^ n) current measurableSet > 0 := by
  intro current
  rcases h_certified.2 current with ⟨n, h_le, h_hit_atom⟩
  refine ⟨n, h_le, lt_of_lt_of_le h_hit_atom ?_⟩
  exact MeasureTheory.measure_mono (by
    intro point h_point
    have h_point_eq : point = atom := by
      simpa using h_point
    simpa [h_point_eq] using h_atom_mem)

theorem measurableSmallSetHittingBound_of_quantitativeLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_atom_small : atom ∈ smallSet)
    (h_certified :
      MeasurableQuantitativeLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    forall current : state,
      ∃ n : ℕ, n <= hitBound current ∧ (kernel ^ n) current smallSet > 0 := by
  exact measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom
    kernel
    atom
    invariantMeasure
    minorizationMeasure
    smallSet
    smallSet
    epsilon
    hitBound
    h_certified
    h_atom_small

theorem measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_certified :
      MeasurableQuantitativeLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableReferencePositiveHittingBound
      kernel
      (MeasureTheory.Measure.dirac atom)
      hitBound := by
  intro measurableSet h_measurableSet h_positive current
  by_cases h_atom_mem : atom ∈ measurableSet
  · exact measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      measurableSet
      epsilon
      hitBound
      h_certified
      h_atom_mem
      current
  · have h_not_positive : ¬ MeasureTheory.Measure.dirac atom measurableSet > 0 := by
      simp [h_atom_mem]
    exact False.elim (h_not_positive h_positive)

theorem measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom
    {state : Type*}
    [MeasurableSpace state]
    [MeasurableSingletonClass state]
    (kernel : ProbabilityTheory.Kernel state state)
    (atom : state)
    (invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_certified :
      MeasurableQuantitativeLaminarCertifiedAtAtom
        kernel
        atom
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableQuantitativeHarrisCertified
      kernel
      (MeasureTheory.Measure.dirac atom)
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound := by
  exact ⟨
    h_certified.1.1,
    measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom
      kernel
      atom
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_certified
  ⟩

theorem measurableContinuousHarrisWitness_of_components
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (observable expectedObservable lyapunov : state -> Real)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (driftGap : Real)
    (h_harris :
      MeasurableQuantitativeHarrisCertified
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound)
    (h_observable : MeasurableRealObservableWitness observable smallSet)
    (h_drift :
      MeasurableLyapunovDriftWitness
        expectedObservable
        lyapunov
        smallSet
        driftGap) :
    MeasurableContinuousHarrisWitness
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      observable
      expectedObservable
      lyapunov
      smallSet
      epsilon
      hitBound
      driftGap := by
  exact ⟨h_harris, h_observable, h_drift⟩

theorem measurableQuantitativeReferencePositiveRecurrent_of_quantitativeHarrisCertified
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_quantitative :
      MeasurableQuantitativeHarrisCertified
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableQuantitativeReferencePositiveRecurrent
      kernel
      reference
      hitBound := by
  intro measurableSet h_measurableSet h_positive current
  exact h_quantitative.2 measurableSet h_measurableSet h_positive current

theorem measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_quantitative :
      MeasurableQuantitativeHarrisCertified
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound)
    (h_converges : MeasurableEventuallyConvergesToReference kernel reference hitBound) :
    MeasurableFiniteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound := by
  exact ⟨h_quantitative, h_converges⟩

theorem measurableReferencePositivePersistent_of_eventualConvergence
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat)
    (h_converges : MeasurableEventuallyConvergesToReference kernel reference hitBound) :
    forall measurableSet : Set state,
      MeasurableSet measurableSet ->
        reference measurableSet > 0 ->
          forall current : state,
            forall n : Nat,
              hitBound current <= n ->
                (kernel ^ n) current measurableSet > 0 := by
  intro measurableSet h_measurableSet h_positive current n h_le
  rw [h_converges current n h_le]
  exact h_positive

theorem measurableReferencePositivePersistent_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableReferencePositivePersistent
      kernel
      reference
      hitBound := by
  exact measurableReferencePositivePersistent_of_eventualConvergence
    kernel
    reference
    hitBound
    h_finite.2

theorem measurableFiniteTimeGeometricStability_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableFiniteTimeGeometricStability
      kernel
      reference
      hitBound := by
  exact h_finite.2

theorem measurableFiniteTimeGeometricEnvelope_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableFiniteTimeGeometricEnvelope
      kernel
      reference
      hitBound := by
  refine ⟨?_, ?_, ?_⟩
  · exact measurableQuantitativeReferencePositiveRecurrent_of_quantitativeHarrisCertified
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_finite.1
  · exact measurableReferencePositivePersistent_of_finiteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_finite
  · exact measurableFiniteTimeGeometricStability_of_finiteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_finite

theorem measurableHarrisRecurrent_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableHarrisRecurrent
      kernel
      reference := by
  exact measurableHarrisRecurrent_of_harrisCertified
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    h_finite.1.1

theorem measurableFiniteTimeGeometricErgodic_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableFiniteTimeGeometricErgodic
      kernel
      reference
      hitBound := by
  exact measurableFiniteTimeGeometricEnvelope_of_finiteTimeHarrisRecurrent
    kernel
    reference
    invariantMeasure
    minorizationMeasure
    smallSet
    epsilon
    hitBound
    h_finite

theorem measurableLevyProkhorovEventuallyZero_of_eventualConvergence
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat)
    (h_converges : MeasurableEventuallyConvergesToReference kernel reference hitBound) :
    MeasurableLevyProkhorovEventuallyZero kernel reference hitBound := by
  intro current n h_le
  rw [h_converges current n h_le]
  exact MeasureTheory.levyProkhorovDist_self reference

theorem measurableLevyProkhorovEventuallyZero_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableLevyProkhorovEventuallyZero
      kernel
      reference
      hitBound := by
  exact measurableLevyProkhorovEventuallyZero_of_eventualConvergence
    kernel
    reference
    hitBound
    h_finite.2

theorem measurableFiniteTimeLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableFiniteTimeLevyProkhorovGeometricErgodic
      kernel
      reference
      hitBound := by
  refine ⟨?_, ?_⟩
  · exact measurableFiniteTimeGeometricErgodic_of_finiteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_finite
  · exact measurableLevyProkhorovEventuallyZero_of_finiteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      h_finite

theorem measurableLevyProkhorovGeometricDecayAfterBurnIn_of_eventualConvergence
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat)
    (rate : ℝ)
    (h_rate_nonneg : 0 <= rate)
    (h_rate_lt_one : rate < 1)
    (h_converges : MeasurableEventuallyConvergesToReference kernel reference hitBound) :
    MeasurableLevyProkhorovGeometricDecayAfterBurnIn
      kernel
      reference
      hitBound
      rate := by
  refine ⟨h_rate_nonneg, h_rate_lt_one, ?_⟩
  intro current n
  have h_bound : hitBound current <= n + hitBound current := by
    exact Nat.le_add_left (hitBound current) n
  rw [h_converges current (n + hitBound current) h_bound]
  rw [MeasureTheory.levyProkhorovDist_self]
  exact pow_nonneg h_rate_nonneg n

theorem measurableLevyProkhorovGeometricDecayAfterBurnIn_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (rate : ℝ)
    (h_rate_nonneg : 0 <= rate)
    (h_rate_lt_one : rate < 1)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableLevyProkhorovGeometricDecayAfterBurnIn
      kernel
      reference
      hitBound
      rate := by
  exact measurableLevyProkhorovGeometricDecayAfterBurnIn_of_eventualConvergence
    kernel
    reference
    hitBound
    rate
    h_rate_nonneg
    h_rate_lt_one
    h_finite.2

theorem measurableLevyProkhorovGeometricErgodic_of_decayAfterBurnIn
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference : MeasureTheory.Measure state)
    (hitBound : state -> Nat)
    (rate : ℝ)
    (h_decay :
      MeasurableLevyProkhorovGeometricDecayAfterBurnIn
        kernel
        reference
        hitBound
        rate) :
    MeasurableLevyProkhorovGeometricErgodic
      kernel
      reference := by
  rcases h_decay with ⟨h_rate_nonneg, h_rate_lt_one, h_decay_bound⟩
  refine ⟨hitBound, fun _ => 1, rate, ?_, h_rate_nonneg, h_rate_lt_one, ?_⟩
  · intro current
    norm_num
  · intro current n
    have h_bound := h_decay_bound current n
    simpa using h_bound

theorem measurableLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    {state : Type*}
    [MeasurableSpace state]
    [PseudoEMetricSpace state]
    [OpensMeasurableSpace state]
    (kernel : ProbabilityTheory.Kernel state state)
    (reference invariantMeasure minorizationMeasure : MeasureTheory.Measure state)
    (smallSet : Set state)
    (epsilon : ℝ≥0∞)
    (hitBound : state -> Nat)
    (h_finite :
      MeasurableFiniteTimeHarrisRecurrent
        kernel
        reference
        invariantMeasure
        minorizationMeasure
        smallSet
        epsilon
        hitBound) :
    MeasurableLevyProkhorovGeometricErgodic
      kernel
      reference := by
  exact measurableLevyProkhorovGeometricErgodic_of_decayAfterBurnIn
    kernel
    reference
    hitBound
    (1 / 2)
    (measurableLevyProkhorovGeometricDecayAfterBurnIn_of_finiteTimeHarrisRecurrent
      kernel
      reference
      invariantMeasure
      minorizationMeasure
      smallSet
      epsilon
      hitBound
      (1 / 2)
      (by norm_num)
      (by norm_num)
      h_finite)

theorem nat_iterate_queueStep_stays_at_atom
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    forall n : Nat,
      ((fun current : Nat => if current <= boundary then atom else current - 1)^[n]) atom = atom := by
  intro n
  induction n with
  | zero =>
      rfl
  | succ n ih =>
      rw [Function.iterate_succ_apply]
      simp [h_atom_small, ih]

theorem natMeasurableEventuallyConvergesToAtom_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableEventuallyConvergesToReference
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (fun current : Nat => current - boundary + 1) := by
  intro current n h_le
  rcases Nat.exists_eq_add_of_le h_le with ⟨extra, rfl⟩
  apply MeasureTheory.Measure.ext
  intro measurableSet h_measurableSet
  rw [add_comm, deterministic_pow_eq_deterministic_iterate]
  rw [ProbabilityTheory.Kernel.deterministic_apply]
  have h_hit :
      ((fun current : Nat => if current <= boundary then atom else current - 1)^[current - boundary + 1])
        current = atom :=
    nat_iterate_queueStep_hits_atom boundary atom current
  have h_stay :
      ((fun current : Nat => if current <= boundary then atom else current - 1)^[extra]) atom = atom :=
    nat_iterate_queueStep_stays_at_atom boundary atom h_atom_small extra
  have h_iter :
      ((fun current : Nat => if current <= boundary then atom else current - 1)^[extra + (current - boundary + 1)])
        current = atom := by
    rw [Function.iterate_add_apply, h_hit, h_stay]
  simp [h_iter]

theorem natMeasurableHarrisCertified_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableHarrisCertified
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1 := by
  exact measurableHarrisCertified_of_atomAccessible
    (ProbabilityTheory.Kernel.deterministic
      (fun current : Nat => if current <= boundary then atom else current - 1)
      (measurable_of_countable _))
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    h_atom_small
    (natMeasurableAtomAccessible_of_queueStep boundary atom)
    (natQueueSupportInvariantAtAtom boundary atom h_atom_small)
    (natQueueSupportSmallSetMinorized boundary atom)

theorem natMeasurableLaminarCertified_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableLaminarCertifiedAtAtom
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      atom
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1 := by
  exact ⟨
    natMeasurableHarrisCertified_of_queueStep boundary atom h_atom_small,
    natMeasurableAtomAccessible_of_queueStep boundary atom
  ⟩

theorem natMeasurableQuantitativeLaminarCertified_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableQuantitativeLaminarCertifiedAtAtom
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      atom
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1
      (fun current : Nat => current - boundary + 1) := by
  exact measurableQuantitativeLaminarCertifiedAtAtom_of_components
    (ProbabilityTheory.Kernel.deterministic
      (fun current : Nat => if current <= boundary then atom else current - 1)
      (measurable_of_countable _))
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    (fun current : Nat => current - boundary + 1)
    (natMeasurableLaminarCertified_of_queueStep boundary atom h_atom_small)
    (natMeasurableAtomHittingBound_of_queueStep boundary atom)

theorem natMeasurableQuantitativeHarrisCertified_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableQuantitativeHarrisCertified
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1
      (fun current : Nat => current - boundary + 1) := by
  exact measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom
    (ProbabilityTheory.Kernel.deterministic
      (fun current : Nat => if current <= boundary then atom else current - 1)
      (measurable_of_countable _))
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    (fun current : Nat => current - boundary + 1)
    (natMeasurableQuantitativeLaminarCertified_of_queueStep boundary atom h_atom_small)

def natQueueAffineObservable
    (scale offset : Real) :
    Nat -> Real :=
  fun current => scale * current + offset

def natQueueAffineExpectedObservable
    (boundary atom : Nat)
    (scale offset : Real) :
    Nat -> Real :=
  fun current =>
    if current <= boundary then
      scale * atom + offset
    else
      scale * current + offset - scale

theorem natMeasurableRealObservableWitness_of_queueStep
    (boundary : Nat)
    (scale offset : Real) :
    MeasurableRealObservableWitness
      (natQueueAffineObservable scale offset)
      {current : Nat | current <= boundary} := by
  constructor
  · exact measurable_of_countable _
  · exact (Set.to_countable _).measurableSet

theorem natMeasurableLyapunovDriftWitness_of_queueStep_with_gap
    (boundary atom : Nat)
    (scale : Real)
    (offset : Real)
    (driftGap : Real)
    (h_driftGap : 0 < driftGap)
    (h_driftGap_le_scale : driftGap <= scale) :
    MeasurableLyapunovDriftWitness
      (natQueueAffineExpectedObservable boundary atom scale offset)
      (natQueueAffineObservable scale offset)
      {current : Nat | current <= boundary}
      driftGap := by
  constructor
  · exact measurable_of_countable _
  constructor
  · exact measurable_of_countable _
  constructor
  · exact (Set.to_countable _).measurableSet
  constructor
  · exact h_driftGap
  · intro current h_not_small
    have h_current_gt : boundary < current := Nat.lt_of_not_ge h_not_small
    have h_current_not_le : ¬ current ≤ boundary := Nat.not_le_of_gt h_current_gt
    calc
      natQueueAffineExpectedObservable boundary atom scale offset current
          = natQueueAffineObservable scale offset current - scale := by
            simp [
              natQueueAffineExpectedObservable,
              natQueueAffineObservable,
              h_current_not_le,
            ]
      _ <= natQueueAffineObservable scale offset current - driftGap := by
        linarith

theorem natMeasurableLyapunovDriftWitness_of_queueStep
    (boundary atom : Nat)
    (scale : Real)
    (offset : Real)
    (h_scale : 0 < scale) :
    MeasurableLyapunovDriftWitness
      (natQueueAffineExpectedObservable boundary atom scale offset)
      (natQueueAffineObservable scale offset)
      {current : Nat | current <= boundary}
      scale := by
  exact natMeasurableLyapunovDriftWitness_of_queueStep_with_gap
    boundary
    atom
    scale
    offset
    scale
    h_scale
    le_rfl

/-
The deterministic queue support kernel admits a bounded affine observable /
Lyapunov witness whenever the drift gap stays within the one-step affine drop:
0 < driftGap <= scale.
-/
theorem natMeasurableContinuousHarrisWitness_of_queueStep_with_gap
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary)
    (scale : Real)
    (offset : Real)
    (driftGap : Real)
    (h_driftGap : 0 < driftGap)
    (h_driftGap_le_scale : driftGap <= scale) :
    MeasurableContinuousHarrisWitness
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (natQueueAffineObservable scale offset)
      (natQueueAffineExpectedObservable boundary atom scale offset)
      (natQueueAffineObservable scale offset)
      {current : Nat | current <= boundary}
      1
      (fun current : Nat => current - boundary + 1)
      driftGap := by
  exact measurableContinuousHarrisWitness_of_components
    (ProbabilityTheory.Kernel.deterministic
      (fun current : Nat => if current <= boundary then atom else current - 1)
      (measurable_of_countable _))
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    (natQueueAffineObservable scale offset)
    (natQueueAffineExpectedObservable boundary atom scale offset)
    (natQueueAffineObservable scale offset)
    {current : Nat | current <= boundary}
    1
    (fun current : Nat => current - boundary + 1)
    driftGap
    (natMeasurableQuantitativeHarrisCertified_of_queueStep boundary atom h_atom_small)
    (natMeasurableRealObservableWitness_of_queueStep boundary scale offset)
    (natMeasurableLyapunovDriftWitness_of_queueStep_with_gap
      boundary
      atom
      scale
      offset
      driftGap
      h_driftGap
      h_driftGap_le_scale)

theorem natMeasurableContinuousHarrisWitness_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary)
    (scale : Real)
    (offset : Real)
    (h_scale : 0 < scale) :
    MeasurableContinuousHarrisWitness
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (natQueueAffineObservable scale offset)
      (natQueueAffineExpectedObservable boundary atom scale offset)
      (natQueueAffineObservable scale offset)
      {current : Nat | current <= boundary}
      1
      (fun current : Nat => current - boundary + 1)
      scale := by
  exact natMeasurableContinuousHarrisWitness_of_queueStep_with_gap
    boundary
    atom
    h_atom_small
    scale
    offset
    scale
    h_scale
    le_rfl

def realQueueLinearObservable
    (scale : Real) :
    Real -> Real :=
  fun current => scale * current

noncomputable def realQueueLinearExpectedObservable
    (boundary atom step scale : Real) :
    Real -> Real :=
  fun current => if current <= boundary then scale * atom else scale * current - scale * step

theorem realMeasurableRealObservableWitness_of_queueStep
    (boundary scale : Real) :
    MeasurableRealObservableWitness
      (realQueueLinearObservable scale)
      (Set.Iic boundary) := by
  constructor
  · simpa [realQueueLinearObservable] using (measurable_const.mul measurable_id)
  · exact measurableSet_Iic

theorem realMeasurableLyapunovDriftWitness_of_queueStep
    (boundary atom step scale : Real)
    (h_step : 0 < step)
    (h_scale : 0 < scale) :
    MeasurableLyapunovDriftWitness
      (realQueueLinearExpectedObservable boundary atom step scale)
      (realQueueLinearObservable scale)
      (Set.Iic boundary)
      (scale * step) := by
  constructor
  · exact Measurable.ite measurableSet_Iic
      measurable_const
      (by
        simpa [realQueueLinearObservable] using
          ((measurable_const.mul measurable_id).sub measurable_const))
  constructor
  · simpa [realQueueLinearObservable] using (measurable_const.mul measurable_id)
  constructor
  · exact measurableSet_Iic
  constructor
  · positivity
  · intro current h_not_small
    have h_current_gt : boundary < current := lt_of_not_ge h_not_small
    have h_current_not_le : ¬ current ≤ boundary := not_le_of_gt h_current_gt
    rw [show realQueueLinearExpectedObservable boundary atom step scale current =
        realQueueLinearObservable scale current - scale * step by
          simp [realQueueLinearExpectedObservable, realQueueLinearObservable, h_current_not_le]]

/-! ### Continuous-state level-set Lyapunov witnesses

    For continuous observables (fluid-backlog, thermal-load, etc.) where the state
    is real-valued, the small set is C = {x | V(x) <= boundary} (level set)
    and V(x) = scale * observable(x) + offset is the Lyapunov function.
    The drift condition is: E[V(X') | X=x] <= V(x) - gap for x outside C. -/

/-- Affine Lyapunov function for continuous observables: V(x) = scale * x + offset. -/
noncomputable def realContinuousAffineV
    (scale offset : Real) : Real -> Real :=
  fun x => scale * x + offset

/-- Expected Lyapunov after one step for continuous affine observables.
    Inside the level set, the expected value is bounded by the boundary value.
    Outside, V decreases by the drift gap. -/
noncomputable def realContinuousAffineExpectedV
    (boundary scale offset gap : Real) : Real -> Real :=
  fun x => if scale * x + offset ≤ boundary then boundary else scale * x + offset - gap

/-- Measurability of the affine Lyapunov function and level-set small set. -/
theorem realMeasurableObservable_of_continuousAffine
    (scale offset boundary : Real) :
    MeasurableRealObservableWitness
      (realContinuousAffineV scale offset)
      {x | realContinuousAffineV scale offset x ≤ boundary} := by
  constructor
  · exact (measurable_const.mul measurable_id).add measurable_const
  · exact measurableSet_le ((measurable_const.mul measurable_id).add measurable_const) measurable_const

/-- Drift witness for continuous affine observables with level-set small sets. -/
theorem realMeasurableLyapunovDriftWitness_of_continuousAffineStep
    (boundary scale offset gap : Real)
    (h_gap : 0 < gap)
    (h_scale : 0 < scale) :
    MeasurableLyapunovDriftWitness
      (realContinuousAffineExpectedV boundary scale offset gap)
      (realContinuousAffineV scale offset)
      {x | realContinuousAffineV scale offset x ≤ boundary}
      gap := by
  constructor
  · exact Measurable.ite
      (measurableSet_le ((measurable_const.mul measurable_id).add measurable_const)
        measurable_const)
      measurable_const
      (((measurable_const.mul measurable_id).add measurable_const).sub measurable_const)
  constructor
  · exact (measurable_const.mul measurable_id).add measurable_const
  constructor
  · exact measurableSet_le ((measurable_const.mul measurable_id).add measurable_const)
      measurable_const
  constructor
  · exact h_gap
  · intro current h_not_small
    have h_gt : boundary < realContinuousAffineV scale offset current := lt_of_not_ge h_not_small
    have h_not_le : ¬ (scale * current + offset ≤ boundary) := by
      simpa [realContinuousAffineV] using not_le_of_gt h_gt
    show realContinuousAffineExpectedV boundary scale offset gap current ≤
        realContinuousAffineV scale offset current - gap
    simp only [realContinuousAffineExpectedV, realContinuousAffineV, h_not_le, ite_false]

open Lean Elab Tactic in
elab "derive_gnosis_drift" : tactic => do
  evalTactic (← `(tactic|
    first
    | refine realMeasurableLyapunovDriftWitness_of_continuousAffineStep _ _ _ _ ?_ ?_
      · positivity
      · positivity
    | refine realMeasurableLyapunovDriftWitness_of_queueStep _ _ _ _ ?_ ?_
      · positivity
      · positivity
    | refine natMeasurableLyapunovDriftWitness_of_queueStep _ _ _ ?_
      positivity))

theorem natMeasurableHarrisCertified_of_queueWitnessKernel
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableHarrisCertified
      (natQueueWitnessKernel boundary atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1 := by
  exact measurableHarrisCertified_of_atomAccessible
    (natQueueWitnessKernel boundary atom)
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    h_atom_small
    (natMeasurableAtomAccessible_of_queueWitnessKernel boundary atom)
    (natQueueWitnessInvariantAtAtom boundary atom h_atom_small)
    (natQueueWitnessSmallSetMinorized boundary atom)

theorem natMeasurableLaminarCertified_of_queueWitnessKernel
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableLaminarCertifiedAtAtom
      (natQueueWitnessKernel boundary atom)
      atom
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1 := by
  exact ⟨
    natMeasurableHarrisCertified_of_queueWitnessKernel boundary atom h_atom_small,
    natMeasurableAtomAccessible_of_queueWitnessKernel boundary atom
  ⟩

theorem natMeasurableQuantitativeLaminarCertified_of_queueWitnessKernel
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableQuantitativeLaminarCertifiedAtAtom
      (natQueueWitnessKernel boundary atom)
      atom
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1
      (fun _ : Nat => 1) := by
  exact measurableQuantitativeLaminarCertifiedAtAtom_of_components
    (natQueueWitnessKernel boundary atom)
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    (fun _ : Nat => 1)
    (natMeasurableLaminarCertified_of_queueWitnessKernel boundary atom h_atom_small)
    (natMeasurableAtomHittingBound_of_queueWitnessKernel boundary atom)

theorem natMeasurableQuantitativeHarrisCertified_of_queueWitnessKernel
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableQuantitativeHarrisCertified
      (natQueueWitnessKernel boundary atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1
      (fun _ : Nat => 1) := by
  exact measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom
    (natQueueWitnessKernel boundary atom)
    atom
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    (fun _ : Nat => 1)
    (natMeasurableQuantitativeLaminarCertified_of_queueWitnessKernel boundary atom h_atom_small)

theorem natMeasurableFiniteTimeHarrisRecurrent_of_queueStep
    (boundary atom : Nat)
    (h_atom_small : atom <= boundary) :
    MeasurableFiniteTimeHarrisRecurrent
      (ProbabilityTheory.Kernel.deterministic
        (fun current : Nat => if current <= boundary then atom else current - 1)
        (measurable_of_countable _))
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      (MeasureTheory.Measure.dirac atom)
      {current : Nat | current <= boundary}
      1
      (fun current : Nat => current - boundary + 1) := by
  exact measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence
    (ProbabilityTheory.Kernel.deterministic
      (fun current : Nat => if current <= boundary then atom else current - 1)
      (measurable_of_countable _))
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    (MeasureTheory.Measure.dirac atom)
    {current : Nat | current <= boundary}
    1
    (fun current : Nat => current - boundary + 1)
    (natMeasurableQuantitativeHarrisCertified_of_queueStep boundary atom h_atom_small)
    (natMeasurableEventuallyConvergesToAtom_of_queueStep boundary atom h_atom_small)

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

def coupledArrivalCertificate
    (certificate : DriftCertificate)
    (arrivalPressure : Real) : DriftCertificate where
  gamma := certificate.gamma - arrivalPressure
  arrivalRate := certificate.arrivalRate + arrivalPressure
  serviceRate := certificate.serviceRate
  ventRate := certificate.ventRate

def coupledCertifiedKernel
    (kernel : CertifiedKernel nodeCount)
    (arrivalPressure : Real) : CertifiedKernel nodeCount :=
  match kernel.drift with
  | none => kernel
  | some certificate =>
      { kernel with
        drift := some (coupledArrivalCertificate certificate arrivalPressure) }

theorem driftAt_coupledArrivalCertificate
    (certificate : DriftCertificate)
    (arrivalPressure : Real)
    (queueDepth : Nat) :
    driftAt (coupledArrivalCertificate certificate arrivalPressure) queueDepth =
      driftAt certificate queueDepth + arrivalPressure := by
  simp [coupledArrivalCertificate, driftAt]
  ring

theorem coupledArrivalCertificate_negative_drift
    (certificate : DriftCertificate)
    (arrivalPressure : Real)
    (h_arrival_nonnegative : 0 ≤ arrivalPressure)
    (h_arrival_lt_gamma : arrivalPressure < certificate.gamma)
    (h_floor : forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma) :
    0 ≤ arrivalPressure ∧
      0 < (coupledArrivalCertificate certificate arrivalPressure).gamma ∧
        forall queueDepth : Nat,
          driftAt (coupledArrivalCertificate certificate arrivalPressure) queueDepth <=
            -(coupledArrivalCertificate certificate arrivalPressure).gamma := by
  constructor
  · exact h_arrival_nonnegative
  constructor
  · simp [coupledArrivalCertificate]
    linarith [h_arrival_nonnegative, h_arrival_lt_gamma]
  · intro queueDepth
    rw [driftAt_coupledArrivalCertificate]
    simp [coupledArrivalCertificate]
    have h_base := h_floor queueDepth
    linarith [h_base, h_arrival_nonnegative]

theorem coupledCertifiedKernel_stable
    [NeZero nodeCount]
    (kernel : CertifiedKernel nodeCount)
    (certificate : DriftCertificate)
    (arrivalPressure : Real)
    (h_kernel : kernel.drift = some certificate)
    (h_spectral : SpectrallyStable kernel)
    (h_arrival_nonnegative : 0 ≤ arrivalPressure)
    (h_arrival_lt_gamma : arrivalPressure < certificate.gamma)
    (h_floor : forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma) :
    GeometricStability (coupledCertifiedKernel kernel arrivalPressure) := by
  have h_coupled_drift :=
    coupledArrivalCertificate_negative_drift
      certificate
      arrivalPressure
      h_arrival_nonnegative
      h_arrival_lt_gamma
      h_floor
  apply certifiedKernel_stable_of_drift_certificate
    (kernel := coupledCertifiedKernel kernel arrivalPressure)
    (certificate := coupledArrivalCertificate certificate arrivalPressure)
  · simp [coupledCertifiedKernel, h_kernel, coupledArrivalCertificate]
  · simpa [coupledCertifiedKernel, h_kernel, coupledArrivalCertificate, SpectrallyStable] using h_spectral
  · exact h_coupled_drift.2.1
  · exact h_coupled_drift.2.2

theorem tetheredCertifiedKernels_stable
    [NeZero upstreamCount]
    [NeZero downstreamCount]
    (upstream : CertifiedKernel upstreamCount)
    (downstream : CertifiedKernel downstreamCount)
    (certificate : DriftCertificate)
    (arrivalPressure : Real)
    (h_upstream : GeometricStability upstream)
    (h_downstream : downstream.drift = some certificate)
    (h_downstream_spectral : SpectrallyStable downstream)
    (h_arrival_nonnegative : 0 ≤ arrivalPressure)
    (h_arrival_lt_gamma : arrivalPressure < certificate.gamma)
    (h_floor : forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma) :
    GeometricStability upstream ∧
      GeometricStability (coupledCertifiedKernel downstream arrivalPressure) := by
  constructor
  · exact h_upstream
  · exact
      coupledCertifiedKernel_stable
        downstream
        certificate
        arrivalPressure
        h_downstream
        h_downstream_spectral
        h_arrival_nonnegative
        h_arrival_lt_gamma
        h_floor

/- ── Recursive Coarsening Synthesis ──────────────────────────────────── -/

structure RawGraphData (fineCount coarseCount : Nat) where
  quotientMap : Fin fineCount -> Fin coarseCount
  arrivalRate : Fin fineCount -> Real
  serviceRate : Fin fineCount -> Real
  hServicePositive : forall node : Fin fineCount, 0 < serviceRate node

def aggregateArrival {fineCount coarseCount : Nat}
    (data : RawGraphData fineCount coarseCount)
    (coarseNode : Fin coarseCount) : Real :=
  Finset.sum Finset.univ fun fineNode =>
    if data.quotientMap fineNode = coarseNode then data.arrivalRate fineNode else 0

def aggregateService {fineCount coarseCount : Nat}
    (data : RawGraphData fineCount coarseCount)
    (coarseNode : Fin coarseCount) : Real :=
  Finset.sum Finset.univ fun fineNode =>
    if data.quotientMap fineNode = coarseNode then data.serviceRate fineNode else 0

def coarseDrift {fineCount coarseCount : Nat}
    (data : RawGraphData fineCount coarseCount)
    (coarseNode : Fin coarseCount) : Real :=
  aggregateArrival data coarseNode - aggregateService data coarseNode

structure CoarseDriftCertificate (fineCount coarseCount : Nat) where
  data : RawGraphData fineCount coarseCount
  driftGap : Real
  hDriftGapPositive : 0 < driftGap
  hAllCoarseDriftNegative :
    forall coarseNode : Fin coarseCount,
      coarseDrift data coarseNode <= -driftGap

inductive SynthesisResult (fineCount coarseCount : Nat)
  | success (certificate : CoarseDriftCertificate fineCount coarseCount)
  | unstable (witness : Fin coarseCount)
      (hPositive : 0 <= coarseDrift (certificate : RawGraphData fineCount coarseCount).1 witness)
  | invalid

theorem synthesis_sound {fineCount coarseCount : Nat}
    (certificate : CoarseDriftCertificate fineCount coarseCount)
    (coarseNode : Fin coarseCount) :
    coarseDrift certificate.data coarseNode <= -certificate.driftGap :=
  certificate.hAllCoarseDriftNegative coarseNode

theorem certificate_provides_drift_witness {fineCount coarseCount : Nat}
    (certificate : CoarseDriftCertificate fineCount coarseCount)
    (coarseNode : Fin coarseCount) :
    coarseDrift certificate.data coarseNode < 0 := by
  have h := certificate.hAllCoarseDriftNegative coarseNode
  linarith [certificate.hDriftGapPositive]

def WorkspaceReady : Prop := True

theorem workspace_ready : WorkspaceReady := by
  trivial

end GnosisProofs
