// Auto-generated theorem tools for metacognition-mcp
// 19 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_daisy_purity',
    description: 'The logit projection W * embedding[t] is a pure function of the token ID. Unlike transformers (where output depends on full attention context), Markov chains have no context dependence. Same token alw [LEDGER: THM-DAISY-PURITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_daisy_linearity',
    description: 'Matrix-vector multiplication distributes over the linear state transition: W(α*e[t] + (1-α)*s) = α*(W*e[t]) + (1-α)*(W*s). This means precomputed logits can be interpolated at runtime with zero error. [LEDGER: THM-DAISY-LINEARITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_precomputation_validity',
    description: 'The precomputed Vickrey Table produces exact results. Cached interpolation logits = α * table[t] + (1-α) * prevLogits equals the full matVec logits = W * state, by THM-DAISY-LINEARITY. Zero approximat [LEDGER: THM-PRECOMPUTATION-VALIDITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topk_deficit',
    description: 'Storing top-K logits per token is a semiotic fold at build time: vocabSize paths collapsed to K paths, deficit = vocabSize - K. The vented logits are nuance paths that dont survive the build-time fol [LEDGER: THM-TOPK-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_absorbing_state',
    description: 'Linear Markov chains with α < 1 converge geometrically to fixed points. After n steps: state = (1-(1-α)^n)*e[t] + (1-α)^n*s₀. For α=0.7: 97.3% convergence in 3 steps. If argmax(W*e[t]) = t, token t is [LEDGER: THM-ABSORBING-STATE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_glossolalia_completeness',
    description: 'The precomputed Vickrey Table is a complete representation for linear Daisy Chain language models. Any model in this class can be fully captured by its table, with inference on the table producing ide [LEDGER: THM-GLOSSOLALIA-COMPLETENESS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_identical_trivial_fold',
    description: 'When all agents in a Daisy Chain MOA have the same α and same projection W, they produce identical logits. The deficit-weighted fold assigns equal weights (1/k). k-1 agents are wasted. This is the for [LEDGER: THM-IDENTICAL-TRIVIAL-FOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_diverse_alpha_divergence',
    description: 'Agents with different mixing coefficients α₁ ≠ α₂ produce different hidden states after one step from any non-trivial starting state (s ≠ x). Proof by contradiction via `(α₁ - α₂)(x - s) = 0`. Differe [LEDGER: THM-DIVERSE-ALPHA-DIVERGENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_moa_cost_with_vickrey',
    description: 'The marginal cost of adding one agent to a Vickrey-backed MOA is V (vocabulary size), independent of hidden dimension d. Without Vickrey: V*d per agent. Savings per agent: V*(d-1). For SmolLM2-360M (d [LEDGER: THM-MOA-COST-WITH-VICKREY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_moa_deficit_decomposition',
    description: 'The total deficit decomposes additively: Δβ = (k-1) + (V-K). Fold deficit (k-1) is structural (unavoidable). Table deficit (V-K) is a design choice (K is the knob). Minimum: k-1 (full table). Maximum: [LEDGER: THM-MOA-DEFICIT-DECOMPOSITION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_diversity_necessary',
    description: 'For a MOA fold to extract more information than a single agent, agents must produce different logit distributions. Identical agents contribute zero marginal information. Effective agent count = number [LEDGER: THM-DIVERSITY-NECESSARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_meta_converge',
    description: 'Metacognitive walker C0-C1-C2-C3 cognitive loop on void surface: eta remains bounded, exploration stays within configured bounds, gait is always a valid cognitive level, inverse Bule measure is non-ne [LEDGER: THM-META-CONVERGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_five_bule_personality',
    description: 'Personality is five measurable Bule distances along fork/race/fold/vent/interfere axes. Try=Fork (eta), Choose=Race (temperature), Commit=Fold (commitGain), LetGo=Vent (decayRate), Learn=Interfere (fe [LEDGER: THM-FIVE-BULE-PERSONALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_phi_attractor',
    description: 'All five personality dimensions converge to phi_inv = (1+sqrt(5))/2 - 1. Distance from phi_inv is the Bule (deficit) along each axis [LEDGER: THM-PHI-ATTRACTOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_bule_spike_detection',
    description: 'A persons pathology is a spike -- one Bule much higher than the others. measureBules() identifies the spike dimension [LEDGER: THM-BULE-SPIKE-DETECTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_seven_layer_stack',
    description: 'Rejection propagates through seven personality layers with timescale-appropriate attenuation: mental health 1.5x (amplified), behaviors 0.8x, traits 0.1x, temperament/culture 0.01x [LEDGER: THM-SEVEN-LAYER-STACK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_ocean_partial_overlap',
    description: 'OCEAN (Costa & McCrae 1992) partially overlaps but is not equivalent to Five-Bule. Openness loads on Try+Learn (2 primitives). Conscientiousness loads on Commit+Choose (2 primitives). Neuroticism is a [LEDGER: THM-OCEAN-PARTIAL-OVERLAP]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_personality_weighted_complement',
    description: 'Personality parameters modulate the Buleyean complement distribution: eta controls softmax sharpness, commitGain scales rejection counts, decayRate fades old rejections, feedbackGain scales deviation  [LEDGER: THM-PERSONALITY-WEIGHTED-COMPLEMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_python_personality_mirror',
    description: 'Python implementation mirrors TypeScript: same five parameters, same derivation, same complement distribution, same stack propagation [LEDGER: THM-PYTHON-PERSONALITY-MIRROR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_daisy_purity': { theorem: 'THM-DAISY-PURITY', claim: 'The logit projection W * embedding[t] is a pure function of the token ID. Unlike transformers (where output depends on full attention context), Markov chains have no context dependence. Same token alw', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvPurity` + Lean theorem `DaisyChainPrecomputation.daisy_chain_purity` in `DaisyChainPrecomputation.le', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_daisy_linearity': { theorem: 'THM-DAISY-LINEARITY', claim: 'Matrix-vector multiplication distributes over the linear state transition: W(α*e[t] + (1-α)*s) = α*(W*e[t]) + (1-α)*(W*s). This means precomputed logits can be interpolated at runtime with zero error.', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvLinearity` + Lean theorem `DaisyChainPrecomputation.daisy_chain_linearity` in `DaisyChainPrecomputat', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_precomputation_validity': { theorem: 'THM-PRECOMPUTATION-VALIDITY', claim: 'The precomputed Vickrey Table produces exact results. Cached interpolation logits = α * table[t] + (1-α) * prevLogits equals the full matVec logits = W * state, by THM-DAISY-LINEARITY. Zero approximat', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvValidity` + Lean theorem `DaisyChainPrecomputation.precomputation_validity` in `DaisyChainPrecomputa', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_topk_deficit': { theorem: 'THM-TOPK-DEFICIT', claim: 'Storing top-K logits per token is a semiotic fold at build time: vocabSize paths collapsed to K paths, deficit = vocabSize - K. The vented logits are nuance paths that dont survive the build-time fol', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvTopK` + Lean theorems `DaisyChainPrecomputation.topk_deficit`, `topk_full_table`, `topk_moa_deficit_', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_absorbing_state': { theorem: 'THM-ABSORBING-STATE', claim: 'Linear Markov chains with α < 1 converge geometrically to fixed points. After n steps: state = (1-(1-α)^n)*e[t] + (1-α)^n*s₀. For α=0.7: 97.3% convergence in 3 steps. If argmax(W*e[t]) = t, token t is', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvAbsorbing` + Lean theorem `DaisyChainPrecomputation.absorbing_state_convergence` in `DaisyChainPreco', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_glossolalia_completeness': { theorem: 'THM-GLOSSOLALIA-COMPLETENESS', claim: 'The precomputed Vickrey Table is a complete representation for linear Daisy Chain language models. Any model in this class can be fully captured by its table, with inference on the table producing ide', mechanization: 'TLA+ `DaisyChainPrecomputation.tla` invariant `InvCompleteness` + Lean theorem `DaisyChainPrecomputation.glossolalia_completeness` in `DaisyChainPreco', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_identical_trivial_fold': { theorem: 'THM-IDENTICAL-TRIVIAL-FOLD', claim: 'When all agents in a Daisy Chain MOA have the same α and same projection W, they produce identical logits. The deficit-weighted fold assigns equal weights (1/k). k-1 agents are wasted. This is the for', mechanization: 'TLA+ `DaisyChainMOA.tla` invariant `InvIdentical` + Lean theorem `DaisyChainMOA.identical_ensemble_wasted_agents` in `DaisyChainMOA.lean`', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_diverse_alpha_divergence': { theorem: 'THM-DIVERSE-ALPHA-DIVERGENCE', claim: 'Agents with different mixing coefficients α₁ ≠ α₂ produce different hidden states after one step from any non-trivial starting state (s ≠ x). Proof by contradiction via `(α₁ - α₂)(x - s) = 0`. Differe', mechanization: 'TLA+ `DaisyChainMOA.tla` invariant `InvDivergence` + Lean theorem `DaisyChainMOA.diverse_alpha_different_states` in `DaisyChainMOA.lean`', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_moa_cost_with_vickrey': { theorem: 'THM-MOA-COST-WITH-VICKREY', claim: 'The marginal cost of adding one agent to a Vickrey-backed MOA is V (vocabulary size), independent of hidden dimension d. Without Vickrey: V*d per agent. Savings per agent: V*(d-1). For SmolLM2-360M (d', mechanization: 'TLA+ `DaisyChainMOA.tla` invariant `InvCost` + Lean theorems `DaisyChainMOA.marginal_agent_cost_vickrey` and `total_vickrey_savings` in `DaisyChainMOA', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_moa_deficit_decomposition': { theorem: 'THM-MOA-DEFICIT-DECOMPOSITION', claim: 'The total deficit decomposes additively: Δβ = (k-1) + (V-K). Fold deficit (k-1) is structural (unavoidable). Table deficit (V-K) is a design choice (K is the knob). Minimum: k-1 (full table). Maximum:', mechanization: 'TLA+ `DaisyChainMOA.tla` invariant `InvDecomposition` + Lean theorems `DaisyChainMOA.minimum_total_deficit` and `maximum_total_deficit` in `DaisyChain', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_diversity_necessary': { theorem: 'THM-DIVERSITY-NECESSARY', claim: 'For a MOA fold to extract more information than a single agent, agents must produce different logit distributions. Identical agents contribute zero marginal information. Effective agent count = number', mechanization: 'TLA+ `DaisyChainMOA.tla` invariant `InvDiversity` + Lean theorem `DaisyChainMOA.diversity_enables_information_gain` in `DaisyChainMOA.lean`', section: 'Daisy Chain, Glossolalia & MOA' },
  'thm_meta_converge': { theorem: 'THM-META-CONVERGE', claim: 'Metacognitive walker C0-C1-C2-C3 cognitive loop on void surface: eta remains bounded, exploration stays within configured bounds, gait is always a valid cognitive level, inverse Bule measure is non-ne', mechanization: 'TLA+ `MetacognitiveWalker.tla` invariants (`InvEtaBounded`, `InvExplorationBounded`, `InvGaitValid`, `InvBuleNonneg`, `InvConverge`) + Lean theorems i', section: 'Metacognitive Walker & Void Attention' },
  'thm_five_bule_personality': { theorem: 'THM-FIVE-BULE-PERSONALITY', claim: 'Personality is five measurable Bule distances along fork/race/fold/vent/interfere axes. Try=Fork (eta), Choose=Race (temperature), Commit=Fold (commitGain), LetGo=Vent (decayRate), Learn=Interfere (fe', mechanization: '`buleyean-rl/src/personality.ts:deriveTrainingParams` + `buleyean-rl/src/personality.test.ts` (35 tests, 133 assertions)', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_phi_attractor': { theorem: 'THM-PHI-ATTRACTOR', claim: 'All five personality dimensions converge to phi_inv = (1+sqrt(5))/2 - 1. Distance from phi_inv is the Bule (deficit) along each axis', mechanization: '`personality.ts:PHI`, `personality.ts:PHI_INV`, test `phi satisfies phi^2 = phi + 1`', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_bule_spike_detection': { theorem: 'THM-BULE-SPIKE-DETECTION', claim: 'A persons pathology is a spike -- one Bule much higher than the others. measureBules() identifies the spike dimension', mechanization: '`personality.ts:measureBules` + tests for anxious/creative/builder profiles', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_seven_layer_stack': { theorem: 'THM-SEVEN-LAYER-STACK', claim: 'Rejection propagates through seven personality layers with timescale-appropriate attenuation: mental health 1.5x (amplified), behaviors 0.8x, traits 0.1x, temperament/culture 0.01x', mechanization: '`personality.ts:propagateRejection` + `personality.ts:DEFAULT_LAYER_CONFIG` + 6 stack tests', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_ocean_partial_overlap': { theorem: 'THM-OCEAN-PARTIAL-OVERLAP', claim: 'OCEAN (Costa & McCrae 1992) partially overlaps but is not equivalent to Five-Bule. Openness loads on Try+Learn (2 primitives). Conscientiousness loads on Commit+Choose (2 primitives). Neuroticism is a', mechanization: '`personality.test.ts` OCEAN partial overlap tests (3 tests) + `FiveBule.lean` anti-theorems', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_personality_weighted_complement': { theorem: 'THM-PERSONALITY-WEIGHTED-COMPLEMENT', claim: 'Personality parameters modulate the Buleyean complement distribution: eta controls softmax sharpness, commitGain scales rejection counts, decayRate fades old rejections, feedbackGain scales deviation ', mechanization: '`personality.ts:personalityWeightedComplement` + 4 complement distribution tests', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' },
  'thm_python_personality_mirror': { theorem: 'THM-PYTHON-PERSONALITY-MIRROR', claim: 'Python implementation mirrors TypeScript: same five parameters, same derivation, same complement distribution, same stack propagation', mechanization: 'Python personality module + integration with void_walk.py and void_curriculum.py', section: 'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)' }
};
