// Auto-generated theorem tools for coherence-mcp
// 33 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_pentagon',
    description: 'The pentagon identity for the fork/race/fold monoidal category: for four objects A,B,C,D, the two associator paths from `((A×B)×C)×D` to `A×(B×(C×D))` are equal. This is the first generator of Mac Lan [LEDGER: THM-PENTAGON]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_triangle',
    description: 'The triangle identity: the path `(A×I)×B → A×(I×B) → A×B` via associator + left unitor equals the direct right unitor path. Second generator of Mac Lane coherence. [LEDGER: THM-TRIANGLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_hexagon',
    description: 'The hexagon identity for braiding: two paths from `(A×B)×C` to `B×(A×C)` via associator + braiding agree. Third generator of symmetric monoidal coherence. [LEDGER: THM-HEXAGON]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_monoidal_category',
    description: 'Bundle: `GHom` with `gcomp`, `tensorHom`, `PUnit`, associators, unitors forms a monoidal category. All structural roundtrips (associator, unitor) are identity, pentagon and triangle hold. [LEDGER: THM-MONOIDAL-CATEGORY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_symmetric_monoidal',
    description: 'Adding `braid` to the monoidal category makes it symmetric monoidal. Braid is involutive and satisfies the hexagon identity. [LEDGER: THM-SYMMETRIC-MONOIDAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trace_vanishing',
    description: 'Trace vanishing: when feedback type is monoidal unit PUnit, the trace reduces to the function itself. Trivial feedback disappears: `Tr_I(f) = f`. [LEDGER: THM-TRACE-VANISHING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trace_yanking',
    description: 'Trace yanking: `Tr(braid) = id`. The trace of the swap morphism is identity — pulling a straight string through a loop leaves it straight. Uses `braid_involutive` from MonoidalCoherence. [LEDGER: THM-TRACE-YANKING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trace_sliding',
    description: 'Trace sliding: `Tr(f ∘ (id⊗g)) = Tr((id⊗g) ∘ f)`. Sliding a morphism around the feedback loop preserves the trace. Naturality of the feedback wire (Joyal-Street-Verity, 1996). [LEDGER: THM-TRACE-SLIDING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trace_superposing',
    description: 'Trace superposing: `Tr(f) ⊗ g = Tr(f ⊗ g)`. Feedback on one component does not interfere with parallel computation. [LEDGER: THM-TRACE-SUPERPOSING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_traced_monoidal',
    description: 'Bundle: the fork/race/fold category with trace satisfies all Joyal-Street-Verity axioms (vanishing, yanking, sliding, superposing). Extends the symmetric monoidal category to a traced monoidal categor [LEDGER: THM-TRACED-MONOIDAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trace_iteration',
    description: 'The trace operator models bounded iteration: `Tr(f)(a)` produces the same result as `traceIter(f, a, fuel)` for any fuel. Connects the categorical trace to computational iteration. [LEDGER: THM-TRACE-ITERATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_insufficient_data',
    description: 'When the deficit is positive (Bule > 0), the answer is not yet computable. "INSUFFICIENT DATA FOR MEANINGFUL ANSWER" is the state where more rejections are needed before convergence. Deficit positive  [LEDGER: THM-INSUFFICIENT-DATA]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_data_accumulates',
    description: 'The deficit decreases monotonically as data accumulates. Each observation round reduces the deficit. The deficit never increases. Delegates to `future_deficit_monotone` [LEDGER: THM-DATA-ACCUMULATES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_answer_eventually_computable',
    description: 'After exactly d rounds (the initial deficit), the deficit reaches zero. The complement distribution has converged. The answer is computable. Multivacs final moment. Delegates to `future_deficit_event [LEDGER: THM-ANSWER-EVENTUALLY-COMPUTABLE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_heat_death_maximum_void',
    description: 'At maximum void (every choice rejected every round), every choice has weight exactly 1. Heat death is the state where the void boundary is full. Delegates to `buleyean_min_uncertainty` [LEDGER: THM-HEAT-DEATH-MAXIMUM-VOID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_sliver_survives_heat_death',
    description: 'Even at maximum void (heat death), every choice retains weight >= 1. The sliver is irreducible: no choice can reach weight zero. The +1 in the weight formula is structural. Delegates to `buleyean_posi [LEDGER: THM-SLIVER-SURVIVES-HEAT-DEATH]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_let_there_be_light',
    description: 'A converged complement distribution (Bule = 0) is a valid Bayesian prior for a new Buleyean space. Different rejection counts produce different weights. The prior is informative, not uniform. The conv [LEDGER: THM-LET-THERE-BE-LIGHT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_entropy_reversal',
    description: 'The void boundary grows monotonically (entropy increases). The complement distribution concentrates monotonically (entropy decreases). Non-rejected choices gain weight after each rejection round. Entr [LEDGER: THM-ENTROPY-REVERSAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_no_data_no_answer',
    description: 'A system with zero observations (empty void boundary) produces uniform weights -- maximum entropy, zero information, no meaningful answer. Delegates to `fold_without_evidence_is_coinflip` [LEDGER: THM-NO-DATA-NO-ANSWER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_trajectory_deterministic',
    description: 'The entire future trajectory of the deficit is known: futureDeficit d k = d - min(k, d). No randomness, no breakthroughs. The convergence round is d. Delegates to `future_deficit_deterministic` [LEDGER: THM-TRAJECTORY-DETERMINISTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_last_question',
    description: 'Complete Last Question theorem: deficit monotonically decreasing, answer eventually computable at round d, every choice survives heat death (weight >= 1), no choice reaches zero, no data means no answ [LEDGER: THM-LAST-QUESTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_utm_universal_fork',
    description: 'The Universal Turing Machine is the maximally general fork: totalPrograms = haltingPrograms + nonHalting. Every computable process is a path in the universal fork. Execution partitions programs into h [LEDGER: THM-UTM-UNIVERSAL-FORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_execution_is_fold',
    description: 'Program execution is a fold operation: haltingPrograms + nonHalting = totalPrograms. Every program goes to exactly one set. The fold is total: no program escapes classification [LEDGER: THM-EXECUTION-IS-FOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_halting_survivors_bounded',
    description: 'The number of halting programs is strictly less than the total. Not every program halts. The void of non-termination is nonempty [LEDGER: THM-HALTING-SURVIVORS-BOUNDED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_omega_positivity',
    description: 'The halting probability is positive: at least one program halts. Omega > 0. The void boundary of program space does not absorb everything [LEDGER: THM-OMEGA-POSITIVITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_omega_strict_subuniversality',
    description: 'Omega < 1: not every program halts. The fold is nontrivial -- it vents at least one path. The non-halting void is nonempty [LEDGER: THM-OMEGA-STRICT-SUBUNIVERSALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_finite_approximation_monotone',
    description: 'Extending the program enumeration can only increase (or maintain) the halting count. The finite approximation to Omega is monotonically non-decreasing as more programs are enumerated [LEDGER: THM-FINITE-APPROXIMATION-MONOTONE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_omega_approximation_bounded',
    description: 'Any finite prefix of the enumeration undercounts (or exactly counts) the true halting set. The finite Omega is a lower bound on the limit [LEDGER: THM-OMEGA-APPROXIMATION-BOUNDED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_halting_as_fold_deficit',
    description: 'The number of non-halting programs is the fold deficit: the topological cost of execution. Analogous to classicalDeficit in quantum search and protocolTopologicalDeficit in transport multiplexing [LEDGER: THM-HALTING-AS-FOLD-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_omega_is_buleyean_complement',
    description: 'Omega (the halting probability) corresponds to the Buleyean complement weight of the halting set. Programs that halt have low rejection count (survived). Programs that dont halt have high rejection c [LEDGER: THM-OMEGA-IS-BULEYEAN-COMPLEMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_chaitin_solomonoff_bridge',
    description: 'Chaitins Omega and Solomonoffs Universal Prior share the same void boundary structure. Both partition the same program space. Both are strictly between 0 and 1. The non-halting deficit is positive.  [LEDGER: THM-CHAITIN-SOLOMONOFF-BRIDGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_uncomputability_is_infinite_void',
    description: 'The uncomputability of Omega is the statement that the void boundary of all programs is not finitely constructible. The finite approximation is monotone, bounded, and positive at every stage. Buleyean [LEDGER: THM-UNCOMPUTABILITY-IS-INFINITE-VOID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_chaitin_omega_master',
    description: 'Complete Chaitin-Omega theorem: UTM is universal fork, execution is fold, halting is bounded, Omega is positive, Omega is subuniversal, void is nonempty, Chaitin-Solomonoff bridge holds. Chaitins Ome [LEDGER: THM-CHAITIN-OMEGA-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_pentagon': { theorem: 'THM-PENTAGON', claim: 'The pentagon identity for the fork/race/fold monoidal category: for four objects A,B,C,D, the two associator paths from `((A×B)×C)×D` to `A×(B×(C×D))` are equal. This is the first generator of Mac Lan', mechanization: 'TLA+ `MonoidalCoherence.tla` invariant `InvPentagon` + Lean theorem `MonoidalCoherence.pentagon` in `MonoidalCoherence.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_triangle': { theorem: 'THM-TRIANGLE', claim: 'The triangle identity: the path `(A×I)×B → A×(I×B) → A×B` via associator + left unitor equals the direct right unitor path. Second generator of Mac Lane coherence.', mechanization: 'TLA+ `MonoidalCoherence.tla` invariant `InvTriangle` + Lean theorem `MonoidalCoherence.triangle` in `MonoidalCoherence.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_hexagon': { theorem: 'THM-HEXAGON', claim: 'The hexagon identity for braiding: two paths from `(A×B)×C` to `B×(A×C)` via associator + braiding agree. Third generator of symmetric monoidal coherence.', mechanization: 'TLA+ `MonoidalCoherence.tla` invariant `InvHexagon` + Lean theorem `MonoidalCoherence.hexagon` in `MonoidalCoherence.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_monoidal_category': { theorem: 'THM-MONOIDAL-CATEGORY', claim: 'Bundle: `GHom` with `gcomp`, `tensorHom`, `PUnit`, associators, unitors forms a monoidal category. All structural roundtrips (associator, unitor) are identity, pentagon and triangle hold.', mechanization: 'TLA+ `MonoidalCoherence.tla` invariant `InvMonoidalCategory` + Lean theorem `MonoidalCoherence.monoidal_category` in `MonoidalCoherence.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_symmetric_monoidal': { theorem: 'THM-SYMMETRIC-MONOIDAL', claim: 'Adding `braid` to the monoidal category makes it symmetric monoidal. Braid is involutive and satisfies the hexagon identity.', mechanization: 'TLA+ `MonoidalCoherence.tla` invariant `InvSymmetricMonoidal` + Lean theorem `MonoidalCoherence.symmetric_monoidal` in `MonoidalCoherence.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_trace_vanishing': { theorem: 'THM-TRACE-VANISHING', claim: 'Trace vanishing: when feedback type is monoidal unit PUnit, the trace reduces to the function itself. Trivial feedback disappears: `Tr_I(f) = f`.', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvVanishing` + Lean theorem `TracedMonoidal.trace_vanishing_id` in `TracedMonoidal.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_trace_yanking': { theorem: 'THM-TRACE-YANKING', claim: 'Trace yanking: `Tr(braid) = id`. The trace of the swap morphism is identity — pulling a straight string through a loop leaves it straight. Uses `braid_involutive` from MonoidalCoherence.', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvYanking` + Lean theorem `TracedMonoidal.trace_yanking` in `TracedMonoidal.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_trace_sliding': { theorem: 'THM-TRACE-SLIDING', claim: 'Trace sliding: `Tr(f ∘ (id⊗g)) = Tr((id⊗g) ∘ f)`. Sliding a morphism around the feedback loop preserves the trace. Naturality of the feedback wire (Joyal-Street-Verity, 1996).', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvSliding` + Lean theorems `TracedMonoidal.trace_sliding_id` and `TracedMonoidal.trace_sliding` in `TracedMonoid', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_trace_superposing': { theorem: 'THM-TRACE-SUPERPOSING', claim: 'Trace superposing: `Tr(f) ⊗ g = Tr(f ⊗ g)`. Feedback on one component does not interfere with parallel computation.', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvSuperposing` + Lean theorems `TracedMonoidal.trace_superposing` and `TracedMonoidal.trace_superposing_id` in `', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_traced_monoidal': { theorem: 'THM-TRACED-MONOIDAL', claim: 'Bundle: the fork/race/fold category with trace satisfies all Joyal-Street-Verity axioms (vanishing, yanking, sliding, superposing). Extends the symmetric monoidal category to a traced monoidal categor', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvTracedMonoidal` + Lean theorem `TracedMonoidal.traced_monoidal` in `TracedMonoidal.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_trace_iteration': { theorem: 'THM-TRACE-ITERATION', claim: 'The trace operator models bounded iteration: `Tr(f)(a)` produces the same result as `traceIter(f, a, fuel)` for any fuel. Connects the categorical trace to computational iteration.', mechanization: 'TLA+ `TracedMonoidal.tla` invariant `InvIteration` + Lean theorem `TracedMonoidal.trace_iteration_equiv` in `TracedMonoidal.lean`', section: 'Monoidal Coherence & Traced Structure (Tracks Zeta + Eta)' },
  'thm_insufficient_data': { theorem: 'THM-INSUFFICIENT-DATA', claim: 'When the deficit is positive (Bule > 0), the answer is not yet computable. "INSUFFICIENT DATA FOR MEANINGFUL ANSWER" is the state where more rejections are needed before convergence. Deficit positive ', mechanization: 'Lean theorem `insufficient_data_is_positive_bule` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_data_accumulates': { theorem: 'THM-DATA-ACCUMULATES', claim: 'The deficit decreases monotonically as data accumulates. Each observation round reduces the deficit. The deficit never increases. Delegates to `future_deficit_monotone`', mechanization: 'Lean theorem `data_accumulates_monotonically` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_answer_eventually_computable': { theorem: 'THM-ANSWER-EVENTUALLY-COMPUTABLE', claim: 'After exactly d rounds (the initial deficit), the deficit reaches zero. The complement distribution has converged. The answer is computable. Multivacs final moment. Delegates to `future_deficit_event', mechanization: 'Lean theorem `answer_eventually_computable` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_heat_death_maximum_void': { theorem: 'THM-HEAT-DEATH-MAXIMUM-VOID', claim: 'At maximum void (every choice rejected every round), every choice has weight exactly 1. Heat death is the state where the void boundary is full. Delegates to `buleyean_min_uncertainty`', mechanization: 'Lean theorem `heat_death_is_maximum_void` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_sliver_survives_heat_death': { theorem: 'THM-SLIVER-SURVIVES-HEAT-DEATH', claim: 'Even at maximum void (heat death), every choice retains weight >= 1. The sliver is irreducible: no choice can reach weight zero. The +1 in the weight formula is structural. Delegates to `buleyean_posi', mechanization: 'Lean theorems `sliver_survives_heat_death` and `sliver_is_irreducible` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_let_there_be_light': { theorem: 'THM-LET-THERE-BE-LIGHT', claim: 'A converged complement distribution (Bule = 0) is a valid Bayesian prior for a new Buleyean space. Different rejection counts produce different weights. The prior is informative, not uniform. The conv', mechanization: 'Lean theorem `let_there_be_light` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_entropy_reversal': { theorem: 'THM-ENTROPY-REVERSAL', claim: 'The void boundary grows monotonically (entropy increases). The complement distribution concentrates monotonically (entropy decreases). Non-rejected choices gain weight after each rejection round. Entr', mechanization: 'Lean theorem `entropy_reversal_is_complement` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_no_data_no_answer': { theorem: 'THM-NO-DATA-NO-ANSWER', claim: 'A system with zero observations (empty void boundary) produces uniform weights -- maximum entropy, zero information, no meaningful answer. Delegates to `fold_without_evidence_is_coinflip`', mechanization: 'Lean theorem `no_data_no_answer` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_trajectory_deterministic': { theorem: 'THM-TRAJECTORY-DETERMINISTIC', claim: 'The entire future trajectory of the deficit is known: futureDeficit d k = d - min(k, d). No randomness, no breakthroughs. The convergence round is d. Delegates to `future_deficit_deterministic`', mechanization: 'Lean theorem `trajectory_deterministic` in `LastQuestion.lean`', section: 'The Last Question (Asimov Bridge)' },
  'thm_last_question': { theorem: 'THM-LAST-QUESTION', claim: 'Complete Last Question theorem: deficit monotonically decreasing, answer eventually computable at round d, every choice survives heat death (weight >= 1), no choice reaches zero, no data means no answ', mechanization: 'TLA+ `LastQuestion.tla` invariants (`InvDeficitNonneg`, `InvDeficitBounded`, `InvSliverSurvives`, `InvConvergedMeansZeroDeficit`, `InvLetThereBeLight`', section: 'The Last Question (Asimov Bridge)' },
  'thm_utm_universal_fork': { theorem: 'THM-UTM-UNIVERSAL-FORK', claim: 'The Universal Turing Machine is the maximally general fork: totalPrograms = haltingPrograms + nonHalting. Every computable process is a path in the universal fork. Execution partitions programs into h', mechanization: 'Lean theorem `utm_is_universal_fork` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_execution_is_fold': { theorem: 'THM-EXECUTION-IS-FOLD', claim: 'Program execution is a fold operation: haltingPrograms + nonHalting = totalPrograms. Every program goes to exactly one set. The fold is total: no program escapes classification', mechanization: 'Lean theorem `execution_is_fold` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_halting_survivors_bounded': { theorem: 'THM-HALTING-SURVIVORS-BOUNDED', claim: 'The number of halting programs is strictly less than the total. Not every program halts. The void of non-termination is nonempty', mechanization: 'Lean theorem `halting_survivors_bounded` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_omega_positivity': { theorem: 'THM-OMEGA-POSITIVITY', claim: 'The halting probability is positive: at least one program halts. Omega > 0. The void boundary of program space does not absorb everything', mechanization: 'Lean theorem `omega_positivity` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_omega_strict_subuniversality': { theorem: 'THM-OMEGA-STRICT-SUBUNIVERSALITY', claim: 'Omega < 1: not every program halts. The fold is nontrivial -- it vents at least one path. The non-halting void is nonempty', mechanization: 'Lean theorem `omega_strict_subuniversality` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_finite_approximation_monotone': { theorem: 'THM-FINITE-APPROXIMATION-MONOTONE', claim: 'Extending the program enumeration can only increase (or maintain) the halting count. The finite approximation to Omega is monotonically non-decreasing as more programs are enumerated', mechanization: 'Lean theorem `finite_approximation_monotone` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_omega_approximation_bounded': { theorem: 'THM-OMEGA-APPROXIMATION-BOUNDED', claim: 'Any finite prefix of the enumeration undercounts (or exactly counts) the true halting set. The finite Omega is a lower bound on the limit', mechanization: 'Lean theorem `omega_approximation_bounded` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_halting_as_fold_deficit': { theorem: 'THM-HALTING-AS-FOLD-DEFICIT', claim: 'The number of non-halting programs is the fold deficit: the topological cost of execution. Analogous to classicalDeficit in quantum search and protocolTopologicalDeficit in transport multiplexing', mechanization: 'Lean theorem `halting_as_fold_deficit` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_omega_is_buleyean_complement': { theorem: 'THM-OMEGA-IS-BULEYEAN-COMPLEMENT', claim: 'Omega (the halting probability) corresponds to the Buleyean complement weight of the halting set. Programs that halt have low rejection count (survived). Programs that dont halt have high rejection c', mechanization: 'Lean theorem `omega_is_buleyean_complement` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_chaitin_solomonoff_bridge': { theorem: 'THM-CHAITIN-SOLOMONOFF-BRIDGE', claim: 'Chaitins Omega and Solomonoffs Universal Prior share the same void boundary structure. Both partition the same program space. Both are strictly between 0 and 1. The non-halting deficit is positive. ', mechanization: 'Lean theorem `chaitin_solomonoff_bridge` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_uncomputability_is_infinite_void': { theorem: 'THM-UNCOMPUTABILITY-IS-INFINITE-VOID', claim: 'The uncomputability of Omega is the statement that the void boundary of all programs is not finitely constructible. The finite approximation is monotone, bounded, and positive at every stage. Buleyean', mechanization: 'Lean theorem `uncomputability_is_infinite_void` in `ChaitinOmega.lean`', section: 'Chaitin Omega (Computability Bridge)' },
  'thm_chaitin_omega_master': { theorem: 'THM-CHAITIN-OMEGA-MASTER', claim: 'Complete Chaitin-Omega theorem: UTM is universal fork, execution is fold, halting is bounded, Omega is positive, Omega is subuniversal, void is nonempty, Chaitin-Solomonoff bridge holds. Chaitins Ome', mechanization: 'TLA+ `ChaitinOmega.tla` invariants (`InvFoldConservation`, `InvOmegaPositive`, `InvOmegaSubuniversal`, `InvVoidNonempty`, `InvHaltingBounded`, `InvTot', section: 'Chaitin Omega (Computability Bridge)' }
};
