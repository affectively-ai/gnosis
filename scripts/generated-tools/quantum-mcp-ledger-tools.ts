// Auto-generated theorem tools for quantum-mcp
// 19 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_superposition_fork',
    description: 'Superposition of rootN paths has intrinsic beta1 = rootN - 1. The topological content of quantum superposition is the number of independent cycles in the fork graph [LEDGER: THM-SUPERPOSITION-FORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_observer_fold',
    description: 'Measurement (the observers fold) reduces beta1 from rootN - 1 to 0. The fold selects one path and vents rootN - 1 paths into the void. Post-measurement topology is a path graph [LEDGER: THM-OBSERVER-FOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_observer_deficit',
    description: 'The measurement deficit -- the topological cost of observation -- is exactly rootN - 1. Path conservation: 1 + (rootN - 1) = rootN. Paths are not destroyed, they are vented to the void boundary [LEDGER: THM-OBSERVER-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_observer_effect_fold',
    description: 'Quantum deficit = 0 (quantum algorithms preserve all beta1). Classical deficit = rootN - 1 (classical algorithms collapse to path graph). The Observer Effect is the classical deficit: the cost of meas [LEDGER: THM-OBSERVER-EFFECT-FOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_qbism_prior',
    description: 'QBist quantum state is a BayesianPrior -- an initialized void boundary. Positive weight (never say never), normalized (well-defined distribution), concentration-ordered (less rejection = higher weight [LEDGER: THM-QBISM-PRIOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_observer_coherence',
    description: 'Two observers reading the same void boundary compute the same quantum state. Resolves QBisms coherence problem: rational agents agree whenever their experimental histories agree [LEDGER: THM-OBSERVER-COHERENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quantum_observer_master',
    description: 'Complete Observer Effect theorem: superposition is fork (beta1 = rootN - 1), measurement collapses beta1 to 0, deficit is exactly rootN - 1, path conservation holds, quantum deficit = 0, classical def [LEDGER: THM-QUANTUM-OBSERVER-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_append_only',
    description: 'The void boundary is append-only: once an event is recorded, it cannot be un-occurred. All Buleyean weights are >= 1. The ancestors existence is a permanent fact in the boundary [LEDGER: THM-VOID-APPEND-ONLY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beta1_floor_zero',
    description: 'Beta1 cannot go below zero. A fold can reduce beta1 to zero but not below. No negative cycles exist [LEDGER: THM-BETA1-FLOOR-ZERO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sliver_prevents_annihilation',
    description: 'The +1 in the Buleyean weight formula ensures no events weight can reach zero. Structural impossibility of the grandfather paradox [LEDGER: THM-SLIVER-PREVENTS-ANNIHILATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_self_referential_fold_impossible',
    description: 'A fold that would eliminate the root of its own causal chain is impossible. Both root and tip have positive existence weight and are distinct [LEDGER: THM-SELF-REFERENTIAL-FOLD-IMPOSSIBLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_branching_is_fork',
    description: 'The Many-Worlds resolution is a fork (beta1 increases), not a fold (beta1 decreases). Time travel creates a new path rather than eliminating an old one [LEDGER: THM-BRANCHING-IS-FORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_branch_preserves_original',
    description: 'Branching preserves the original causal chain. All existence weights remain positive. The ancestor still exists in the original branch [LEDGER: THM-BRANCH-PRESERVES-ORIGINAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_causal_chain_conservation',
    description: 'Total events in the causal chain are conserved. No event is destroyed -- the chain is extended by branching, not shortened by folding [LEDGER: THM-CAUSAL-CHAIN-CONSERVATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_paradox_requires_negative',
    description: 'The grandfather paradox requires setting an ancestors weight to zero, which contradicts buleyean_positivity. The paradox requires an operation the algebra does not support [LEDGER: THM-PARADOX-REQUIRES-NEGATIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_bootstrap_dissolves',
    description: 'The bootstrap paradox dissolves because every Buleyean weight has definite provenance via the weight formula. Information without provenance would require negative void count [LEDGER: THM-BOOTSTRAP-DISSOLVES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_retrocausal_consistency',
    description: 'The retrocausal bound excludes paradoxical terminal states: a state where the traveler exists but the ancestor doesnt has no consistent trajectory [LEDGER: THM-RETROCAUSAL-CONSISTENCY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_time_travel_is_topology',
    description: 'Time travel is a topology change: adding a cycle to the causal graph increases beta1 by one. The original chain is preserved. The paradox asks to fold the new cycle, but the sliver prevents it [LEDGER: THM-TIME-TRAVEL-IS-TOPOLOGY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_grandfather_paradox_master',
    description: 'Complete resolution: append-only void, no annihilation, self-referential fold impossible, branching is fork, original preserved. The grandfather paradox is an algebraic impossibility, not a physical o [LEDGER: THM-GRANDFATHER-PARADOX-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_superposition_fork': { theorem: 'THM-SUPERPOSITION-FORK', claim: 'Superposition of rootN paths has intrinsic beta1 = rootN - 1. The topological content of quantum superposition is the number of independent cycles in the fork graph', mechanization: 'Lean theorem `superposition_is_fork` in `QuantumObserver.lean`', section: 'Quantum Observer' },
  'thm_observer_fold': { theorem: 'THM-OBSERVER-FOLD', claim: 'Measurement (the observers fold) reduces beta1 from rootN - 1 to 0. The fold selects one path and vents rootN - 1 paths into the void. Post-measurement topology is a path graph', mechanization: 'Lean theorem `observer_fold_collapses_beta1` in `QuantumObserver.lean`', section: 'Quantum Observer' },
  'thm_observer_deficit': { theorem: 'THM-OBSERVER-DEFICIT', claim: 'The measurement deficit -- the topological cost of observation -- is exactly rootN - 1. Path conservation: 1 + (rootN - 1) = rootN. Paths are not destroyed, they are vented to the void boundary', mechanization: 'Lean theorems `measurement_deficit_exact` and `path_conservation` in `QuantumObserver.lean`', section: 'Quantum Observer' },
  'thm_observer_effect_fold': { theorem: 'THM-OBSERVER-EFFECT-FOLD', claim: 'Quantum deficit = 0 (quantum algorithms preserve all beta1). Classical deficit = rootN - 1 (classical algorithms collapse to path graph). The Observer Effect is the classical deficit: the cost of meas', mechanization: 'Lean theorem `observer_effect_is_fold` in `QuantumObserver.lean`, composing `quantum_deficit_is_zero` from `Claims.lean`', section: 'Quantum Observer' },
  'thm_qbism_prior': { theorem: 'THM-QBISM-PRIOR', claim: 'QBist quantum state is a BayesianPrior -- an initialized void boundary. Positive weight (never say never), normalized (well-defined distribution), concentration-ordered (less rejection = higher weight', mechanization: 'Lean theorems `qbism_prior_is_void_boundary`, `qbism_prior_normalized`, `qbism_prior_ordering` in `QuantumObserver.lean`', section: 'Quantum Observer' },
  'thm_observer_coherence': { theorem: 'THM-OBSERVER-COHERENCE', claim: 'Two observers reading the same void boundary compute the same quantum state. Resolves QBisms coherence problem: rational agents agree whenever their experimental histories agree', mechanization: 'Lean theorem `observer_coherence` in `QuantumObserver.lean`, delegating to `buleyean_coherence`', section: 'Quantum Observer' },
  'thm_quantum_observer_master': { theorem: 'THM-QUANTUM-OBSERVER-MASTER', claim: 'Complete Observer Effect theorem: superposition is fork (beta1 = rootN - 1), measurement collapses beta1 to 0, deficit is exactly rootN - 1, path conservation holds, quantum deficit = 0, classical def', mechanization: 'TLA+ `QuantumObserver.tla` invariants (`InvSuperpositionBeta1`, `InvMeasuredBeta1Zero`, `InvDeficitExact`, `InvPathConservation`, `InvVoidGrowth`, `In', section: 'Quantum Observer' },
  'thm_void_append_only': { theorem: 'THM-VOID-APPEND-ONLY', claim: 'The void boundary is append-only: once an event is recorded, it cannot be un-occurred. All Buleyean weights are >= 1. The ancestors existence is a permanent fact in the boundary', mechanization: 'Lean theorem `void_boundary_append_only` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_beta1_floor_zero': { theorem: 'THM-BETA1-FLOOR-ZERO', claim: 'Beta1 cannot go below zero. A fold can reduce beta1 to zero but not below. No negative cycles exist', mechanization: 'Lean theorem `beta1_floor_zero` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_sliver_prevents_annihilation': { theorem: 'THM-SLIVER-PREVENTS-ANNIHILATION', claim: 'The +1 in the Buleyean weight formula ensures no events weight can reach zero. Structural impossibility of the grandfather paradox', mechanization: 'Lean theorem `sliver_prevents_annihilation` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_self_referential_fold_impossible': { theorem: 'THM-SELF-REFERENTIAL-FOLD-IMPOSSIBLE', claim: 'A fold that would eliminate the root of its own causal chain is impossible. Both root and tip have positive existence weight and are distinct', mechanization: 'Lean theorem `self_referential_fold_impossible` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_branching_is_fork': { theorem: 'THM-BRANCHING-IS-FORK', claim: 'The Many-Worlds resolution is a fork (beta1 increases), not a fold (beta1 decreases). Time travel creates a new path rather than eliminating an old one', mechanization: 'Lean theorem `branching_is_fork` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_branch_preserves_original': { theorem: 'THM-BRANCH-PRESERVES-ORIGINAL', claim: 'Branching preserves the original causal chain. All existence weights remain positive. The ancestor still exists in the original branch', mechanization: 'Lean theorem `branch_preserves_original` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_causal_chain_conservation': { theorem: 'THM-CAUSAL-CHAIN-CONSERVATION', claim: 'Total events in the causal chain are conserved. No event is destroyed -- the chain is extended by branching, not shortened by folding', mechanization: 'Lean theorem `causal_chain_conservation` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_paradox_requires_negative': { theorem: 'THM-PARADOX-REQUIRES-NEGATIVE', claim: 'The grandfather paradox requires setting an ancestors weight to zero, which contradicts buleyean_positivity. The paradox requires an operation the algebra does not support', mechanization: 'Lean theorem `paradox_requires_negative` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_bootstrap_dissolves': { theorem: 'THM-BOOTSTRAP-DISSOLVES', claim: 'The bootstrap paradox dissolves because every Buleyean weight has definite provenance via the weight formula. Information without provenance would require negative void count', mechanization: 'Lean theorem `bootstrap_dissolves` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_retrocausal_consistency': { theorem: 'THM-RETROCAUSAL-CONSISTENCY', claim: 'The retrocausal bound excludes paradoxical terminal states: a state where the traveler exists but the ancestor doesnt has no consistent trajectory', mechanization: 'Lean theorem `retrocausal_consistency` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_time_travel_is_topology': { theorem: 'THM-TIME-TRAVEL-IS-TOPOLOGY', claim: 'Time travel is a topology change: adding a cycle to the causal graph increases beta1 by one. The original chain is preserved. The paradox asks to fold the new cycle, but the sliver prevents it', mechanization: 'Lean theorem `time_travel_is_topology` in `GrandfatherParadox.lean`', section: 'Grandfather Paradox (§15.23)' },
  'thm_grandfather_paradox_master': { theorem: 'THM-GRANDFATHER-PARADOX-MASTER', claim: 'Complete resolution: append-only void, no annihilation, self-referential fold impossible, branching is fork, original preserved. The grandfather paradox is an algebraic impossibility, not a physical o', mechanization: 'TLA+ `GrandfatherParadox.tla` invariants (`InvAncestorAlive`, `InvTravelerAlive`, `InvNoAnnihilation`, `InvBeta1NonNeg`, `InvBranchPositive`, `InvBran', section: 'Grandfather Paradox (§15.23)' }
};
