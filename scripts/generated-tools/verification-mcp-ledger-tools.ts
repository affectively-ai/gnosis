// Auto-generated theorem tools for verification-mcp
// 42 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_c1c4',
    description: 'Fork/race/fold safety+liveness (C1–C4) [LEDGER: THM-C1C4]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_monoidal',
    description: 'Fork/Race/Fold coherence: the GGL topological primitives satisfy the compilers coherent monoidal execution laws for natural fork relabeling, associative race, and deterministic fold [LEDGER: THM-GNOSIS-MONOIDAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sched_bound',
    description: 'Conditional scheduler-overhead bound: additive + bounded + handler-independent under explicit assumptions [LEDGER: THM-SCHED-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_parser_closure',
    description: 'Formal artifacts are self-consistent under project parser [LEDGER: THM-PARSER-CLOSURE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_completeness_dag',
    description: 'Fork/race/fold expresses any DAG [LEDGER: THM-COMPLETENESS-DAG]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_convergence_schema',
    description: 'Constraint-driven convergence to fork/race/fold in modeled finite class [LEDGER: THM-CONVERGENCE-SCHEMA]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_first_law_general',
    description: '`V_fork = W_fold + Q_vent` for modeled systems [LEDGER: THM-FIRST-LAW-GENERAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_refl',
    description: 'Type compatibility is reflexive: every topology type is compatible with itself. Proved by structural induction on TopologyType (8 constructors). [LEDGER: THM-SEM-REFL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_unknown',
    description: 'Unknown types are universally compatible: Unknown on either side of an edge produces Compatible, never Incompatible. This is the escape hatch for partially-annotated codebases. [LEDGER: THM-SEM-UNKNOWN]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_int_subtype',
    description: 'Integer is a subtype of Number under JSON schema: `Json(Integer) → Json(Number)` is Compatible, but `Json(Number) → Json(Integer)` is ProofObligation (number may not be integer). The asymmetric subtyp [LEDGER: THM-SEM-INT-SUBTYPE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_roundtrip',
    description: 'JSON serialization preserves schema: if a value conforms to a JSON schema before serialization, it conforms after deserialization. Foundation of the cross-language type bridge. [LEDGER: THM-SEM-ROUNDTRIP]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_process_valid',
    description: 'Hoare propagation through PROCESS edges: a PROCESS edge is semantically valid when the sources return type is compatible with the targets param type. Unknown on either side makes it trivially valid. [LEDGER: THM-SEM-PROCESS-VALID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_fork_preserve',
    description: 'FORK distributes predicates to all branches: every branch of a FORK inherits all semantic predicates from the source. If the source produces ValidJson, every branch receives ValidJson. Predicate count [LEDGER: THM-SEM-FORK-PRESERVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_fold_consistent',
    description: 'FOLD branches must be pairwise type-compatible: a FOLD with a single branch is trivially consistent; a FOLD where all branches have the same type is consistent (proved by reflexivity). [LEDGER: THM-SEM-FOLD-CONSISTENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_comp_inv',
    description: 'Composition of invertible functions is invertible: if `f : α → β` and `g : β → γ` both have left inverses, then `g ∘ f` has a left inverse `f⁻¹ ∘ g⁻¹`. This proves "this pipeline is reversible" for co [LEDGER: THM-SEM-COMP-INV]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_pipeline_json',
    description: 'Pipeline ValidJson preservation: if every node in a pipeline produces valid JSON, the pipeline produces valid JSON. Single-node base case and inductive structure. [LEDGER: THM-SEM-PIPELINE-JSON]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_bytes_isolate',
    description: 'Bytes boundary is strict: Bytes is incompatible with Json, Stream, and Product. Binary data cannot cross a JSON serialization boundary without explicit conversion (base64). This catches `Vec<u8>` → `s [LEDGER: THM-SEM-BYTES-ISOLATE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_option_sub',
    description: 'Non-null into nullable is safe: a non-null value of type T is compatible with Option(T). `int` can flow into `Optional[int]`. [LEDGER: THM-SEM-OPTION-SUB]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_cross_lang',
    description: 'Specific cross-language denotation alignments proved compatible: Python `list[float]` = Rust `Vec<f64>` = `Stream(Json(Number))`; Python `dict` = Go `map[string]interface{}` = `Product(open=true)`; Go [LEDGER: THM-SEM-CROSS-LANG]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_fold_uniform_0',
    description: 'Uniform FOLD generates zero proof obligations: when all branches in a topo-race produce the same type, the FOLD is obligation-free. Proved by induction on the branch list with reflexivity at each step [LEDGER: THM-SEM-FOLD-UNIFORM-0]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_hope',
    description: 'The Hope Certificate: five guarantees about cross-language confusion. G1: no false positives (Unknown never generates Incompatible). G2: confusion bounded by ` [LEDGER: THM-SEM-HOPE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sem_diversity',
    description: 'Diversity Optimality: multi-language topologies are strictly stronger than mono-language. Net information = cross-language edge count. Mono-language has zero net information. Any topology with cross-l [LEDGER: THM-SEM-DIVERSITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_spectral',
    description: 'GGL routing spectral stability: a Gnosis transition kernel with explicit nilpotent routing or contractive row mass has spectral radius strictly less than `1` [LEDGER: THM-GNOSIS-SPECTRAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_recurrence',
    description: 'GGL small-set recurrence: a state-dependent Gnosis kernel bounded by a Foster-Lyapunov-style potential field returns to its certified small set [LEDGER: THM-GNOSIS-RECURRENCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_continuous_drift',
    description: 'GGL measurable continuous drift surface: a real-valued queue-depth observable on a real state space carries a measurable Foster-Lyapunov gap once the step size and observable scale are positive, and t [LEDGER: THM-GNOSIS-CONTINUOUS-DRIFT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_continuous_harris',
    description: 'GGL bounded affine continuous-Harris queue witness: the deterministic queue support kernel carries a measurable quantitative Harris package together with affine observable/Lyapunov witnesses whenever  [LEDGER: THM-GNOSIS-CONTINUOUS-HARRIS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_geometry',
    description: 'GGL certified geometric stability: a Gnosis kernel is geometrically stable once spectral stability is paired with either no drift obligation or a certified negative drift margin [LEDGER: THM-GNOSIS-GEOMETRY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gnosis_coupled',
    description: 'Interlocking voids / coupled manifolds: a nonnegative handoff pressure modeling upstream `Q_vent` or `W_fold` re-entering as downstream `λ` preserves downstream geometric stability, and therefore pair [LEDGER: THM-GNOSIS-COUPLED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topo_race_monotone_floor',
    description: 'Adding a strictly better codec gives strictly positive wire reduction [LEDGER: THM-TOPO-RACE-MONOTONE-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_queue_separation_floor',
    description: 'For parallel workloads (β₁* > 0), fork/race/fold time < pipelined time. Sequential leaves strictly positive topological waste [LEDGER: THM-QUEUE-SEPARATION-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_frame_header_information_floor',
    description: 'Self-describing frame header ≥ ⌈log₂(N) + log₂(S)⌉/8 + 1 bytes. FlowFrames 10 bytes satisfies this for 2³² streams/sequences [LEDGER: THM-FRAME-HEADER-INFORMATION-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_diversity_convergence_floor',
    description: 'With k < D content types, entropy gap > 0. Gap decreases monotonically in k. Zero at full coverage k ≥ D [LEDGER: THM-DIVERSITY-CONVERGENCE-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_solomonoff_void_gain_floor',
    description: 'Non-zero void mass gives monotonically increasing information gain. Gain ≥ 1 bit when ≥ half options impossible [LEDGER: THM-SOLOMONOFF-VOID-GAIN-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_pipeline_speedup_floor',
    description: 'Pipelined time ≤ sequential time (pipelining never hurts). Strict for N ≥ 2, P ≥ 2. Ramp-up waste bounded [LEDGER: THM-PIPELINE-SPEEDUP-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_supply_chain_diversity_floor',
    description: 'With k < D suppliers for D disruption modes, exposure > 0. Monotone in k. Zero at full diversity k ≥ D. Monoculture = maximum exposure [LEDGER: THM-SUPPLY-CHAIN-DIVERSITY-FLOOR]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_proof_as_topology',
    description: 'A .gg proof topology with all terminal nodes at bules = 0 constitutes a valid and complete Buleyean proof. The ranked DAG structure prevents circular reasoning [LEDGER: THM-PROOF-AS-TOPOLOGY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_deficit_is_bules',
    description: 'Bettys deficit analysis (beta1 at leaf nodes) equals the remaining Bule count for proof topologies. deficit = 0 at all terminals if and only if the proof is complete [LEDGER: THM-DEFICIT-IS-BULES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_reject_is_vent',
    description: 'REJECT has identical beta1 semantics to VENT (decrement by 1) but carries proof metadata (rejection reason). The proof primitive and the dissipation primitive are the same operation [LEDGER: THM-REJECT-IS-VENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_proof_lean_emission',
    description: 'A verified .gg proof topology emits a valid Lean 4 theorem scaffold referencing BuleyeanLogic.lean foundations. Complete proofs use `n_rejections_reach_ground`, incomplete proofs use `sorry` [LEDGER: THM-PROOF-LEAN-EMISSION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_proof_tla_emission',
    description: 'A verified .gg proof topology emits a valid TLA+ specification with per-node variables, REJECT actions, non-negativity invariant, and eventual QED property [LEDGER: THM-PROOF-TLA-EMISSION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_seven_proof_diagnostics',
    description: 'Betty emits seven proof-specific diagnostic codes: PROOF_CYCLE_DETECTED, PROOF_RANK_VIOLATION, PROOF_BULE_UNDERFLOW, PROOF_TERMINAL_NONZERO, PROOF_FORK_BULE_MISMATCH, PROOF_MISSING_THEOREM, PROOF_AXIO [LEDGER: THM-SEVEN-PROOF-DIAGNOSTICS]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_1499_proofs_valid',
    description: 'All 1,499 .gg proof topologies in gnosis/examples/proofs/ are valid and complete (DAG acyclic, all terminals at bules = 0, zero diagnostics). Covers 111 TLA+ specs, 159 Lean theorems, 1,140 behavioral [LEDGER: THM-1499-PROOFS-VALID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_c1c4': { theorem: 'THM-C1C4', claim: 'Fork/race/fold safety+liveness (C1–C4)', mechanization: 'TLA+ `ForkRaceFoldC1C4.tla` + Lean schema `Axioms.c1_c4_imply_safety_and_liveness`', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_gnosis_monoidal': { theorem: 'THM-GNOSIS-MONOIDAL', claim: 'Fork/Race/Fold coherence: the GGL topological primitives satisfy the compilers coherent monoidal execution laws for natural fork relabeling, associative race, and deterministic fold', mechanization: 'Lean theorems `GnosisProofs.fork_natural`, `GnosisProofs.c3_deterministic_fold`, and `GnosisProofs.race_tree_coherence` in [`GnosisProofs.lean`](../..', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_sched_bound': { theorem: 'THM-SCHED-BOUND', claim: 'Conditional scheduler-overhead bound: additive + bounded + handler-independent under explicit assumptions', mechanization: 'TLA+ `SchedulerBound.tla` invariants (`InvAdditiveRuntimeDecomposition`, `InvSchedulerOverheadBounded`, `InvSchedulerOverheadIndependentOfHandler`)', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_parser_closure': { theorem: 'THM-PARSER-CLOSURE', claim: 'Formal artifacts are self-consistent under project parser', mechanization: '`aeon-logic` parser preflight + Lean schema `Axioms.parser_closure_theorem`', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_completeness_dag': { theorem: 'THM-COMPLETENESS-DAG', claim: 'Fork/race/fold expresses any DAG', mechanization: 'Lean local decomposition theorem `Claims.local_node_decomposition` + schema `Axioms.dag_completeness_schema` + executable finite-DAG decomposition tes', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_convergence_schema': { theorem: 'THM-CONVERGENCE-SCHEMA', claim: 'Constraint-driven convergence to fork/race/fold in modeled finite class', mechanization: 'Lean schema `Axioms.convergence_schema` + executable convergence simulation tests', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_first_law_general': { theorem: 'THM-FIRST-LAW-GENERAL', claim: '`V_fork = W_fold + Q_vent` for modeled systems', mechanization: 'Lean theorem `Claims.first_law_conservation` + executable thermodynamics tests', section: 'Foundation: Fork/Race/Fold Axioms & Core Laws' },
  'thm_sem_refl': { theorem: 'THM-SEM-REFL', claim: 'Type compatibility is reflexive: every topology type is compatible with itself. Proved by structural induction on TopologyType (8 constructors).', mechanization: 'Lean theorem `SemanticCompatibility.topology_type_compat_refl` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_unknown': { theorem: 'THM-SEM-UNKNOWN', claim: 'Unknown types are universally compatible: Unknown on either side of an edge produces Compatible, never Incompatible. This is the escape hatch for partially-annotated codebases.', mechanization: 'Lean theorems `SemanticCompatibility.unknown_compatible_left` and `SemanticCompatibility.unknown_compatible_right` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_int_subtype': { theorem: 'THM-SEM-INT-SUBTYPE', claim: 'Integer is a subtype of Number under JSON schema: `Json(Integer) → Json(Number)` is Compatible, but `Json(Number) → Json(Integer)` is ProofObligation (number may not be integer). The asymmetric subtyp', mechanization: 'Lean theorems `SemanticCompatibility.integer_subtype_number` and `SemanticCompatibility.number_to_integer_needs_proof` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_roundtrip': { theorem: 'THM-SEM-ROUNDTRIP', claim: 'JSON serialization preserves schema: if a value conforms to a JSON schema before serialization, it conforms after deserialization. Foundation of the cross-language type bridge.', mechanization: 'Lean theorem `SemanticCompatibility.json_roundtrip_preserves_schema` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_process_valid': { theorem: 'THM-SEM-PROCESS-VALID', claim: 'Hoare propagation through PROCESS edges: a PROCESS edge is semantically valid when the sources return type is compatible with the targets param type. Unknown on either side makes it trivially valid.', mechanization: 'Lean theorems `SemanticCompatibility.process_edge_valid_unknown_source` and `SemanticCompatibility.process_edge_valid_unknown_target` in `SemanticComp', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_fork_preserve': { theorem: 'THM-SEM-FORK-PRESERVE', claim: 'FORK distributes predicates to all branches: every branch of a FORK inherits all semantic predicates from the source. If the source produces ValidJson, every branch receives ValidJson. Predicate count', mechanization: 'Lean theorems `SemanticCompatibility.fork_branch_has_source_predicates` and `SemanticCompatibility.fork_preserves_predicate_count` in `SemanticCompati', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_fold_consistent': { theorem: 'THM-SEM-FOLD-CONSISTENT', claim: 'FOLD branches must be pairwise type-compatible: a FOLD with a single branch is trivially consistent; a FOLD where all branches have the same type is consistent (proved by reflexivity).', mechanization: 'Lean theorems `SemanticCompatibility.fold_single_branch_consistent` and `SemanticCompatibility.fold_uniform_branches_consistent` in `SemanticCompatibi', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_comp_inv': { theorem: 'THM-SEM-COMP-INV', claim: 'Composition of invertible functions is invertible: if `f : α → β` and `g : β → γ` both have left inverses, then `g ∘ f` has a left inverse `f⁻¹ ∘ g⁻¹`. This proves "this pipeline is reversible" for co', mechanization: 'Lean theorem `SemanticCompatibility.comp_invertible_preserves_left_inverse` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_pipeline_json': { theorem: 'THM-SEM-PIPELINE-JSON', claim: 'Pipeline ValidJson preservation: if every node in a pipeline produces valid JSON, the pipeline produces valid JSON. Single-node base case and inductive structure.', mechanization: 'Lean theorems `SemanticCompatibility.pipeline_json_output` and `SemanticCompatibility.single_node_pipeline_valid` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_bytes_isolate': { theorem: 'THM-SEM-BYTES-ISOLATE', claim: 'Bytes boundary is strict: Bytes is incompatible with Json, Stream, and Product. Binary data cannot cross a JSON serialization boundary without explicit conversion (base64). This catches `Vec<u8>` → `s', mechanization: 'Lean theorems `SemanticCompatibility.bytes_incompatible_with_json`, `SemanticCompatibility.bytes_incompatible_with_stream`, and `SemanticCompatibility', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_option_sub': { theorem: 'THM-SEM-OPTION-SUB', claim: 'Non-null into nullable is safe: a non-null value of type T is compatible with Option(T). `int` can flow into `Optional[int]`.', mechanization: 'Lean theorem `SemanticCompatibility.option_accepts_non_null` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_cross_lang': { theorem: 'THM-SEM-CROSS-LANG', claim: 'Specific cross-language denotation alignments proved compatible: Python `list[float]` = Rust `Vec<f64>` = `Stream(Json(Number))`; Python `dict` = Go `map[string]interface{}` = `Product(open=true)`; Go', mechanization: 'Lean theorems `SemanticCompatibility.python_list_float_compat_rust_vec_f64`, `SemanticCompatibility.python_dict_compat_go_map`, and `SemanticCompatibi', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_fold_uniform_0': { theorem: 'THM-SEM-FOLD-UNIFORM-0', claim: 'Uniform FOLD generates zero proof obligations: when all branches in a topo-race produce the same type, the FOLD is obligation-free. Proved by induction on the branch list with reflexivity at each step', mechanization: 'Lean theorem `SemanticCompatibility.uniform_fold_zero_obligations` in `SemanticCompatibility.lean`', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_hope': { theorem: 'THM-SEM-HOPE', claim: 'The Hope Certificate: five guarantees about cross-language confusion. G1: no false positives (Unknown never generates Incompatible). G2: confusion bounded by `', mechanization: '× 64`. G5: adding a type annotation strictly decreases Unknown count; type coverage is monotonically non-decreasing.', section: 'Cross-Language Semantic Type Theory' },
  'thm_sem_diversity': { theorem: 'THM-SEM-DIVERSITY', claim: 'Diversity Optimality: multi-language topologies are strictly stronger than mono-language. Net information = cross-language edge count. Mono-language has zero net information. Any topology with cross-l', mechanization: 'Lean theorems `SemanticCompatibility.mono_language_zero_information`, `SemanticCompatibility.multi_language_positive_information`, `SemanticCompatibil', section: 'Cross-Language Semantic Type Theory' },
  'thm_gnosis_spectral': { theorem: 'THM-GNOSIS-SPECTRAL', claim: 'GGL routing spectral stability: a Gnosis transition kernel with explicit nilpotent routing or contractive row mass has spectral radius strictly less than `1`', mechanization: 'Lean theorems `GnosisProofs.spectrallyStable_of_nilpotent` and `GnosisProofs.spectrallyStable_of_rowMass` in [`GnosisProofs.lean`](../../../../../../g', section: 'Gnosis Compiler Proofs' },
  'thm_gnosis_recurrence': { theorem: 'THM-GNOSIS-RECURRENCE', claim: 'GGL small-set recurrence: a state-dependent Gnosis kernel bounded by a Foster-Lyapunov-style potential field returns to its certified small set', mechanization: 'Lean theorems `GnosisProofs.countableSmallSetRecurrent_of_driftWitness` and `GnosisProofs.natSmallSetRecurrent_of_margin_step` in [`GnosisProofs.lean`', section: 'Gnosis Compiler Proofs' },
  'thm_gnosis_continuous_drift': { theorem: 'THM-GNOSIS-CONTINUOUS-DRIFT', claim: 'GGL measurable continuous drift surface: a real-valued queue-depth observable on a real state space carries a measurable Foster-Lyapunov gap once the step size and observable scale are positive, and t', mechanization: 'Lean definitions/theorems `GnosisProofs.realQueueLinearObservable`, `GnosisProofs.realQueueLinearExpectedObservable`, `GnosisProofs.realMeasurableReal', section: 'Gnosis Compiler Proofs' },
  'thm_gnosis_continuous_harris': { theorem: 'THM-GNOSIS-CONTINUOUS-HARRIS', claim: 'GGL bounded affine continuous-Harris queue witness: the deterministic queue support kernel carries a measurable quantitative Harris package together with affine observable/Lyapunov witnesses whenever ', mechanization: 'Lean definitions/theorems `GnosisProofs.MeasurableContinuousHarrisWitness`, `GnosisProofs.natQueueAffineObservable`, `GnosisProofs.natQueueAffineExpec', section: 'Gnosis Compiler Proofs' },
  'thm_gnosis_geometry': { theorem: 'THM-GNOSIS-GEOMETRY', claim: 'GGL certified geometric stability: a Gnosis kernel is geometrically stable once spectral stability is paired with either no drift obligation or a certified negative drift margin', mechanization: 'Lean theorems `GnosisProofs.certifiedKernel_stable_of_supremum` and `GnosisProofs.certifiedKernel_stable_of_drift_certificate` in [`GnosisProofs.lean`', section: 'Gnosis Compiler Proofs' },
  'thm_gnosis_coupled': { theorem: 'THM-GNOSIS-COUPLED', claim: 'Interlocking voids / coupled manifolds: a nonnegative handoff pressure modeling upstream `Q_vent` or `W_fold` re-entering as downstream `λ` preserves downstream geometric stability, and therefore pair', mechanization: 'Lean definitions/theorems `GnosisProofs.coupledArrivalCertificate`, `GnosisProofs.coupledCertifiedKernel`, `GnosisProofs.driftAt_coupledArrivalCertifi', section: 'Gnosis Compiler Proofs' },
  'thm_topo_race_monotone_floor': { theorem: 'THM-TOPO-RACE-MONOTONE-FLOOR', claim: 'Adding a strictly better codec gives strictly positive wire reduction', mechanization: '`CodecRacing.lean:race_monotone_floor`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_queue_separation_floor': { theorem: 'THM-QUEUE-SEPARATION-FLOOR', claim: 'For parallel workloads (β₁* > 0), fork/race/fold time < pipelined time. Sequential leaves strictly positive topological waste', mechanization: '`Multiplexing.lean:queue_separation_floor`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_frame_header_information_floor': { theorem: 'THM-FRAME-HEADER-INFORMATION-FLOOR', claim: 'Self-describing frame header ≥ ⌈log₂(N) + log₂(S)⌉/8 + 1 bytes. FlowFrames 10 bytes satisfies this for 2³² streams/sequences', mechanization: '`FrameOverheadBound.lean:frame_header_information_floor` + `flowframe_satisfies_information_floor` + `frame_information_floor_positive`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_diversity_convergence_floor': { theorem: 'THM-DIVERSITY-CONVERGENCE-FLOOR', claim: 'With k < D content types, entropy gap > 0. Gap decreases monotonically in k. Zero at full coverage k ≥ D', mechanization: '`CodecRacing.lean:diversity_convergence_floor` + `diversity_gap_monotone` + `diversity_gap_zero_at_full_coverage`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_solomonoff_void_gain_floor': { theorem: 'THM-SOLOMONOFF-VOID-GAIN-FLOOR', claim: 'Non-zero void mass gives monotonically increasing information gain. Gain ≥ 1 bit when ≥ half options impossible', mechanization: '`SolomonoffBuleyean.lean:void_gain_monotone` + `void_gain_at_least_one_bit`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_pipeline_speedup_floor': { theorem: 'THM-PIPELINE-SPEEDUP-FLOOR', claim: 'Pipelined time ≤ sequential time (pipelining never hurts). Strict for N ≥ 2, P ≥ 2. Ramp-up waste bounded', mechanization: '`Multiplexing.lean:pipeline_speedup_floor` + `pipeline_strict_speedup`', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_supply_chain_diversity_floor': { theorem: 'THM-SUPPLY-CHAIN-DIVERSITY-FLOOR', claim: 'With k < D suppliers for D disruption modes, exposure > 0. Monotone in k. Zero at full diversity k ≥ D. Monoculture = maximum exposure', mechanization: '`TradeTopologyRound2.lean:supply_chain_diversity_floor` + `supply_chain_exposure_monotone` + `supply_chain_full_coverage` + `supply_chain_monoculture_', section: 'Floor Theorems: Missing Lower Bounds (§3, §7, §9, §12, §13, §15)' },
  'thm_proof_as_topology': { theorem: 'THM-PROOF-AS-TOPOLOGY', claim: 'A .gg proof topology with all terminal nodes at bules = 0 constitutes a valid and complete Buleyean proof. The ranked DAG structure prevents circular reasoning', mechanization: '`aeon-logic/src/buleyean-proof.ts:verifyProofTopology` + 31 tests in `buleyean-proof.test.ts`', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_deficit_is_bules': { theorem: 'THM-DEFICIT-IS-BULES', claim: 'Bettys deficit analysis (beta1 at leaf nodes) equals the remaining Bule count for proof topologies. deficit = 0 at all terminals if and only if the proof is complete', mechanization: '`buleyean-proof.ts:propagateBules` correspondence with `betty/deficit.ts:analyzeDeficit`', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_reject_is_vent': { theorem: 'THM-REJECT-IS-VENT', claim: 'REJECT has identical beta1 semantics to VENT (decrement by 1) but carries proof metadata (rejection reason). The proof primitive and the dissipation primitive are the same operation', mechanization: '`buleyean-proof.ts` REJECT propagation + `gg.ts` VENT transition', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_proof_lean_emission': { theorem: 'THM-PROOF-LEAN-EMISSION', claim: 'A verified .gg proof topology emits a valid Lean 4 theorem scaffold referencing BuleyeanLogic.lean foundations. Complete proofs use `n_rejections_reach_ground`, incomplete proofs use `sorry`', mechanization: '`buleyean-proof.ts:emitLean4` + 3 emission tests', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_proof_tla_emission': { theorem: 'THM-PROOF-TLA-EMISSION', claim: 'A verified .gg proof topology emits a valid TLA+ specification with per-node variables, REJECT actions, non-negativity invariant, and eventual QED property', mechanization: '`buleyean-proof.ts:emitTlaPlus` + 1 emission test', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_seven_proof_diagnostics': { theorem: 'THM-SEVEN-PROOF-DIAGNOSTICS', claim: 'Betty emits seven proof-specific diagnostic codes: PROOF_CYCLE_DETECTED, PROOF_RANK_VIOLATION, PROOF_BULE_UNDERFLOW, PROOF_TERMINAL_NONZERO, PROOF_FORK_BULE_MISMATCH, PROOF_MISSING_THEOREM, PROOF_AXIO', mechanization: '`buleyean-proof.ts:verifyProofTopology` diagnostic emission + 4 diagnostic tests', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' },
  'thm_1499_proofs_valid': { theorem: 'THM-1499-PROOFS-VALID', claim: 'All 1,499 .gg proof topologies in gnosis/examples/proofs/ are valid and complete (DAG acyclic, all terminals at bules = 0, zero diagnostics). Covers 111 TLA+ specs, 159 Lean theorems, 1,140 behavioral', mechanization: 'Node.js batch verification script (1,499/1,499 valid, 1,499/1,499 complete, 0 parse errors)', section: 'Buleyean Proof Topology System (ch17 section 20.2.8)' }
};
