// Auto-generated theorem tools for pipeline-mcp
// 19 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_s7_whip',
    description: 'Worthington Whip savings shape [LEDGER: THM-S7-WHIP]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_spec',
    description: 'Speculative Tree positivity constraints [LEDGER: THM-S7-SPEC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_turb',
    description: 'Turbulent idle fraction stays bounded [LEDGER: THM-S7-TURB]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_occ',
    description: 'Pipeline occupancy deficit is the complement of frontier fill and equals turbulent idle fraction in the canonical pipeline envelope [LEDGER: THM-S7-OCC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_wallace',
    description: 'Wallace metric (`wally`) on a bounded three-layer frontier is bounded, complementary to frontier fill, zero exactly at full envelope occupancy, and reduces to `2(k-1)/(3k)` on the symmetric diamond wi [LEDGER: THM-S7-WALLACE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_mux_mono',
    description: 'Turbulent multiplexing monotonicity: with fixed useful work and legal recovered overlap, multiplexing cannot increase the Wallace metric and strictly lowers it when overlap is actually recovered [LEDGER: THM-S7-MUX-MONO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_stagger',
    description: 'Staged expansion dominates naive widening on the bounded diamond witness: with positive topology deficit and the same added frontier budget, filling underfilled shoulders first yields higher frontier  [LEDGER: THM-S7-STAGGER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_warm_eff',
    description: 'Warm-up efficiency: for homologous workloads with fixed useful work, recovered overlap is worth the added Buley cost exactly when the weighted Wallace reduction exceeds the Burden Scalar; equivalently [LEDGER: THM-S7-WARM-EFF]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_warm_dyn',
    description: 'Dynamic warm-up cooling: under bounded entropy creep, reachable burden threshold, and cooling strength that can clear any reachable overlap, the dynamic warm-up controller keeps overlap bounded and ev [LEDGER: THM-S7-WARM-DYN]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_warm_ctrl',
    description: 'Warm-up controller optimality: under one-hot topology mismatch, the score-minimizing controller chooses `expand` for underfilled topology below the redline, `constrain` for overprovisioned topology be [LEDGER: THM-S7-WARM-CTRL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_s7_whip_crossover',
    description: 'Cross-shard correction crossover is finite and over-sharding becomes non-improving [LEDGER: THM-S7-WHIP-CROSSOVER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_staged_expansion',
    description: 'Staged expansion frontier: the three-stage expansion area formula matches naive widening. Peak is preserved across stages. Wallace numerator measures wasted capacity in the expansion envelope [LEDGER: THM-STAGED-EXPANSION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_warmup_controller',
    description: 'Warmup controller action scoring over expand/constrain/shedLoad: the controller selects the action with minimum score. Repair redline = deficitWeight + shedPenalty. Warmup worth = Wallace benefit exce [LEDGER: THM-WARMUP-CONTROLLER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_multiplexing_capacity',
    description: 'Multiplexing capacity = sequential minus recovered overlap. Wallace numerator is monotone under multiplexing. Wallace numerator drop equals overlap identity [LEDGER: THM-MULTIPLEXING-CAPACITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rotation_admissible',
    description: 'The Wallington Rotation produces an admissible schedule for any fork/race/fold DAG: positive finite makespan, respects stage ordering. [LEDGER: THM-ROTATION-ADMISSIBLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rotation_makespan_bound',
    description: 'The rotation makespan equals the critical path: numStages × maxStageTime. No admissible schedule can achieve lower makespan because stages are sequential dependencies. Bound is tight for balanced DAGs [LEDGER: THM-ROTATION-MAKESPAN-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rotation_dominates_sequential',
    description: 'For any DAG with β₁ > 0 (numPaths ≥ 2), the rotation strictly dominates the sequential schedule: rotationMakespan < sequentialMakespan. The speedup factor is exactly numPaths. [LEDGER: THM-ROTATION-DOMINATES-SEQUENTIAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rotation_pareto_schedule',
    description: 'The rotation is Pareto-optimal in (makespan, resources): sequential uses fewer resources (1 vs numPaths) but has strictly higher makespan. No schedule simultaneously beats both dimensions. [LEDGER: THM-ROTATION-PARETO-SCHEDULE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rotation_deficit_correlation',
    description: 'The rotations speedup factor equals the topological deficit reduction plus one: speedup = β₁(rotation) - β₁(sequential) + 1 = numPaths. Larger deficit reduction → larger speedup, monotonically. [LEDGER: THM-ROTATION-DEFICIT-CORRELATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_s7_whip': { theorem: 'THM-S7-WHIP', claim: 'Worthington Whip savings shape', mechanization: 'TLA+ transition model + Lean theorem `Claims.worthington_num_lt_den`', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_spec': { theorem: 'THM-S7-SPEC', claim: 'Speculative Tree positivity constraints', mechanization: 'TLA+ transition model + Lean theorems `Claims.speculative_tree_numerator_positive` and `Claims.speculative_tree_denominator_positive`', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_turb': { theorem: 'THM-S7-TURB', claim: 'Turbulent idle fraction stays bounded', mechanization: 'TLA+ transition model + Lean theorems `Claims.turbulent_idle_bounds` and `Claims.turbulent_idle_den_positive`', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_occ': { theorem: 'THM-S7-OCC', claim: 'Pipeline occupancy deficit is the complement of frontier fill and equals turbulent idle fraction in the canonical pipeline envelope', mechanization: 'TLA+ `Section7Formulas.tla` invariants (`InvFrontierFillBounds`, `InvOccupancyDeficitBounds`, `InvOccupancyDeficitEqualsTurbulentIdle`, `InvOccupancyC', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_wallace': { theorem: 'THM-S7-WALLACE', claim: 'Wallace metric (`wally`) on a bounded three-layer frontier is bounded, complementary to frontier fill, zero exactly at full envelope occupancy, and reduces to `2(k-1)/(3k)` on the symmetric diamond wi', mechanization: 'TLA+ `WallaceMetric.tla` invariants (`InvWallaceBounds`, `InvWallaceComplement`, `InvWallaceZeroIffFull`, `InvDiamondClosedForm`, `InvDiamondZeroIffUn', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_mux_mono': { theorem: 'THM-S7-MUX-MONO', claim: 'Turbulent multiplexing monotonicity: with fixed useful work and legal recovered overlap, multiplexing cannot increase the Wallace metric and strictly lowers it when overlap is actually recovered', mechanization: 'TLA+ `MultiplexingMonotonicity.tla` invariants (`InvWallaceNumeratorMonotone`, `InvFillMonotone`, `InvWallaceRatioMonotone`, `InvWallaceRatioStrictWhe', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_stagger': { theorem: 'THM-S7-STAGGER', claim: 'Staged expansion dominates naive widening on the bounded diamond witness: with positive topology deficit and the same added frontier budget, filling underfilled shoulders first yields higher frontier ', mechanization: 'TLA+ `StagedExpansion.tla` invariants (`InvSameBudgetFrontierArea`, `InvEnvelopeComparison`, `InvStagedFillDominatesNaive`, `InvStagedWallaceBeatsNaiv', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_warm_eff': { theorem: 'THM-S7-WARM-EFF', claim: 'Warm-up efficiency: for homologous workloads with fixed useful work, recovered overlap is worth the added Buley cost exactly when the weighted Wallace reduction exceeds the Burden Scalar; equivalently', mechanization: 'TLA+ `WarmupEfficiency.tla` invariants (`InvWallaceDropCrossClosedForm`, `InvBurdenScalarClosedForm`, `InvWorthWarmupIffExplicit`, `InvWorthWarmupIffS', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_warm_dyn': { theorem: 'THM-S7-WARM-DYN', claim: 'Dynamic warm-up cooling: under bounded entropy creep, reachable burden threshold, and cooling strength that can clear any reachable overlap, the dynamic warm-up controller keeps overlap bounded and ev', mechanization: 'TLA+ `DynamicWarmupEfficiency.tla` invariants (`InvOverlapBounded`, `InvDynamicAssumptions`, `InvWarmCapBounded`, `InvMaxOverlapTriggersCooling`) + li', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_warm_ctrl': { theorem: 'THM-S7-WARM-CTRL', claim: 'Warm-up controller optimality: under one-hot topology mismatch, the score-minimizing controller chooses `expand` for underfilled topology below the redline, `constrain` for overprovisioned topology be', mechanization: 'TLA+ `WarmupController.tla` invariants (`InvChosenScoreMinimal`, `InvExpandBeatsConstrainWhenUnder`, `InvConstrainBeatsExpandWhenOver`, `InvExpandOpti', section: 'Pipeline Scheduling (Section 7)' },
  'thm_s7_whip_crossover': { theorem: 'THM-S7-WHIP-CROSSOVER', claim: 'Cross-shard correction crossover is finite and over-sharding becomes non-improving', mechanization: 'TLA+ `WhipCrossover.tla` invariants + Lean theorems `Claims.whip_total_time_strictly_increases_after_full_sharding` and `Claims.whip_strict_crossover_', section: 'Pipeline Scheduling (Section 7)' },
  'thm_staged_expansion': { theorem: 'THM-STAGED-EXPANSION', claim: 'Staged expansion frontier: the three-stage expansion area formula matches naive widening. Peak is preserved across stages. Wallace numerator measures wasted capacity in the expansion envelope', mechanization: 'Lean theorems `StagedExpansion.staged_frontier_area_matches_naive` and `StagedExpansion.staged_peak_preserved` in `StagedExpansion.lean`', section: 'Pipeline Scheduling (Section 7)' },
  'thm_warmup_controller': { theorem: 'THM-WARMUP-CONTROLLER', claim: 'Warmup controller action scoring over expand/constrain/shedLoad: the controller selects the action with minimum score. Repair redline = deficitWeight + shedPenalty. Warmup worth = Wallace benefit exce', mechanization: 'Lean theorems in `WarmupController.lean` and `WarmupEfficiency.lean` including `warmup_wallace_drop_cross_closed_form`', section: 'Pipeline Scheduling (Section 7)' },
  'thm_multiplexing_capacity': { theorem: 'THM-MULTIPLEXING-CAPACITY', claim: 'Multiplexing capacity = sequential minus recovered overlap. Wallace numerator is monotone under multiplexing. Wallace numerator drop equals overlap identity', mechanization: 'Lean theorems `Multiplexing.multiplexing_wallace_numerator_monotone` and `Multiplexing.multiplexing_wallace_numerator_drop_equals_overlap` in `Multipl', section: 'Pipeline Scheduling (Section 7)' },
  'thm_rotation_admissible': { theorem: 'THM-ROTATION-ADMISSIBLE', claim: 'The Wallington Rotation produces an admissible schedule for any fork/race/fold DAG: positive finite makespan, respects stage ordering.', mechanization: 'TLA+ `WallingtonOptimality.tla` invariant `InvAdmissible` + Lean theorem `WallingtonOptimality.rotation_admissible` in `WallingtonOptimality.lean`', section: 'Wallington Rotation Optimality (Track Lambda)' },
  'thm_rotation_makespan_bound': { theorem: 'THM-ROTATION-MAKESPAN-BOUND', claim: 'The rotation makespan equals the critical path: numStages × maxStageTime. No admissible schedule can achieve lower makespan because stages are sequential dependencies. Bound is tight for balanced DAGs', mechanization: 'TLA+ `WallingtonOptimality.tla` invariant `InvMakespanBound` + Lean theorem `WallingtonOptimality.rotation_makespan_bound` in `WallingtonOptimality.le', section: 'Wallington Rotation Optimality (Track Lambda)' },
  'thm_rotation_dominates_sequential': { theorem: 'THM-ROTATION-DOMINATES-SEQUENTIAL', claim: 'For any DAG with β₁ > 0 (numPaths ≥ 2), the rotation strictly dominates the sequential schedule: rotationMakespan < sequentialMakespan. The speedup factor is exactly numPaths.', mechanization: 'TLA+ `WallingtonOptimality.tla` invariant `InvDominatesSequential` + Lean theorem `WallingtonOptimality.rotation_dominates_sequential` in `WallingtonO', section: 'Wallington Rotation Optimality (Track Lambda)' },
  'thm_rotation_pareto_schedule': { theorem: 'THM-ROTATION-PARETO-SCHEDULE', claim: 'The rotation is Pareto-optimal in (makespan, resources): sequential uses fewer resources (1 vs numPaths) but has strictly higher makespan. No schedule simultaneously beats both dimensions.', mechanization: 'TLA+ `WallingtonOptimality.tla` invariant `InvPareto` + Lean theorem `WallingtonOptimality.rotation_pareto_schedule` in `WallingtonOptimality.lean`', section: 'Wallington Rotation Optimality (Track Lambda)' },
  'thm_rotation_deficit_correlation': { theorem: 'THM-ROTATION-DEFICIT-CORRELATION', claim: 'The rotations speedup factor equals the topological deficit reduction plus one: speedup = β₁(rotation) - β₁(sequential) + 1 = numPaths. Larger deficit reduction → larger speedup, monotonically.', mechanization: 'TLA+ `WallingtonOptimality.tla` invariant `InvDeficitCorrelation` + Lean theorems `WallingtonOptimality.rotation_deficit_correlation` and `WallingtonO', section: 'Wallington Rotation Optimality (Track Lambda)' }
};
