// Auto-generated theorem tools for protocol-mcp
// 24 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_q_deficit',
    description: 'Quantum speedup identity in topology-matched regime [LEDGER: THM-Q-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_q_correspondence_boundary',
    description: 'Path-integral correspondence is operationally exact only for linear full aggregation; nonlinear selection cannot preserve the same partition-additivity/order-invariance properties in general, and any  [LEDGER: THM-Q-CORRESPONDENCE-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_proto_deficit',
    description: 'TCP/QUIC/Aeon deficit ordering [LEDGER: THM-PROTO-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_bandgap_beta2',
    description: 'Band gap implies `β₂ > 0` [LEDGER: THM-BANDGAP-BETA2]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_band_gap_void',
    description: 'Band gap as void positivity: an allowed energy band with forbidden zones tracks band gap existence and void positivity. When forbidden energies exist between boundary levels, Beta2 > 0 -- the void mea [LEDGER: THM-BAND-GAP-VOID]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quantum_deficit',
    description: 'Quantum speedup through Beta1 elimination: N = rootN^2. Classical deficit = rootN - 1. Quantum deficit = 0. Sequential rounds = N, parallel rounds = rootN, speedup = N / rootN [LEDGER: THM-QUANTUM-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_settlement_deficit',
    description: 'Sequential settlement has deficit = 2, parallel settlement has deficit = 0. The topological deficit measures wasted parallelism in the settlement mode [LEDGER: THM-SETTLEMENT-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_frame_bisim',
    description: 'Frame-native execution (frameRace, frameFold) produces identical results to Stream-based execution under the canUseFrameNativePath guard: no timeout, no shared state, all handlers registered, default  [LEDGER: THM-FRAME-BISIM]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_frame_wallington_equiv',
    description: 'Tick-parallel frame executor with flat pre-allocated grid produces same output as sequential Stream-based wallington for any stage/chunk decomposition [LEDGER: THM-FRAME-WALLINGTON-EQUIV]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_frame_overhead_bound',
    description: 'Frame-native allocates O(N) raw promises; Stream-based allocates O(7N) objects (AbortController + event listener + state machine + Promise constructor + result wrapper + vented tracker + map entry). S [LEDGER: THM-FRAME-OVERHEAD-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_fold_increases_wave_speed',
    description: 'A fold reduces mass density ρ (discharges β₁) while preserving tension T (energy conservation). Wave speed c² = T/ρ increases at every fold. Inner folds are faster than outer folds. This is why the ti [LEDGER: THM-FOLD-INCREASES-WAVE-SPEED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_snap_threshold',
    description: 'The snap (supersonic transition) is inevitable if tension is preserved and mass decreases through enough fold stages. For any threshold c*², there exists a fold depth where wave speed exceeds it. Phys [LEDGER: THM-SNAP-THRESHOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_taper_monotonicity',
    description: 'Through a sequence of nested folds, wave speed is monotonically increasing. No fold can slow the wave down (Second Law: folds are irreversible, β₁ only decreases). The taper is a one-way energy concen [LEDGER: THM-TAPER-MONOTONICITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_binary_encoding',
    description: 'A snap sequence encodes a bitstream: snap = 1, silence = 0. Channel capacity = number of fold stages. The metronomic regime (equal spacing, zero jitter) maximizes capacity. Scale-invariant: works on p [LEDGER: THM-BINARY-ENCODING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_visibility',
    description: 'In the bounded asynchronous single-key quorum protocol, write and read quorums intersect, acknowledged versions remain covered under bounded crashes/recovery, and every legal quorum read returns the a [LEDGER: THM-QUORUM-VISIBILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_boundary',
    description: 'The quorum-visibility claim fails exactly where the assumptions say it should: weak quorums admit disjoint read/write sets, contagious regression can make an intersecting read quorum miss the acknowle [LEDGER: THM-QUORUM-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_connected',
    description: 'In the bounded asynchronous single-key quorum model with explicit connectivity, quorum availability is exactly the presence of a live connected quorum, minority connected splits are unavailable, and a [LEDGER: THM-QUORUM-CONNECTED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_consistency',
    description: 'In the bounded single-session quorum model, once reads are restricted to committed states (`pendingVersion = 0`), each observed read equals the acknowledged version, therefore satisfies read-your-writ [LEDGER: THM-QUORUM-CONSISTENCY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_consistency_boundary',
    description: 'The session-consistency claim is scoped, not universal: if reads are allowed during in-flight writes, monotonicity can fail; if the client does not carry a session floor, read-your-writes can fail eve [LEDGER: THM-QUORUM-CONSISTENCY-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_ordering',
    description: 'In the bounded multi-writer quorum register, globally ordered ballots plus committed-state reads force each observed read to return the latest acknowledged ballot and its writer, so a later committed  [LEDGER: THM-QUORUM-ORDERING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_ordering_boundary',
    description: 'The multi-writer ordering claim is scoped, not universal: if a read loses quorum connectivity under partition it can return a stale ballot, and if ballots are not globally unique then writer identity  [LEDGER: THM-QUORUM-ORDERING-BOUNDARY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_history_refinement',
    description: 'In the bounded committed-state multi-writer quorum register, observed reads refine the latest completed-write prefix, operation-history indices stay monotone, and the latest committed read linearizes  [LEDGER: THM-QUORUM-HISTORY-REFINEMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_async_network',
    description: 'Quorum async network: minority connected set cannot host quorum. Connected quorum read is exact under coverage. Minority split read is stale if weak reads are allowed [LEDGER: THM-QUORUM-ASYNC-NETWORK]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quorum_visibility_base',
    description: 'Base quorum results: read value is supremum of stored versions. Write-read quorums intersect (critical W+R > N property). Strict majority failure budget is less than quorum size [LEDGER: THM-QUORUM-VISIBILITY-BASE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_q_deficit': { theorem: 'THM-Q-DEFICIT', claim: 'Quantum speedup identity in topology-matched regime', mechanization: 'TLA+ transition model + Lean theorems `Claims.quantum_deficit_is_zero` and `Claims.quantum_speedup_equals_classical_deficit_plus_one`', section: 'Protocol, Settlement & Band Gap' },
  'thm_q_correspondence_boundary': { theorem: 'THM-Q-CORRESPONDENCE-BOUNDARY', claim: 'Path-integral correspondence is operationally exact only for linear full aggregation; nonlinear selection cannot preserve the same partition-additivity/order-invariance properties in general, and any ', mechanization: 'executable `src/quantum-correspondence-boundary.test.ts` + `src/quantum-recombination-ablation.test.ts`/artifact runner + Lean theorems `Claims.additi', section: 'Protocol, Settlement & Band Gap' },
  'thm_proto_deficit': { theorem: 'THM-PROTO-DEFICIT', claim: 'TCP/QUIC/Aeon deficit ordering', mechanization: 'TLA+ transition model + Lean theorem `Claims.protocol_deficits`', section: 'Protocol, Settlement & Band Gap' },
  'thm_bandgap_beta2': { theorem: 'THM-BANDGAP-BETA2', claim: 'Band gap implies `β₂ > 0`', mechanization: 'TLA+ transition model + Lean theorem `Claims.band_gap_implies_beta2_positive`', section: 'Protocol, Settlement & Band Gap' },
  'thm_band_gap_void': { theorem: 'THM-BAND-GAP-VOID', claim: 'Band gap as void positivity: an allowed energy band with forbidden zones tracks band gap existence and void positivity. When forbidden energies exist between boundary levels, Beta2 > 0 -- the void mea', mechanization: 'TLA+ `BandGapVoid.tla` invariants (`InvAllowedSubset`, `InvBandGapExists`, `InvVoidIsPositive`)', section: 'Protocol, Settlement & Band Gap' },
  'thm_quantum_deficit': { theorem: 'THM-QUANTUM-DEFICIT', claim: 'Quantum speedup through Beta1 elimination: N = rootN^2. Classical deficit = rootN - 1. Quantum deficit = 0. Sequential rounds = N, parallel rounds = rootN, speedup = N / rootN', mechanization: 'TLA+ `QuantumDeficit.tla` invariants (`InvPerfectSquare`, `InvClassicalDeficit`, `InvQuantumDeficitZero`, `InvSpeedup`)', section: 'Protocol, Settlement & Band Gap' },
  'thm_settlement_deficit': { theorem: 'THM-SETTLEMENT-DEFICIT', claim: 'Sequential settlement has deficit = 2, parallel settlement has deficit = 0. The topological deficit measures wasted parallelism in the settlement mode', mechanization: 'TLA+ `SettlementDeficit.tla` invariants (`InvSequentialDeficitIsTwo`, `InvParallelDeficitIsZero`)', section: 'Protocol, Settlement & Band Gap' },
  'thm_frame_bisim': { theorem: 'THM-FRAME-BISIM', claim: 'Frame-native execution (frameRace, frameFold) produces identical results to Stream-based execution under the canUseFrameNativePath guard: no timeout, no shared state, all handlers registered, default ', mechanization: 'TLA+ `FrameNativeBisim.tla` invariants (`InvRaceBisimResults`, `InvRaceBisimWinner`, `InvFoldBisimResults`) + Lean theorems `FrameNativeBisim.frame_ra', section: 'Frame Native Execution' },
  'thm_frame_wallington_equiv': { theorem: 'THM-FRAME-WALLINGTON-EQUIV', claim: 'Tick-parallel frame executor with flat pre-allocated grid produces same output as sequential Stream-based wallington for any stage/chunk decomposition', mechanization: 'TLA+ `FrameNativeBisim.tla` + Lean theorem `FrameNativeBisim.frame_wallington_equiv`', section: 'Frame Native Execution' },
  'thm_frame_overhead_bound': { theorem: 'THM-FRAME-OVERHEAD-BOUND', claim: 'Frame-native allocates O(N) raw promises; Stream-based allocates O(7N) objects (AbortController + event listener + state machine + Promise constructor + result wrapper + vented tracker + map entry). S', mechanization: 'TLA+ `FrameNativeBisim.tla` invariants (`InvOverheadBound`, `InvFrameLinear`, `InvStreamSevenX`) + Lean theorems `FrameNativeBisim.frame_overhead_stri', section: 'Frame Native Execution' },
  'thm_fold_increases_wave_speed': { theorem: 'THM-FOLD-INCREASES-WAVE-SPEED', claim: 'A fold reduces mass density ρ (discharges β₁) while preserving tension T (energy conservation). Wave speed c² = T/ρ increases at every fold. Inner folds are faster than outer folds. This is why the ti', mechanization: 'TLA+ `WhipWaveDuality.tla` invariant `InvFoldSpeed` + Lean theorem `WhipWaveDuality.fold_increases_wave_speed` in `WhipWaveDuality.lean`', section: 'Whip Wave Duality' },
  'thm_snap_threshold': { theorem: 'THM-SNAP-THRESHOLD', claim: 'The snap (supersonic transition) is inevitable if tension is preserved and mass decreases through enough fold stages. For any threshold c*², there exists a fold depth where wave speed exceeds it. Phys', mechanization: 'TLA+ `WhipWaveDuality.tla` invariant `InvSnap` + Lean theorem `WhipWaveDuality.snap_inevitable` in `WhipWaveDuality.lean`', section: 'Whip Wave Duality' },
  'thm_taper_monotonicity': { theorem: 'THM-TAPER-MONOTONICITY', claim: 'Through a sequence of nested folds, wave speed is monotonically increasing. No fold can slow the wave down (Second Law: folds are irreversible, β₁ only decreases). The taper is a one-way energy concen', mechanization: 'TLA+ `WhipWaveDuality.tla` invariant `InvTaper` + Lean theorem `WhipWaveDuality.taper_wave_speed_monotone` in `WhipWaveDuality.lean`', section: 'Whip Wave Duality' },
  'thm_binary_encoding': { theorem: 'THM-BINARY-ENCODING', claim: 'A snap sequence encodes a bitstream: snap = 1, silence = 0. Channel capacity = number of fold stages. The metronomic regime (equal spacing, zero jitter) maximizes capacity. Scale-invariant: works on p', mechanization: 'TLA+ `WhipWaveDuality.tla` invariant `InvBinary` + Lean theorems `WhipWaveDuality.snap_sequence_capacity` and `metronomic_maximizes_capacity` in `Whip', section: 'Whip Wave Duality' },
  'thm_quorum_visibility': { theorem: 'THM-QUORUM-VISIBILITY', claim: 'In the bounded asynchronous single-key quorum protocol, write and read quorums intersect, acknowledged versions remain covered under bounded crashes/recovery, and every legal quorum read returns the a', mechanization: 'TLA+ `QuorumReadWrite.tla` invariants (`InvQuorumIntersection`, `InvAckedQuorumCoverage`, `InvLiveAckedCoverage`, `InvReadQuorumHitsAckedReplica`, `In', section: 'Quorum Protocols' },
  'thm_quorum_boundary': { theorem: 'THM-QUORUM-BOUNDARY', claim: 'The quorum-visibility claim fails exactly where the assumptions say it should: weak quorums admit disjoint read/write sets, contagious regression can make an intersecting read quorum miss the acknowle', mechanization: 'Lean counterexamples `QuorumVisibility.weak_quorum_boundary_not_strict_majority`, `QuorumVisibility.weak_quorum_boundary_disjoint`, `QuorumVisibility.', section: 'Quorum Protocols' },
  'thm_quorum_connected': { theorem: 'THM-QUORUM-CONNECTED', claim: 'In the bounded asynchronous single-key quorum model with explicit connectivity, quorum availability is exactly the presence of a live connected quorum, minority connected splits are unavailable, and a', mechanization: 'TLA+ `QuorumAsyncNetwork.tla` invariants (`InvConnectedAvailabilityBoundary`, `InvMinoritySplitUnavailable`, `InvNoReplicaAheadWhenCommitted`, `InvCon', section: 'Quorum Protocols' },
  'thm_quorum_consistency': { theorem: 'THM-QUORUM-CONSISTENCY', claim: 'In the bounded single-session quorum model, once reads are restricted to committed states (`pendingVersion = 0`), each observed read equals the acknowledged version, therefore satisfies read-your-writ', mechanization: 'TLA+ `QuorumSessionConsistency.tla` invariants (`InvClientWriteTracksAck`, `InvNoPendingMeansNoReplicaAhead`, `InvCommittedReadReturnsAck`, `InvReadYo', section: 'Quorum Protocols' },
  'thm_quorum_consistency_boundary': { theorem: 'THM-QUORUM-CONSISTENCY-BOUNDARY', claim: 'The session-consistency claim is scoped, not universal: if reads are allowed during in-flight writes, monotonicity can fail; if the client does not carry a session floor, read-your-writes can fail eve', mechanization: 'Lean counterexamples `QuorumConsistency.pending_boundary_breaks_monotonic_reads` and `QuorumConsistency.no_session_floor_breaks_read_your_writes`', section: 'Quorum Protocols' },
  'thm_quorum_ordering': { theorem: 'THM-QUORUM-ORDERING', claim: 'In the bounded multi-writer quorum register, globally ordered ballots plus committed-state reads force each observed read to return the latest acknowledged ballot and its writer, so a later committed ', mechanization: 'TLA+ `QuorumMultiWriter.tla` invariants (`InvAckedWriterMatchesBallotOwner`, `InvAckedBallotBelowNext`, `InvPendingBallotsBelowNext`, `InvLatestAckCov', section: 'Quorum Protocols' },
  'thm_quorum_ordering_boundary': { theorem: 'THM-QUORUM-ORDERING-BOUNDARY', claim: 'The multi-writer ordering claim is scoped, not universal: if a read loses quorum connectivity under partition it can return a stale ballot, and if ballots are not globally unique then writer identity ', mechanization: 'Lean counterexamples `QuorumOrdering.partition_boundary_read_set_not_quorum`, `QuorumOrdering.partition_boundary_read_returns_stale_ballot`, `QuorumOr', section: 'Quorum Protocols' },
  'thm_quorum_history_refinement': { theorem: 'THM-QUORUM-HISTORY-REFINEMENT', claim: 'In the bounded committed-state multi-writer quorum register, observed reads refine the latest completed-write prefix, operation-history indices stay monotone, and the latest committed read linearizes ', mechanization: 'TLA+ `QuorumLinearizability.tla` invariants (`InvLatestHistoryTracksAck`, `InvWriteOpsMatchHistory`, `InvReadOpsRefineRegister`, `InvOpHistoryIndicesM', section: 'Quorum Protocols' },
  'thm_quorum_async_network': { theorem: 'THM-QUORUM-ASYNC-NETWORK', claim: 'Quorum async network: minority connected set cannot host quorum. Connected quorum read is exact under coverage. Minority split read is stale if weak reads are allowed', mechanization: 'Lean theorems `QuorumAsyncNetwork.minority_connected_set_cannot_host_quorum`, `QuorumAsyncNetwork.connected_quorum_read_exact_of_coverage`, and `Quoru', section: 'Quorum Protocols' },
  'thm_quorum_visibility_base': { theorem: 'THM-QUORUM-VISIBILITY-BASE', claim: 'Base quorum results: read value is supremum of stored versions. Write-read quorums intersect (critical W+R > N property). Strict majority failure budget is less than quorum size', mechanization: 'Lean theorems `QuorumVisibility.le_readValue_of_mem`, `QuorumVisibility.write_read_quorums_intersect`, and `QuorumVisibility.strict_majority_failure_b', section: 'Quorum Protocols' }
};
