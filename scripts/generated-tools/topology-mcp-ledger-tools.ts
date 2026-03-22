// Auto-generated theorem tools for topology-mcp
// 28 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_covering_causality',
    description: 'If β₁(computation) > 0 and β₁(transport) = 0 (TCP-style single ordered stream), there exists a reachable state where loss on path pⱼ stalls progress on independent path pᵢ. Constructive blocking witne [LEDGER: THM-COVERING-CAUSALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_covering_match',
    description: 'If β₁(transport) ≥ β₁(computation), no cross-path blocking state is reachable. Each path maps to its own transport stream (covering map is injective). [LEDGER: THM-COVERING-MATCH]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_latency_separation',
    description: 'Topological deficit Δ = β₁(G) - β₁(transport) lower-bounds worst-case latency inflation. TCP deficit equals pathCount - 1. Deficit is monotonically decreasing in transport stream count. Positive defic [LEDGER: THM-DEFICIT-LATENCY-SEPARATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_capacity_gap',
    description: 'For a system with `k` independent computation paths on `m < k` transport streams, the per-step information capacity gap is `≥ (k - m) · c_min` where `c_min` is the minimum per-stream capacity. Quantif [LEDGER: THM-DEFICIT-CAPACITY-GAP]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_information_loss',
    description: 'Topological deficit `Δβ > 0` forces positive information loss under any multiplexing strategy. The multiplexing function is non-injective (pigeonhole), so by the data processing inequality, informatio [LEDGER: THM-DEFICIT-INFORMATION-LOSS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_erasure_chain',
    description: 'Full chain from topology to thermodynamics: deficit → pigeonhole collision → information erasure → Landauer heat → observable waste. Composes deficit_information_loss with fold_erasure and fold_heat. [LEDGER: THM-DEFICIT-ERASURE-CHAIN]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_zero_deficit_preserves_information',
    description: 'When `Δβ = 0` (streams ≥ paths), there exists a multiplexing strategy achieving lossless transport. Each path gets its own stream; the multiplexing function is injective. [LEDGER: THM-ZERO-DEFICIT-PRESERVES-INFORMATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_monotone_in_streams',
    description: 'Information loss under optimal multiplexing is monotonically decreasing in transport stream count, reaching zero when `m ≥ k`. Adding transport streams can only reduce deficit. [LEDGER: THM-DEFICIT-MONOTONE-IN-STREAMS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_american_frontier',
    description: 'Pareto frontier of diversity vs waste: the frontier function is monotone, zero at the matched topology, positive below, and admits a pigeonhole witness for any topology with fewer streams than require [LEDGER: THM-AMERICAN-FRONTIER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_american_frontier_codec_racing',
    description: 'Codec-racing instantiation of the Buley frontier: monotone wire size, zero deficit at matched codec, and subsumption of smaller codecs by larger ones [LEDGER: THM-AMERICAN-FRONTIER-CODEC-RACING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_american_frontier_unified',
    description: 'Unified topological + codec frontier composition: the combined frontier inherits monotonicity and zero-at-match from both the topological and codec layers [LEDGER: THM-AMERICAN-FRONTIER-UNIFIED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_american_frontier_pareto_diagnostic',
    description: 'Pareto diagnostic: matched topology is optimal, monoculture is suboptimal, and there exists a monotone path from any suboptimal point toward the frontier [LEDGER: THM-AMERICAN-FRONTIER-PARETO-DIAGNOSTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier',
    description: 'THM-AMERICAN-FRONTIER instantiated on published Netflix Prize data: monotone RMSE descent across algorithm-family and team-of-teams frontiers, positive waste for every monoculture ceiling, pigeonhole  [LEDGER: THM-NETFLIX-FRONTIER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier_monotone_algo',
    description: 'Algorithm-family frontier RMSE is monotonically non-increasing across 6 published milestones [LEDGER: THM-NETFLIX-FRONTIER-MONOTONE-ALGO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier_monotone_team',
    description: 'Team-of-teams frontier RMSE is monotonically non-increasing across 4 published milestones [LEDGER: THM-NETFLIX-FRONTIER-MONOTONE-TEAM]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier_positive_below',
    description: 'Every monoculture ceiling (Cinematch, timeSVD++, k-NN, RBM, NNMF) has strictly higher RMSE than the observed floor [LEDGER: THM-NETFLIX-FRONTIER-POSITIVE-BELOW]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier_pigeonhole',
    description: 'Best single model (timeSVD++, 0.8762) is strictly worse than first 3-family blend (BellKor 2007, 0.8712) [LEDGER: THM-NETFLIX-FRONTIER-PIGEONHOLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_frontier_recursive',
    description: 'Team frontier floor (50/50 blend, 0.8555) is strictly below algorithm frontier floor (BellKor 2008, 0.8643) [LEDGER: THM-NETFLIX-FRONTIER-RECURSIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_residual_gap',
    description: 'Grand Prize winner (0.856704) has strictly higher RMSE than 50/50 finalist blend (0.8555): 0.0012 RMSE of optimization left on the table [LEDGER: THM-NETFLIX-RESIDUAL-GAP]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_independent_convergence',
    description: 'Two independent mega-ensembles (BPC and The Ensemble) converged to the same RMSE to 4 decimal places (0.8567) [LEDGER: THM-NETFLIX-INDEPENDENT-CONVERGENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_netflix_oracle_hierarchy',
    description: 'On synthetic 8-dimensional taste space: void-designed oracle monoculture (time-traveled optimal single strategy) loses to void-walking ensemble; god-mode (all-dims-visible, unrealizable) beats ensembl [LEDGER: THM-NETFLIX-ORACLE-HIERARCHY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dmn_void_walker',
    description: 'The Default Mode Network as void walking engine: energy allocation (K-1)/K predicts Raichles 95% within 0.45pp, mind-wandering duty cycle (K-1)/(2K-1) predicts Killingsworth & Gilberts 46.9% within  [LEDGER: THM-DMN-VOID-WALKER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dmn_void_gain_index',
    description: 'Three predictive metrics -- VGI = (K_total-1)/(K_env-1) = 0.905, CVI = (K_conscious-1)/(K_total-1) = 0.40, CFP = 0.995 -- with pathological threshold at VGI > 1.0 (rumination = void-walking on phantom [LEDGER: THM-DMN-VOID-GAIN-INDEX]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dmn_prediction_matrix',
    description: '8×8 prediction matrix: 8 observable measures (DMN energy, mind-wandering rate, saccade rate, fixation duration, pupil dilation, EEG alpha, EEG theta, reaction time) × 8 populations (rest/task, creativ [LEDGER: THM-DMN-PREDICTION-MATRIX]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_diversity_is_concurrency',
    description: 'Diversity and concurrency are the same property. β₁ counts both. Effective concurrency = diversity. Redundant parallelism (K copies of one strategy) produces zero information gain. Serialization destr [LEDGER: THM-DIVERSITY-IS-CONCURRENCY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_bule_is_value',
    description: 'The grand unification: the Bule is the unit of value. Six faces of one number: topological deficit = diversity lost = concurrency lost = information erased = waste generated = work required = heat qua [LEDGER: THM-BULE-IS-VALUE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_neurodivergent_vgi',
    description: 'Unified VGI model of neurodivergence: 4 profiles (NT/AUT/ADHD/AuDHD) × 6 environments = 24-cell VGI matrix. Autism = wider aperture (K_perceived=8 vs NT 3), ADHD = gait oscillation (VGI swings 7.5× wi [LEDGER: THM-NEURODIVERGENT-VGI]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dmn_shape_and_forces',
    description: 'The framework describes the geometry of consciousness (the topology, the deficit, the frontier) but not the phenomenology (why the fold feels like something). The relationship to the hard problem is s [LEDGER: THM-DMN-SHAPE-AND-FORCES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_covering_causality': { theorem: 'THM-COVERING-CAUSALITY', claim: 'If β₁(computation) > 0 and β₁(transport) = 0 (TCP-style single ordered stream), there exists a reachable state where loss on path pⱼ stalls progress on independent path pᵢ. Constructive blocking witne', mechanization: 'TLA+ `CoveringSpaceCausality.tla` invariants (`InvDeficitImpliesBlockingPossible`, `InvComputationBeta1`, `InvTcpBeta1Zero`) + Lean theorems `Covering', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_covering_match': { theorem: 'THM-COVERING-MATCH', claim: 'If β₁(transport) ≥ β₁(computation), no cross-path blocking state is reachable. Each path maps to its own transport stream (covering map is injective).', mechanization: 'TLA+ `CoveringSpaceMatch.tla` invariants (`InvNoCrossPathBlocking`, `InvNoForeignBlocking`, `InvZeroDeficit`) + Lean theorems `CoveringSpaceCausality.', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_deficit_latency_separation': { theorem: 'THM-DEFICIT-LATENCY-SEPARATION', claim: 'Topological deficit Δ = β₁(G) - β₁(transport) lower-bounds worst-case latency inflation. TCP deficit equals pathCount - 1. Deficit is monotonically decreasing in transport stream count. Positive defic', mechanization: 'TLA+ `CoveringSpaceCausality.tla` invariant `InvDeficitBoundsInflation` + Lean theorems `CoveringSpaceCausality.deficit_latency_separation`, `Covering', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_deficit_capacity_gap': { theorem: 'THM-DEFICIT-CAPACITY-GAP', claim: 'For a system with `k` independent computation paths on `m < k` transport streams, the per-step information capacity gap is `≥ (k - m) · c_min` where `c_min` is the minimum per-stream capacity. Quantif', mechanization: 'TLA+ `DeficitCapacity.tla` invariant `InvCapacityGap` + Lean theorem `DeficitCapacity.deficit_capacity_gap` in `DeficitCapacity.lean`', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_deficit_information_loss': { theorem: 'THM-DEFICIT-INFORMATION-LOSS', claim: 'Topological deficit `Δβ > 0` forces positive information loss under any multiplexing strategy. The multiplexing function is non-injective (pigeonhole), so by the data processing inequality, informatio', mechanization: 'TLA+ `DeficitCapacity.tla` invariant `InvInformationLoss` + Lean theorem `DeficitCapacity.deficit_information_loss` in `DeficitCapacity.lean`', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_deficit_erasure_chain': { theorem: 'THM-DEFICIT-ERASURE-CHAIN', claim: 'Full chain from topology to thermodynamics: deficit → pigeonhole collision → information erasure → Landauer heat → observable waste. Composes deficit_information_loss with fold_erasure and fold_heat.', mechanization: 'TLA+ `DeficitCapacity.tla` invariant `InvErasureChain` + Lean theorem `DeficitCapacity.deficit_erasure_chain` in `DeficitCapacity.lean`', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_zero_deficit_preserves_information': { theorem: 'THM-ZERO-DEFICIT-PRESERVES-INFORMATION', claim: 'When `Δβ = 0` (streams ≥ paths), there exists a multiplexing strategy achieving lossless transport. Each path gets its own stream; the multiplexing function is injective.', mechanization: 'TLA+ `DeficitCapacity.tla` invariant `InvZeroDeficit` + Lean theorem `DeficitCapacity.zero_deficit_preserves_information` in `DeficitCapacity.lean`', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_deficit_monotone_in_streams': { theorem: 'THM-DEFICIT-MONOTONE-IN-STREAMS', claim: 'Information loss under optimal multiplexing is monotonically decreasing in transport stream count, reaching zero when `m ≥ k`. Adding transport streams can only reduce deficit.', mechanization: 'TLA+ `DeficitCapacity.tla` invariant `InvMonotone` + Lean theorem `DeficitCapacity.deficit_monotone_in_streams` in `DeficitCapacity.lean`', section: 'Covering Space & Topological Deficit (Track Theta)' },
  'thm_american_frontier': { theorem: 'THM-AMERICAN-FRONTIER', claim: 'Pareto frontier of diversity vs waste: the frontier function is monotone, zero at the matched topology, positive below, and admits a pigeonhole witness for any topology with fewer streams than require', mechanization: 'Lean theorem `american_frontier` in `AmericanFrontier.lean`', section: 'American Frontier' },
  'thm_american_frontier_codec_racing': { theorem: 'THM-AMERICAN-FRONTIER-CODEC-RACING', claim: 'Codec-racing instantiation of the Buley frontier: monotone wire size, zero deficit at matched codec, and subsumption of smaller codecs by larger ones', mechanization: 'Lean theorem `american_frontier_codec_racing` in `AmericanFrontier.lean`', section: 'American Frontier' },
  'thm_american_frontier_unified': { theorem: 'THM-AMERICAN-FRONTIER-UNIFIED', claim: 'Unified topological + codec frontier composition: the combined frontier inherits monotonicity and zero-at-match from both the topological and codec layers', mechanization: 'Lean theorem `american_frontier_unified` in `AmericanFrontier.lean`', section: 'American Frontier' },
  'thm_american_frontier_pareto_diagnostic': { theorem: 'THM-AMERICAN-FRONTIER-PARETO-DIAGNOSTIC', claim: 'Pareto diagnostic: matched topology is optimal, monoculture is suboptimal, and there exists a monotone path from any suboptimal point toward the frontier', mechanization: 'Lean theorem `american_frontier_pareto_diagnostic` in `AmericanFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_frontier': { theorem: 'THM-NETFLIX-FRONTIER', claim: 'THM-AMERICAN-FRONTIER instantiated on published Netflix Prize data: monotone RMSE descent across algorithm-family and team-of-teams frontiers, positive waste for every monoculture ceiling, pigeonhole ', mechanization: 'Lean theorem `netflix_frontier` in `NetflixFrontier.lean` (7-way conjunction; all `omega` on concrete ℕ) + companion tests `ch17-netflix-frontier-figu', section: 'American Frontier' },
  'thm_netflix_frontier_monotone_algo': { theorem: 'THM-NETFLIX-FRONTIER-MONOTONE-ALGO', claim: 'Algorithm-family frontier RMSE is monotonically non-increasing across 6 published milestones', mechanization: 'Lean theorem `netflix_frontier_monotone_algo` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_frontier_monotone_team': { theorem: 'THM-NETFLIX-FRONTIER-MONOTONE-TEAM', claim: 'Team-of-teams frontier RMSE is monotonically non-increasing across 4 published milestones', mechanization: 'Lean theorem `netflix_frontier_monotone_team` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_frontier_positive_below': { theorem: 'THM-NETFLIX-FRONTIER-POSITIVE-BELOW', claim: 'Every monoculture ceiling (Cinematch, timeSVD++, k-NN, RBM, NNMF) has strictly higher RMSE than the observed floor', mechanization: 'Lean theorem `netflix_frontier_positive_below` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_frontier_pigeonhole': { theorem: 'THM-NETFLIX-FRONTIER-PIGEONHOLE', claim: 'Best single model (timeSVD++, 0.8762) is strictly worse than first 3-family blend (BellKor 2007, 0.8712)', mechanization: 'Lean theorem `netflix_frontier_pigeonhole` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_frontier_recursive': { theorem: 'THM-NETFLIX-FRONTIER-RECURSIVE', claim: 'Team frontier floor (50/50 blend, 0.8555) is strictly below algorithm frontier floor (BellKor 2008, 0.8643)', mechanization: 'Lean theorem `netflix_frontier_recursive` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_residual_gap': { theorem: 'THM-NETFLIX-RESIDUAL-GAP', claim: 'Grand Prize winner (0.856704) has strictly higher RMSE than 50/50 finalist blend (0.8555): 0.0012 RMSE of optimization left on the table', mechanization: 'Lean theorem `netflix_residual_gap` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_independent_convergence': { theorem: 'THM-NETFLIX-INDEPENDENT-CONVERGENCE', claim: 'Two independent mega-ensembles (BPC and The Ensemble) converged to the same RMSE to 4 decimal places (0.8567)', mechanization: 'Lean theorem `netflix_independent_convergence` in `NetflixFrontier.lean`', section: 'American Frontier' },
  'thm_netflix_oracle_hierarchy': { theorem: 'THM-NETFLIX-ORACLE-HIERARCHY', claim: 'On synthetic 8-dimensional taste space: void-designed oracle monoculture (time-traveled optimal single strategy) loses to void-walking ensemble; god-mode (all-dims-visible, unrealizable) beats ensembl', mechanization: 'Companion tests `ch17-netflix-void-walker.test.ts` (26 tests)', section: 'American Frontier' },
  'thm_dmn_void_walker': { theorem: 'THM-DMN-VOID-WALKER', claim: 'The Default Mode Network as void walking engine: energy allocation (K-1)/K predicts Raichles 95% within 0.45pp, mind-wandering duty cycle (K-1)/(2K-1) predicts Killingsworth & Gilberts 46.9% within ', mechanization: 'Companion tests `ch17-dmn-void-walker.test.ts` (39 tests)', section: 'American Frontier' },
  'thm_dmn_void_gain_index': { theorem: 'THM-DMN-VOID-GAIN-INDEX', claim: 'Three predictive metrics -- VGI = (K_total-1)/(K_env-1) = 0.905, CVI = (K_conscious-1)/(K_total-1) = 0.40, CFP = 0.995 -- with pathological threshold at VGI > 1.0 (rumination = void-walking on phantom', mechanization: 'Companion tests `ch17-dmn-void-walker.test.ts` (39 tests)', section: 'American Frontier' },
  'thm_dmn_prediction_matrix': { theorem: 'THM-DMN-PREDICTION-MATRIX', claim: '8×8 prediction matrix: 8 observable measures (DMN energy, mind-wandering rate, saccade rate, fixation duration, pupil dilation, EEG alpha, EEG theta, reaction time) × 8 populations (rest/task, creativ', mechanization: 'Companion tests `ch17-dmn-prediction-matrix.test.ts` (28 tests) + artifact `ch17-dmn-prediction-matrix.md`', section: 'American Frontier' },
  'thm_diversity_is_concurrency': { theorem: 'THM-DIVERSITY-IS-CONCURRENCY', claim: 'Diversity and concurrency are the same property. β₁ counts both. Effective concurrency = diversity. Redundant parallelism (K copies of one strategy) produces zero information gain. Serialization destr', mechanization: 'Lean theorem `diversity_is_concurrency_full` in `DiversityIsConcurrency.lean` (6-way conjunction) + TLA+ `DiversityIsConcurrency.tla` (5 invariants) +', section: 'American Frontier' },
  'thm_bule_is_value': { theorem: 'THM-BULE-IS-VALUE', claim: 'The grand unification: the Bule is the unit of value. Six faces of one number: topological deficit = diversity lost = concurrency lost = information erased = waste generated = work required = heat qua', mechanization: 'Lean theorem `bule_is_value` in `BuleIsValue.lean` (5-way conjunction) + TLA+ `BuleIsValue.tla` (7 invariants, sweep to MaxPaths=10) + companion tests', section: 'American Frontier' },
  'thm_neurodivergent_vgi': { theorem: 'THM-NEURODIVERGENT-VGI', claim: 'Unified VGI model of neurodivergence: 4 profiles (NT/AUT/ADHD/AuDHD) × 6 environments = 24-cell VGI matrix. Autism = wider aperture (K_perceived=8 vs NT 3), ADHD = gait oscillation (VGI swings 7.5× wi', mechanization: 'Companion tests `ch17-neurodivergent-vgi.test.ts` (22 tests) + `autism-void-sensitivity.test.ts` (8 tests) + `adhd-gait-instability.test.ts` (11 tests', section: 'American Frontier' },
  'thm_dmn_shape_and_forces': { theorem: 'THM-DMN-SHAPE-AND-FORCES', claim: 'The framework describes the geometry of consciousness (the topology, the deficit, the frontier) but not the phenomenology (why the fold feels like something). The relationship to the hard problem is s', mechanization: '§20.2.4 of manuscript', section: 'American Frontier' }
};
