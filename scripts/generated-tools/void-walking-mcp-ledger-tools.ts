// Auto-generated theorem tools for void-walking-mcp
// 7 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_void_dominance',
    description: 'Void volume grows as Omega(T * (N-1)), dominating active computation by factor Omega(T). For nested depth d, void grows as Omega(T * N^d) while active paths remain bounded at N^d. The void fraction ap [LEDGER: THM-VOID-DOMINANCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_memory_efficiency',
    description: 'Void boundary encoding is exponentially more compact than storing discarded paths. Ratio: Omega(N * m_min / log N). The boundary is a sufficient statistic for optimal fork distributions. Upper bound f [LEDGER: THM-VOID-MEMORY-EFFICIENCY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_tunnel',
    description: 'Void regions sharing a common ancestor fork have positive mutual information: I(dV_A; dV_B) > 0. Correlation decays exponentially: I <= H(F) * prod(1 - epsilon_t) where epsilon_t is erasure fraction a [LEDGER: THM-VOID-TUNNEL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_regret_bound',
    description: 'Void walking reduces adversarial regret from Omega(sqrt(TN)) to O(sqrt(T log N)). Improvement factor sqrt(N / log N), unbounded as N grows. Void boundary provides N-1 bits of negative information per  [LEDGER: THM-VOID-REGRET-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_gradient',
    description: 'The void boundary induces a gradient field: void density rho_i = (times choice i was vented) / T. The complement distribution mu_i proportional to (1 - rho_i + epsilon) uniquely minimizes expected reg [LEDGER: THM-VOID-GRADIENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_coherence',
    description: 'Two independent void walkers reading the same boundary produce identical fork distributions (deterministic case) or epsilon-close distributions with epsilon = O(1/sqrt(T)) (stochastic case). Determini [LEDGER: THM-VOID-COHERENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_attention',
    description: 'The structural identity between void walking and transformer attention: complement distribution IS softmax attention over the void boundary. Void boundary grows monotonically (residual accumulation).  [LEDGER: THM-VOID-ATTENTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_void_dominance': { theorem: 'THM-VOID-DOMINANCE', claim: 'Void volume grows as Omega(T * (N-1)), dominating active computation by factor Omega(T). For nested depth d, void grows as Omega(T * N^d) while active paths remain bounded at N^d. The void fraction ap', mechanization: 'TLA+ `VoidDominance.tla` invariants (`InvVoidVolumeFormula`, `InvActivePathsBounded`, `InvVoidDominatesLinear`, `InvTotalConservation`, `InvVoidPositi', section: 'Void Walking' },
  'thm_void_memory_efficiency': { theorem: 'THM-VOID-MEMORY-EFFICIENCY', claim: 'Void boundary encoding is exponentially more compact than storing discarded paths. Ratio: Omega(N * m_min / log N). The boundary is a sufficient statistic for optimal fork distributions. Upper bound f', mechanization: 'Lean theorem `VoidWalking.void_boundary_sufficient_statistic` in `VoidWalking.lean` using existing `DataProcessingInequality.lean` + executable `src/v', section: 'Void Walking' },
  'thm_void_tunnel': { theorem: 'THM-VOID-TUNNEL', claim: 'Void regions sharing a common ancestor fork have positive mutual information: I(dV_A; dV_B) > 0. Correlation decays exponentially: I <= H(F) * prod(1 - epsilon_t) where epsilon_t is erasure fraction a', mechanization: 'TLA+ `VoidTunnel.tla` invariants (`InvRetainedInfoAPositive`, `InvRetainedInfoBPositive`, `InvMutualInfoPositive`, `InvMutualInfoBounded`, `InvRetaine', section: 'Void Walking' },
  'thm_void_regret_bound': { theorem: 'THM-VOID-REGRET-BOUND', claim: 'Void walking reduces adversarial regret from Omega(sqrt(TN)) to O(sqrt(T log N)). Improvement factor sqrt(N / log N), unbounded as N grows. Void boundary provides N-1 bits of negative information per ', mechanization: 'Lean theorem `VoidWalking.void_walking_regret_bound` in `VoidWalking.lean` + executable `src/void-regret-simulation.test.ts` with Exp3 comparison', section: 'Void Walking' },
  'thm_void_gradient': { theorem: 'THM-VOID-GRADIENT', claim: 'The void boundary induces a gradient field: void density rho_i = (times choice i was vented) / T. The complement distribution mu_i proportional to (1 - rho_i + epsilon) uniquely minimizes expected reg', mechanization: 'Lean theorems `VoidWalking.void_gradient_complement_positive` and `VoidWalking.void_gradient_complement_minimizes_regret` in `VoidWalking.lean` + exec', section: 'Void Walking' },
  'thm_void_coherence': { theorem: 'THM-VOID-COHERENCE', claim: 'Two independent void walkers reading the same boundary produce identical fork distributions (deterministic case) or epsilon-close distributions with epsilon = O(1/sqrt(T)) (stochastic case). Determini', mechanization: 'Lean theorems `VoidWalking.void_walkers_converge` and `VoidWalking.void_walkers_converge_all` in `VoidWalking.lean` + executable Monte Carlo test in `', section: 'Void Walking' },
  'thm_void_attention': { theorem: 'THM-VOID-ATTENTION', claim: 'The structural identity between void walking and transformer attention: complement distribution IS softmax attention over the void boundary. Void boundary grows monotonically (residual accumulation). ', mechanization: 'TLA+ `VoidAttention.tla` invariants (`InvComplementIsSoftmax`, `InvResidualAccumulates`, `InvDecayStabilizes`, `InvCrossIsGated`, `InvEntropyDecreases', section: 'Void Walking' }
};
