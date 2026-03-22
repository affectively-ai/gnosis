// Auto-generated theorem tools for thermodynamics-mcp
// 12 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_landauer_equality_characterization',
    description: 'Frontier entropy equals failure tax if and only if liveBranches ≤ 2; for n ≥ 3, entropy is strictly less than failure tax. This sharpens the paper: the failure-tax floor strictly dominates entropy for [LEDGER: THM-LANDAUER-EQUALITY-CHARACTERIZATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_infinite_erasure',
    description: 'For PMFs with genuinely infinite support (not Finset-coverable), the entropy-to-heat chain still holds because the chain only requires entropy positivity (≥ log 2 bits when ≥ 2 live branches), not fin [LEDGER: THM-INFINITE-ERASURE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_data_processing_inequality',
    description: 'Strict data processing inequality for finite PMFs: H(f(X)) ≤ H(X) for any function f, with strict inequality H(f(X)) < H(X) when f is non-injective on the support. Conditional entropy H(X [LEDGER: THM-DATA-PROCESSING-INEQUALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_coarsening_thermodynamics',
    description: 'Landauer heat of network coarsening and the thermodynamic arrow of abstraction. Every non-trivial coarsening (many-to-one quotient) erases information, incurring Landauer heat ≥ kT ln 2 × information  [LEDGER: THM-COARSENING-THERMODYNAMICS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_coarsened_beauty_floor',
    description: 'For systems that arose from non-trivial coarsening: zero topological deficit is the strict unique global minimum for every strict generalized-convex cost and every strict real monotone objective, WITH [LEDGER: THM-COARSENED-BEAUTY-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_entropic_refinement_calculus',
    description: 'Conditional entropy as a functorial information measure on the category of quotient refinements. Identity law: H(X [LEDGER: THM-ENTROPIC-REFINEMENT-CALCULUS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_rate_distortion_frontier',
    description: 'Rate-distortion frontier for network coarsening. Given a family of many-to-one quotients, there exists a minimum-rate member (minimum information erasure), a minimum-heat member (since heat = kT ln 2  [LEDGER: THM-RATE-DISTORTION-FRONTIER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_enriched_convergence',
    description: 'Reduces the convergence schema from 7 axioms to 5 by deriving A6 (forkRaceFoldAttractor) and A7 (noAlternativeInModelClass) from throughput landscape optimization. The throughput-maximal skeleton has  [LEDGER: THM-ENRICHED-CONVERGENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fold_erasure',
    description: 'Any fold on ≥ 2 branches with a non-injective merge erases information: `H(inputs  [LEDGER: THM-FOLD-ERASURE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fold_heat',
    description: 'Information erased by non-injective fold has Landauer heat cost `≥ kT ln 2 · H(inputs  [LEDGER: THM-FOLD-HEAT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_erasure_coupling',
    description: 'For systems where fold is many-to-one, construct a `ThermodynamicObservableCoupling` as a *theorem* (not axiom). Latency/waste floor maps derived from heat dissipation physics. The coupling is built f [LEDGER: THM-ERASURE-COUPLING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fold_injectivity_boundary',
    description: 'Injective fold produces zero conditional entropy; the erasure coupling degenerates. This is the *exact boundary* of the erasure-sufficient regime: only injective folds (lossless merges) fall outside t [LEDGER: THM-FOLD-INJECTIVITY-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_landauer_equality_characterization': { theorem: 'THM-LANDAUER-EQUALITY-CHARACTERIZATION', claim: 'Frontier entropy equals failure tax if and only if liveBranches ≤ 2; for n ≥ 3, entropy is strictly less than failure tax. This sharpens the paper: the failure-tax floor strictly dominates entropy for', mechanization: 'Lean theorems `LandauerBuley.frontier_entropy_bits_eq_failure_tax_iff_le_two` and `LandauerBuley.frontier_entropy_bits_lt_failure_tax_of_three_or_more', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_infinite_erasure': { theorem: 'THM-INFINITE-ERASURE', claim: 'For PMFs with genuinely infinite support (not Finset-coverable), the entropy-to-heat chain still holds because the chain only requires entropy positivity (≥ log 2 bits when ≥ 2 live branches), not fin', mechanization: 'Lean theorems `InfiniteErasure.entropy_positive_of_two_atoms`, `InfiniteErasure.landauer_heat_positive_of_two_atoms`, `InfiniteErasure.infinite_erasur', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_data_processing_inequality': { theorem: 'THM-DATA-PROCESSING-INEQUALITY', claim: 'Strict data processing inequality for finite PMFs: H(f(X)) ≤ H(X) for any function f, with strict inequality H(f(X)) < H(X) when f is non-injective on the support. Conditional entropy H(X', mechanization: 'g∘f(X)) = H(X', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_coarsening_thermodynamics': { theorem: 'THM-COARSENING-THERMODYNAMICS', claim: 'Landauer heat of network coarsening and the thermodynamic arrow of abstraction. Every non-trivial coarsening (many-to-one quotient) erases information, incurring Landauer heat ≥ kT ln 2 × information ', mechanization: 'Lean module `CoarseningThermodynamics.lean` with `coarseningInformationLoss`, `coarsening_information_loss_nonneg`, `coarsening_information_loss_pos_o', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_coarsened_beauty_floor': { theorem: 'THM-COARSENED-BEAUTY-FLOOR', claim: 'For systems that arose from non-trivial coarsening: zero topological deficit is the strict unique global minimum for every strict generalized-convex cost and every strict real monotone objective, WITH', mechanization: 'Lean module `CoarseningThermodynamics.lean` with structure `CoarsenedSystem`, definition `coarsenedSystemObservableCoupling`, theorems `coarsened_syst', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_entropic_refinement_calculus': { theorem: 'THM-ENTROPIC-REFINEMENT-CALCULUS', claim: 'Conditional entropy as a functorial information measure on the category of quotient refinements. Identity law: H(X', mechanization: 'g∘f(X)) = H(X', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_rate_distortion_frontier': { theorem: 'THM-RATE-DISTORTION-FRONTIER', claim: 'Rate-distortion frontier for network coarsening. Given a family of many-to-one quotients, there exists a minimum-rate member (minimum information erasure), a minimum-heat member (since heat = kT ln 2 ', mechanization: 'Lean module `RateDistortionFrontier.lean` with `QuotientCandidate`, `DistortionMeasure`, `RateDistortionPoint`, `quotientToRateDistortionPoint`, `rate', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_enriched_convergence': { theorem: 'THM-ENRICHED-CONVERGENCE', claim: 'Reduces the convergence schema from 7 axioms to 5 by deriving A6 (forkRaceFoldAttractor) and A7 (noAlternativeInModelClass) from throughput landscape optimization. The throughput-maximal skeleton has ', mechanization: 'Lean module `EnrichedConvergence.lean` with `MonoidalSkeleton`, `forkRaceFoldSkeleton`, `ThroughputLandscape`, `throughput_maximum_exists`, `throughpu', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_fold_erasure': { theorem: 'THM-FOLD-ERASURE', claim: 'Any fold on ≥ 2 branches with a non-injective merge erases information: `H(inputs ', mechanization: 'Fintype α, β; DecidableEq α, β; PMF α; non-injective fold merge `f : α → β` witnessed by two distinct elements with positive mass mapping to same imag', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_fold_heat': { theorem: 'THM-FOLD-HEAT', claim: 'Information erased by non-injective fold has Landauer heat cost `≥ kT ln 2 · H(inputs ', mechanization: 'FoldErasureWitness with Boltzmann constant > 0, temperature > 0', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_erasure_coupling': { theorem: 'THM-ERASURE-COUPLING', claim: 'For systems where fold is many-to-one, construct a `ThermodynamicObservableCoupling` as a *theorem* (not axiom). Latency/waste floor maps derived from heat dissipation physics. The coupling is built f', mechanization: 'TLA+ `FoldErasure.tla` invariant `InvErasureCouplingDerived` + Lean definition `FoldErasure.erasure_coupling` and theorem `FoldErasure.erasure_couplin', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' },
  'thm_fold_injectivity_boundary': { theorem: 'THM-FOLD-INJECTIVITY-BOUNDARY', claim: 'Injective fold produces zero conditional entropy; the erasure coupling degenerates. This is the *exact boundary* of the erasure-sufficient regime: only injective folds (lossless merges) fall outside t', mechanization: 'TLA+ `FoldErasure.tla` invariant `InvInjectiveBoundary` + Lean theorems `FoldErasure.fold_injectivity_boundary`, `FoldErasure.fold_injectivity_zero_he', section: 'Thermodynamic Bridge: Erasure, Heat, and Information' }
};
