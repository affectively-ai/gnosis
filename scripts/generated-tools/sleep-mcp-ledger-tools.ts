// Auto-generated theorem tools for sleep-mcp
// 1 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_sleep_weighted_threshold',
    description: 'Weighted repeated-cycle sleep-schedule bridge: an integerized literature-style critical wake boundary leaves subcritical and critical schedules debt-free, while supercritical schedules accumulate carr [LEDGER: THM-SLEEP-WEIGHTED-THRESHOLD]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_sleep_weighted_threshold': { theorem: 'THM-SLEEP-WEIGHTED-THRESHOLD', claim: 'Weighted repeated-cycle sleep-schedule bridge: an integerized literature-style critical wake boundary leaves subcritical and critical schedules debt-free, while supercritical schedules accumulate carr', mechanization: 'TLA+ `SleepDebtWeightedThreshold.tla` invariants (`InvNotCrossedKeepsZero`, `InvCrossedMatchesCycleSurplus`, `InvCrossedPositivePastFirstCycle`) + pro', section: 'Sleep Debt' }
};
