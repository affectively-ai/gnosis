// Auto-generated theorem tools for failure-mcp
// 13 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_fail_entropy',
    description: 'Structured failure reduces a live-frontier entropy proxy, collapse from a forked frontier to one survivor requires at least one failed branch, and coupled repair debt preserves or reverses that reduct [LEDGER: THM-FAIL-ENTROPY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_families',
    description: 'Failure topology splits into branch-isolating failure, which preserves deterministic fold on the survivor projection and carries zero repair debt, and contagious failure, which forces positive repair  [LEDGER: THM-FAIL-FAMILIES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_durability',
    description: 'Bounded branch-isolating failures preserve quorum durability and, once failures are exhausted, weakly fair repair returns the system to the fully repaired stable state [LEDGER: THM-FAIL-DURABILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_trilemma',
    description: 'A nontrivial fork cannot collapse to a deterministic single-survivor fold for free: zero vent plus zero repair debt precludes deterministic collapse, so any deterministic single-survivor collapse must [LEDGER: THM-FAIL-TRILEMMA]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_composition',
    description: 'The no-free-collapse boundary composes across stages: once a pipeline starts from a nontrivial fork, stagewise zero vent and zero repair debt cannot end in a deterministic single-survivor collapse, so [LEDGER: THM-FAIL-COMPOSITION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_universal',
    description: 'The no-free-collapse boundary survives normalization to persistent branch identity and arbitrary depth: any nontrivial sparse choice system, and therefore any finite prefix of an arbitrary-depth recov [LEDGER: THM-FAIL-UNIVERSAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_mincost',
    description: 'Deterministic collapse has a minimum cost floor: for any normalized sparse choice system or finite prefix of an arbitrary-depth recovery trajectory, collapsing from an initial fork to one survivor req [LEDGER: THM-FAIL-MINCOST]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_landauer_boundary',
    description: 'The thermodynamic bridge now spans finite, countable-support, measurable finite-type, observable-pushforward, and effective-support layers. For an equiprobable live frontier, a vented branch carries s [LEDGER: THM-FAIL-LANDAUER-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_tightness',
    description: 'The deterministic-collapse cost floor is tight: for any positive-live normalized start state there exists a branch-isolating single-survivor collapse witness with zero repair debt and exact cost `init [LEDGER: THM-FAIL-TIGHTNESS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_ctrl',
    description: 'Over the three canonical failure actions `keep-multiplicity`, `pay-vent`, and `pay-repair`, the score-minimizing controller chooses the action with the smallest weighted coefficient against the exact  [LEDGER: THM-FAIL-CTRL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fail_pareto',
    description: 'Over the canonical failure-action family, the three legal outcomes form a Pareto frontier: `keep-multiplicity`, `pay-vent`, and `pay-repair` are pairwise non-dominating whenever `liveBranches > 1`, so [LEDGER: THM-FAIL-PARETO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_failure_entropy',
    description: 'Structured failure conserves frontier mass, reduces frontier width with venting, reduces entropy proxy, and forked frontier collapses to single survivor under binary race convergence [LEDGER: THM-FAILURE-ENTROPY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_failure_durability',
    description: 'Durable replica state: well-formed replicas maintain live count at or above quorum size and positive live count. Stable replica state tracks all-healthy invariant [LEDGER: THM-FAILURE-DURABILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_fail_entropy': { theorem: 'THM-FAIL-ENTROPY', claim: 'Structured failure reduces a live-frontier entropy proxy, collapse from a forked frontier to one survivor requires at least one failed branch, and coupled repair debt preserves or reverses that reduct', mechanization: 'TLA+ `FailureEntropy.tla` invariants (`InvStructuredFailureConservesMass`, `InvStructuredFailureReducesWidth`, `InvStructuredFailureReducesEntropy`, `', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_families': { theorem: 'THM-FAIL-FAMILIES', claim: 'Failure topology splits into branch-isolating failure, which preserves deterministic fold on the survivor projection and carries zero repair debt, and contagious failure, which forces positive repair ', mechanization: 'TLA+ `FailureFamilies.tla` invariants (`InvWellFormed`, `InvBranchIsolatingPreservesDeterministicFold`, `InvBranchIsolatingRepairDebtZero`, `InvContag', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_durability': { theorem: 'THM-FAIL-DURABILITY', claim: 'Bounded branch-isolating failures preserve quorum durability and, once failures are exhausted, weakly fair repair returns the system to the fully repaired stable state', mechanization: 'TLA+ `FailureDurability.tla` invariants (`InvWellFormed`, `InvReplicaMassConserved`, `InvRepairDebtBounded`, `InvQuorumDurability`, `InvPositiveLive`)', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_trilemma': { theorem: 'THM-FAIL-TRILEMMA', claim: 'A nontrivial fork cannot collapse to a deterministic single-survivor fold for free: zero vent plus zero repair debt precludes deterministic collapse, so any deterministic single-survivor collapse must', mechanization: 'TLA+ `FailureTrilemma.tla` invariants (`InvZeroVentPreservesBranchMass`, `InvNoFreeDeterministicCollapse`, `InvDeterministicSingleSurvivorRequiresWast', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_composition': { theorem: 'THM-FAIL-COMPOSITION', claim: 'The no-free-collapse boundary composes across stages: once a pipeline starts from a nontrivial fork, stagewise zero vent and zero repair debt cannot end in a deterministic single-survivor collapse, so', mechanization: 'TLA+ `FailureComposition.tla` invariants (`InvStagewiseZeroVentPreservesBranchMass`, `InvNoFreePipelineCollapse`, `InvPipelineCollapseRequiresGlobalWa', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_universal': { theorem: 'THM-FAIL-UNIVERSAL', claim: 'The no-free-collapse boundary survives normalization to persistent branch identity and arbitrary depth: any nontrivial sparse choice system, and therefore any finite prefix of an arbitrary-depth recov', mechanization: 'TLA+ `FailureUniversality.tla` invariants (`InvZeroVentPreservesBranchMassAtAnyDepth`, `InvNoFreeDeterministicCollapseAtAnyDepth`, `InvDeterministicCo', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_mincost': { theorem: 'THM-FAIL-MINCOST', claim: 'Deterministic collapse has a minimum cost floor: for any normalized sparse choice system or finite prefix of an arbitrary-depth recovery trajectory, collapsing from an initial fork to one survivor req', mechanization: 'TLA+ `FailureUniversality.tla` invariants (`InvVentedEqualsForkWidthGap`, `InvDeterministicCollapseRequiresVentFloor`, `InvDeterministicCollapseRequir', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_landauer_boundary': { theorem: 'THM-FAIL-LANDAUER-BOUNDARY', claim: 'The thermodynamic bridge now spans finite, countable-support, measurable finite-type, observable-pushforward, and effective-support layers. For an equiprobable live frontier, a vented branch carries s', mechanization: 'Lean theorems `LandauerBuley.uniform_branch_self_information_bits_eq_frontier_entropy_bits`, `LandauerBuley.finite_branch_entropy_nats_le_log_card`, `', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_tightness': { theorem: 'THM-FAIL-TIGHTNESS', claim: 'The deterministic-collapse cost floor is tight: for any positive-live normalized start state there exists a branch-isolating single-survivor collapse witness with zero repair debt and exact cost `init', mechanization: 'TLA+ `FailureUniversality.tla` invariants (`InvCanonicalWitnessWellFormed`, `InvCanonicalWitnessDeterministicCollapse`, `InvCanonicalWitnessZeroRepair', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_ctrl': { theorem: 'THM-FAIL-CTRL', claim: 'Over the three canonical failure actions `keep-multiplicity`, `pay-vent`, and `pay-repair`, the score-minimizing controller chooses the action with the smallest weighted coefficient against the exact ', mechanization: 'TLA+ `FailureController.tla` invariants (`InvChosenScoreMinimal`, `InvKeepOptimalWhenCoefficientMinimal`, `InvVentOptimalWhenCoefficientMinimal`, `Inv', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_fail_pareto': { theorem: 'THM-FAIL-PARETO', claim: 'Over the canonical failure-action family, the three legal outcomes form a Pareto frontier: `keep-multiplicity`, `pay-vent`, and `pay-repair` are pairwise non-dominating whenever `liveBranches > 1`, so', mechanization: 'TLA+ `FailurePareto.tla` invariants (`InvKeepNondominated`, `InvVentNondominated`, `InvRepairNondominated`) + Lean theorems `FailurePareto.keep_is_par', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_failure_entropy': { theorem: 'THM-FAILURE-ENTROPY', claim: 'Structured failure conserves frontier mass, reduces frontier width with venting, reduces entropy proxy, and forked frontier collapses to single survivor under binary race convergence', mechanization: 'Lean theorems `FailureEntropy.structured_failure_conserves_frontier_mass`, `FailureEntropy.structured_failure_reduces_frontier_width`, `FailureEntropy', section: 'Failure Theory: Collapse, Cost, and Control' },
  'thm_failure_durability': { theorem: 'THM-FAILURE-DURABILITY', claim: 'Durable replica state: well-formed replicas maintain live count at or above quorum size and positive live count. Stable replica state tracks all-healthy invariant', mechanization: 'TLA+ `FailureDurability.tla` invariants + Lean theorems `FailureDurability.durable_live_count_ge_quorum` and `FailureDurability.durable_live_count_pos', section: 'Failure Theory: Collapse, Cost, and Control' }
};
