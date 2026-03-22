// Auto-generated theorem tools for quorum-mcp
// 1 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_reynolds_bft',
    description: 'Reynolds-BFT correspondence: Reynolds number Re = N/C (stages/chunks). Idle fraction = max(0, 1 - 1/Re). BFT thresholds derived from fork/race/fold framework: Re < 3/2 (quorum-safe), Re < 2 (majority- [LEDGER: THM-REYNOLDS-BFT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_reynolds_bft': { theorem: 'THM-REYNOLDS-BFT', claim: 'Reynolds-BFT correspondence: Reynolds number Re = N/C (stages/chunks). Idle fraction = max(0, 1 - 1/Re). BFT thresholds derived from fork/race/fold framework: Re < 3/2 (quorum-safe), Re < 2 (majority-', mechanization: 'Lean theorems in `ReynoldsBFT.lean`', section: 'Reynolds BFT' }
};
