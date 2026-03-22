// Auto-generated theorem tools for race-mcp
// 3 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_topo_race_subsumption',
    description: 'Per-resource codec racing subsumes any fixed codec: racing total is always less than or equal to any fixed-codec total. Adding a codec to the race never increases wire size. Racing achieves zero compr [LEDGER: THM-TOPO-RACE-SUBSUMPTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_dual_protocol_pareto',
    description: 'HTTP+Flow dual protocol dominates either protocol alone. Internal deficit of zero transfers advantage. Throughput conserved across the protocol boundary. Adding Flow never worsens HTTP clients [LEDGER: THM-DUAL-PROTOCOL-PARETO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_server_race_elimination',
    description: 'x-gnosis server lifecycle as fork/race/fold transition system: race terminates with exactly one winner. Fold preserves content-length invariant. Wallington Rotation achieves T=ceil(P/B)+N-1. Cache war [LEDGER: THM-SERVER-RACE-ELIMINATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_topo_race_subsumption': { theorem: 'THM-TOPO-RACE-SUBSUMPTION', claim: 'Per-resource codec racing subsumes any fixed codec: racing total is always less than or equal to any fixed-codec total. Adding a codec to the race never increases wire size. Racing achieves zero compr', mechanization: 'TLA+ `CodecRacing.tla` invariants (`InvRaceSubsumption`, `InvRaceMonotone`, `InvRaceDeficitZero`, `InvRaceEntropy`) + Lean theorems `CodecRacing.raceM', section: 'Server Optimality & Codec Racing' },
  'thm_dual_protocol_pareto': { theorem: 'THM-DUAL-PROTOCOL-PARETO', claim: 'HTTP+Flow dual protocol dominates either protocol alone. Internal deficit of zero transfers advantage. Throughput conserved across the protocol boundary. Adding Flow never worsens HTTP clients', mechanization: 'TLA+ `DualProtocol.tla` invariants (`InvDualProtocolPareto`, `InvInternalDeficitTransfer`, `InvProtocolBridgeConservation`, `InvDualProtocolMonotone`)', section: 'Server Optimality & Codec Racing' },
  'thm_server_race_elimination': { theorem: 'THM-SERVER-RACE-ELIMINATION', claim: 'x-gnosis server lifecycle as fork/race/fold transition system: race terminates with exactly one winner. Fold preserves content-length invariant. Wallington Rotation achieves T=ceil(P/B)+N-1. Cache war', mechanization: 'TLA+ `ServerTopology.tla` invariants (`InvRaceElimination`, `InvFoldIntegrity`, `InvRotationDepth`, `InvCacheMonotone`)', section: 'Server Optimality & Codec Racing' }
};
