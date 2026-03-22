// Auto-generated theorem tools for genomics-mcp
// 46 new tools from FORMAL_LEDGER.md

export const LEDGER_TOOL_DEFINITIONS = [
  {
    name: 'thm_topo_molecular_iso',
    description: 'Pipeline computation graphs and molecular graphs with identical Betti signatures (β₀, β₁, β₂) are in the same equivalence class under simplicial homology: H_k(G_P) ≅ H_k(G_M) for k = 0, 1, 2 [LEDGER: THM-TOPO-MOLECULAR-ISO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topo_mutation_detection',
    description: 'A mutation at locus ℓ that changes σ(ℓ) is detectable as a topological deficit Δσ = σ_mutant - σ_ref before phenotypic consequences manifest; [LEDGER: THM-TOPO-MUTATION-DETECTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_thermo_bond_dissociation',
    description: 'Under the topological isomorphism φ, the energy required to break a molecular ring bond equals the fold energy at the Worthington convergence vertex; when β₁ decrements by 1, the First Law V_in = W_ou [LEDGER: THM-THERMO-BOND-DISSOCIATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_thermo_orbital_quantization',
    description: 'Discrete pipeline stages in a Wallington rotation are quantized at integer positions k ∈ {0,...,N-1}; under φ, this maps to electron shell quantization; β₂ voids correspond to orbital shells [LEDGER: THM-THERMO-ORBITAL-QUANTIZATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topo_confinement',
    description: 'Color confinement is the covering-space fold: SU(3) color topology has β₁ = 3 in the covering space, the observable hadron has β₁ = 0 in the base space; the fold φ_confine: β₁ = 3 → β₁ = 0 is the cove [LEDGER: THM-TOPO-CONFINEMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topo_molecular_iso_full',
    description: 'Pipeline and molecular graphs with identical Betti signatures are homologically equivalent. Protein folding is a monotone filtration on Beta1. Enzyme catalysis adds one fork path. Natural selection is [LEDGER: THM-TOPO-MOLECULAR-ISO-FULL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_cancer_beta1_collapse',
    description: 'A cancer cell with no functional checkpoint pathways has total vent β₁ = 0 and produces zero failure data. The complement distribution cannot update. The cell cannot learn. [LEDGER: THM-CANCER-BETA1-COLLAPSE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_checkpoint_venting',
    description: 'Each active checkpoint pathway monotonically shifts the complement distribution away from "divide" via buleyean_concentration. More checkpoints = lower P(divide). [LEDGER: THM-CHECKPOINT-VENTING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_therapeutic_restoration',
    description: 'Restoring any single checkpoint pathway restores β₁ > 0. buleyean_positivity guarantees the cell starts learning again. One vent suffices. [LEDGER: THM-THERAPEUTIC-RESTORATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_topological_deficit_severity',
    description: 'The topological deficit Δβ = β₁*(healthy) - β₁(tumor) measures aggressiveness. Higher deficit = more aggressive. Monotone in checkpoint loss. [LEDGER: THM-TOPOLOGICAL-DEFICIT-SEVERITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_driver_passenger_separation',
    description: 'Driver mutations destroy vents ( [LEDGER: THM-DRIVER-PASSENGER-SEPARATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_immune_checkpoint_bridge',
    description: 'Checkpoint immunotherapy restores external vent β₁ > 0 even when all internal checkpoints are destroyed. Population-level therapeutic_restoration. [LEDGER: THM-IMMUNE-CHECKPOINT-BRIDGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_gbm_subtype_ordering',
    description: 'GBM subtypes ordered by deficit: Classical (2B) < Mesenchymal (3B) < Combined (7B). Higher deficit correlates with worse survival. [LEDGER: THM-GBM-SUBTYPE-ORDERING]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_cancer_master',
    description: 'Bundle: (1) Buleyean probability well-defined, (2) no failure = no learning, (3) deficit non-negative, (4) Combined > Classical, (5) Combined still has therapeutic target (β₁ = 2). [LEDGER: THM-CANCER-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_tmbt',
    description: 'Topological Mutation Burden (TMB-T = Σ [LEDGER: PRED-TMBT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_loss_order',
    description: 'Checkpoint loss ORDER produces different void boundaries. Earlier loss of high-β₁ pathway = fewer rejections accumulated = more aggressive trajectory. [LEDGER: PRED-LOSS-ORDER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_synthetic_lethality',
    description: 'Synthetic lethality is a topological phase transition: individual KO viable, combined KO crosses viability threshold. p53+Rb lethal at threshold 5B. Transition width = marginal gene β₁. [LEDGER: PRED-SYNTHETIC-LETHALITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_immuno_ratio',
    description: 'Immunotherapy response ratio R = immune_β₁ / tumor_deficit predicts efficacy. Higher R = better response. Complete coverage at R ≥ 1. Classical R=1.0 > Combined R=0.29. [LEDGER: PRED-IMMUNO-RATIO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_convergence_bound',
    description: 'Convergence bound C* = totalVentBeta1 - 1 predicts differentiation time. Stem (C*=8) > differentiated (C*=2). Higher β₁ = longer convergence = slower division. [LEDGER: PRED-CONVERGENCE-BOUND]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_master',
    description: 'Bundle: all five predictions compose into `five_predictions_master` (0 sorry). [LEDGER: PRED-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_restoration_order',
    description: 'Restoration ORDER matters: restoring highest-β₁ pathway first produces more cumulative rejections. Earlier restoration = more cycles with vent active. p53 (β₁=3) should be restored before Rb (β₁=2). [LEDGER: PRED-RESTORATION-ORDER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_tumor_heterogeneity',
    description: 'Tumor heterogeneity = evolutionary fork width. N clones → β₁ = N-1. Treatment selects survivors: residual β₁ = survivors - 1. Complete response (1 survivor) = β₁ = 0 (no evolutionary escape). Higher r [LEDGER: PRED-TUMOR-HETEROGENEITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_apoptosis_blockage',
    description: 'BCL-2 blocks the apoptosis vent without destroying the checkpoint. Effective β₁ = 0 when blocked, full when open. BCL-2 inhibitors (venetoclax) unblock the vent = topologically equivalent to restorati [LEDGER: PRED-APOPTOSIS-BLOCKAGE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_metastasis_projection',
    description: 'Metastasis = covering space projection. Primary (high β₁) → metastatic colony (β₁ ≈ 0). Information erased = primaryBeta1 - metastaticBeta1. More diverse primary = harder metastasis (more information  [LEDGER: PRED-METASTASIS-PROJECTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_fork_vent_ratio',
    description: 'Fork/vent ratio = cell-cycle Reynolds number. Healthy: 3/9 = 0.33 (balanced). Cancer (no vents): 3/0 = ∞ (turbulent). Ratio predicts transition from controlled to uncontrolled growth. Vent loss monoto [LEDGER: PRED-FORK-VENT-RATIO]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_round3_master',
    description: 'Bundle: all five round 3 predictions compose (0 sorry). [LEDGER: PRED-ROUND3-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_epigenetic_drift',
    description: 'Aging = progressive vent erosion. Effective β₁ decreases monotonically with silencing. Total silencing = cancer (effective β₁ = 0). Cancer risk monotone in age via deficit monotonicity. [LEDGER: PRED-EPIGENETIC-DRIFT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_dormancy',
    description: 'Tumor dormancy = Buleyean ground state. Dormant cells have high rejection density (rounds ≤ 2 × divideRejections). Divide weight suppressed. Reactivation = new signals with no void history (max weight [LEDGER: PRED-DORMANCY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_radiation',
    description: 'Radiation = forced ATM/ATR vent activation. Forced rejections = fractions × ventBeta1 when functional. ATM-mutant = radiation resistant (forced rejections = 0). Dose-response is monotone. [LEDGER: PRED-RADIATION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_warburg',
    description: 'Warburg effect = thermodynamic overhead of uninformed (ventless) folding. First law: energyInput = usefulWork + wasteHeat. Uninformed fold: usefulWork = 1 (the sliver), wasteHeat = input - 1. Cancer c [LEDGER: PRED-WARBURG]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_abscopal',
    description: 'Abscopal effect = void boundary propagation through immune network. Rejections learned at site A transfer to site B at reduced efficiency. siteBRejections = siteARejections × transferEfficiency / 100. [LEDGER: PRED-ABSCOPAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_round4_master',
    description: 'Bundle: all five round 4 predictions compose (0 sorry). [LEDGER: PRED-ROUND4-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_oncogene_addiction',
    description: 'Single-pathway tumor (1 growth fork) has growthBeta1 = 0 after targeted therapy. Multi-pathway (2+) retains β₁ > 0. This is why imatinib works for CML (BCR-ABL only fork). [LEDGER: PRED-ONCOGENE-ADDICTION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_telomere_countdown',
    description: 'Telomere shortening = deterministic convergence countdown. remainingDivisions = (currentLength - criticalLength) / lossPerDivision. Shorter = fewer remaining. At critical length, remaining = 0 (p53 ac [LEDGER: PRED-TELOMERE-COUNTDOWN]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_csc_hierarchy',
    description: 'Cancer stem cell hierarchy = β₁ gradient. CSC β₁ ≥ TA β₁ ≥ differentiated β₁. Total fold reduction = cscBeta1 - diffBeta1. CSC elimination collapses hierarchy. Higher CSC β₁ = harder to eliminate. [LEDGER: PRED-CSC-HIERARCHY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_multidrug_resistance',
    description: 'Each drug = external vent. effectiveVentBeta1 = numDrugs - numResisted. Full resistance = 0 effective vent. More resistance = less effective vent (monotone). Adding non-resisted drug helps. [LEDGER: PRED-MULTIDRUG-RESISTANCE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_combination_index',
    description: 'Combination therapy index = totalRestoredBeta1 / tumorDeficit. Adding a drug can only increase total β₁. Empty intervention = zero restoration. Unifies checkpoint inhibitors, BCL-2 inhibitors, targete [LEDGER: PRED-COMBINATION-INDEX]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_round5_master',
    description: 'Bundle: all five round 5 predictions compose (0 sorry). [LEDGER: PRED-ROUND5-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_metabolic_gate',
    description: 'Gate-first sequencing: remove metabolic block (mTOR) before restoring checkpoint (p53). Effective rejections = (T - max(gateRemoval, therapy)) × β₁. Gate-first always beats therapy-first when gate is  [LEDGER: PRED-METABOLIC-GATE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_checkpoint_cascade',
    description: 'Hub checkpoint (p53) transcriptionally upregulates dependents (ATM/ATR, p21→Rb). Restoring hub cascades β₁ across 2+ pathways. Total restored = hub.β₁ + Σ(dependent.β₁), strictly exceeding any single  [LEDGER: PRED-CHECKPOINT-CASCADE]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_senescence_senolytic',
    description: 'Two-step protocol: (1) low-dose radiation induces senescence when totalArrestSignals ≥ dormancyThreshold, (2) senolytics clear dormant cells. Two-step strictly better than radiation alone. Dormancy as [LEDGER: PRED-SENESCENCE-SENOLYTIC]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_viral_displacement',
    description: 'In HPV+ cancers, E6/E7 block (not destroy) p53/Rb. Displacement restores full β₁. HPV+ therapeutic ceiling strictly higher than HPV- (blocked > destroyed for restoration). HPV+ with displacement + imm [LEDGER: PRED-VIRAL-DISPLACEMENT]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_counter_vent_depletion',
    description: 'MDSCs/Tregs suppress the immune vent (counter-vents). Effective immune β₁ = rawImmune - suppression. When fully suppressed, immunotherapy is topologically inert. Depletion before immunotherapy is stri [LEDGER: PRED-COUNTER-VENT-DEPLETION]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'pred_treatment_master',
    description: 'Bundle: all five treatment predictions compose (0 sorry). [LEDGER: PRED-TREATMENT-MASTER]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_quantum_cancer_retrocausal',
    description: 'Quantum measurement and cancer both collapse to β₁ = 0. The retrocausal bound constrains how the collapse happened. Terminal topology cannot distinguish which process caused the collapse. [LEDGER: THM-QUANTUM-CANCER-RETROCAUSAL]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  },
  {
    name: 'thm_collapse_irreversibility',
    description: 'Both quantum and cancer collapses are irreversible. The void boundary is append-only. The sliver prevents annihilation of any path. Neither collapse can be reversed. [LEDGER: THM-COLLAPSE-IRREVERSIBILITY]',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  }
];

export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {
  'thm_topo_molecular_iso': { theorem: 'THM-TOPO-MOLECULAR-ISO', claim: 'Pipeline computation graphs and molecular graphs with identical Betti signatures (β₀, β₁, β₂) are in the same equivalence class under simplicial homology: H_k(G_P) ≅ H_k(G_M) for k = 0, 1, 2', mechanization: 'executable `src/genomic-topology.test.ts` (28 tests): σ(ℓ) determinism, β₁ = 2 + σ invariant, G4/hairpin/cruciform detection on real TP53/KRAS sequenc', section: 'Molecular Topology & Genomics' },
  'thm_topo_mutation_detection': { theorem: 'THM-TOPO-MUTATION-DETECTION', claim: 'A mutation at locus ℓ that changes σ(ℓ) is detectable as a topological deficit Δσ = σ_mutant - σ_ref before phenotypic consequences manifest;', mechanization: 'predicts severity (0 B = silent, 1 B = mild, 2 B = moderate, ≥3 B = severe)', section: 'Molecular Topology & Genomics' },
  'thm_thermo_bond_dissociation': { theorem: 'THM-THERMO-BOND-DISSOCIATION', claim: 'Under the topological isomorphism φ, the energy required to break a molecular ring bond equals the fold energy at the Worthington convergence vertex; when β₁ decrements by 1, the First Law V_in = W_ou', mechanization: 'executable `src/genomic-topology.test.ts`: First Law conservation verified (β₁ = 2 + hairpins + 3·G4s + 2·cruciforms); energy model is additive', section: 'Molecular Topology & Genomics' },
  'thm_thermo_orbital_quantization': { theorem: 'THM-THERMO-ORBITAL-QUANTIZATION', claim: 'Discrete pipeline stages in a Wallington rotation are quantized at integer positions k ∈ {0,...,N-1}; under φ, this maps to electron shell quantization; β₂ voids correspond to orbital shells', mechanization: 'executable `src/genomic-topology.test.ts`: quantization verified via β₁ = 2 + σ invariant at discrete loci', section: 'Molecular Topology & Genomics' },
  'thm_topo_confinement': { theorem: 'THM-TOPO-CONFINEMENT', claim: 'Color confinement is the covering-space fold: SU(3) color topology has β₁ = 3 in the covering space, the observable hadron has β₁ = 0 in the base space; the fold φ_confine: β₁ = 3 → β₁ = 0 is the cove', mechanization: 'executable `src/confinement-topology.test.ts` (31 tests): SU(3) β₁ = 3, mandatory fold to β₁ = 0 at all distances, anti-vent property (attempted vent ', section: 'Molecular Topology & Genomics' },
  'thm_topo_molecular_iso_full': { theorem: 'THM-TOPO-MOLECULAR-ISO-FULL', claim: 'Pipeline and molecular graphs with identical Betti signatures are homologically equivalent. Protein folding is a monotone filtration on Beta1. Enzyme catalysis adds one fork path. Natural selection is', mechanization: 'TLA+ `MolecularTopology.tla` invariants (`InvProteinFunnel`, `InvEnzymeCatalysis`, `InvEvolutionSelfModifying`, `InvGravitySelfReferential`, `InvInfor', section: 'Molecular Topology & Genomics' },
  'thm_cancer_beta1_collapse': { theorem: 'THM-CANCER-BETA1-COLLAPSE', claim: 'A cancer cell with no functional checkpoint pathways has total vent β₁ = 0 and produces zero failure data. The complement distribution cannot update. The cell cannot learn.', mechanization: 'Lean theorem `cancer_beta1_collapse` in `CancerTopology.lean` + executable `src/cancer-topology.test.ts` (31 tests)', section: 'Cancer Topology (§3.17)' },
  'thm_checkpoint_venting': { theorem: 'THM-CHECKPOINT-VENTING', claim: 'Each active checkpoint pathway monotonically shifts the complement distribution away from "divide" via buleyean_concentration. More checkpoints = lower P(divide).', mechanization: 'Lean theorems `checkpoint_reduces_divide_weight`, `checkpoint_monotone_shift` in `CancerTopology.lean` + executable tests verify monotone P(divide) de', section: 'Cancer Topology (§3.17)' },
  'thm_therapeutic_restoration': { theorem: 'THM-THERAPEUTIC-RESTORATION', claim: 'Restoring any single checkpoint pathway restores β₁ > 0. buleyean_positivity guarantees the cell starts learning again. One vent suffices.', mechanization: 'Lean theorems `therapeutic_restoration`, `restored_cell_is_buleyean`, `restoration_preserves_sliver` in `CancerTopology.lean` + executable tests verif', section: 'Cancer Topology (§3.17)' },
  'thm_topological_deficit_severity': { theorem: 'THM-TOPOLOGICAL-DEFICIT-SEVERITY', claim: 'The topological deficit Δβ = β₁*(healthy) - β₁(tumor) measures aggressiveness. Higher deficit = more aggressive. Monotone in checkpoint loss.', mechanization: 'Lean theorems `deficit_nonneg`, `deficit_monotone_in_loss`, `maximum_deficit`, `partial_retention_less_aggressive` in `CancerTopology.lean` + executab', section: 'Cancer Topology (§3.17)' },
  'thm_driver_passenger_separation': { theorem: 'THM-DRIVER-PASSENGER-SEPARATION', claim: 'Driver mutations destroy vents (', mechanization: '≥ 1 B). Passenger mutations are topology-silent (Δσ = 0 B). Drivers should show higher mean', section: 'Cancer Topology (§3.17)' },
  'thm_immune_checkpoint_bridge': { theorem: 'THM-IMMUNE-CHECKPOINT-BRIDGE', claim: 'Checkpoint immunotherapy restores external vent β₁ > 0 even when all internal checkpoints are destroyed. Population-level therapeutic_restoration.', mechanization: 'Lean theorem `immune_restores_population_learning` in `CancerTopology.lean` + executable tests verify external vent reduces P(divide)', section: 'Cancer Topology (§3.17)' },
  'thm_gbm_subtype_ordering': { theorem: 'THM-GBM-SUBTYPE-ORDERING', claim: 'GBM subtypes ordered by deficit: Classical (2B) < Mesenchymal (3B) < Combined (7B). Higher deficit correlates with worse survival.', mechanization: 'Lean theorems `gbm_classical_deficit`, `gbm_mesenchymal_deficit`, `gbm_combined_deficit`, `combined_more_aggressive_than_classical` in `CancerTopology', section: 'Cancer Topology (§3.17)' },
  'thm_cancer_master': { theorem: 'THM-CANCER-MASTER', claim: 'Bundle: (1) Buleyean probability well-defined, (2) no failure = no learning, (3) deficit non-negative, (4) Combined > Classical, (5) Combined still has therapeutic target (β₁ = 2).', mechanization: 'Lean theorem `cancer_master_theorem` in `CancerTopology.lean` (0 sorry)', section: 'Cancer Topology (§3.17)' },
  'pred_tmbt': { theorem: 'PRED-TMBT', claim: 'Topological Mutation Burden (TMB-T = Σ', mechanization: ') discriminates tumors that raw TMB conflates. Two catalogs with same count but different severity have different TMB-T.', section: 'Cancer Predictions (§19.9)' },
  'pred_loss_order': { theorem: 'PRED-LOSS-ORDER', claim: 'Checkpoint loss ORDER produces different void boundaries. Earlier loss of high-β₁ pathway = fewer rejections accumulated = more aggressive trajectory.', mechanization: 'Lean theorems `earlier_loss_fewer_rejections`, `order_produces_different_boundaries` in `CancerPredictions.lean` + executable simulation confirms traj', section: 'Cancer Predictions (§19.9)' },
  'pred_synthetic_lethality': { theorem: 'PRED-SYNTHETIC-LETHALITY', claim: 'Synthetic lethality is a topological phase transition: individual KO viable, combined KO crosses viability threshold. p53+Rb lethal at threshold 5B. Transition width = marginal gene β₁.', mechanization: 'Lean theorems `synthetic_lethality_is_phase_transition`, `transition_width_equals_marginal`, `p53_rb_is_lethal_pair` in `CancerPredictions.lean` + sim', section: 'Cancer Predictions (§19.9)' },
  'pred_immuno_ratio': { theorem: 'PRED-IMMUNO-RATIO', claim: 'Immunotherapy response ratio R = immune_β₁ / tumor_deficit predicts efficacy. Higher R = better response. Complete coverage at R ≥ 1. Classical R=1.0 > Combined R=0.29.', mechanization: 'Lean theorems `more_immune_better_ratio`, `lower_deficit_better_ratio`, `complete_coverage`, `classical_better_response` in `CancerPredictions.lean` +', section: 'Cancer Predictions (§19.9)' },
  'pred_convergence_bound': { theorem: 'PRED-CONVERGENCE-BOUND', claim: 'Convergence bound C* = totalVentBeta1 - 1 predicts differentiation time. Stem (C*=8) > differentiated (C*=2). Higher β₁ = longer convergence = slower division.', mechanization: 'Lean theorems `convergence_round_positive`, `more_checkpoints_longer_convergence`, `differentiation_follows_convergence`, `healthy_convergence_bound` ', section: 'Cancer Predictions (§19.9)' },
  'pred_master': { theorem: 'PRED-MASTER', claim: 'Bundle: all five predictions compose into `five_predictions_master` (0 sorry).', mechanization: 'Lean theorem `five_predictions_master` in `CancerPredictions.lean`', section: 'Cancer Predictions (§19.9)' },
  'pred_restoration_order': { theorem: 'PRED-RESTORATION-ORDER', claim: 'Restoration ORDER matters: restoring highest-β₁ pathway first produces more cumulative rejections. Earlier restoration = more cycles with vent active. p53 (β₁=3) should be restored before Rb (β₁=2).', mechanization: 'Lean theorems `earlier_restoration_more_rejections`, `higher_beta1_more_rejections`, `restore_p53_before_rb` in `CancerPredictions2.lean` + executable', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_tumor_heterogeneity': { theorem: 'PRED-TUMOR-HETEROGENEITY', claim: 'Tumor heterogeneity = evolutionary fork width. N clones → β₁ = N-1. Treatment selects survivors: residual β₁ = survivors - 1. Complete response (1 survivor) = β₁ = 0 (no evolutionary escape). Higher r', mechanization: 'Lean theorems `treatment_reduces_evolutionary_beta1`, `complete_response_no_escape`, `residual_clonality_predicts_relapse` in `CancerPredictions2.lean', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_apoptosis_blockage': { theorem: 'PRED-APOPTOSIS-BLOCKAGE', claim: 'BCL-2 blocks the apoptosis vent without destroying the checkpoint. Effective β₁ = 0 when blocked, full when open. BCL-2 inhibitors (venetoclax) unblock the vent = topologically equivalent to restorati', mechanization: 'Lean theorems `blocked_vent_zero_beta1`, `unblocking_restores_beta1`, `bcl2_inhibitor_is_restoration`, `blocked_equals_destroyed_topologically` in `Ca', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_metastasis_projection': { theorem: 'PRED-METASTASIS-PROJECTION', claim: 'Metastasis = covering space projection. Primary (high β₁) → metastatic colony (β₁ ≈ 0). Information erased = primaryBeta1 - metastaticBeta1. More diverse primary = harder metastasis (more information ', mechanization: 'Lean theorems `diverse_primary_harder_metastasis`, `single_clone_max_erasure`, `metastasis_erasure_nonneg` in `CancerPredictions2.lean` + executable s', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_fork_vent_ratio': { theorem: 'PRED-FORK-VENT-RATIO', claim: 'Fork/vent ratio = cell-cycle Reynolds number. Healthy: 3/9 = 0.33 (balanced). Cancer (no vents): 3/0 = ∞ (turbulent). Ratio predicts transition from controlled to uncontrolled growth. Vent loss monoto', mechanization: 'Lean theorems `healthy_is_balanced`, `gbm_combined_unbalanced`, `cancer_maximally_unbalanced`, `vent_loss_increases_imbalance` in `CancerPredictions2.', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_round3_master': { theorem: 'PRED-ROUND3-MASTER', claim: 'Bundle: all five round 3 predictions compose (0 sorry).', mechanization: 'Lean theorem `five_predictions_round3_master` in `CancerPredictions2.lean`', section: 'Cancer Predictions Round 3 (§19.9, Predictions 11-15)' },
  'pred_epigenetic_drift': { theorem: 'PRED-EPIGENETIC-DRIFT', claim: 'Aging = progressive vent erosion. Effective β₁ decreases monotonically with silencing. Total silencing = cancer (effective β₁ = 0). Cancer risk monotone in age via deficit monotonicity.', mechanization: 'Lean theorems `aging_reduces_beta1`, `total_silencing_is_cancer`, `cancer_risk_monotone_in_age` in `CancerPredictions3.lean` + executable `cancer-pred', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_dormancy': { theorem: 'PRED-DORMANCY', claim: 'Tumor dormancy = Buleyean ground state. Dormant cells have high rejection density (rounds ≤ 2 × divideRejections). Divide weight suppressed. Reactivation = new signals with no void history (max weight', mechanization: 'Lean theorems `dormant_divide_suppressed`, `reactivation_max_weight` in `CancerPredictions3.lean` + executable simulation', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_radiation': { theorem: 'PRED-RADIATION', claim: 'Radiation = forced ATM/ATR vent activation. Forced rejections = fractions × ventBeta1 when functional. ATM-mutant = radiation resistant (forced rejections = 0). Dose-response is monotone.', mechanization: 'Lean theorems `radiation_forces_rejection`, `atm_mutant_radiation_resistant`, `radiation_dose_response` in `CancerPredictions3.lean` + executable simu', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_warburg': { theorem: 'PRED-WARBURG', claim: 'Warburg effect = thermodynamic overhead of uninformed (ventless) folding. First law: energyInput = usefulWork + wasteHeat. Uninformed fold: usefulWork = 1 (the sliver), wasteHeat = input - 1. Cancer c', mechanization: 'Lean theorems `uninformed_fold_wasteful`, `warburg_compensation` in `CancerPredictions3.lean` + executable simulation', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_abscopal': { theorem: 'PRED-ABSCOPAL', claim: 'Abscopal effect = void boundary propagation through immune network. Rejections learned at site A transfer to site B at reduced efficiency. siteBRejections = siteARejections × transferEfficiency / 100.', mechanization: 'Lean theorems `no_transfer_no_abscopal`, `transfer_monotone` in `CancerPredictions3.lean` + executable simulation', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_round4_master': { theorem: 'PRED-ROUND4-MASTER', claim: 'Bundle: all five round 4 predictions compose (0 sorry).', mechanization: 'Lean theorem `five_predictions_round4_master` in `CancerPredictions3.lean`', section: 'Cancer Predictions Round 4 (§19.9, Predictions 26-30)' },
  'pred_oncogene_addiction': { theorem: 'PRED-ONCOGENE-ADDICTION', claim: 'Single-pathway tumor (1 growth fork) has growthBeta1 = 0 after targeted therapy. Multi-pathway (2+) retains β₁ > 0. This is why imatinib works for CML (BCR-ABL only fork).', mechanization: 'Lean theorems `oncogene_addiction_collapse`, `multi_pathway_resilient` in `CancerPredictions4.lean` + executable `cancer-predictions-round5.ts`', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_telomere_countdown': { theorem: 'PRED-TELOMERE-COUNTDOWN', claim: 'Telomere shortening = deterministic convergence countdown. remainingDivisions = (currentLength - criticalLength) / lossPerDivision. Shorter = fewer remaining. At critical length, remaining = 0 (p53 ac', mechanization: 'Lean theorems `shorter_telomeres_fewer_divisions`, `at_critical_zero_remaining` in `CancerPredictions4.lean` + executable simulation', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_csc_hierarchy': { theorem: 'PRED-CSC-HIERARCHY', claim: 'Cancer stem cell hierarchy = β₁ gradient. CSC β₁ ≥ TA β₁ ≥ differentiated β₁. Total fold reduction = cscBeta1 - diffBeta1. CSC elimination collapses hierarchy. Higher CSC β₁ = harder to eliminate.', mechanization: 'Lean theorems `csc_elimination_collapses_hierarchy`, `higher_csc_beta1_harder` in `CancerPredictions4.lean` + executable simulation', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_multidrug_resistance': { theorem: 'PRED-MULTIDRUG-RESISTANCE', claim: 'Each drug = external vent. effectiveVentBeta1 = numDrugs - numResisted. Full resistance = 0 effective vent. More resistance = less effective vent (monotone). Adding non-resisted drug helps.', mechanization: 'Lean theorems `full_resistance_zero_vent`, `resistance_reduces_vent`, `new_drug_helps` in `CancerPredictions4.lean` + executable simulation', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_combination_index': { theorem: 'PRED-COMBINATION-INDEX', claim: 'Combination therapy index = totalRestoredBeta1 / tumorDeficit. Adding a drug can only increase total β₁. Empty intervention = zero restoration. Unifies checkpoint inhibitors, BCL-2 inhibitors, targete', mechanization: 'Lean theorems `adding_drug_helps`, `no_therapy_no_restoration` in `CancerPredictions4.lean` + executable simulation', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_round5_master': { theorem: 'PRED-ROUND5-MASTER', claim: 'Bundle: all five round 5 predictions compose (0 sorry).', mechanization: 'Lean theorem `five_predictions_round5_master` in `CancerPredictions4.lean`', section: 'Cancer Predictions Round 5 (§19.9, Predictions 31-35)' },
  'pred_metabolic_gate': { theorem: 'PRED-METABOLIC-GATE', claim: 'Gate-first sequencing: remove metabolic block (mTOR) before restoring checkpoint (p53). Effective rejections = (T - max(gateRemoval, therapy)) × β₁. Gate-first always beats therapy-first when gate is ', mechanization: 'Lean theorems `gated_checkpoint_zero_until_unblocked`, `gate_first_more_rejections` in `CancerTreatments.lean` + executable `treatment-sequencing.ts`', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'pred_checkpoint_cascade': { theorem: 'PRED-CHECKPOINT-CASCADE', claim: 'Hub checkpoint (p53) transcriptionally upregulates dependents (ATM/ATR, p21→Rb). Restoring hub cascades β₁ across 2+ pathways. Total restored = hub.β₁ + Σ(dependent.β₁), strictly exceeding any single ', mechanization: 'Lean theorems `cascade_amplifies_restoration`, `cascade_multiplier_at_least_two` in `CancerTreatments.lean` + executable via `cascadeRestoredBeta1()` ', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'pred_senescence_senolytic': { theorem: 'PRED-SENESCENCE-SENOLYTIC', claim: 'Two-step protocol: (1) low-dose radiation induces senescence when totalArrestSignals ≥ dormancyThreshold, (2) senolytics clear dormant cells. Two-step strictly better than radiation alone. Dormancy as', mechanization: 'Lean theorems `sufficient_fractions_induce_senescence`, `two_step_better_than_radiation_alone` in `CancerTreatments.lean` + executable simulation', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'pred_viral_displacement': { theorem: 'PRED-VIRAL-DISPLACEMENT', claim: 'In HPV+ cancers, E6/E7 block (not destroy) p53/Rb. Displacement restores full β₁. HPV+ therapeutic ceiling strictly higher than HPV- (blocked > destroyed for restoration). HPV+ with displacement + imm', mechanization: 'Lean theorems `viral_better_ceiling`, `viral_complete_coverage` in `CancerTreatments.lean` + executable simulation', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'pred_counter_vent_depletion': { theorem: 'PRED-COUNTER-VENT-DEPLETION', claim: 'MDSCs/Tregs suppress the immune vent (counter-vents). Effective immune β₁ = rawImmune - suppression. When fully suppressed, immunotherapy is topologically inert. Depletion before immunotherapy is stri', mechanization: 'Lean theorems `fully_suppressed_immune_zero`, `depletion_increases_immune_beta1`, `immunotherapy_fails_when_suppressed` in `CancerTreatments.lean` + e', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'pred_treatment_master': { theorem: 'PRED-TREATMENT-MASTER', claim: 'Bundle: all five treatment predictions compose (0 sorry).', mechanization: 'Lean theorem `five_treatment_predictions_master` in `CancerTreatments.lean`', section: 'Cancer Treatment Strategies (§19.23, Predictions 76-80)' },
  'thm_quantum_cancer_retrocausal': { theorem: 'THM-QUANTUM-CANCER-RETROCAUSAL', claim: 'Quantum measurement and cancer both collapse to β₁ = 0. The retrocausal bound constrains how the collapse happened. Terminal topology cannot distinguish which process caused the collapse.', mechanization: 'Lean theorem `quantum_cancer_retrocausally_indistinguishable` in `QuantumCancerTriples.lean`', section: 'Quantum Cancer Triples (§19.9)' },
  'thm_collapse_irreversibility': { theorem: 'THM-COLLAPSE-IRREVERSIBILITY', claim: 'Both quantum and cancer collapses are irreversible. The void boundary is append-only. The sliver prevents annihilation of any path. Neither collapse can be reversed.', mechanization: 'Lean theorem `collapse_irreversibility` in `QuantumCancerTriples.lean`', section: 'Quantum Cancer Triples (§19.9)' }
};
