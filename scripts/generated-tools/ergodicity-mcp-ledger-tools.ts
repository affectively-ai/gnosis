// Auto-generated theorem tools for ergodicity-mcp
// 29 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_continuous_harris',
    description: 'Foster-Lyapunov drift witness synthesis for continuous-state kernels over Polish spaces, extending beyond Fin (maxQueue + 1) types. Provides kernel structure, drift conditions, witness synthesis, and  [LEDGER: THM-CONTINUOUS-HARRIS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_geometric_ergodicity_discrete',
    description: 'For a countable certified kernel with quantitative geometric envelope at an atom, the TV distance from any initial state to the stationary distribution decays geometrically: `TV(P^n(x, ·), π) ≤ M(x) · [LEDGER: THM-GEOMETRIC-ERGODICITY-DISCRETE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_geometric_ergodicity_rate',
    description: 'The contraction rate `r` is bounded by `1 - stepEpsilon · smallSetEpsilon`, explicitly computable from the kernel certificate data. [LEDGER: THM-GEOMETRIC-ERGODICITY-RATE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_mixing_time_bound',
    description: 'The ε-mixing time satisfies `t_mix(ε) ≤ (1/(1-r)) · log(M(x)/ε)`. For any target tolerance, there exists a finite step count at which TV distance drops below it. [LEDGER: THM-MIXING-TIME-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_continuous_ergodicity_lift',
    description: 'For a ContinuousStateKernel with a discrete sub-lattice embedding, the discrete geometric rate lifts to the continuous kernel. Polish-space kernels inherit convergence rates from their discrete skelet [LEDGER: THM-CONTINUOUS-ERGODICITY-LIFT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_parallel_ergodicity',
    description: 'For two geometrically ergodic kernels `K₁(r₁)` and `K₂(r₂)`, the product kernel `K₁ ⊗ K₂` is geometrically ergodic with rate `r ≤ max(r₁, r₂)`. The slower stage dominates in parallel composition. [LEDGER: THM-PARALLEL-ERGODICITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sequential_ergodicity',
    description: 'For `K₂ ∘ K₁` (sequential composition), the composite is geometrically ergodic with rate `r ≤ r₁ · r₂`. Rates multiply under sequential composition — faster convergence than either stage alone. [LEDGER: THM-SEQUENTIAL-ERGODICITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_pipeline_mixing_bound',
    description: 'An n-stage pipeline with per-stage rates has bounded mixing time. For sequential composition, `t_mix(ε) ≤ Σᵢ (1/(1-rᵢ)) · log(Mᵢ/ε)`. The pipeline converges to equilibrium in finite time. [LEDGER: THM-PIPELINE-MIXING-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_pipeline_certificate',
    description: 'Given per-stage `GeometricErgodicWitness` certificates, construct a pipeline-level certificate automatically. Per-stage stability certificates compose into pipeline-level certificates. [LEDGER: THM-PIPELINE-CERTIFICATE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_ergodicity_monotone_in_stages',
    description: 'Adding a geometrically ergodic stage to a sequential pipeline cannot worsen the per-step contraction rate. Since 0 < r_new < 1, the product rate is strictly smaller. [LEDGER: THM-ERGODICITY-MONOTONE-IN-STAGES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_syntactic_lyapunov_affine',
    description: 'For an affine drift program with positive drift gap (serviceRate > arrivalRate), V(x) = x is a valid Lyapunov function. The drift gap equals serviceRate - arrivalRate, which is the spectral gap of the [LEDGER: THM-SYNTACTIC-LYAPUNOV-AFFINE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_syntactic_small_set',
    description: 'The set {x : x ≤ ventThreshold} is a valid small set for the affine kernel: finite, non-empty (contains state 0), bounded by maxState. The small-set fraction (ventThreshold+1)/(maxState+1) bounds the  [LEDGER: THM-SYNTACTIC-SMALL-SET]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_syntactic_witness_sound',
    description: 'The synthesized GeometricErgodicityRate (with stepEpsilon = driftGap/maxState, smallSetEpsilon = smallSetFraction) has a contraction rate r = 1 - ε₁·ε₂ that is provably in (0,1). The certificate match [LEDGER: THM-SYNTACTIC-WITNESS-SOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_syntactic_witness_complete_affine',
    description: 'For any affine drift program with positive drift gap, synthesis always succeeds: stepEpsilon > 0, smallSetFraction ∈ (0,1), so a GeometricErgodicityRate can always be constructed. Completeness for the [LEDGER: THM-SYNTACTIC-WITNESS-COMPLETE-AFFINE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_syntactic_pipeline_lift',
    description: 'Per-stage synthesized witnesses compose via THM-PIPELINE-CERTIFICATE into pipeline-level certificates automatically. The composite rate r₁·r₂ is sub-unit and strictly less than either individual rate. [LEDGER: THM-SYNTACTIC-PIPELINE-LIFT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_nonlinear_lyapunov_quadratic',
    description: 'For V(x) = x², the effective drift gap at state x is gap·(2x - gap), which grows linearly with x. Strictly positive for x > gap, and strictly exceeds the affine drift gap. Handles fluid backlog and th [LEDGER: THM-NONLINEAR-LYAPUNOV-QUADRATIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_nonlinear_lyapunov_power',
    description: 'V(x) = x^p for p ≥ 1 satisfies Foster drift: (x - gap)^p ≤ x^p for x ≥ gap. Monotonicity in the exponent: higher p gives larger effective drift gaps for states far from the small set. [LEDGER: THM-NONLINEAR-LYAPUNOV-POWER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_nonlinear_small_set_valid',
    description: 'The level set {x ≤ T} from the affine program is also valid for nonlinear V(x) = x^p: finite, non-empty, bounded by maxState. [LEDGER: THM-NONLINEAR-SMALL-SET-VALID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_nonlinear_witness_sound',
    description: 'The synthesized rate from nonlinear V inherits the affine synthesis parameters: stepEpsilon > 0, smallSetFraction ∈ (0,1). Nonlinear case can only improve the rate. [LEDGER: THM-NONLINEAR-WITNESS-SOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_nonlinear_dominates_affine',
    description: 'Nonlinear V(x) = x² gives a tighter (smaller) contraction rate than affine V(x) = x: the quadratic drift term gap·(2x-gap) > gap for all x > gap. Larger effective spectral gap → faster convergence. [LEDGER: THM-NONLINEAR-DOMINATES-AFFINE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_adaptive_gradient_decomposition',
    description: 'The gradient of service slack across network nodes defines valid drift weights: wᵢ = sᵢ/Σsⱼ ∈ [0,1], Σwᵢ = 1. All weights non-negative, normalized to sum to 1. [LEDGER: THM-ADAPTIVE-GRADIENT-DECOMPOSITION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_adaptive_bottleneck_detection',
    description: 'The minimum-slack node is the bottleneck: it is positive (stable) and lower-bounds all per-node slacks. [LEDGER: THM-ADAPTIVE-BOTTLENECK-DETECTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_adaptive_reserve_coverage',
    description: 'The gradient-weighted drift reserve = (Σsᵢ²)/(Σsᵢ) covers the drift gap. By QM-AM inequality, this exceeds the average slack and thus the minimum slack. [LEDGER: THM-ADAPTIVE-RESERVE-COVERAGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_adaptive_decomposition_sound',
    description: 'The gradient decomposition satisfies all AdaptiveCeilingDriftSynthesis obligations: non-negative normalized weights, positive total slack, positive bottleneck. [LEDGER: THM-ADAPTIVE-DECOMPOSITION-SOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_adaptive_dominates_uniform',
    description: 'Gradient weights dominate uniform weights by Cauchy-Schwarz: n·Σsᵢ² ≥ (Σsᵢ)², so (Σsᵢ²)/(Σsᵢ) ≥ (Σsᵢ)/n = avg(sᵢ) = uniform reserve. [LEDGER: THM-ADAPTIVE-DOMINATES-UNIFORM]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_envelope_contraction',
    description: 'The throughputEnvelopeApprox ladder contracts: residual(n+1) = ρ · residual(n) where ρ = maxIncomingRoutingMass. The residual strictly decreases each step. [LEDGER: THM-ENVELOPE-CONTRACTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_envelope_mixing_time',
    description: 'For target accuracy ε > 0, the ladder reaches ε-accuracy in finite steps. The envelope-ladder analog of mixing_time_bound from GeometricErgodicity.lean. [LEDGER: THM-ENVELOPE-MIXING-TIME]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_envelope_spectral_connection',
    description: 'The contraction rate ρ bounds the spectral radius of the routing matrix P. The envelope iteration is the power method on the traffic equations. [LEDGER: THM-ENVELOPE-SPECTRAL-CONNECTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_envelope_certificate_at_n',
    description: 'At any step n where the envelope is below the service rate, the stability certificate is valid — early stopping is sound. As n grows, service slack increases monotonically, and eventually certificatio [LEDGER: THM-ENVELOPE-CERTIFICATE-AT-N]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_continuous_harris': { theorem: 'THM-CONTINUOUS-HARRIS', claim: 'Foster-Lyapunov drift witness synthesis for continuous-state kernels over Polish spaces, extending beyond Fin (maxQueue + 1) types. Provides kernel structure, drift conditions, witness synthesis, and ', mechanization: 'Lean theorems `ContinuousHarris.continuous_harris_from_drift`, `ContinuousHarris.synthesized_kernel_foster_drift`, `ContinuousHarris.discrete_embeds_c', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_geometric_ergodicity_discrete': { theorem: 'THM-GEOMETRIC-ERGODICITY-DISCRETE', claim: 'For a countable certified kernel with quantitative geometric envelope at an atom, the TV distance from any initial state to the stationary distribution decays geometrically: `TV(P^n(x, ·), π) ≤ M(x) ·', mechanization: 'TLA+ `GeometricErgodicity.tla` invariant `InvGeometricDecay` + Lean theorem `GeometricErgodicity.geometric_ergodicity_discrete` in `GeometricErgodicit', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_geometric_ergodicity_rate': { theorem: 'THM-GEOMETRIC-ERGODICITY-RATE', claim: 'The contraction rate `r` is bounded by `1 - stepEpsilon · smallSetEpsilon`, explicitly computable from the kernel certificate data.', mechanization: 'TLA+ `GeometricErgodicity.tla` invariant `InvRateBound` + Lean theorem `GeometricErgodicity.geometric_ergodicity_rate` in `GeometricErgodicity.lean`', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_mixing_time_bound': { theorem: 'THM-MIXING-TIME-BOUND', claim: 'The ε-mixing time satisfies `t_mix(ε) ≤ (1/(1-r)) · log(M(x)/ε)`. For any target tolerance, there exists a finite step count at which TV distance drops below it.', mechanization: 'TLA+ `GeometricErgodicity.tla` invariant `InvMixingTimeBound` + Lean theorem `GeometricErgodicity.mixing_time_bound` in `GeometricErgodicity.lean`', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_continuous_ergodicity_lift': { theorem: 'THM-CONTINUOUS-ERGODICITY-LIFT', claim: 'For a ContinuousStateKernel with a discrete sub-lattice embedding, the discrete geometric rate lifts to the continuous kernel. Polish-space kernels inherit convergence rates from their discrete skelet', mechanization: 'TLA+ `GeometricErgodicity.tla` invariant `InvContinuousLift` + Lean theorem `GeometricErgodicity.continuous_ergodicity_lift` in `GeometricErgodicity.l', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_parallel_ergodicity': { theorem: 'THM-PARALLEL-ERGODICITY', claim: 'For two geometrically ergodic kernels `K₁(r₁)` and `K₂(r₂)`, the product kernel `K₁ ⊗ K₂` is geometrically ergodic with rate `r ≤ max(r₁, r₂)`. The slower stage dominates in parallel composition.', mechanization: 'TLA+ `CompositionalErgodicity.tla` invariant `InvParallel` + Lean theorem `CompositionalErgodicity.parallel_ergodicity` in `CompositionalErgodicity.le', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_sequential_ergodicity': { theorem: 'THM-SEQUENTIAL-ERGODICITY', claim: 'For `K₂ ∘ K₁` (sequential composition), the composite is geometrically ergodic with rate `r ≤ r₁ · r₂`. Rates multiply under sequential composition — faster convergence than either stage alone.', mechanization: 'TLA+ `CompositionalErgodicity.tla` invariant `InvSequential` + Lean theorem `CompositionalErgodicity.sequential_ergodicity` in `CompositionalErgodicit', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_pipeline_mixing_bound': { theorem: 'THM-PIPELINE-MIXING-BOUND', claim: 'An n-stage pipeline with per-stage rates has bounded mixing time. For sequential composition, `t_mix(ε) ≤ Σᵢ (1/(1-rᵢ)) · log(Mᵢ/ε)`. The pipeline converges to equilibrium in finite time.', mechanization: 'TLA+ `CompositionalErgodicity.tla` invariant `InvMixingBound` + Lean theorem `CompositionalErgodicity.pipeline_mixing_bound` in `CompositionalErgodici', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_pipeline_certificate': { theorem: 'THM-PIPELINE-CERTIFICATE', claim: 'Given per-stage `GeometricErgodicWitness` certificates, construct a pipeline-level certificate automatically. Per-stage stability certificates compose into pipeline-level certificates.', mechanization: 'TLA+ `CompositionalErgodicity.tla` invariant `InvCertificate` + Lean theorem `CompositionalErgodicity.pipeline_certificate_valid` in `CompositionalErg', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_ergodicity_monotone_in_stages': { theorem: 'THM-ERGODICITY-MONOTONE-IN-STAGES', claim: 'Adding a geometrically ergodic stage to a sequential pipeline cannot worsen the per-step contraction rate. Since 0 < r_new < 1, the product rate is strictly smaller.', mechanization: 'TLA+ `CompositionalErgodicity.tla` invariant `InvMonotone` + Lean theorem `CompositionalErgodicity.ergodicity_monotone_in_stages` in `CompositionalErg', section: 'Geometric & Compositional Ergodicity (Tracks Delta + Iota)' },
  'thm_syntactic_lyapunov_affine': { theorem: 'THM-SYNTACTIC-LYAPUNOV-AFFINE', claim: 'For an affine drift program with positive drift gap (serviceRate > arrivalRate), V(x) = x is a valid Lyapunov function. The drift gap equals serviceRate - arrivalRate, which is the spectral gap of the', mechanization: 'TLA+ `SyntacticLyapunov.tla` invariant `InvLyapunov` + Lean theorem `SyntacticLyapunov.syntactic_lyapunov_affine` in `SyntacticLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_syntactic_small_set': { theorem: 'THM-SYNTACTIC-SMALL-SET', claim: 'The set {x : x ≤ ventThreshold} is a valid small set for the affine kernel: finite, non-empty (contains state 0), bounded by maxState. The small-set fraction (ventThreshold+1)/(maxState+1) bounds the ', mechanization: 'TLA+ `SyntacticLyapunov.tla` invariant `InvSmallSet` + Lean theorems `SyntacticLyapunov.syntactic_small_set` and `SyntacticLyapunov.syntactic_small_se', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_syntactic_witness_sound': { theorem: 'THM-SYNTACTIC-WITNESS-SOUND', claim: 'The synthesized GeometricErgodicityRate (with stepEpsilon = driftGap/maxState, smallSetEpsilon = smallSetFraction) has a contraction rate r = 1 - ε₁·ε₂ that is provably in (0,1). The certificate match', mechanization: 'TLA+ `SyntacticLyapunov.tla` invariant `InvWitnessSound` + Lean theorem `SyntacticLyapunov.syntactic_witness_sound` in `SyntacticLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_syntactic_witness_complete_affine': { theorem: 'THM-SYNTACTIC-WITNESS-COMPLETE-AFFINE', claim: 'For any affine drift program with positive drift gap, synthesis always succeeds: stepEpsilon > 0, smallSetFraction ∈ (0,1), so a GeometricErgodicityRate can always be constructed. Completeness for the', mechanization: 'TLA+ `SyntacticLyapunov.tla` invariant `InvWitnessComplete` + Lean theorem `SyntacticLyapunov.syntactic_witness_complete` in `SyntacticLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_syntactic_pipeline_lift': { theorem: 'THM-SYNTACTIC-PIPELINE-LIFT', claim: 'Per-stage synthesized witnesses compose via THM-PIPELINE-CERTIFICATE into pipeline-level certificates automatically. The composite rate r₁·r₂ is sub-unit and strictly less than either individual rate.', mechanization: 'TLA+ `SyntacticLyapunov.tla` invariant `InvPipelineLift` + Lean theorem `SyntacticLyapunov.syntactic_pipeline_lift` in `SyntacticLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_nonlinear_lyapunov_quadratic': { theorem: 'THM-NONLINEAR-LYAPUNOV-QUADRATIC', claim: 'For V(x) = x², the effective drift gap at state x is gap·(2x - gap), which grows linearly with x. Strictly positive for x > gap, and strictly exceeds the affine drift gap. Handles fluid backlog and th', mechanization: 'TLA+ `NonlinearLyapunov.tla` invariant `InvQuadratic` + Lean theorems `NonlinearLyapunov.nonlinear_lyapunov_quadratic_drift` and `NonlinearLyapunov.no', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_nonlinear_lyapunov_power': { theorem: 'THM-NONLINEAR-LYAPUNOV-POWER', claim: 'V(x) = x^p for p ≥ 1 satisfies Foster drift: (x - gap)^p ≤ x^p for x ≥ gap. Monotonicity in the exponent: higher p gives larger effective drift gaps for states far from the small set.', mechanization: 'TLA+ `NonlinearLyapunov.tla` invariant `InvPower` + Lean theorem `NonlinearLyapunov.nonlinear_lyapunov_power_monotone` in `NonlinearLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_nonlinear_small_set_valid': { theorem: 'THM-NONLINEAR-SMALL-SET-VALID', claim: 'The level set {x ≤ T} from the affine program is also valid for nonlinear V(x) = x^p: finite, non-empty, bounded by maxState.', mechanization: 'TLA+ `NonlinearLyapunov.tla` invariant `InvSmallSet` + Lean theorem `NonlinearLyapunov.nonlinear_small_set_valid` in `NonlinearLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_nonlinear_witness_sound': { theorem: 'THM-NONLINEAR-WITNESS-SOUND', claim: 'The synthesized rate from nonlinear V inherits the affine synthesis parameters: stepEpsilon > 0, smallSetFraction ∈ (0,1). Nonlinear case can only improve the rate.', mechanization: 'TLA+ `NonlinearLyapunov.tla` invariant `InvWitnessSound` + Lean theorem `NonlinearLyapunov.nonlinear_witness_sound` in `NonlinearLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_nonlinear_dominates_affine': { theorem: 'THM-NONLINEAR-DOMINATES-AFFINE', claim: 'Nonlinear V(x) = x² gives a tighter (smaller) contraction rate than affine V(x) = x: the quadratic drift term gap·(2x-gap) > gap for all x > gap. Larger effective spectral gap → faster convergence.', mechanization: 'TLA+ `NonlinearLyapunov.tla` invariant `InvDominatesAffine` + Lean theorem `NonlinearLyapunov.nonlinear_dominates_affine` in `NonlinearLyapunov.lean`', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_adaptive_gradient_decomposition': { theorem: 'THM-ADAPTIVE-GRADIENT-DECOMPOSITION', claim: 'The gradient of service slack across network nodes defines valid drift weights: wᵢ = sᵢ/Σsⱼ ∈ [0,1], Σwᵢ = 1. All weights non-negative, normalized to sum to 1.', mechanization: 'TLA+ `AdaptiveDecomposition.tla` invariant `InvGradientDecomp` + Lean theorems `AdaptiveDecomposition.adaptive_gradient_weights_nonneg` and `AdaptiveD', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_adaptive_bottleneck_detection': { theorem: 'THM-ADAPTIVE-BOTTLENECK-DETECTION', claim: 'The minimum-slack node is the bottleneck: it is positive (stable) and lower-bounds all per-node slacks.', mechanization: 'TLA+ `AdaptiveDecomposition.tla` invariant `InvBottleneck` + Lean theorems `AdaptiveDecomposition.adaptive_bottleneck_positive` and `AdaptiveDecomposi', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_adaptive_reserve_coverage': { theorem: 'THM-ADAPTIVE-RESERVE-COVERAGE', claim: 'The gradient-weighted drift reserve = (Σsᵢ²)/(Σsᵢ) covers the drift gap. By QM-AM inequality, this exceeds the average slack and thus the minimum slack.', mechanization: 'TLA+ `AdaptiveDecomposition.tla` invariant `InvReserveCoverage` + Lean theorem `AdaptiveDecomposition.adaptive_reserve_nonneg` in `AdaptiveDecompositi', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_adaptive_decomposition_sound': { theorem: 'THM-ADAPTIVE-DECOMPOSITION-SOUND', claim: 'The gradient decomposition satisfies all AdaptiveCeilingDriftSynthesis obligations: non-negative normalized weights, positive total slack, positive bottleneck.', mechanization: 'TLA+ `AdaptiveDecomposition.tla` invariant `InvDecompositionSound` + Lean theorem `AdaptiveDecomposition.adaptive_decomposition_sound` in `AdaptiveDec', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_adaptive_dominates_uniform': { theorem: 'THM-ADAPTIVE-DOMINATES-UNIFORM', claim: 'Gradient weights dominate uniform weights by Cauchy-Schwarz: n·Σsᵢ² ≥ (Σsᵢ)², so (Σsᵢ²)/(Σsᵢ) ≥ (Σsᵢ)/n = avg(sᵢ) = uniform reserve.', mechanization: 'TLA+ `AdaptiveDecomposition.tla` invariant `InvDominatesUniform` + Lean theorem `AdaptiveDecomposition.adaptive_dominates_uniform_cauchy_schwarz` in `', section: 'Lyapunov Synthesis (Tracks Kappa + Nu + Xi)' },
  'thm_envelope_contraction': { theorem: 'THM-ENVELOPE-CONTRACTION', claim: 'The throughputEnvelopeApprox ladder contracts: residual(n+1) = ρ · residual(n) where ρ = maxIncomingRoutingMass. The residual strictly decreases each step.', mechanization: 'TLA+ `EnvelopeConvergence.tla` invariant `InvContraction` + Lean theorems `EnvelopeConvergence.envelope_contraction` and `EnvelopeConvergence.envelope', section: 'Envelope Convergence (Track Mu)' },
  'thm_envelope_mixing_time': { theorem: 'THM-ENVELOPE-MIXING-TIME', claim: 'For target accuracy ε > 0, the ladder reaches ε-accuracy in finite steps. The envelope-ladder analog of mixing_time_bound from GeometricErgodicity.lean.', mechanization: 'TLA+ `EnvelopeConvergence.tla` invariant `InvMixingTime` + Lean theorem `EnvelopeConvergence.envelope_mixing_time` in `EnvelopeConvergence.lean`', section: 'Envelope Convergence (Track Mu)' },
  'thm_envelope_spectral_connection': { theorem: 'THM-ENVELOPE-SPECTRAL-CONNECTION', claim: 'The contraction rate ρ bounds the spectral radius of the routing matrix P. The envelope iteration is the power method on the traffic equations.', mechanization: 'TLA+ `EnvelopeConvergence.tla` invariant `InvSpectralConnection` + Lean theorem `EnvelopeConvergence.envelope_spectral_connection` in `EnvelopeConverg', section: 'Envelope Convergence (Track Mu)' },
  'thm_envelope_certificate_at_n': { theorem: 'THM-ENVELOPE-CERTIFICATE-AT-N', claim: 'At any step n where the envelope is below the service rate, the stability certificate is valid — early stopping is sound. As n grows, service slack increases monotonically, and eventually certificatio', mechanization: 'TLA+ `EnvelopeConvergence.tla` invariant `InvCertificate` + Lean theorems `EnvelopeConvergence.envelope_certificate_at_n`, `EnvelopeConvergence.envelo', section: 'Envelope Convergence (Track Mu)' }
};
