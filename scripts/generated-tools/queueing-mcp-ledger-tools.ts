// Auto-generated theorem tools for queueing-mcp
// 28 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_queue_sample_path',
    description: 'Finite-trace work-conserving single-server queues satisfy the discrete sample-path Littles Law identity independent of discipline choice [LEDGER: THM-QUEUE-SAMPLE-PATH]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_multiclass_network',
    description: 'Bounded multi-class open networks satisfy the same conservation identity under node-local work-conserving dispatch [LEDGER: THM-QUEUE-MULTICLASS-NETWORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_stochastic_mixture',
    description: 'Finite-support stochastic mixtures of bounded multi-class open-network traces preserve customer-time conservation in expectation [LEDGER: THM-QUEUE-STOCHASTIC-MIXTURE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_probabilistic_kernel',
    description: 'Exact finite-state probabilistic queue transitions preserve customer-time conservation at the distribution level [LEDGER: THM-QUEUE-PROBABILISTIC-KERNEL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_probabilistic_network_kernel',
    description: 'Exact finite-state probabilistic multiclass open-network transitions preserve customer-time conservation at the distribution level [LEDGER: THM-QUEUE-PROBABILISTIC-NETWORK-KERNEL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_probabilistic_large_network',
    description: 'Larger exact finite-support multiclass open-network probabilistic cubes preserve the same weighted conservation law [LEDGER: THM-QUEUE-PROBABILISTIC-LARGE-NETWORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_mm1_stability',
    description: 'Stable `M/M/1` occupancy has the geometric stationary law with finite mean queue length `ρ / (1 - ρ)`, and the same stationary law inherits the queue conservation identities [LEDGER: THM-QUEUE-MM1-STABILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_one_path',
    description: 'Canonical stable `M/M/1` queues admit a constructive one-path boundary witness: `β₁ = 0`, capacity `β₁ + 1 = 1`, stationary mean occupancy `λ / (μ - λ)`, and the induced identity `λ / (μ - λ) = λ * (1 [LEDGER: THM-QUEUE-ONE-PATH]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_product',
    description: 'Finite open networks with a stable throughput witness satisfying the traffic equations admit an exact product-form occupancy law with exact singleton mass and total mean occupancy `∑ᵢ αᵢ / (μᵢ - αᵢ)` [LEDGER: THM-QUEUE-JACKSON-PRODUCT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_exact',
    description: 'Finite open networks admit an exact constructive Jackson closure beyond the envelope ladder once an exact stable real traffic fixed point is supplied: under `spectralRadius P < 1`, any nonnegative rea [LEDGER: THM-QUEUE-JACKSON-EXACT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_raw',
    description: 'Finite open networks satisfying the raw envelope criterion admit the same product-form occupancy and queue-balance laws with no hand-supplied throughput witness: if `maxIncomingRoutingMass < 1` and `m [LEDGER: THM-QUEUE-JACKSON-RAW]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_feedforward',
    description: 'The bounded two-node feed-forward ceiling witness is a nontrivial raw exact Jackson subclass: its routing matrix is nilpotent (`P^2 = 0`), so the explicit throughput candidate already matches the cons [LEDGER: THM-QUEUE-JACKSON-FEEDFORWARD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_envelope_ladder',
    description: 'The finite Jackson raw route sharpens into a descending constructive envelope ladder: if any chosen stage `throughputEnvelopeApprox n` already lies below service rates, then the same product-form occu [LEDGER: THM-QUEUE-JACKSON-ENVELOPE-LADDER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_infinite_support',
    description: 'Infinite weighted scenario families preserve queue customer-time conservation under exact countable/infinite support aggregation [LEDGER: THM-QUEUE-INFINITE-SUPPORT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_countable_stochastic',
    description: 'Countably supported stochastic queue laws preserve the same expectation/conservation identity [LEDGER: THM-QUEUE-COUNTABLE-STOCHASTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_measure_limit',
    description: 'Measure-theoretic queue observables and monotone truncation families preserve conservation in the unbounded limit [LEDGER: THM-QUEUE-MEASURE-LIMIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_ergodic_cesaro',
    description: 'Unbounded open-network sample-path conservation lifts to long-run Cesaro limits, and vanishing residual open age yields terminal balance [LEDGER: THM-QUEUE-ERGODIC-CESARO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_state_dependent_schema',
    description: 'State-dependent open-network stationary and terminal queue balance follow from explicit routing-kernel bridge witnesses, explicit Lyapunov drift bounds outside a finite small set, and a positive drift [LEDGER: THM-QUEUE-STATE-DEPENDENT-SCHEMA]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_adaptive_supremum',
    description: 'Adaptive routing families dominated by a substochastic contractive ceiling kernel inherit the ceilings throughput bounds constructively, and from that raw ceiling data plus a monotone expected-Lyapun [LEDGER: THM-QUEUE-ADAPTIVE-SUPREMUM]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_adaptive_raw_ceiling',
    description: 'A bounded two-node adaptive rerouting family derives its own dominating ceiling kernel, strict-row-substochastic spectral side conditions, constructive throughput bound, and a linear drift witness dir [LEDGER: THM-QUEUE-ADAPTIVE-RAW-CEILING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_limit_schema',
    description: 'Stronger queue-limit claims with explicit support-exhaustion and integrable-envelope side conditions remain available as a higher-level theorem schema [LEDGER: THM-QUEUE-LIMIT-SCHEMA]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_containment',
    description: '*Superseded by THM-QUEUE-SUBSUMPTION.* Forward direction of queueing subsumption: when the supplied `β₁=0` queue law holds, the framework recovers that one-path boundary, and when `β₁>0` the framework [LEDGER: THM-QUEUE-CONTAINMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_converse',
    description: 'Converse direction of queueing subsumption: every queueing system (G/G/1, G/G/c, priority, network) admits a fork/race/fold embedding under C3 (probabilistic fold). Arrival processes map to fork dist [LEDGER: THM-QUEUE-CONVERSE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_c3_prime_generalization',
    description: 'C3 (probabilistic fold) generalizes C3 (deterministic fold): deterministic fold is the Dirac δ special case of probabilistic fold. C3 preserves C1 (fork creates paths), C2 (race selects earliest), a [LEDGER: THM-C3-PRIME-GENERALIZATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_probabilistic_fold_safety',
    description: 'Under C3 + ergodicity, probabilistic fold preserves all four fork/race/fold axioms and conservation holds in expectation rather than pointwise. The entropy increase is bounded: H(fold) = 0 for determ [LEDGER: THM-PROBABILISTIC-FOLD-SAFETY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_subsumption',
    description: 'Bidirectional subsumption of queueing theory by fork/race/fold: (forward) FRF at β₁=0 recovers queueing theory (THM-QUEUE-CONTAINMENT); (converse) every queueing system embeds as FRF under C3 (THM-QU [LEDGER: THM-QUEUE-SUBSUMPTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_jackson_queueing',
    description: 'Jackson network fundamentals: spectrum/transpose equality, spectral radius transpose equality, M/M/1 stationary queue length integral equals rho/(1-rho). Measure-theoretic queue analysis with weighted [LEDGER: THM-QUEUE-JACKSON-QUEUEING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_state_dependent_queue_families',
    description: 'State-dependent queue families: vacation queue state, retrial queue, reneging queue, adaptive routing queue. Queue law structures for multiple service disciplines with customer time, sojourn time, and [LEDGER: THM-STATE-DEPENDENT-QUEUE-FAMILIES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_queue_sample_path': { theorem: 'THM-QUEUE-SAMPLE-PATH', claim: 'Finite-trace work-conserving single-server queues satisfy the discrete sample-path Littles Law identity independent of discipline choice', mechanization: 'TLA+ `QueueingSamplePath.tla` invariants (`InvWorkConservingChoice`, `InvConservationLaw`, `InvFinalLittleIdentity`) + executable queueing-discipline ', section: 'Queueing Theory' },
  'thm_queue_multiclass_network': { theorem: 'THM-QUEUE-MULTICLASS-NETWORK', claim: 'Bounded multi-class open networks satisfy the same conservation identity under node-local work-conserving dispatch', mechanization: 'TLA+ `QueueingMultiClassNetwork.tla` invariants (`InvWorkConservingNetworkDispatch`, `InvNetworkConservationLaw`, `InvFinalNetworkIdentity`) + executa', section: 'Queueing Theory' },
  'thm_queue_stochastic_mixture': { theorem: 'THM-QUEUE-STOCHASTIC-MIXTURE', claim: 'Finite-support stochastic mixtures of bounded multi-class open-network traces preserve customer-time conservation in expectation', mechanization: 'TLA+ `QueueingStochasticMixture.tla` invariants (`InvWeightedNetworkConservationLaw`, `InvWeightedFinalNetworkIdentity`) + Lean theorem `Claims.weight', section: 'Queueing Theory' },
  'thm_queue_probabilistic_kernel': { theorem: 'THM-QUEUE-PROBABILISTIC-KERNEL', claim: 'Exact finite-state probabilistic queue transitions preserve customer-time conservation at the distribution level', mechanization: 'TLA+ `QueueingProbabilisticKernel.tla` invariants (`InvMassSchedule`, `InvDistributionConservationLaw`, `InvFinalExpectationIdentity`) + executable ex', section: 'Queueing Theory' },
  'thm_queue_probabilistic_network_kernel': { theorem: 'THM-QUEUE-PROBABILISTIC-NETWORK-KERNEL', claim: 'Exact finite-state probabilistic multiclass open-network transitions preserve customer-time conservation at the distribution level', mechanization: 'TLA+ `QueueingProbabilisticNetworkKernel.tla` invariants (`InvMassSchedule`, `InvDistributionConservationLaw`, `InvFinalExpectationIdentity`) + execut', section: 'Queueing Theory' },
  'thm_queue_probabilistic_large_network': { theorem: 'THM-QUEUE-PROBABILISTIC-LARGE-NETWORK', claim: 'Larger exact finite-support multiclass open-network probabilistic cubes preserve the same weighted conservation law', mechanization: 'TLA+ `QueueingProbabilisticLargeNetworkKernel.tla` invariants (`InvMassSchedule`, `InvDistributionConservationLaw`, `InvFinalExpectationIdentity`) + e', section: 'Queueing Theory' },
  'thm_queue_mm1_stability': { theorem: 'THM-QUEUE-MM1-STABILITY', claim: 'Stable `M/M/1` occupancy has the geometric stationary law with finite mean queue length `ρ / (1 - ρ)`, and the same stationary law inherits the queue conservation identities', mechanization: 'Lean definitions/theorems `QueueStability.mm1StationaryPMF`, `QueueStability.mm1StationaryPMF_apply`, `QueueStability.mm1_stationary_mean_queue_length', section: 'Queueing Theory' },
  'thm_queue_one_path': { theorem: 'THM-QUEUE-ONE-PATH', claim: 'Canonical stable `M/M/1` queues admit a constructive one-path boundary witness: `β₁ = 0`, capacity `β₁ + 1 = 1`, stationary mean occupancy `λ / (μ - λ)`, and the induced identity `λ / (μ - λ) = λ * (1', mechanization: 'Lean definitions/theorems `QueueBoundary.QueueBoundaryWitness`, `QueueBoundary.canonicalMM1Boundary`, `QueueBoundary.canonicalMM1Boundary_beta1_zero`,', section: 'Queueing Theory' },
  'thm_queue_jackson_product': { theorem: 'THM-QUEUE-JACKSON-PRODUCT', claim: 'Finite open networks with a stable throughput witness satisfying the traffic equations admit an exact product-form occupancy law with exact singleton mass and total mean occupancy `∑ᵢ αᵢ / (μᵢ - αᵢ)`', mechanization: 'Lean definitions/theorems `JacksonQueueing.JacksonNetworkData`, `JacksonQueueing.JacksonTrafficData.constructiveNetworkData`, `JacksonQueueing.Jackson', section: 'Queueing Theory' },
  'thm_queue_jackson_exact': { theorem: 'THM-QUEUE-JACKSON-EXACT', claim: 'Finite open networks admit an exact constructive Jackson closure beyond the envelope ladder once an exact stable real traffic fixed point is supplied: under `spectralRadius P < 1`, any nonnegative rea', mechanization: 'Lean definitions/theorems `JacksonExactClosure.JacksonTrafficData.exact_real_fixed_point_unique`, `JacksonExactClosure.JacksonTrafficData.constructive', section: 'Queueing Theory' },
  'thm_queue_jackson_raw': { theorem: 'THM-QUEUE-JACKSON-RAW', claim: 'Finite open networks satisfying the raw envelope criterion admit the same product-form occupancy and queue-balance laws with no hand-supplied throughput witness: if `maxIncomingRoutingMass < 1` and `m', mechanization: 'Lean definitions/theorems `JacksonRawClosure.JacksonTrafficData.rawEnvelopeBound`, `JacksonRawClosure.JacksonTrafficData.rawEnvelopeBound_lt_serviceRa', section: 'Queueing Theory' },
  'thm_queue_jackson_feedforward': { theorem: 'THM-QUEUE-JACKSON-FEEDFORWARD', claim: 'The bounded two-node feed-forward ceiling witness is a nontrivial raw exact Jackson subclass: its routing matrix is nilpotent (`P^2 = 0`), so the explicit throughput candidate already matches the cons', mechanization: 'Lean definitions/theorems `JacksonFeedForwardClosure.TwoNodeAdaptiveRoutingParameters.ceilingRoutingMatrix_sq_eq_zero`, `JacksonFeedForwardClosure.Two', section: 'Queueing Theory' },
  'thm_queue_jackson_envelope_ladder': { theorem: 'THM-QUEUE-JACKSON-ENVELOPE-LADDER', claim: 'The finite Jackson raw route sharpens into a descending constructive envelope ladder: if any chosen stage `throughputEnvelopeApprox n` already lies below service rates, then the same product-form occu', mechanization: 'Lean definitions/theorems `JacksonEnvelopeClosure.JacksonTrafficData.throughputEnvelopeApprox_zero_eq_rawEnvelopeBound`, `JacksonEnvelopeClosure.Jacks', section: 'Queueing Theory' },
  'thm_queue_infinite_support': { theorem: 'THM-QUEUE-INFINITE-SUPPORT', claim: 'Infinite weighted scenario families preserve queue customer-time conservation under exact countable/infinite support aggregation', mechanization: 'Lean theorems `MeasureQueueing.weighted_queue_tsum_balance` and `MeasureQueueing.weighted_queue_tsum_terminal_expectation_balance`', section: 'Queueing Theory' },
  'thm_queue_countable_stochastic': { theorem: 'THM-QUEUE-COUNTABLE-STOCHASTIC', claim: 'Countably supported stochastic queue laws preserve the same expectation/conservation identity', mechanization: 'Lean theorems `MeasureQueueing.pmf_queue_tsum_balance`, `MeasureQueueing.pmf_queue_tsum_terminal_balance`, `MeasureQueueing.pmf_queue_lintegral_balanc', section: 'Queueing Theory' },
  'thm_queue_measure_limit': { theorem: 'THM-QUEUE-MEASURE-LIMIT', claim: 'Measure-theoretic queue observables and monotone truncation families preserve conservation in the unbounded limit', mechanization: 'Lean theorems `MeasureQueueing.measure_queue_lintegral_balance`, `MeasureQueueing.measure_queue_terminal_lintegral_balance`, `MeasureQueueing.measure_', section: 'Queueing Theory' },
  'thm_queue_ergodic_cesaro': { theorem: 'THM-QUEUE-ERGODIC-CESARO', claim: 'Unbounded open-network sample-path conservation lifts to long-run Cesaro limits, and vanishing residual open age yields terminal balance', mechanization: 'Lean structure/theorems `QueueStability.OpenNetworkCesaroWitness`, `QueueStability.open_network_cesaro_balance`, and `QueueStability.open_network_term', section: 'Queueing Theory' },
  'thm_queue_state_dependent_schema': { theorem: 'THM-QUEUE-STATE-DEPENDENT-SCHEMA', claim: 'State-dependent open-network stationary and terminal queue balance follow from explicit routing-kernel bridge witnesses, explicit Lyapunov drift bounds outside a finite small set, and a positive drift', mechanization: 'Lean structure/theorems `Axioms.StateDependentQueueStabilityAssumptions`, `Axioms.StateDependentQueueStabilityAssumptions.positiveRecurrent_holds`, `A', section: 'Queueing Theory' },
  'thm_queue_adaptive_supremum': { theorem: 'THM-QUEUE-ADAPTIVE-SUPREMUM', claim: 'Adaptive routing families dominated by a substochastic contractive ceiling kernel inherit the ceilings throughput bounds constructively, and from that raw ceiling data plus a monotone expected-Lyapun', mechanization: 'Lean definitions/theorems `JacksonQueueing.AdaptiveJacksonTrafficData`, `JacksonQueueing.AdaptiveJacksonTrafficData.constructiveThroughput_le_of_domin', section: 'Queueing Theory' },
  'thm_queue_adaptive_raw_ceiling': { theorem: 'THM-QUEUE-ADAPTIVE-RAW-CEILING', claim: 'A bounded two-node adaptive rerouting family derives its own dominating ceiling kernel, strict-row-substochastic spectral side conditions, constructive throughput bound, and a linear drift witness dir', mechanization: 'Lean definitions/theorems `StateDependentQueueFamilies.TwoNodeAdaptiveRoutingParameters`, `StateDependentQueueFamilies.TwoNodeAdaptiveRoutingParameter', section: 'Queueing Theory' },
  'thm_queue_limit_schema': { theorem: 'THM-QUEUE-LIMIT-SCHEMA', claim: 'Stronger queue-limit claims with explicit support-exhaustion and integrable-envelope side conditions remain available as a higher-level theorem schema', mechanization: 'Lean theorems `Claims.weighted_queue_prefix_customer_time_balance`, `Claims.weighted_queue_prefix_expectation_balance`, and schema `Axioms.queue_limit', section: 'Queueing Theory' },
  'thm_queue_containment': { theorem: 'THM-QUEUE-CONTAINMENT', claim: '*Superseded by THM-QUEUE-SUBSUMPTION.* Forward direction of queueing subsumption: when the supplied `β₁=0` queue law holds, the framework recovers that one-path boundary, and when `β₁>0` the framework', mechanization: 'Lean schemas `Axioms.queueing_containment_at_beta1_zero` and `Axioms.queueing_strict_extension_at_positive_beta` + executable tests', section: 'Queueing Theory' },
  'thm_queue_converse': { theorem: 'THM-QUEUE-CONVERSE', claim: 'Converse direction of queueing subsumption: every queueing system (G/G/1, G/G/c, priority, network) admits a fork/race/fold embedding under C3 (probabilistic fold). Arrival processes map to fork dist', mechanization: 'Executable tests `queueing-converse.test.ts`: G/G/1 embedding family (M/M/1, M/D/1, M/G/1, G/G/1), priority queue embedding (non-preemptive, preemptiv', section: 'Queueing Theory' },
  'thm_c3_prime_generalization': { theorem: 'THM-C3-PRIME-GENERALIZATION', claim: 'C3 (probabilistic fold) generalizes C3 (deterministic fold): deterministic fold is the Dirac δ special case of probabilistic fold. C3 preserves C1 (fork creates paths), C2 (race selects earliest), a', mechanization: 'Executable tests `queueing-converse.test.ts`: Dirac special case verification, C1/C2/C4 preservation, expectation conservation under ergodicity, varia', section: 'Queueing Theory' },
  'thm_probabilistic_fold_safety': { theorem: 'THM-PROBABILISTIC-FOLD-SAFETY', claim: 'Under C3 + ergodicity, probabilistic fold preserves all four fork/race/fold axioms and conservation holds in expectation rather than pointwise. The entropy increase is bounded: H(fold) = 0 for determ', mechanization: 'Executable tests `queueing-converse.test.ts`: entropy comparison, variance bounds, simulated conservation verification over 50000 events', section: 'Queueing Theory' },
  'thm_queue_subsumption': { theorem: 'THM-QUEUE-SUBSUMPTION', claim: 'Bidirectional subsumption of queueing theory by fork/race/fold: (forward) FRF at β₁=0 recovers queueing theory (THM-QUEUE-CONTAINMENT); (converse) every queueing system embeds as FRF under C3 (THM-QU', mechanization: 'Forward: Lean schemas + executable tests (`queueing-subsumption.test.ts`, `deep-queueing-extensions.test.ts`). Converse: executable tests (`queueing-c', section: 'Queueing Theory' },
  'thm_queue_jackson_queueing': { theorem: 'THM-QUEUE-JACKSON-QUEUEING', claim: 'Jackson network fundamentals: spectrum/transpose equality, spectral radius transpose equality, M/M/1 stationary queue length integral equals rho/(1-rho). Measure-theoretic queue analysis with weighted', mechanization: 'Lean theorems `JacksonQueueing.spectrum_transpose_eq`, `JacksonQueueing.spectralRadius_transpose_eq`, `JacksonQueueing.mm1_stationary_lintegral_queue_', section: 'Queueing Theory' },
  'thm_state_dependent_queue_families': { theorem: 'THM-STATE-DEPENDENT-QUEUE-FAMILIES', claim: 'State-dependent queue families: vacation queue state, retrial queue, reneging queue, adaptive routing queue. Queue law structures for multiple service disciplines with customer time, sojourn time, and', mechanization: 'Lean definitions and queue law structures in `StateDependentQueueFamilies.lean`', section: 'Queueing Theory' }
};
