// Auto-generated theorem tools for negotiation-mcp
// 28 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_negotiation_deficit',
    description: 'The negotiation deficit between parties with multi-dimensional interests compressed into a single offer stream is strictly positive, equals totalDimensions - 1, and is bounded below totalDimensions. N [LEDGER: THM-NEGOTIATION-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_batna_is_void',
    description: 'The BATNA surface is exactly the void boundary of the negotiation fork/race/fold process. Each negotiation round contributes offerCount - 1 entries to the void boundary. The BATNA grows monotonically  [LEDGER: THM-BATNA-IS-VOID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_concession_gradient',
    description: 'The optimal concession strategy is the void gradient complement distribution. Every term retains positive weight (never say never in negotiation). Less-rejected terms get higher concession weight (lea [LEDGER: THM-CONCESSION-GRADIENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_settlement_stability',
    description: 'Mutual settlement is a Lyapunov-stable fixed point of the void gradient flow. Perturbation of one partys void boundary (one additional rejection) does not destroy the agreement: the complement distri [LEDGER: THM-SETTLEMENT-STABILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_coherence',
    description: 'Two rational agents reading the same rejection history produce identical concession strategies. Same rejected offers + same rational update rule = same next offer. Transparent negotiation works becaus [LEDGER: THM-NEGOTIATION-COHERENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_heat',
    description: 'Failed negotiations generate irreversible thermodynamic heat. Each rejected offer is a vented path; by THM-VOID-DOMINANCE the void of rejected offers dominates the space of accepted terms. The cost of [LEDGER: THM-NEGOTIATION-HEAT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_context_reduces_deficit',
    description: 'Shared context between negotiating parties (prior relationship, market norms, shared vocabulary) reduces the semiotic deficit of the negotiation channel. Sufficient shared context eliminates the defic [LEDGER: THM-CONTEXT-REDUCES-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_convergence',
    description: 'Master theorem: for any negotiation between parties with multi-dimensional interests, (1) confusion is real (deficit positive), (2) confusion is bounded (deficit < totalDimensions), and (3) shared con [LEDGER: THM-NEGOTIATION-CONVERGENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_regret',
    description: 'Negotiation with N offer variants per round achieves O(sqrt(T log N)) regret instead of Omega(sqrt(TN)). The BATNA surface provides N-1 bits of negative information per round. Improvement factor sqrt( [LEDGER: THM-NEGOTIATION-REGRET]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_batna_sufficient_statistic',
    description: 'The BATNA surface is exponentially more compact than storing the full history of rejected offers. Storing every rejected offer costs O(N * T * payloadBits); storing the BATNA surface costs O(T * log N [LEDGER: THM-BATNA-SUFFICIENT-STATISTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_tunnel',
    description: 'Two negotiation threads sharing a common prior proposal have positive mutual information. Precedent transfers across negotiations: prior rejected offers in one negotiation inform a related negotiation [LEDGER: THM-NEGOTIATION-TUNNEL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_negotiation_convergence_extended',
    description: 'Extended master theorem adding regret bound to the original convergence triple: (1) confusion is real, (2) confusion is bounded, (3) context helps, and (4) regret is controlled at O(sqrt(T log N)). [LEDGER: THM-NEGOTIATION-CONVERGENCE-EXTENDED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_batna_attraction',
    description: 'BATNA complement weights are always positive (the attractive gradient never fully abandons any term) and monotone (less BATNA-rejected terms have higher attraction weight). The exact component of the  [LEDGER: THM-BATNA-ATTRACTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_watna_repulsion',
    description: 'Terms with higher WATNA density exert stronger repulsion. WATNA repulsion is zero for terms never classified as catastrophic. The co-exact component of the Hodge decomposition. [LEDGER: THM-WATNA-REPULSION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_hodge_decomposition',
    description: 'The settlement score decomposes as BATNA attraction minus WATNA repulsion. The exact component (BATNA) is always positive. Discrete Hodge decomposition: exact = attraction toward viable, co-exact = re [LEDGER: THM-HODGE-DECOMPOSITION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dual_void_squeeze',
    description: 'When both voids are nonempty, there exists a term with positive settlement score -- BATNA attraction exceeds WATNA repulsion. Settlement exists precisely because two voids squeeze from opposite sides. [LEDGER: THM-DUAL-VOID-SQUEEZE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_duality',
    description: 'BATNA and WATNA are dual: for the same total vent count, a term classified as more BATNA than WATNA has a higher settlement score. The allocation between the two voids matters -- not just the total re [LEDGER: THM-VOID-DUALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dark_matter_energy_conservation',
    description: 'Total void volume is the sum of BATNA (dark matter) and WATNA (dark energy) components. No vented path escapes classification. The void isnt one thing -- its two things that sum to everything reject [LEDGER: THM-DARK-MATTER-ENERGY-CONSERVATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dark_matter_positive',
    description: 'The BATNA void (dark matter) has positive volume. There is always at least one viable alternative that was rejected. Without dark matter, the trajectory has no shape -- no gravitational pull toward vi [LEDGER: THM-DARK-MATTER-POSITIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dark_energy_positive',
    description: 'The WATNA void (dark energy) has positive volume. There is always at least one catastrophic outcome being fled. Without dark energy, there is no urgency to settle -- no repulsive force preventing coll [LEDGER: THM-DARK-ENERGY-POSITIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dominance_trichotomy',
    description: 'Every void partition is dark-matter-dominated (BATNA > WATNA, healthy), dark-energy-dominated (WATNA > BATNA, failing), or balanced. The trichotomy is exhaustive -- the dark matter/dark energy ratio i [LEDGER: THM-DOMINANCE-TRICHOTOMY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_batna_tunnel_positive',
    description: 'The BATNA component of a classified tunnel carries positive mutual information. Knowledge of what worked in a related negotiation never fully vanishes. Positive knowledge transfers across negotiation  [LEDGER: THM-BATNA-TUNNEL-POSITIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_watna_tunnel_positive',
    description: 'The WATNA component of a classified tunnel carries positive mutual information. Knowledge of what killed a related negotiation never fully vanishes. The ghost of past catastrophe haunts all future neg [LEDGER: THM-WATNA-TUNNEL-POSITIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_classified_tunnel_both_retained',
    description: 'Both components of a classified tunnel have positive retention product. Neither BATNA knowledge (what worked) nor WATNA knowledge (what killed) is fully lost across negotiation threads. [LEDGER: THM-CLASSIFIED-TUNNEL-BOTH-RETAINED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_coherence_breakdown',
    description: 'When two parties agree on what was rejected but classify identically, their settlement scores agree (coherence preserved). When they classify differently -- one partys BATNA is anothers WATNA -- the [LEDGER: THM-COHERENCE-BREAKDOWN]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_watna_reduced_regret',
    description: 'WATNA elimination strictly shrinks the effective offer space and tightens the regret bound from O(sqrt(T log N)) to O(sqrt(T log(N-k))). The WATNA void is not just repulsive -- it is constructive. Eac [LEDGER: THM-WATNA-REDUCED-REGRET]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dual_void_master',
    description: 'Complete dual void theorem: (1) both voids positive, (2) dominance trichotomy, (3) settlement exists between them. The void is not one thing -- it is two things, success and failure, and the duality b [LEDGER: THM-DUAL-VOID-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_neg_settle',
    description: 'Negotiation convergence via fork/race/fold on void surface: settlement is reachable when an offer exceeds BATNA. Void deficit is monotonically non-increasing. Settled complement satisfies void boundar [LEDGER: THM-NEG-SETTLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_negotiation_deficit': { theorem: 'THM-NEGOTIATION-DEFICIT', claim: 'The negotiation deficit between parties with multi-dimensional interests compressed into a single offer stream is strictly positive, equals totalDimensions - 1, and is bounded below totalDimensions. N', mechanization: 'Lean theorems `negotiation_deficit_positive`, `negotiation_deficit_value`, and `negotiation_deficit_bounded` in `NegotiationEquilibrium.lean` composin', section: 'Negotiation Equilibrium' },
  'thm_batna_is_void': { theorem: 'THM-BATNA-IS-VOID', claim: 'The BATNA surface is exactly the void boundary of the negotiation fork/race/fold process. Each negotiation round contributes offerCount - 1 entries to the void boundary. The BATNA grows monotonically ', mechanization: 'Lean theorems `batna_is_void_boundary` and `batna_grows_with_rounds` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_boundary_grows_', section: 'Negotiation Equilibrium' },
  'thm_concession_gradient': { theorem: 'THM-CONCESSION-GRADIENT', claim: 'The optimal concession strategy is the void gradient complement distribution. Every term retains positive weight (never say never in negotiation). Less-rejected terms get higher concession weight (lea', mechanization: 'Lean theorems `concession_gradient_positive` and `concession_gradient_monotone` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_grad', section: 'Negotiation Equilibrium' },
  'thm_settlement_stability': { theorem: 'THM-SETTLEMENT-STABILITY', claim: 'Mutual settlement is a Lyapunov-stable fixed point of the void gradient flow. Perturbation of one partys void boundary (one additional rejection) does not destroy the agreement: the complement distri', mechanization: 'Lean theorem `settlement_stable_under_perturbation` in `NegotiationEquilibrium.lean` via `concession_gradient_monotone`', section: 'Negotiation Equilibrium' },
  'thm_negotiation_coherence': { theorem: 'THM-NEGOTIATION-COHERENCE', claim: 'Two rational agents reading the same rejection history produce identical concession strategies. Same rejected offers + same rational update rule = same next offer. Transparent negotiation works becaus', mechanization: 'Lean theorems `negotiation_coherence` and `negotiation_full_coherence` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_walkers_conve', section: 'Negotiation Equilibrium' },
  'thm_negotiation_heat': { theorem: 'THM-NEGOTIATION-HEAT', claim: 'Failed negotiations generate irreversible thermodynamic heat. Each rejected offer is a vented path; by THM-VOID-DOMINANCE the void of rejected offers dominates the space of accepted terms. The cost of', mechanization: 'Lean theorems `negotiation_void_dominates` and `rejection_dominates_acceptance` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_volu', section: 'Negotiation Equilibrium' },
  'thm_context_reduces_deficit': { theorem: 'THM-CONTEXT-REDUCES-DEFICIT', claim: 'Shared context between negotiating parties (prior relationship, market norms, shared vocabulary) reduces the semiotic deficit of the negotiation channel. Sufficient shared context eliminates the defic', mechanization: 'Lean theorems `context_reduces_negotiation_deficit` and `sufficient_context_eliminates_deficit` in `NegotiationEquilibrium.lean` composing with `Semio', section: 'Negotiation Equilibrium' },
  'thm_negotiation_convergence': { theorem: 'THM-NEGOTIATION-CONVERGENCE', claim: 'Master theorem: for any negotiation between parties with multi-dimensional interests, (1) confusion is real (deficit positive), (2) confusion is bounded (deficit < totalDimensions), and (3) shared con', mechanization: 'Lean theorem `negotiation_convergence` in `NegotiationEquilibrium.lean` combining `negotiation_deficit_positive`, `negotiation_deficit_bounded`, and `', section: 'Negotiation Equilibrium' },
  'thm_negotiation_regret': { theorem: 'THM-NEGOTIATION-REGRET', claim: 'Negotiation with N offer variants per round achieves O(sqrt(T log N)) regret instead of Omega(sqrt(TN)). The BATNA surface provides N-1 bits of negative information per round. Improvement factor sqrt(', mechanization: 'Lean theorem `negotiation_regret_bound` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_walking_regret_bound` via `NegotiationRound.', section: 'Negotiation Equilibrium' },
  'thm_batna_sufficient_statistic': { theorem: 'THM-BATNA-SUFFICIENT-STATISTIC', claim: 'The BATNA surface is exponentially more compact than storing the full history of rejected offers. Storing every rejected offer costs O(N * T * payloadBits); storing the BATNA surface costs O(T * log N', mechanization: 'Lean theorem `batna_sufficient_statistic` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_boundary_sufficient_statistic`', section: 'Negotiation Equilibrium' },
  'thm_negotiation_tunnel': { theorem: 'THM-NEGOTIATION-TUNNEL', claim: 'Two negotiation threads sharing a common prior proposal have positive mutual information. Precedent transfers across negotiations: prior rejected offers in one negotiation inform a related negotiation', mechanization: 'Lean theorems `negotiation_tunnel_positive` and `negotiation_tunnel_retention_positive` in `NegotiationEquilibrium.lean` composing with `VoidWalking.v', section: 'Negotiation Equilibrium' },
  'thm_negotiation_convergence_extended': { theorem: 'THM-NEGOTIATION-CONVERGENCE-EXTENDED', claim: 'Extended master theorem adding regret bound to the original convergence triple: (1) confusion is real, (2) confusion is bounded, (3) context helps, and (4) regret is controlled at O(sqrt(T log N)).', mechanization: 'Lean theorem `negotiation_convergence_extended` in `NegotiationEquilibrium.lean` combining all four properties', section: 'Negotiation Equilibrium' },
  'thm_batna_attraction': { theorem: 'THM-BATNA-ATTRACTION', claim: 'BATNA complement weights are always positive (the attractive gradient never fully abandons any term) and monotone (less BATNA-rejected terms have higher attraction weight). The exact component of the ', mechanization: 'Lean theorems `batna_attraction_positive` and `batna_attraction_monotone` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_watna_repulsion': { theorem: 'THM-WATNA-REPULSION', claim: 'Terms with higher WATNA density exert stronger repulsion. WATNA repulsion is zero for terms never classified as catastrophic. The co-exact component of the Hodge decomposition.', mechanization: 'Lean theorems `watna_repulsion_monotone` and `watna_repulsion_zero_of_no_history` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_hodge_decomposition': { theorem: 'THM-HODGE-DECOMPOSITION', claim: 'The settlement score decomposes as BATNA attraction minus WATNA repulsion. The exact component (BATNA) is always positive. Discrete Hodge decomposition: exact = attraction toward viable, co-exact = re', mechanization: 'Lean theorems `hodge_decomposition` and `hodge_exact_positive` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_dual_void_squeeze': { theorem: 'THM-DUAL-VOID-SQUEEZE', claim: 'When both voids are nonempty, there exists a term with positive settlement score -- BATNA attraction exceeds WATNA repulsion. Settlement exists precisely because two voids squeeze from opposite sides.', mechanization: 'Lean theorems `dual_void_squeeze`, `settlement_positive_of_no_watna`, and `settlement_decreases_with_watna` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_void_duality': { theorem: 'THM-VOID-DUALITY', claim: 'BATNA and WATNA are dual: for the same total vent count, a term classified as more BATNA than WATNA has a higher settlement score. The allocation between the two voids matters -- not just the total re', mechanization: 'Lean theorem `void_duality_allocation_matters` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_dark_matter_energy_conservation': { theorem: 'THM-DARK-MATTER-ENERGY-CONSERVATION', claim: 'Total void volume is the sum of BATNA (dark matter) and WATNA (dark energy) components. No vented path escapes classification. The void isnt one thing -- its two things that sum to everything reject', mechanization: 'Lean theorem `dark_matter_energy_conservation` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_dark_matter_positive': { theorem: 'THM-DARK-MATTER-POSITIVE', claim: 'The BATNA void (dark matter) has positive volume. There is always at least one viable alternative that was rejected. Without dark matter, the trajectory has no shape -- no gravitational pull toward vi', mechanization: 'Lean theorem `dark_matter_positive` in `NegotiationEquilibrium.lean` via `Finset.sum_pos`', section: 'Negotiation Equilibrium' },
  'thm_dark_energy_positive': { theorem: 'THM-DARK-ENERGY-POSITIVE', claim: 'The WATNA void (dark energy) has positive volume. There is always at least one catastrophic outcome being fled. Without dark energy, there is no urgency to settle -- no repulsive force preventing coll', mechanization: 'Lean theorem `dark_energy_positive` in `NegotiationEquilibrium.lean` via `Finset.sum_pos`', section: 'Negotiation Equilibrium' },
  'thm_dominance_trichotomy': { theorem: 'THM-DOMINANCE-TRICHOTOMY', claim: 'Every void partition is dark-matter-dominated (BATNA > WATNA, healthy), dark-energy-dominated (WATNA > BATNA, failing), or balanced. The trichotomy is exhaustive -- the dark matter/dark energy ratio i', mechanization: 'Lean theorem `dominance_trichotomy` in `NegotiationEquilibrium.lean` via `omega`', section: 'Negotiation Equilibrium' },
  'thm_batna_tunnel_positive': { theorem: 'THM-BATNA-TUNNEL-POSITIVE', claim: 'The BATNA component of a classified tunnel carries positive mutual information. Knowledge of what worked in a related negotiation never fully vanishes. Positive knowledge transfers across negotiation ', mechanization: 'Lean theorem `batna_tunnel_positive` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_tunnel_mutual_information_positive`', section: 'Negotiation Equilibrium' },
  'thm_watna_tunnel_positive': { theorem: 'THM-WATNA-TUNNEL-POSITIVE', claim: 'The WATNA component of a classified tunnel carries positive mutual information. Knowledge of what killed a related negotiation never fully vanishes. The ghost of past catastrophe haunts all future neg', mechanization: 'Lean theorem `watna_tunnel_positive` in `NegotiationEquilibrium.lean` composing with `VoidWalking.void_tunnel_mutual_information_positive`', section: 'Negotiation Equilibrium' },
  'thm_classified_tunnel_both_retained': { theorem: 'THM-CLASSIFIED-TUNNEL-BOTH-RETAINED', claim: 'Both components of a classified tunnel have positive retention product. Neither BATNA knowledge (what worked) nor WATNA knowledge (what killed) is fully lost across negotiation threads.', mechanization: 'Lean theorems `classified_tunnel_both_positive` and `classified_tunnel_both_retained` in `NegotiationEquilibrium.lean`', section: 'Negotiation Equilibrium' },
  'thm_coherence_breakdown': { theorem: 'THM-COHERENCE-BREAKDOWN', claim: 'When two parties agree on what was rejected but classify identically, their settlement scores agree (coherence preserved). When they classify differently -- one partys BATNA is anothers WATNA -- the', mechanization: 'Lean theorems `coherence_when_classification_agrees`, `coherence_divergence`, `classification_gap_bounded`, and `classification_gap_equals_double_watn', section: 'Negotiation Equilibrium' },
  'thm_watna_reduced_regret': { theorem: 'THM-WATNA-REDUCED-REGRET', claim: 'WATNA elimination strictly shrinks the effective offer space and tightens the regret bound from O(sqrt(T log N)) to O(sqrt(T log(N-k))). The WATNA void is not just repulsive -- it is constructive. Eac', mechanization: 'Lean theorems `watna_reduces_effective_space`, `watna_reduced_regret`, `watna_reduced_regret_strict`, and `watna_effective_nontrivial` in `Negotiation', section: 'Negotiation Equilibrium' },
  'thm_dual_void_master': { theorem: 'THM-DUAL-VOID-MASTER', claim: 'Complete dual void theorem: (1) both voids positive, (2) dominance trichotomy, (3) settlement exists between them. The void is not one thing -- it is two things, success and failure, and the duality b', mechanization: 'Lean theorem `dual_void_master` in `NegotiationEquilibrium.lean` combining `dark_matter_positive`, `dark_energy_positive`, `dominance_trichotomy`, and', section: 'Negotiation Equilibrium' },
  'thm_neg_settle': { theorem: 'THM-NEG-SETTLE', claim: 'Negotiation convergence via fork/race/fold on void surface: settlement is reachable when an offer exceeds BATNA. Void deficit is monotonically non-increasing. Settled complement satisfies void boundar', mechanization: 'TLA+ `NegotiationConvergence.tla` invariants (`InvSettleReachable`, `InvVoidMono`, `InvComplement`, `InvDeficitCtx`, `InvExhaust`)', section: 'Negotiation Equilibrium' }
};
