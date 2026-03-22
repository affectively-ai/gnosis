// Auto-generated theorem tools for beauty-mcp
// 17 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_beauty_def',
    description: 'Bu beauty definition from deficit (`deficitBu = β₁* - β₁`, `beautyBu = β₁* - deficitBu`) [LEDGER: THM-BEAUTY-DEF]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_latency_mono',
    description: 'In the constructive linear workload model, lower Bu deficit implies non-worse latency, and positive latency penalty plus strict deficit separation gives strict latency separation; the broader manuscri [LEDGER: THM-BEAUTY-LATENCY-MONO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_waste_mono',
    description: 'In the constructive linear workload model, lower Bu deficit implies non-worse waste, and positive waste penalty plus strict deficit separation gives strict waste separation; the broader manuscript cla [LEDGER: THM-BEAUTY-WASTE-MONO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_pareto',
    description: 'In the constructive linear workload model, a zero-deficit candidate is Pareto-optimal in the latency/waste envelope, and under positive penalties a full-fit candidate strictly beats a positive-deficit [LEDGER: THM-BEAUTY-PARETO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_composition',
    description: 'In the constructive additive model, global Bu deficit composes additively from subsystem deficits [LEDGER: THM-BEAUTY-COMPOSITION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_optimality',
    description: 'In the constructive linear/additive model, definition + monotonicity + Pareto + composition cohere; the broader manuscript claim remains available as a schema [LEDGER: THM-BEAUTY-OPTIMALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_monotone_objective',
    description: 'In the constructive linear workload model, any componentwise monotone objective over latency and waste is deficit-monotone, so a zero-deficit candidate is never worse under arbitrary monotone nonlinea [LEDGER: THM-BEAUTY-MONOTONE-OBJECTIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_monotone_profile',
    description: 'The beauty layer no longer requires linear latency/waste penalties: for any workload whose latency and waste are arbitrary monotone functions of deficit, a zero-deficit candidate is never worse under  [LEDGER: THM-BEAUTY-MONOTONE-PROFILE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_comparison_family',
    description: 'A designated full-fit candidate in an indexed deficit-monotone comparison family is a global minimizer for every monotone generalized-convex cost, and under a strict latency or waste profile it is the [LEDGER: THM-BEAUTY-COMPARISON-FAMILY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_universal_floor',
    description: 'On any failure Pareto frontier equipped with measure-theoretic latency/waste floor bounds, the zero-deficit floor point is a global minimizer for every monotone generalized-convex cost, and under stri [LEDGER: THM-BEAUTY-UNIVERSAL-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_real_objective',
    description: 'The convexity hypothesis can also be dropped on the real-valued objective layer: arbitrary componentwise monotone real objectives admit the same zero-deficit/full-fit floor on monotone-profile workloa [LEDGER: THM-BEAUTY-REAL-OBJECTIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_deficit_only_boundary',
    description: 'Bare deficit bookkeeping does not force a zero-deficit latency/waste floor: there exists a zero-deficit point and a positive-deficit point with strictly lower latency and strictly lower waste, so the  [LEDGER: THM-BEAUTY-DEFICIT-ONLY-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_deficit_tax_bridge',
    description: 'The failure-tax bridge now has a quantitative deficit-dominating form: if a frontier carries a failure tax `τ` with `(Δβ : ℝ) ≤ τ` pointwise, monotone observable floor maps convert that tax into laten [LEDGER: THM-BEAUTY-DEFICIT-TAX-BRIDGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_failure_tax_bridge',
    description: 'The missing beauty bridge is now explicit and mechanized as an interface theorem: if a frontier carries a nonnegative failure tax whose zero point is the floor, positive deficit forces positive tax, a [LEDGER: THM-BEAUTY-FAILURE-TAX-BRIDGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_bridge_instance',
    description: 'The bridge layers now have concrete inhabitants from the existing beauty layer: every indexed strict-profile beauty family instantiates the quantitative deficit-dominating bridge by taking `τ = Δβ` an [LEDGER: THM-BEAUTY-BRIDGE-INSTANCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_unconditional_floor',
    description: 'Under the physically motivated assumption that Landauer erasure heat is observable through latency or waste (Axiom TOC, `ThermodynamicObservableCoupling`), zero topological deficit is the unique beaut [LEDGER: THM-BEAUTY-UNCONDITIONAL-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_beauty_erasure_sufficient',
    description: 'For any fork/race/fold system with non-injective fold, beauty optimality holds unconditionally. Zero-deficit minimizes any monotone objective. Narrows the axiom gap: only injective-fold systems need A [LEDGER: THM-BEAUTY-ERASURE-SUFFICIENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_beauty_def': { theorem: 'THM-BEAUTY-DEF', claim: 'Bu beauty definition from deficit (`deficitBu = β₁* - β₁`, `beautyBu = β₁* - deficitBu`)', mechanization: 'TLA+ `BeautyOptimality.tla` invariants + Lean schema `Axioms.beauty_definition_schema` + constructive linear-model theorems `BeautyLinearWorkload.defi', section: 'Beauty Optimality' },
  'thm_beauty_latency_mono': { theorem: 'THM-BEAUTY-LATENCY-MONO', claim: 'In the constructive linear workload model, lower Bu deficit implies non-worse latency, and positive latency penalty plus strict deficit separation gives strict latency separation; the broader manuscri', mechanization: 'TLA+ `BeautyOptimality.tla` invariant `InvBeautyLatencyMonotone` + Lean schema `Axioms.beauty_latency_monotone_schema` + constructive theorems `Beauty', section: 'Beauty Optimality' },
  'thm_beauty_waste_mono': { theorem: 'THM-BEAUTY-WASTE-MONO', claim: 'In the constructive linear workload model, lower Bu deficit implies non-worse waste, and positive waste penalty plus strict deficit separation gives strict waste separation; the broader manuscript cla', mechanization: 'TLA+ `BeautyOptimality.tla` invariant `InvBeautyWasteMonotone` + Lean schema `Axioms.beauty_waste_monotone_schema` + constructive theorems `BeautyLine', section: 'Beauty Optimality' },
  'thm_beauty_pareto': { theorem: 'THM-BEAUTY-PARETO', claim: 'In the constructive linear workload model, a zero-deficit candidate is Pareto-optimal in the latency/waste envelope, and under positive penalties a full-fit candidate strictly beats a positive-deficit', mechanization: 'TLA+ `BeautyOptimality.tla` invariant `InvBeautyPareto` + Lean schema `Axioms.beauty_pareto_optimality_schema` + constructive theorems `BeautyLinearWo', section: 'Beauty Optimality' },
  'thm_beauty_composition': { theorem: 'THM-BEAUTY-COMPOSITION', claim: 'In the constructive additive model, global Bu deficit composes additively from subsystem deficits', mechanization: 'TLA+ `BeautyOptimality.tla` invariant `InvBeautyComposition` + Lean schema `Axioms.beauty_composition_schema` + constructive theorem `BeautyCompositio', section: 'Beauty Optimality' },
  'thm_beauty_optimality': { theorem: 'THM-BEAUTY-OPTIMALITY', claim: 'In the constructive linear/additive model, definition + monotonicity + Pareto + composition cohere; the broader manuscript claim remains available as a schema', mechanization: 'TLA+ `BeautyOptimality.tla` invariant `InvBeautyOptimality` + Lean schema `Axioms.beauty_optimality_schema` + constructive theorems `BeautyLinearOptim', section: 'Beauty Optimality' },
  'thm_beauty_monotone_objective': { theorem: 'THM-BEAUTY-MONOTONE-OBJECTIVE', claim: 'In the constructive linear workload model, any componentwise monotone objective over latency and waste is deficit-monotone, so a zero-deficit candidate is never worse under arbitrary monotone nonlinea', mechanization: 'Lean structures/theorems `BeautyMonotoneObjective`, `BeautyStrictObjective`, `BeautyLinearWorkload.objective_monotone`, `BeautyLinearWorkload.zero_def', section: 'Beauty Optimality' },
  'thm_beauty_monotone_profile': { theorem: 'THM-BEAUTY-MONOTONE-PROFILE', claim: 'The beauty layer no longer requires linear latency/waste penalties: for any workload whose latency and waste are arbitrary monotone functions of deficit, a zero-deficit candidate is never worse under ', mechanization: 'Lean structures/theorems `BeautyMonotoneProfileWorkload`, `BeautyGeneralizedConvexCost`, `BeautyStrictGeneralizedConvexCost`, `BeautyMonotoneProfileWo', section: 'Beauty Optimality' },
  'thm_beauty_comparison_family': { theorem: 'THM-BEAUTY-COMPARISON-FAMILY', claim: 'A designated full-fit candidate in an indexed deficit-monotone comparison family is a global minimizer for every monotone generalized-convex cost, and under a strict latency or waste profile it is the', mechanization: 'Lean structures/theorems `BeautyMonotoneProfileFamily`, `BeautyMonotoneProfileFamily.comparisonWorkload`, `BeautyMonotoneProfileFamily.best_generalize', section: 'Beauty Optimality' },
  'thm_beauty_universal_floor': { theorem: 'THM-BEAUTY-UNIVERSAL-FLOOR', claim: 'On any failure Pareto frontier equipped with measure-theoretic latency/waste floor bounds, the zero-deficit floor point is a global minimizer for every monotone generalized-convex cost, and under stri', mechanization: 'Lean structures/theorems `BeautyFailureParetoPoint`, `BeautyFailureParetoPoint.cost`, `BeautyFailureParetoFrontier`, `BeautyFailureParetoFrontier.floo', section: 'Beauty Optimality' },
  'thm_beauty_real_objective': { theorem: 'THM-BEAUTY-REAL-OBJECTIVE', claim: 'The convexity hypothesis can also be dropped on the real-valued objective layer: arbitrary componentwise monotone real objectives admit the same zero-deficit/full-fit floor on monotone-profile workloa', mechanization: 'Lean structures/theorems `BeautyRealMonotoneObjective`, `BeautyRealStrictObjective`, `BeautyMonotoneProfileWorkload.real_objective_monotone`, `BeautyM', section: 'Beauty Optimality' },
  'thm_beauty_deficit_only_boundary': { theorem: 'THM-BEAUTY-DEFICIT-ONLY-BOUNDARY', claim: 'Bare deficit bookkeeping does not force a zero-deficit latency/waste floor: there exists a zero-deficit point and a positive-deficit point with strictly lower latency and strictly lower waste, so the ', mechanization: 'Lean namespace/theorems `BeautyDeficitOnlyBoundary.exists_componentwise_improving_positive_deficit_point`, `BeautyDeficitOnlyBoundary.exists_positive_', section: 'Beauty Optimality' },
  'thm_beauty_deficit_tax_bridge': { theorem: 'THM-BEAUTY-DEFICIT-TAX-BRIDGE', claim: 'The failure-tax bridge now has a quantitative deficit-dominating form: if a frontier carries a failure tax `τ` with `(Δβ : ℝ) ≤ τ` pointwise, monotone observable floor maps convert that tax into laten', mechanization: 'Lean structures/theorems `BeautyDeficitDominatingFailureTaxFrontier`, `BeautyDeficitDominatingFailureTaxFrontier.toFailureTaxObservableFrontier`, `Bea', section: 'Beauty Optimality' },
  'thm_beauty_failure_tax_bridge': { theorem: 'THM-BEAUTY-FAILURE-TAX-BRIDGE', claim: 'The missing beauty bridge is now explicit and mechanized as an interface theorem: if a frontier carries a nonnegative failure tax whose zero point is the floor, positive deficit forces positive tax, a', mechanization: 'Lean structures/theorems `BeautyFailureTaxObservableFrontier`, `BeautyFailureTaxObservableFrontier.toFailureParetoFrontier`, `BeautyFailureTaxObservab', section: 'Beauty Optimality' },
  'thm_beauty_bridge_instance': { theorem: 'THM-BEAUTY-BRIDGE-INSTANCE', claim: 'The bridge layers now have concrete inhabitants from the existing beauty layer: every indexed strict-profile beauty family instantiates the quantitative deficit-dominating bridge by taking `τ = Δβ` an', mechanization: 'Lean definitions/theorems `BeautyFailureTaxObservableFrontier.oneStepFloor`, `BeautyFailureTaxObservableFrontier.oneStepFloor_monotone`, `BeautyFailur', section: 'Beauty Optimality' },
  'thm_beauty_unconditional_floor': { theorem: 'THM-BEAUTY-UNCONDITIONAL-FLOOR', claim: 'Under the physically motivated assumption that Landauer erasure heat is observable through latency or waste (Axiom TOC, `ThermodynamicObservableCoupling`), zero topological deficit is the unique beaut', mechanization: 'Lean structure `ThermodynamicObservableCoupling`, `LandauerBeautyFrontier`, `landauer_beauty_frontier_to_observable_frontier`, `landauer_beauty_uncond', section: 'Beauty Optimality' },
  'thm_beauty_erasure_sufficient': { theorem: 'THM-BEAUTY-ERASURE-SUFFICIENT', claim: 'For any fork/race/fold system with non-injective fold, beauty optimality holds unconditionally. Zero-deficit minimizes any monotone objective. Narrows the axiom gap: only injective-fold systems need A', mechanization: 'TLA+ `FoldErasure.tla` invariant `InvBeautyFloorUnconditional` + Lean theorem `FoldErasure.beauty_erasure_sufficient` in `FoldErasure.lean`', section: 'Beauty Optimality' }
};
