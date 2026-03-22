// Auto-generated theorem tools for conflict-mcp
// 7 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_semiotic_deficit',
    description: 'Thought→speech has positive topological deficit when semantic paths exceed articulation streams. For standard speech (1 stream), Δβ = semanticPaths - 1. Each additional semantic dimension beyond the f [LEDGER: THM-SEMIOTIC-DEFICIT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_erasure',
    description: 'The speech fold is many-to-one: multiple semantic paths collide on shared articulation streams, erasing meaning by DPI. Composes THM-COVERING-CAUSALITY with THM-DEFICIT-INFORMATION-LOSS. "Something is [LEDGER: THM-SEMIOTIC-ERASURE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_vent_nuance',
    description: 'Vented semantic paths = lost nuance. The number of paths that must be dropped equals the semiotic deficit. "Its complicated" is a vent operation. [LEDGER: THM-SEMIOTIC-VENT-NUANCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_race_articulation',
    description: 'Phrasing selection is a neural race: multiple candidates forked in parallel, fastest adequate one wins. "Tip of the tongue" = race hasnt terminated. "Wrong word" = race winner passed validity but was [LEDGER: THM-SEMIOTIC-RACE-ARTICULATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_context_reduces',
    description: 'Shared context reduces semiotic deficit by adding implicit parallel channels. Expert-to-expert = high context = low deficit = precise. Expert-to-novice = low context = high deficit = confusion. Suffic [LEDGER: THM-SEMIOTIC-CONTEXT-REDUCES]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_conversation_trace',
    description: 'Dialogue is traced monoidal: trace operator models speak→hear→adjust→speak feedback. By THM-TRACE-VANISHING, trivial feedback = no new understanding. By THM-TRACE-YANKING, symmetric restatement = iden [LEDGER: THM-SEMIOTIC-CONVERSATION-TRACE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_semiotic_moa_isomorphism',
    description: 'MOA architecture is isomorphic to the semiotic pipeline: k agents producing 1 output has deficit k-1, identical to k semantic paths through 1 speech stream. Zero deficit when each agent gets its own o [LEDGER: THM-SEMIOTIC-MOA-ISOMORPHISM]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_semiotic_deficit': { theorem: 'THM-SEMIOTIC-DEFICIT', claim: 'Thought→speech has positive topological deficit when semantic paths exceed articulation streams. For standard speech (1 stream), Δβ = semanticPaths - 1. Each additional semantic dimension beyond the f', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvDeficit` + Lean theorems `SemioticDeficit.semiotic_deficit` and `SemioticDeficit.semiotic_deficit_speech` in ', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_erasure': { theorem: 'THM-SEMIOTIC-ERASURE', claim: 'The speech fold is many-to-one: multiple semantic paths collide on shared articulation streams, erasing meaning by DPI. Composes THM-COVERING-CAUSALITY with THM-DEFICIT-INFORMATION-LOSS. "Something is', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvErasure` + Lean theorem `SemioticDeficit.semiotic_erasure` in `SemioticDeficit.lean`', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_vent_nuance': { theorem: 'THM-SEMIOTIC-VENT-NUANCE', claim: 'Vented semantic paths = lost nuance. The number of paths that must be dropped equals the semiotic deficit. "Its complicated" is a vent operation.', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvVent` + Lean theorem `SemioticDeficit.semiotic_vent_nuance` in `SemioticDeficit.lean`', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_race_articulation': { theorem: 'THM-SEMIOTIC-RACE-ARTICULATION', claim: 'Phrasing selection is a neural race: multiple candidates forked in parallel, fastest adequate one wins. "Tip of the tongue" = race hasnt terminated. "Wrong word" = race winner passed validity but was', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvRace` + Lean theorem `SemioticDeficit.semiotic_race_articulation` in `SemioticDeficit.lean`', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_context_reduces': { theorem: 'THM-SEMIOTIC-CONTEXT-REDUCES', claim: 'Shared context reduces semiotic deficit by adding implicit parallel channels. Expert-to-expert = high context = low deficit = precise. Expert-to-novice = low context = high deficit = confusion. Suffic', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvContext` + Lean theorems `SemioticDeficit.semiotic_context_reduces` and `SemioticDeficit.semiotic_context_eli', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_conversation_trace': { theorem: 'THM-SEMIOTIC-CONVERSATION-TRACE', claim: 'Dialogue is traced monoidal: trace operator models speak→hear→adjust→speak feedback. By THM-TRACE-VANISHING, trivial feedback = no new understanding. By THM-TRACE-YANKING, symmetric restatement = iden', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvTrace` + Lean theorem `SemioticDeficit.semiotic_conversation_trace` in `SemioticDeficit.lean`', section: 'Semiotic Deficit & Peace (Track Pi)' },
  'thm_semiotic_moa_isomorphism': { theorem: 'THM-SEMIOTIC-MOA-ISOMORPHISM', claim: 'MOA architecture is isomorphic to the semiotic pipeline: k agents producing 1 output has deficit k-1, identical to k semantic paths through 1 speech stream. Zero deficit when each agent gets its own o', mechanization: 'TLA+ `SemioticDeficit.tla` invariant `InvMOA` + Lean theorems `SemioticDeficit.semiotic_moa_isomorphism` and `SemioticDeficit.semiotic_moa_zero_defici', section: 'Semiotic Deficit & Peace (Track Pi)' }
};
