import Mathlib.Tactic

set_option autoImplicit false

namespace ForkRaceFoldTheorems

/--
`CandidateMetrics` is the arithmetic summary used by the Aeon voting rule.

- `approvals`: raw approval count
- `rejections`: raw rejection count
- `representedCommunities`: number of communities with at least one approval
- `totalCommunities`: total communities participating in the election
-/
structure CandidateMetrics where
  approvals : Nat
  rejections : Nat
  representedCommunities : Nat
  totalCommunities : Nat
  represented_le_total : representedCommunities ≤ totalCommunities

/-- Communities not represented by the candidate's approval coalition. -/
def uncoveredCommunities (candidate : CandidateMetrics) : Nat :=
  candidate.totalCommunities - candidate.representedCommunities

/-- Governance deficit: rejection burden plus missing community cover. -/
def governanceDeficit (candidate : CandidateMetrics) : Nat :=
  candidate.rejections + uncoveredCommunities candidate

/-- Primary comparison key: lower governance deficit is better. -/
def strictlyBeatsOnDeficit (left right : CandidateMetrics) : Prop :=
  governanceDeficit left < governanceDeficit right

/-- Secondary comparison key: when deficits tie, more approvals win. -/
def winsApprovalTiebreak (left right : CandidateMetrics) : Prop :=
  governanceDeficit left = governanceDeficit right ∧ right.approvals < left.approvals

/--
Tertiary comparison key: when deficits and approvals tie, broader community
representation wins.
-/
def winsCoverageTiebreak (left right : CandidateMetrics) : Prop :=
  governanceDeficit left = governanceDeficit right ∧
    left.approvals = right.approvals ∧
    right.representedCommunities < left.representedCommunities

/-- A fully covered, rejection-free candidate has zero uncovered communities. -/
theorem uncovered_zero_of_full_cover
    (candidate : CandidateMetrics)
    (hcover : candidate.representedCommunities = candidate.totalCommunities) :
    uncoveredCommunities candidate = 0 := by
  unfold uncoveredCommunities
  omega

/-- A fully covered, rejection-free candidate has zero governance deficit. -/
theorem governanceDeficit_zero_iff_zero_rejection_and_full_cover
    (candidate : CandidateMetrics) :
    governanceDeficit candidate = 0 ↔
      candidate.rejections = 0 ∧ candidate.representedCommunities = candidate.totalCommunities := by
  constructor
  · intro hzero
    have hrej : candidate.rejections = 0 := by
      unfold governanceDeficit uncoveredCommunities at hzero
      omega
    have hsub : candidate.totalCommunities - candidate.representedCommunities = 0 := by
      unfold governanceDeficit uncoveredCommunities at hzero
      omega
    have htotal_le_repr : candidate.totalCommunities ≤ candidate.representedCommunities :=
      Nat.sub_eq_zero_iff_le.mp hsub
    have hrepr_le_total : candidate.representedCommunities ≤ candidate.totalCommunities :=
      candidate.represented_le_total
    unfold governanceDeficit uncoveredCommunities at hzero
    constructor
    · exact hrej
    · exact Nat.le_antisymm hrepr_le_total htotal_le_repr
  · rintro ⟨hrej, hcover⟩
    unfold governanceDeficit uncoveredCommunities
    omega

/-- Governance deficit is always nonnegative. -/
theorem governanceDeficit_nonnegative (candidate : CandidateMetrics) :
    0 ≤ governanceDeficit candidate := by
  unfold governanceDeficit uncoveredCommunities
  omega

/-- Zero governance deficit is the global minimum of the metric. -/
theorem zero_governanceDeficit_globally_optimal
    (winner challenger : CandidateMetrics)
    (hzero : governanceDeficit winner = 0) :
    governanceDeficit winner ≤ governanceDeficit challenger := by
  have hnonneg : 0 ≤ governanceDeficit challenger :=
    governanceDeficit_nonnegative challenger
  omega

/--
Inside the same election, lower rejection strictly beats higher rejection when
community cover is equal.
-/
theorem lower_rejection_strictly_beats_with_same_cover
    (left right : CandidateMetrics)
    (hsameElection : left.totalCommunities = right.totalCommunities)
    (hsameCover : left.representedCommunities = right.representedCommunities)
    (hrej : left.rejections < right.rejections) :
    strictlyBeatsOnDeficit left right := by
  unfold strictlyBeatsOnDeficit governanceDeficit uncoveredCommunities
  rw [← hsameElection, ← hsameCover]
  exact Nat.add_lt_add_right hrej (left.totalCommunities - left.representedCommunities)

/--
Inside the same election, broader community cover strictly beats narrower cover
when rejection count is equal.
-/
theorem higher_cover_strictly_beats_with_same_rejection
    (left right : CandidateMetrics)
    (hsameElection : left.totalCommunities = right.totalCommunities)
    (hsameRejections : left.rejections = right.rejections)
    (hcover : right.representedCommunities < left.representedCommunities) :
    strictlyBeatsOnDeficit left right := by
  unfold strictlyBeatsOnDeficit governanceDeficit uncoveredCommunities
  rw [← hsameElection, ← hsameRejections]
  have hright_lt_total : right.representedCommunities < left.totalCommunities :=
    lt_of_lt_of_le hcover left.represented_le_total
  exact Nat.add_lt_add_left
    (Nat.sub_lt_sub_left hright_lt_total hcover)
    left.rejections

/-- Adding rejections adds exactly the same amount to governance deficit. -/
theorem more_rejections_add_exactly_extra_deficit
    (candidate : CandidateMetrics)
    (extra : Nat) :
    governanceDeficit { candidate with rejections := candidate.rejections + extra } =
      governanceDeficit candidate + extra := by
  unfold governanceDeficit uncoveredCommunities
  simp [Nat.add_assoc, Nat.add_comm]

/-- Positive added rejections strictly increase governance deficit. -/
theorem positive_extra_rejections_strictly_increase_deficit
    (candidate : CandidateMetrics)
    (extra : Nat)
    (hextra : 0 < extra) :
    governanceDeficit candidate <
      governanceDeficit { candidate with rejections := candidate.rejections + extra } := by
  rw [more_rejections_add_exactly_extra_deficit]
  omega

/--
If deficits tie, the candidate with more approvals wins the deterministic
secondary tiebreak.
-/
theorem higher_approval_wins_tied_deficit
    (left right : CandidateMetrics)
    (hdef : governanceDeficit left = governanceDeficit right)
    (happ : right.approvals < left.approvals) :
    winsApprovalTiebreak left right := by
  exact ⟨hdef, happ⟩

/--
If deficits and approvals tie, the candidate with broader community cover wins
the deterministic tertiary tiebreak.
-/
theorem higher_cover_wins_double_tie
    (left right : CandidateMetrics)
    (hdef : governanceDeficit left = governanceDeficit right)
    (happ : left.approvals = right.approvals)
    (hcover : right.representedCommunities < left.representedCommunities) :
    winsCoverageTiebreak left right := by
  exact ⟨hdef, happ, hcover⟩

/--
A one-stream candidate in a genuinely plural election cannot have zero
governance deficit.
-/
theorem one_stream_rule_positive_deficit
    (candidate : CandidateMetrics)
    (hstream : candidate.representedCommunities = 1)
    (hplural : 2 ≤ candidate.totalCommunities) :
    0 < governanceDeficit candidate := by
  unfold governanceDeficit uncoveredCommunities
  omega

/--
A fully covered, rejection-free plural candidate strictly dominates a one-stream
candidate in a plural election.
-/
theorem plural_cover_zero_rejection_strictly_dominates_one_stream
    (plural oneStream : CandidateMetrics)
    (hpluralZero : governanceDeficit plural = 0)
    (honeStream : oneStream.representedCommunities = 1)
    (hpluralElection : 2 ≤ oneStream.totalCommunities) :
    strictlyBeatsOnDeficit plural oneStream := by
  unfold strictlyBeatsOnDeficit
  have hpositive : 0 < governanceDeficit oneStream :=
    one_stream_rule_positive_deficit oneStream honeStream hpluralElection
  omega

/--
The Aeon voting rule's optimality claim: any candidate with zero rejections and
full community cover is globally optimal in the governance-deficit metric.
-/
theorem aeon_voting_optimality_claim
    (winner challenger : CandidateMetrics)
    (hwinner : winner.rejections = 0 ∧ winner.representedCommunities = winner.totalCommunities) :
    governanceDeficit winner ≤ governanceDeficit challenger := by
  have hzero : governanceDeficit winner = 0 :=
    (governanceDeficit_zero_iff_zero_rejection_and_full_cover winner).2 hwinner
  exact zero_governanceDeficit_globally_optimal winner challenger hzero

end ForkRaceFoldTheorems
