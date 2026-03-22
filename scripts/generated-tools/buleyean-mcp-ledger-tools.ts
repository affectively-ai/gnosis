// Auto-generated theorem tools for buleyean-mcp
// 5 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_three_are_one',
    description: 'Buleyean RL rejection (v_i++), Buleyean Logic rejection (bules--), and Buleyean Probability update (recordRejection) are the same operation because bules = T - v_i (complement) [LEDGER: THM-THREE-ARE-ONE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_void_is_proof_trace',
    description: 'The void boundary (RL rejection history per token) is structurally identical to the proof trace (Logic rejection reason sequence). Same data, same sufficient statistic [LEDGER: THM-VOID-IS-PROOF-TRACE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_complement_is_target',
    description: 'The Buleyean complement distribution (Probability) is identically the KL training target (RL) and the ground state indicator (Logic). All three select by NOT-rejected [LEDGER: THM-COMPLEMENT-IS-TARGET]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_five_map_to_five',
    description: 'Try=Fork=eta, Choose=Race=temperature, Commit=Fold=commitGain, LetGo=Vent=decayRate, Learn=Reject=feedbackGain. The five personality words, five proof primitives, and five RL hyperparameters are the s [LEDGER: THM-FIVE-MAP-TO-FIVE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_grand_unification_qed',
    description: 'The grand unification proof topology has 54 nodes, 23 edges, 15 Bules, 15 rejections, zero diagnostics. All terminals at bules = 0. QED [LEDGER: THM-GRAND-UNIFICATION-QED]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_three_are_one': { theorem: 'THM-THREE-ARE-ONE', claim: 'Buleyean RL rejection (v_i++), Buleyean Logic rejection (bules--), and Buleyean Probability update (recordRejection) are the same operation because bules = T - v_i (complement)', mechanization: '`buleyean-grand-unification.gg` Part 1 (5 REJECT steps) + grand unification test', section: 'Buleyean Grand Unification: RL + Logic + Probability = Rejection (ch17 sections 15.10.7, 20.2.8)' },
  'thm_void_is_proof_trace': { theorem: 'THM-VOID-IS-PROOF-TRACE', claim: 'The void boundary (RL rejection history per token) is structurally identical to the proof trace (Logic rejection reason sequence). Same data, same sufficient statistic', mechanization: '`buleyean-grand-unification.gg` void_is_proof + VoidWalking.lean', section: 'Buleyean Grand Unification: RL + Logic + Probability = Rejection (ch17 sections 15.10.7, 20.2.8)' },
  'thm_complement_is_target': { theorem: 'THM-COMPLEMENT-IS-TARGET', claim: 'The Buleyean complement distribution (Probability) is identically the KL training target (RL) and the ground state indicator (Logic). All three select by NOT-rejected', mechanization: '`buleyean-grand-unification.gg` complement_is_target', section: 'Buleyean Grand Unification: RL + Logic + Probability = Rejection (ch17 sections 15.10.7, 20.2.8)' },
  'thm_five_map_to_five': { theorem: 'THM-FIVE-MAP-TO-FIVE', claim: 'Try=Fork=eta, Choose=Race=temperature, Commit=Fold=commitGain, LetGo=Vent=decayRate, Learn=Reject=feedbackGain. The five personality words, five proof primitives, and five RL hyperparameters are the s', mechanization: '`buleyean-grand-unification.gg` Part 2 (5 REJECT steps) + personality.ts:deriveTrainingParams', section: 'Buleyean Grand Unification: RL + Logic + Probability = Rejection (ch17 sections 15.10.7, 20.2.8)' },
  'thm_grand_unification_qed': { theorem: 'THM-GRAND-UNIFICATION-QED', claim: 'The grand unification proof topology has 54 nodes, 23 edges, 15 Bules, 15 rejections, zero diagnostics. All terminals at bules = 0. QED', mechanization: '`buleyean-proof.test.ts` grand unification test (1 test, 7 assertions)', section: 'Buleyean Grand Unification: RL + Logic + Probability = Rejection (ch17 sections 15.10.7, 20.2.8)' }
};
