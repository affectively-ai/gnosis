// Auto-generated theorem tools for evidence-mcp
// 11 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_evidence_deficit',
    description: 'The evidentiary deficit is positive for any nontrivial case with a single verdict stream. The deficit equals evidentiaryThreads - 1. This is the topological cost of folding multi-threaded evidence int [LEDGER: THM-EVIDENCE-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_presumption_of_innocence',
    description: 'Before any evidence is examined, the Buleyean verdict is "insufficient data." The initial Bule equals the total number of evidentiary threads and is at least 2. This IS the presumption of innocence -- [LEDGER: THM-PRESUMPTION-OF-INNOCENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_evidence_monotone',
    description: 'Each piece of admissible evidence can only reduce the evidentiary deficit, never increase it. Strictly: covering one additional thread strictly reduces the Bule. This gives a mathematical definition o [LEDGER: THM-EVIDENCE-MONOTONE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_guilty_iff_zero_deficit',
    description: 'A guilty verdict is returned if and only if the evidentiary deficit is exactly zero. Equivalently, the verdict is "insufficient data" if and only if the deficit is positive. β₁ = 0 is the evidence sta [LEDGER: THM-GUILTY-IFF-ZERO-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_verdict_deterministic',
    description: 'The verdict is a deterministic function of thread coverage. Two evidence states with identical coverage produce identical verdicts. No randomness, no judgment calls on the standard itself -- only on t [LEDGER: THM-VERDICT-DETERMINISTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_coverage_eventually_sufficient',
    description: 'If the prosecution covers one thread per round, the deficit reaches zero after exactly evidentiaryThreads rounds. The deficit at round k equals evidentiaryThreads - k [LEDGER: THM-COVERAGE-EVENTUALLY-SUFFICIENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_discovery_reduces_deficit',
    description: 'Full discovery (all evidence disclosed) provides maximum context and prevents Brady violations. Withholding evidence maintains deficit by reducing available context. More disclosure means more context [LEDGER: THM-DISCOVERY-REDUCES-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_defense_increases_topology',
    description: 'The defenses role is to identify uncovered evidentiary threads, increasing β₁(E) and requiring more prosecution coverage. Each new thread strictly increases the evidentiary deficit [LEDGER: THM-DEFENSE-INCREASES-TOPOLOGY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_appeal_ground',
    description: 'A conviction with an uncovered thread has positive residual deficit, contradicts the guilty standard, and is formally reversible. The appellate question is computable: does the recorded void boundary  [LEDGER: THM-APPEAL-GROUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_buleyean_evidence_master',
    description: 'Complete evidence standard theorem: (1) presumption of innocence (initial verdict = insufficient data), (2) initial deficit at least 2, (3) evidence deficit positive for single-verdict topology, (4) f [LEDGER: THM-BULEYEAN-EVIDENCE-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_buleyean_evidence_model',
    description: 'Model-checked five-phase trial protocol: safety (no premature conviction, presumption of innocence, deficit nonneg/bounded/formula, coverage bounded, discovery bounded, guilty only in verdict phase),  [LEDGER: THM-BULEYEAN-EVIDENCE-MODEL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_evidence_deficit': { theorem: 'THM-EVIDENCE-DEFICIT', claim: 'The evidentiary deficit is positive for any nontrivial case with a single verdict stream. The deficit equals evidentiaryThreads - 1. This is the topological cost of folding multi-threaded evidence int', mechanization: 'Lean theorems `evidence_deficit_positive` and `evidence_deficit_value` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_presumption_of_innocence': { theorem: 'THM-PRESUMPTION-OF-INNOCENCE', claim: 'Before any evidence is examined, the Buleyean verdict is "insufficient data." The initial Bule equals the total number of evidentiary threads and is at least 2. This IS the presumption of innocence --', mechanization: 'Lean theorems `presumption_of_innocence`, `initial_bule_maximal`, and `initial_bule_positive` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_evidence_monotone': { theorem: 'THM-EVIDENCE-MONOTONE', claim: 'Each piece of admissible evidence can only reduce the evidentiary deficit, never increase it. Strictly: covering one additional thread strictly reduces the Bule. This gives a mathematical definition o', mechanization: 'Lean theorems `evidence_monotone` and `evidence_strictly_reduces` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_guilty_iff_zero_deficit': { theorem: 'THM-GUILTY-IFF-ZERO-DEFICIT', claim: 'A guilty verdict is returned if and only if the evidentiary deficit is exactly zero. Equivalently, the verdict is "insufficient data" if and only if the deficit is positive. β₁ = 0 is the evidence sta', mechanization: 'Lean theorems `guilty_iff_zero_deficit` and `insufficient_data_iff_positive_deficit` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_verdict_deterministic': { theorem: 'THM-VERDICT-DETERMINISTIC', claim: 'The verdict is a deterministic function of thread coverage. Two evidence states with identical coverage produce identical verdicts. No randomness, no judgment calls on the standard itself -- only on t', mechanization: 'Lean theorem `verdict_deterministic` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_coverage_eventually_sufficient': { theorem: 'THM-COVERAGE-EVENTUALLY-SUFFICIENT', claim: 'If the prosecution covers one thread per round, the deficit reaches zero after exactly evidentiaryThreads rounds. The deficit at round k equals evidentiaryThreads - k', mechanization: 'Lean theorems `coverage_eventually_sufficient` and `coverage_deficit_at_round` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_discovery_reduces_deficit': { theorem: 'THM-DISCOVERY-REDUCES-DEFICIT', claim: 'Full discovery (all evidence disclosed) provides maximum context and prevents Brady violations. Withholding evidence maintains deficit by reducing available context. More disclosure means more context', mechanization: 'Lean theorems `full_discovery_maximum_context`, `brady_violation_withholds_context`, and `more_discovery_more_context` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_defense_increases_topology': { theorem: 'THM-DEFENSE-INCREASES-TOPOLOGY', claim: 'The defenses role is to identify uncovered evidentiary threads, increasing β₁(E) and requiring more prosecution coverage. Each new thread strictly increases the evidentiary deficit', mechanization: 'Lean theorems `defenseIdentifiesThread` and `defense_increases_deficit` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_appeal_ground': { theorem: 'THM-APPEAL-GROUND', claim: 'A conviction with an uncovered thread has positive residual deficit, contradicts the guilty standard, and is formally reversible. The appellate question is computable: does the recorded void boundary ', mechanization: 'Lean theorems `appeal_ground_exists`, `appeal_contradicts_verdict`, and `appeal_reversible` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_buleyean_evidence_master': { theorem: 'THM-BULEYEAN-EVIDENCE-MASTER', claim: 'Complete evidence standard theorem: (1) presumption of innocence (initial verdict = insufficient data), (2) initial deficit at least 2, (3) evidence deficit positive for single-verdict topology, (4) f', mechanization: 'Lean theorem `buleyean_evidence_master` in `BuleyeanEvidence.lean`', section: 'Buleyean Evidence Standards (§28)' },
  'thm_buleyean_evidence_model': { theorem: 'THM-BULEYEAN-EVIDENCE-MODEL', claim: 'Model-checked five-phase trial protocol: safety (no premature conviction, presumption of innocence, deficit nonneg/bounded/formula, coverage bounded, discovery bounded, guilty only in verdict phase), ', mechanization: 'TLA+ `BuleyeanEvidence.tla` + `BuleyeanEvidence.cfg` with 9 invariants and 2 temporal properties', section: 'Buleyean Evidence Standards (§28)' }
};
