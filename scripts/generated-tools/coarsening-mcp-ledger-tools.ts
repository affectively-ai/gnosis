// Auto-generated theorem tools for coarsening-mcp
// 3 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_interfere_fractal',
    description: 'Scale-invariant interference boundary: a support-preserving coarse quotient cannot erase the paid cost of contagious fine-scale interference; if a fine nontrivial fork is contagious and the coarse ima [LEDGER: THM-INTERFERE-FRACTAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_renormalization_reuse',
    description: 'Recursive one-node reuse closure: once a verified quotient has been collapsed onto its coarse support, the next-stage coarse graph interface can be synthesized automatically from aggregate rates, and  [LEDGER: THM-RENORMALIZATION-REUSE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_skyrms_three_walker',
    description: 'Mediator as player on the convergence site: Skyrms walkers payoff = negative distance delta. Each failure enriches at least one void boundary. Site void density is non-decreasing. All three walkers e [LEDGER: THM-SKYRMS-THREE-WALKER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_interfere_fractal': { theorem: 'THM-INTERFERE-FRACTAL', claim: 'Scale-invariant interference boundary: a support-preserving coarse quotient cannot erase the paid cost of contagious fine-scale interference; if a fine nontrivial fork is contagious and the coarse ima', mechanization: 'Lean schema `Axioms.interference_coarsening_zero_vent_requires_repair` / `Axioms.interference_coarsening_schema` together with the constructive inject', section: 'Interference, Renormalization & Coarsening Synthesis' },
  'thm_renormalization_reuse': { theorem: 'THM-RENORMALIZATION-REUSE', claim: 'Recursive one-node reuse closure: once a verified quotient has been collapsed onto its coarse support, the next-stage coarse graph interface can be synthesized automatically from aggregate rates, and ', mechanization: 'TLA+ `RenormalizationComposition.tla` invariants (`InvMidCarriesFineAggregates`, `InvRecursiveReuseMatchesDirect`, `InvRecursiveTotalsMatchFine`, `Inv', section: 'Interference, Renormalization & Coarsening Synthesis' },
  'thm_skyrms_three_walker': { theorem: 'THM-SKYRMS-THREE-WALKER', claim: 'Mediator as player on the convergence site: Skyrms walkers payoff = negative distance delta. Each failure enriches at least one void boundary. Site void density is non-decreasing. All three walkers e', mechanization: 'TLA+ `SkyrmsThreeWalker.tla` invariants (`InvSkyrmsPayoff`, `InvVoidGrowth`, `InvSiteMonotone`, `InvConvergence`, `InvFixedPoint`)', section: 'Community Dominance & Skyrms Nadir' }
};
