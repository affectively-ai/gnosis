import Mathlib.Tactic

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
  transition : Fin nodeCount -> Fin nodeCount -> Real
  topologyNodes : List String
  smallSetNodeIds : List String
  spectralCeiling : Real
  redline : Real
  geometricCeiling : Real
  drift : Option DriftCertificate

def SpectrallyStable (kernel : CertifiedKernel nodeCount) : Prop :=
  kernel.spectralCeiling < 1

def HasNegativeDrift (kernel : CertifiedKernel nodeCount) : Prop :=
  match kernel.drift with
  | none => True
  | some certificate =>
      0 < certificate.gamma ∧
        forall queueDepth : Nat, driftAt certificate queueDepth <= -certificate.gamma

def GeometricStability (kernel : CertifiedKernel nodeCount) : Prop :=
  SpectrallyStable kernel ∧ HasNegativeDrift kernel

theorem certifiedKernel_stable
    (kernel : CertifiedKernel nodeCount)
    (h_spectral : SpectrallyStable kernel)
    (h_drift : HasNegativeDrift kernel) :
    GeometricStability kernel := by
  exact And.intro h_spectral h_drift

theorem certifiedKernel_stable_of_supremum
    (kernel : CertifiedKernel nodeCount)
    (h_spectral : SpectrallyStable kernel)
    (h_no_drift : kernel.drift = none) :
    GeometricStability kernel := by
  apply certifiedKernel_stable
  · exact h_spectral
  · simp [HasNegativeDrift, h_no_drift]

theorem certifiedKernel_stable_of_drift_certificate
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
