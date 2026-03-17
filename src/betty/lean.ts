import type { GraphAST } from './compiler.js';
import type { StabilityKernelEdge, StabilityReport, StabilityStateAssessment } from './stability.js';
import type { OptimizationCertificate } from './optimizer.js';
import type { CoarseningSynthesisResult } from './coarsen.js';

function basenameLike(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/').replace(/\/+$/, '');
  const segments = normalized.split('/');
  return segments[segments.length - 1] ?? normalized;
}

function extnameLike(filePath: string): string {
  const baseName = basenameLike(filePath);
  const extensionStart = baseName.lastIndexOf('.');
  return extensionStart > 0 ? baseName.slice(extensionStart) : '';
}

export interface GnosisLeanArtifact {
  moduleName: string;
  theoremName: string;
  lean: string;
}

export interface GnosisLeanOptions {
  moduleName?: string;
  theoremName?: string;
  sourceFilePath?: string;
}

interface IndexedKernelEdge {
  sourceIndex: number;
  targetIndex: number;
  weight: number;
}

type SpectralProofStrategy =
  | {
      kind: 'nilpotent';
    }
  | {
      kind: 'row-bound';
      rowBounds: number[];
    };

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function sanitizeLeanIdentifier(raw: string): string {
  const normalized = raw
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return normalized.length > 0 ? normalized : 'gnosis_generated';
}

function toLeanStringList(values: readonly string[]): string {
  if (values.length === 0) {
    return '[]';
  }

  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}

function toLeanNatList(values: readonly number[]): string {
  if (values.length === 0) {
    return '[]';
  }

  return `[${values.join(', ')}]`;
}

function buildModuleName(options: GnosisLeanOptions): string {
  const rawName =
    options.moduleName ??
    (options.sourceFilePath
      ? (() => {
          const extension = extnameLike(options.sourceFilePath!);
          const baseName = basenameLike(options.sourceFilePath!);
          return extension
            ? baseName.slice(0, Math.max(0, baseName.length - extension.length))
            : baseName;
        })()
      : 'gnosis_generated');
  return sanitizeLeanIdentifier(rawName);
}

function indentBlock(block: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line.length > 0 ? `${indent}${line}` : line))
    .join('\n');
}

function formatLeanReal(value: number | string | null | undefined): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0';
  }

  const rounded = round3(value);
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function buildNodeIndex(ast: GraphAST): {
  nodeIds: string[];
  indexByNodeId: Map<string, number>;
} {
  const nodeIds = [...ast.nodes.keys()];
  return {
    nodeIds,
    indexByNodeId: new Map<string, number>(
      nodeIds.map((nodeId, index) => [nodeId, index])
    ),
  };
}

function aggregateKernelEdges(
  kernelEdges: readonly StabilityKernelEdge[],
  indexByNodeId: Map<string, number>
): IndexedKernelEdge[] {
  const weightsByPair = new Map<string, number>();

  for (const edge of kernelEdges) {
    const sourceIndex = indexByNodeId.get(edge.sourceId);
    const targetIndex = indexByNodeId.get(edge.targetId);
    if (sourceIndex === undefined || targetIndex === undefined) {
      continue;
    }

    const key = `${sourceIndex}:${targetIndex}`;
    weightsByPair.set(key, round3((weightsByPair.get(key) ?? 0) + edge.effectiveWeight));
  }

  return [...weightsByPair.entries()].map(([key, weight]) => {
    const [sourceIndex, targetIndex] = key.split(':').map((value) => Number(value));
    return {
      sourceIndex,
      targetIndex,
      weight,
    };
  });
}

function buildTransitionDefinitions(
  indexedKernelEdges: readonly IndexedKernelEdge[]
): string {
  const clauses = indexedKernelEdges
    .map(
      (edge) =>
        `    | ${edge.sourceIndex}, ${edge.targetIndex} => ${formatLeanReal(edge.weight)}`
    )
    .join('\n');

  return `def transitionRat : Matrix (Fin topologyNodeCount) (Fin topologyNodeCount) Rat :=
  fun source target =>
    match source.1, target.1 with
${clauses.length > 0 ? `${clauses}\n` : ''}    | _, _ => 0

noncomputable def transition : Matrix (Fin topologyNodeCount) (Fin topologyNodeCount) Real :=
  (Rat.castHom Real).mapMatrix transitionRat`;
}

function buildRealMatchDefinition(name: string, values: readonly number[]): string {
  const clauses = values
    .map(
      (value, index) =>
        `    | ${index} => ${formatLeanReal(value)}`
    )
    .join('\n');

  return `def ${name} : Fin topologyNodeCount -> Real :=
  fun source =>
    match source.1 with
${clauses}
    | _ => 0`;
}

function buildRatMatchDefinition(name: string, values: readonly number[]): string {
  const clauses = values
    .map(
      (value, index) =>
        `    | ${index} => ${formatLeanReal(value)}`
    )
    .join('\n');

  return `def ${name} : Fin topologyNodeCount -> Rat :=
  fun source =>
    match source.1 with
${clauses}
    | _ => 0`;
}

function buildNatMatchDefinition(name: string, values: readonly number[]): string {
  const clauses = values
    .map((value, index) => `    | ${index} => ${value}`)
    .join('\n');

  return `def ${name} : Fin topologyNodeCount -> Nat :=
  fun source =>
    match source.1 with
${clauses}
    | _ => 0`;
}

function buildFinMatchDefinition(
  name: string,
  values: readonly number[]
): string {
  const clauses = values
    .map(
      (value, index) =>
        `    | ${index} => ⟨${value}, by native_decide⟩`
    )
    .join('\n');

  return `def ${name} : Fin topologyNodeCount -> Fin topologyNodeCount :=
  fun source =>
    match source.1 with
${clauses}
    | _ => ⟨0, by native_decide⟩`;
}

function buildRowBounds(
  nodeCount: number,
  indexedKernelEdges: readonly IndexedKernelEdge[]
): number[] {
  const rowBounds = Array.from({ length: nodeCount }, () => 0);

  for (const edge of indexedKernelEdges) {
    rowBounds[edge.sourceIndex] = round3(rowBounds[edge.sourceIndex] + edge.weight);
  }

  return rowBounds;
}

function buildAstAdjacency(ast: GraphAST, nodeIds: readonly string[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(nodeIds.map((nodeId) => [nodeId, []]));

  for (const edge of ast.edges) {
    for (const sourceId of edge.sourceIds) {
      const normalizedSourceId = sourceId.trim();
      const sourceTargets = adjacency.get(normalizedSourceId) ?? [];
      for (const targetId of edge.targetIds) {
        sourceTargets.push(targetId.trim());
      }
      adjacency.set(normalizedSourceId, sourceTargets);
    }
  }

  return adjacency;
}

function computeTopologicalRanks(
  ast: GraphAST,
  nodeIds: readonly string[]
): number[] | null {
  const adjacency = buildAstAdjacency(ast, nodeIds);
  const indegreeByNodeId = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));

  for (const [, targets] of adjacency) {
    for (const targetId of targets) {
      indegreeByNodeId.set(targetId, (indegreeByNodeId.get(targetId) ?? 0) + 1);
    }
  }

  const ranksByNodeId = new Map<string, number>(nodeIds.map((nodeId) => [nodeId, 0]));
  const frontier = nodeIds.filter((nodeId) => (indegreeByNodeId.get(nodeId) ?? 0) === 0);
  let processedCount = 0;

  while (frontier.length > 0) {
    const currentNodeId = frontier.shift();
    if (!currentNodeId) {
      continue;
    }

    processedCount += 1;
    const currentRank = ranksByNodeId.get(currentNodeId) ?? 0;
    for (const targetNodeId of adjacency.get(currentNodeId) ?? []) {
      ranksByNodeId.set(
        targetNodeId,
        Math.max(ranksByNodeId.get(targetNodeId) ?? 0, currentRank + 1)
      );
      const nextIndegree = (indegreeByNodeId.get(targetNodeId) ?? 0) - 1;
      indegreeByNodeId.set(targetNodeId, nextIndegree);
      if (nextIndegree === 0) {
        frontier.push(targetNodeId);
      }
    }
  }

  if (processedCount !== nodeIds.length) {
    return null;
  }

  return nodeIds.map((nodeId) => ranksByNodeId.get(nodeId) ?? 0);
}

function buildSpectralProofStrategy(
  ast: GraphAST,
  nodeIds: readonly string[],
  indexedKernelEdges: readonly IndexedKernelEdge[]
): SpectralProofStrategy {
  const topologicalRanks = computeTopologicalRanks(ast, nodeIds);
  if (topologicalRanks !== null) {
    return {
      kind: 'nilpotent',
    };
  }

  return {
    kind: 'row-bound',
    rowBounds: buildRowBounds(nodeIds.length, indexedKernelEdges),
  };
}

function buildSpectralWitness(
  strategy: SpectralProofStrategy,
  kernelExpression: string
): {
  definitions: string;
  proof: string;
} {
  if (strategy.kind === 'nilpotent') {
    return {
      definitions: '',
      proof: `have h_spectral : SpectrallyStable ${kernelExpression} := by
  have h_nilpotent_rat : transitionRat ^ topologyNodeCount = 0 := by
    native_decide
  have h_nilpotent_map :
      (Rat.castHom Real).mapMatrix (transitionRat ^ topologyNodeCount) = 0 := by
    simpa using congrArg ((Rat.castHom Real).mapMatrix) h_nilpotent_rat
  have h_nilpotent : transition ^ topologyNodeCount = 0 := by
    rw [transition, ← map_pow]
    exact h_nilpotent_map
  exact spectrallyStable_of_nilpotent
    (kernel := ${kernelExpression})
    (power := topologyNodeCount)
    (h_power := by simp [topologyNodeCount])
    h_nilpotent`,
    };
  }

  return {
    definitions: `${buildRatMatchDefinition('rowBoundRat', strategy.rowBounds)}

def rowBound : Fin topologyNodeCount -> Real :=
  fun source => (rowBoundRat source : Real)
`,
    proof: `have h_spectral : SpectrallyStable ${kernelExpression} := by
  have h_nonnegative : HasNonnegativeTransitions ${kernelExpression} := by
    intro source target
    fin_cases source <;> fin_cases target <;> norm_num [kernel, transition, transitionRat]
  apply spectrallyStable_of_rowMass
    (kernel := ${kernelExpression})
    (h_nonnegative := h_nonnegative)
    (rowBound := rowBound)
  constructor
  · intro source
    have h_row_rat : (∑ target : Fin topologyNodeCount, transitionRat source target) = rowBoundRat source := by
      fin_cases source <;> native_decide
    simpa [kernel, rowMass, rowBound, transition] using
      congrArg (fun value : Rat => (value : Real)) h_row_rat
  · intro source
    have h_bound_rat : rowBoundRat source < 1 := by
      fin_cases source <;> native_decide
    change (rowBoundRat source : Real) < 1
    exact_mod_cast h_bound_rat`,
  };
}

function findAssessmentGamma(assessment: StabilityStateAssessment): number | null {
  const arrival = Number(assessment.arrival);
  const service = Number(assessment.service);
  const vent = Number(assessment.vent);

  if (!Number.isFinite(arrival) || !Number.isFinite(service) || !Number.isFinite(vent)) {
    return null;
  }

  const margin = service + vent - arrival;
  return margin > 0 ? round3(margin) : null;
}

function buildGammaValue(stability: StabilityReport): string {
  const explicitGamma = Number(stability.restorativeGamma);
  if (Number.isFinite(explicitGamma) && explicitGamma > 0) {
    return formatLeanReal(explicitGamma);
  }

  const inferredGamma = stability.stateAssessments
    .map(findAssessmentGamma)
    .filter((value): value is number => value !== null)
    .reduce<number | null>(
      (lowest, value) => (lowest === null ? value : Math.min(lowest, value)),
      null
    );

  return inferredGamma !== null ? formatLeanReal(inferredGamma) : '1';
}

function buildQueueBoundaryNat(stability: StabilityReport): number {
  if (stability.countableQueue) {
    return stability.countableQueue.queueBoundary;
  }

  const redline = Number(stability.redline);
  if (Number.isFinite(redline) && redline >= 0) {
    return Math.trunc(redline);
  }

  return 0;
}

function buildCountableQueueRecurrenceTheorem(
  theoremName: string,
  stability: StabilityReport
): {
  definitions: string;
  theorem: string;
} | null {
  const countableQueue = stability.countableQueue;
  if (!countableQueue || countableQueue.predecessorStepMode !== 'margin-predecessor') {
    return null;
  }

  const queueBoundary = buildQueueBoundaryNat(stability);
  const queueAtom = countableQueue.laminarAtom;
  const queueMinorizationFloor =
    stability.proof.kind === 'numeric' ? buildGammaValue(stability) : '1';
  const queueObservableScale = formatLeanReal(
    stability.continuousHarris?.observableScale ?? 1
  );
  const queueObservableOffset = formatLeanReal(
    stability.continuousHarris?.observableOffset ?? 0
  );
  const queueContinuousDriftGap = formatLeanReal(
    stability.continuousHarris?.driftGap ??
      stability.continuousHarris?.observableScale ??
      1
  );
  const sharedDefinitions = `def queueBoundary : Nat := ${queueBoundary}

def queueAtom : Nat := ${queueAtom}

def queueMinorizationFloor : Real := ${queueMinorizationFloor}

def queueSmallSet : Set Nat := {current : Nat | current <= queueBoundary}

def queueSupportStep : Nat -> Nat :=
  fun current => if current <= queueBoundary then queueAtom else current - 1

noncomputable def queueSupportKernel : ProbabilityTheory.Kernel Nat Nat :=
  ProbabilityTheory.Kernel.deterministic queueSupportStep (measurable_of_countable queueSupportStep)

noncomputable def queueWitnessKernel : ProbabilityTheory.Kernel Nat Nat :=
  natQueueWitnessKernel queueBoundary queueAtom

noncomputable def queueAtomMeasure : MeasureTheory.Measure Nat :=
  MeasureTheory.Measure.dirac queueAtom

def queueMeasurableEpsilon : ENNReal := 1

def queueAtomHittingBound : Nat -> Nat :=
  fun current => current - queueBoundary + 1

def queueWitnessHittingBound : Nat -> Nat :=
  fun _ => 1

def queueObservableScale : Real := ${queueObservableScale}

def queueObservableOffset : Real := ${queueObservableOffset}

def queueObservable : Nat -> Real :=
  natQueueAffineObservable queueObservableScale queueObservableOffset

def queueExpectedObservable : Nat -> Real :=
  natQueueAffineExpectedObservable
    queueBoundary
    queueAtom
    queueObservableScale
    queueObservableOffset

def queueLyapunov : Nat -> Real :=
  natQueueAffineObservable queueObservableScale queueObservableOffset

def queueContinuousDriftGap : Real := ${queueContinuousDriftGap}

def queueKernel (lam mu : Real) (alpha : Nat -> Real) : CountableCertifiedKernel Nat := {
  transition := fun current target =>
    if current <= queueBoundary then
      if target = queueAtom then 1 else 0
    else if target + 1 = current then mu + alpha current - lam else 0
  smallSet := queueSmallSet
}
`;
  const continuousObservableTheorems = `

theorem ${theoremName}_measurable_observable :
  MeasurableRealObservableWitness
      queueObservable
      queueSmallSet := by
  simpa [queueObservable, queueObservableScale, queueObservableOffset, queueSmallSet] using
    (natMeasurableRealObservableWitness_of_queueStep
      queueBoundary
      queueObservableScale
      queueObservableOffset)

theorem ${theoremName}_measurable_observable_drift :
  MeasurableLyapunovDriftWitness
      queueExpectedObservable
      queueLyapunov
      queueSmallSet
      queueContinuousDriftGap := by
  have h_scale : 0 < queueObservableScale := by
    norm_num [queueObservableScale]
  have h_driftGap : 0 < queueContinuousDriftGap := by
    norm_num [queueContinuousDriftGap]
  have h_driftGap_le_scale : queueContinuousDriftGap <= queueObservableScale := by
    norm_num [queueContinuousDriftGap, queueObservableScale]
  simpa [
    queueExpectedObservable,
    queueLyapunov,
    queueObservableScale,
    queueObservableOffset,
    queueContinuousDriftGap,
    queueSmallSet
  ] using
    (natMeasurableLyapunovDriftWitness_of_queueStep_with_gap
      queueBoundary
      queueAtom
      queueObservableScale
      queueObservableOffset
      queueContinuousDriftGap
      h_driftGap
      h_driftGap_le_scale)

theorem ${theoremName}_measurable_continuous_harris_certified :
  MeasurableContinuousHarrisWitness
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueObservable
      queueExpectedObservable
      queueLyapunov
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound
      queueContinuousDriftGap := by
  have h_scale : 0 < queueObservableScale := by
    norm_num [queueObservableScale]
  have h_driftGap : 0 < queueContinuousDriftGap := by
    norm_num [queueContinuousDriftGap]
  have h_driftGap_le_scale : queueContinuousDriftGap <= queueObservableScale := by
    norm_num [queueContinuousDriftGap, queueObservableScale]
  simpa [
    queueSupportKernel,
    queueSupportStep,
    queueAtomMeasure,
    queueObservable,
    queueExpectedObservable,
    queueLyapunov,
    queueObservableScale,
    queueObservableOffset,
    queueContinuousDriftGap,
    queueSmallSet,
    queueMeasurableEpsilon,
    queueAtomHittingBound
  ] using
    (natMeasurableContinuousHarrisWitness_of_queueStep_with_gap
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary])
      queueObservableScale
      queueObservableOffset
      queueContinuousDriftGap
      h_driftGap
      h_driftGap_le_scale)
`;

  if (stability.proof.kind === 'numeric') {
    return {
      definitions: sharedDefinitions,
      theorem: `

theorem ${theoremName}_small_set_minorized
  : CountableAtomicSmallSetMinorized
      (queueKernel lam mu alpha)
      queueAtom
      1 := by
  apply countableAtomicSmallSetMinorized_one_of_collapse
  · simp [queueKernel, queueSmallSet, queueAtom]
  · intro current h_current_small
    have h_current_le : current <= queueBoundary := by
      simpa [queueSmallSet] using h_current_small
    simp [queueKernel, queueSmallSet, queueAtom, h_current_le]

theorem ${theoremName}_uniformly_minorized
  : CountableUniformPredecessorMinorized
      (queueKernel lam mu alpha)
      queueBoundary
      queueMinorizationFloor := by
  constructor
  · norm_num [queueMinorizationFloor]
  · intro current h_current_gt
    have h_current_not_le : ¬ current ≤ queueBoundary := Nat.not_le_of_gt h_current_gt
    have h_current_not_le_value : ¬ current ≤ ${queueBoundary} := by
      simpa [queueBoundary] using h_current_not_le
    have h_predecessor : current - 1 + 1 = current := by
      omega
    have h_margin_floor : 1 <= mu + alpha current - lam := by
      norm_num [lam, mu, alpha]
    have h_queue_floor : queueMinorizationFloor <= mu + alpha current - lam := by
      simpa [queueMinorizationFloor] using h_margin_floor
    simpa [queueKernel, queueSmallSet, queueBoundary, h_current_not_le_value, h_predecessor] using h_queue_floor

theorem ${theoremName}_countably_recurrent
  : CountableSmallSetRecurrent (queueKernel lam mu alpha) := by
  apply natSmallSetRecurrent_of_uniformPredecessorMinorization
    (kernel := queueKernel lam mu alpha)
    (boundary := queueBoundary)
    (epsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
  exact ${theoremName}_uniformly_minorized

theorem ${theoremName}_atom_accessible
  : CountableAtomAccessible (queueKernel lam mu alpha) queueAtom := by
  exact countableAtomAccessible_of_smallSetRecurrence_and_atomicMinorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (epsilon := 1)
    ${theoremName}_countably_recurrent
    ${theoremName}_small_set_minorized

theorem ${theoremName}_psi_irreducible
  : CountablePsiIrreducibleAtAtom (queueKernel lam mu alpha) queueAtom := by
  exact countablePsiIrreducibleAtAtom_of_atomAccessible
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    ${theoremName}_atom_accessible

theorem ${theoremName}_harris_prelude
  : CountableHarrisPreludeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableHarrisPreludeAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    ${theoremName}_small_set_minorized
    ${theoremName}_uniformly_minorized
    ${theoremName}_psi_irreducible

theorem ${theoremName}_harris_recurrent_class
  : CountableHarrisRecurrentClassAtAtom
      (queueKernel lam mu alpha)
      queueAtom := by
  exact countableHarrisRecurrentClassAtAtom_of_recurrence_and_prelude
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    ${theoremName}_countably_recurrent
    ${theoremName}_harris_prelude

theorem ${theoremName}_atom_hitting_bound
  : CountableAtomHittingBoundAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary := by
  exact countableAtomHittingBoundAtAtom_of_minorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
    ${theoremName}_small_set_minorized
    ${theoremName}_uniformly_minorized

theorem ${theoremName}_geometric_envelope
  : CountableGeometricEnvelopeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableGeometricEnvelopeAtAtom_of_harrisPrelude_and_bound
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    ${theoremName}_harris_prelude
    ${theoremName}_harris_recurrent_class
    ${theoremName}_atom_hitting_bound

theorem ${theoremName}_atom_hit_lower_bound
  : CountableAtomGeometricHitLowerBoundAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableAtomGeometricHitLowerBoundAtAtom_of_minorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
    ${theoremName}_small_set_minorized
    ${theoremName}_uniformly_minorized

theorem ${theoremName}_quantitative_geometric_envelope
  : CountableQuantitativeGeometricEnvelopeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableQuantitativeGeometricEnvelopeAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    ${theoremName}_geometric_envelope
    ${theoremName}_atom_hit_lower_bound

theorem ${theoremName}_laminar_geometric_stable
  : CountableLaminarGeometricStabilityAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableLaminarGeometricStabilityAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    ${theoremName}_geometric_envelope
    ${theoremName}_atom_hit_lower_bound

theorem ${theoremName}_measurable_atom_accessible
  : MeasurableAtomAccessible queueSupportKernel queueAtom := by
  exact natMeasurableAtomAccessible_of_queueStep
    queueBoundary
    queueAtom

theorem ${theoremName}_measurable_harris_certified :
  MeasurableHarrisCertified
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon] using
    (natMeasurableHarrisCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_laminar_certified :
  MeasurableLaminarCertifiedAtAtom
      queueSupportKernel
      queueAtom
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon] using
    (natMeasurableLaminarCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_atom_hitting_bound :
  MeasurableAtomHittingBoundAtAtom
      queueSupportKernel
      queueAtom
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomHittingBound] using
    (natMeasurableAtomHittingBound_of_queueStep
      queueBoundary
      queueAtom)

theorem ${theoremName}_measurable_quantitative_laminar_certified :
  MeasurableQuantitativeLaminarCertifiedAtAtom
      queueSupportKernel
      queueAtom
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon, queueAtomHittingBound] using
    (natMeasurableQuantitativeLaminarCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_quantitative_harris_certified :
  MeasurableQuantitativeHarrisCertified
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  exact measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified

theorem ${theoremName}_measurable_witness_quantitative_harris_certified :
  MeasurableQuantitativeHarrisCertified
      queueWitnessKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueWitnessHittingBound := by
  simpa [queueWitnessKernel, queueAtomMeasure, queueMeasurableEpsilon, queueWitnessHittingBound] using
    (natMeasurableQuantitativeHarrisCertified_of_queueWitnessKernel
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_eventually_converges :
  MeasurableEventuallyConvergesToReference
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueAtomHittingBound] using
    (natMeasurableEventuallyConvergesToAtom_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_small_set_hitting_bound :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current queueSmallSet > 0 := by
  exact measurableSmallSetHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    (by simp [queueSmallSet, queueAtom, queueBoundary])
    ${theoremName}_measurable_quantitative_laminar_certified

theorem ${theoremName}_measurable_containing_atom_hitting_bound
  (measurableSet : Set Nat)
  (h_atom_mem : queueAtom ∈ measurableSet) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    measurableSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified
    h_atom_mem

theorem ${theoremName}_measurable_reference_positive_hitting_bound
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_witness_reference_positive_hitting_bound
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueWitnessHittingBound current ∧ (queueWitnessKernel ^ n) current measurableSet > 0 := by
  exact ${theoremName}_measurable_witness_quantitative_harris_certified.2
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_reference_positive_persistent
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    forall n : Nat,
      queueAtomHittingBound current <= n ->
        (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableReferencePositivePersistent_of_eventualConvergence
    queueSupportKernel
    queueAtomMeasure
    queueAtomHittingBound
    ${theoremName}_measurable_eventually_converges
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_finite_time_harris_recurrent :
  MeasurableFiniteTimeHarrisRecurrent
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  exact measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_harris_certified
    ${theoremName}_measurable_eventually_converges

theorem ${theoremName}_measurable_harris_recurrent :
  MeasurableHarrisRecurrent
      queueSupportKernel
      queueAtomMeasure := by
  exact measurableHarrisRecurrent_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_finite_time_geometric_ergodic :
  MeasurableFiniteTimeGeometricErgodic
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  exact measurableFiniteTimeGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_ergodic :
  MeasurableFiniteTimeLevyProkhorovGeometricErgodic
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  exact measurableFiniteTimeLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_decay :
  MeasurableLevyProkhorovGeometricDecayAfterBurnIn
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound
      (1 / 2) := by
  exact measurableLevyProkhorovGeometricDecayAfterBurnIn_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    (1 / 2)
    (by norm_num)
    (by norm_num)
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_ergodic_abstract :
  MeasurableLevyProkhorovGeometricErgodic
      queueSupportKernel
      queueAtomMeasure := by
  exact measurableLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_small_set_accessible :
  MeasurableSmallSetAccessible queueSupportKernel queueSmallSet := by
  exact measurableSmallSetAccessible_of_laminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    ${theoremName}_measurable_laminar_certified

theorem ${theoremName}_measurable_containing_atom_accessible
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_atom_mem : queueAtom ∈ measurableSet) :
  forall current : Nat,
    ∃ n : ℕ, (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableContainingAtomAccessible_of_laminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    measurableSet
    queueMeasurableEpsilon
    ${theoremName}_measurable_laminar_certified
    h_measurableSet
    h_atom_mem${continuousObservableTheorems}`,
    };
  }

  return {
    definitions: sharedDefinitions,
      theorem: `

theorem ${theoremName}_small_set_minorized
  (lam mu : Real)
  (alpha : Nat -> Real)
  : CountableAtomicSmallSetMinorized
      (queueKernel lam mu alpha)
      queueAtom
      1 := by
  apply countableAtomicSmallSetMinorized_one_of_collapse
  · simp [queueKernel, queueSmallSet, queueAtom]
  · intro current h_current_small
    have h_current_le : current <= queueBoundary := by
      simpa [queueSmallSet] using h_current_small
    simp [queueKernel, queueSmallSet, queueAtom, h_current_le]

theorem ${theoremName}_uniformly_minorized
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableUniformPredecessorMinorized
      (queueKernel lam mu alpha)
      queueBoundary
      queueMinorizationFloor := by
  constructor
  · norm_num [queueMinorizationFloor]
  · intro current h_current_gt
    have h_current_not_le : ¬ current ≤ queueBoundary := Nat.not_le_of_gt h_current_gt
    have h_current_not_le_value : ¬ current ≤ ${queueBoundary} := by
      simpa [queueBoundary] using h_current_not_le
    have h_predecessor : current - 1 + 1 = current := by
      omega
    have h_margin_floor : 1 <= mu + alpha current - lam := by
      have h_floor := h_drift_floor current h_current_gt
      linarith
    have h_queue_floor : queueMinorizationFloor <= mu + alpha current - lam := by
      simpa [queueMinorizationFloor] using h_margin_floor
    simpa [queueKernel, queueSmallSet, queueBoundary, h_current_not_le_value, h_predecessor] using h_queue_floor

theorem ${theoremName}_countably_recurrent
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableSmallSetRecurrent (queueKernel lam mu alpha) := by
  apply natSmallSetRecurrent_of_uniformPredecessorMinorization
    (kernel := queueKernel lam mu alpha)
    (boundary := queueBoundary)
    (epsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
  exact ${theoremName}_uniformly_minorized lam mu alpha h_drift_floor

theorem ${theoremName}_atom_accessible
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableAtomAccessible (queueKernel lam mu alpha) queueAtom := by
  exact countableAtomAccessible_of_smallSetRecurrence_and_atomicMinorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (epsilon := 1)
    (${theoremName}_countably_recurrent lam mu alpha h_drift_floor)
    (${theoremName}_small_set_minorized lam mu alpha)

theorem ${theoremName}_psi_irreducible
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountablePsiIrreducibleAtAtom (queueKernel lam mu alpha) queueAtom := by
  exact countablePsiIrreducibleAtAtom_of_atomAccessible
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (${theoremName}_atom_accessible lam mu alpha h_drift_floor)

theorem ${theoremName}_harris_prelude
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableHarrisPreludeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableHarrisPreludeAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (${theoremName}_small_set_minorized lam mu alpha)
    (${theoremName}_uniformly_minorized lam mu alpha h_drift_floor)
    (${theoremName}_psi_irreducible lam mu alpha h_drift_floor)

theorem ${theoremName}_harris_recurrent_class
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableHarrisRecurrentClassAtAtom
      (queueKernel lam mu alpha)
      queueAtom := by
  exact countableHarrisRecurrentClassAtAtom_of_recurrence_and_prelude
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (${theoremName}_countably_recurrent lam mu alpha h_drift_floor)
    (${theoremName}_harris_prelude lam mu alpha h_drift_floor)

theorem ${theoremName}_atom_hitting_bound
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableAtomHittingBoundAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary := by
  exact countableAtomHittingBoundAtAtom_of_minorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
    (${theoremName}_small_set_minorized lam mu alpha)
    (${theoremName}_uniformly_minorized lam mu alpha h_drift_floor)

theorem ${theoremName}_geometric_envelope
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableGeometricEnvelopeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableGeometricEnvelopeAtAtom_of_harrisPrelude_and_bound
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (${theoremName}_harris_prelude lam mu alpha h_drift_floor)
    (${theoremName}_harris_recurrent_class lam mu alpha h_drift_floor)
    (${theoremName}_atom_hitting_bound lam mu alpha h_drift_floor)

theorem ${theoremName}_atom_hit_lower_bound
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableAtomGeometricHitLowerBoundAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableAtomGeometricHitLowerBoundAtAtom_of_minorization
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (h_small := by
      simp [queueKernel, queueSmallSet])
    (${theoremName}_small_set_minorized lam mu alpha)
    (${theoremName}_uniformly_minorized lam mu alpha h_drift_floor)

theorem ${theoremName}_quantitative_geometric_envelope
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableQuantitativeGeometricEnvelopeAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableQuantitativeGeometricEnvelopeAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (${theoremName}_geometric_envelope lam mu alpha h_drift_floor)
    (${theoremName}_atom_hit_lower_bound lam mu alpha h_drift_floor)

theorem ${theoremName}_laminar_geometric_stable
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor :
    ∀ current : Nat,
      queueBoundary < current ->
        lam - (mu + alpha current) <= -1) :
  CountableLaminarGeometricStabilityAtAtom
      (queueKernel lam mu alpha)
      queueAtom
      queueBoundary
      1
      queueMinorizationFloor := by
  exact countableLaminarGeometricStabilityAtAtom_of_components
    (kernel := queueKernel lam mu alpha)
    (atom := queueAtom)
    (boundary := queueBoundary)
    (smallSetEpsilon := 1)
    (stepEpsilon := queueMinorizationFloor)
    (${theoremName}_geometric_envelope lam mu alpha h_drift_floor)
    (${theoremName}_atom_hit_lower_bound lam mu alpha h_drift_floor)

theorem ${theoremName}_measurable_atom_accessible
  : MeasurableAtomAccessible queueSupportKernel queueAtom := by
  exact natMeasurableAtomAccessible_of_queueStep
    queueBoundary
    queueAtom

theorem ${theoremName}_measurable_harris_certified :
  MeasurableHarrisCertified
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon] using
    (natMeasurableHarrisCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_laminar_certified :
  MeasurableLaminarCertifiedAtAtom
      queueSupportKernel
      queueAtom
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon] using
    (natMeasurableLaminarCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_atom_hitting_bound :
  MeasurableAtomHittingBoundAtAtom
      queueSupportKernel
      queueAtom
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomHittingBound] using
    (natMeasurableAtomHittingBound_of_queueStep
      queueBoundary
      queueAtom)

theorem ${theoremName}_measurable_quantitative_laminar_certified :
  MeasurableQuantitativeLaminarCertifiedAtAtom
      queueSupportKernel
      queueAtom
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueMeasurableEpsilon, queueAtomHittingBound] using
    (natMeasurableQuantitativeLaminarCertified_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_quantitative_harris_certified :
  MeasurableQuantitativeHarrisCertified
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  exact measurableQuantitativeHarrisCertified_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified

theorem ${theoremName}_measurable_witness_quantitative_harris_certified :
  MeasurableQuantitativeHarrisCertified
      queueWitnessKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueWitnessHittingBound := by
  simpa [queueWitnessKernel, queueAtomMeasure, queueMeasurableEpsilon, queueWitnessHittingBound] using
    (natMeasurableQuantitativeHarrisCertified_of_queueWitnessKernel
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_eventually_converges :
  MeasurableEventuallyConvergesToReference
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  simpa [queueSupportKernel, queueSupportStep, queueAtomMeasure, queueAtomHittingBound] using
    (natMeasurableEventuallyConvergesToAtom_of_queueStep
      queueBoundary
      queueAtom
      (by simp [queueAtom, queueBoundary]))

theorem ${theoremName}_measurable_small_set_hitting_bound :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current queueSmallSet > 0 := by
  exact measurableSmallSetHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    (by simp [queueSmallSet, queueAtom, queueBoundary])
    ${theoremName}_measurable_quantitative_laminar_certified

theorem ${theoremName}_measurable_containing_atom_hitting_bound
  (measurableSet : Set Nat)
  (h_atom_mem : queueAtom ∈ measurableSet) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableContainingAtomHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    measurableSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified
    h_atom_mem

theorem ${theoremName}_measurable_reference_positive_hitting_bound
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueAtomHittingBound current ∧ (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableReferencePositiveHittingBound_of_quantitativeLaminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_laminar_certified
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_witness_reference_positive_hitting_bound
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    ∃ n : ℕ, n <= queueWitnessHittingBound current ∧ (queueWitnessKernel ^ n) current measurableSet > 0 := by
  exact ${theoremName}_measurable_witness_quantitative_harris_certified.2
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_reference_positive_persistent
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_positive : queueAtomMeasure measurableSet > 0) :
  forall current : Nat,
    forall n : Nat,
      queueAtomHittingBound current <= n ->
        (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableReferencePositivePersistent_of_eventualConvergence
    queueSupportKernel
    queueAtomMeasure
    queueAtomHittingBound
    ${theoremName}_measurable_eventually_converges
    measurableSet
    h_measurableSet
    h_positive

theorem ${theoremName}_measurable_finite_time_harris_recurrent :
  MeasurableFiniteTimeHarrisRecurrent
      queueSupportKernel
      queueAtomMeasure
      queueAtomMeasure
      queueAtomMeasure
      queueSmallSet
      queueMeasurableEpsilon
      queueAtomHittingBound := by
  exact measurableFiniteTimeHarrisRecurrent_of_quantitativeHarris_and_convergence
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_quantitative_harris_certified
    ${theoremName}_measurable_eventually_converges

theorem ${theoremName}_measurable_harris_recurrent :
  MeasurableHarrisRecurrent
      queueSupportKernel
      queueAtomMeasure := by
  exact measurableHarrisRecurrent_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_finite_time_geometric_ergodic :
  MeasurableFiniteTimeGeometricErgodic
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  exact measurableFiniteTimeGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_ergodic :
  MeasurableFiniteTimeLevyProkhorovGeometricErgodic
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound := by
  exact measurableFiniteTimeLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_decay :
  MeasurableLevyProkhorovGeometricDecayAfterBurnIn
      queueSupportKernel
      queueAtomMeasure
      queueAtomHittingBound
      (1 / 2) := by
  exact measurableLevyProkhorovGeometricDecayAfterBurnIn_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    (1 / 2)
    (by norm_num)
    (by norm_num)
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_levy_prokhorov_geometric_ergodic_abstract :
  MeasurableLevyProkhorovGeometricErgodic
      queueSupportKernel
      queueAtomMeasure := by
  exact measurableLevyProkhorovGeometricErgodic_of_finiteTimeHarrisRecurrent
    queueSupportKernel
    queueAtomMeasure
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    queueAtomHittingBound
    ${theoremName}_measurable_finite_time_harris_recurrent

theorem ${theoremName}_measurable_small_set_accessible :
  MeasurableSmallSetAccessible queueSupportKernel queueSmallSet := by
  exact measurableSmallSetAccessible_of_laminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    queueMeasurableEpsilon
    ${theoremName}_measurable_laminar_certified

theorem ${theoremName}_measurable_containing_atom_accessible
  (measurableSet : Set Nat)
  (h_measurableSet : MeasurableSet measurableSet)
  (h_atom_mem : queueAtom ∈ measurableSet) :
  forall current : Nat,
    ∃ n : ℕ, (queueSupportKernel ^ n) current measurableSet > 0 := by
  exact measurableContainingAtomAccessible_of_laminarCertifiedAtAtom
    queueSupportKernel
    queueAtom
    queueAtomMeasure
    queueAtomMeasure
    queueSmallSet
    measurableSet
    queueMeasurableEpsilon
    ${theoremName}_measurable_laminar_certified
    h_measurableSet
    h_atom_mem${continuousObservableTheorems}`,
  };
}

function buildRecurrenceDefinitions(
  nodeIds: readonly string[],
  indexByNodeId: Map<string, number>,
  stability: StabilityReport
): {
  definitions: string;
  proof: string;
} | null {
  if (!stability.recurrence.finiteStateCertified) {
    return null;
  }

  const recurrenceByNodeId = new Map(
    stability.recurrence.steps.map((step) => [step.nodeId, step])
  );
  const smallSetIndices = stability.smallSetNodeIds
    .map((nodeId) => indexByNodeId.get(nodeId))
    .filter((index): index is number => index !== undefined);
  const distanceValues = nodeIds.map(
    (nodeId) => recurrenceByNodeId.get(nodeId)?.distanceToSmallSet ?? 0
  );
  const nextValues = nodeIds.map((nodeId) => {
    const nextNodeId = recurrenceByNodeId.get(nodeId)?.nextNodeId ?? nodeId;
    return indexByNodeId.get(nextNodeId) ?? 0;
  });
  const stepProofCases = nodeIds
    .map((nodeId) => {
      const step = recurrenceByNodeId.get(nodeId);
      if (step?.distanceToSmallSet === 0) {
        return `    · simp [smallSet, smallSetIndices] at h_not_small`;
      }

      return `    · simp [smallSet, smallSetIndices] at h_not_small
      constructor
      · norm_num [kernel, transition, transitionRat, nextTowardSmallSet]
      · native_decide`;
    })
    .join('\n');

  return {
    definitions: `def smallSetIndices : List Nat := ${toLeanNatList(smallSetIndices)}

def smallSet : Fin topologyNodeCount -> Prop :=
  fun state => state.1 ∈ smallSetIndices

instance : DecidablePred smallSet := by
  intro state
  unfold smallSet
  infer_instance

${buildNatMatchDefinition('distanceToSmallSet', distanceValues)}

${buildFinMatchDefinition('nextTowardSmallSet', nextValues)}
`,
    proof: `have h_recurrence : FiniteSmallSetRecurrent kernelExpression smallSet := by
  apply finiteSmallSetRecurrent_of_distanceWitness
    (kernel := kernelExpression)
    (smallSet := smallSet)
    (distance := distanceToSmallSet)
    (next := nextTowardSmallSet)
  constructor
  · intro state
    fin_cases state <;> native_decide
  constructor
  · intro state
    fin_cases state <;> native_decide
  · intro state h_not_small
    fin_cases state
${stepProofCases}`,
  };
}

function buildKernelDefinitions(
  ast: GraphAST,
  stability: StabilityReport,
  theoremName: string
): {
  nodeIds: string[];
  definitions: string;
  theorem: string;
} {
  const { nodeIds, indexByNodeId } = buildNodeIndex(ast);
  const indexedKernelEdges = aggregateKernelEdges(stability.kernelEdges, indexByNodeId);
  const spectralStrategy = buildSpectralProofStrategy(ast, nodeIds, indexedKernelEdges);
  const topologyNodes = toLeanStringList(nodeIds);
  const smallSetNodeIds = toLeanStringList(stability.smallSetNodeIds);
  const recurrenceWitness = buildRecurrenceDefinitions(
    nodeIds,
    indexByNodeId,
    stability
  );
  const countableQueueRecurrence = buildCountableQueueRecurrenceTheorem(
    theoremName,
    stability
  );
  const topologyNodeCount = nodeIds.length;
  const spectralCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const redline = formatLeanReal(stability.redline ?? 0);
  const geometricCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const gammaValue = buildGammaValue(stability);
  const transitionDefinitions = buildTransitionDefinitions(indexedKernelEdges);

  const sharedDefinitions = `abbrev NodeId := String

def topologyNodeCount : Nat := ${topologyNodeCount}
instance : NeZero topologyNodeCount := by
  simpa [topologyNodeCount] using (inferInstance : NeZero ${topologyNodeCount})

def topologyNodes : List NodeId := ${topologyNodes}
def smallSetNodeIds : List NodeId := ${smallSetNodeIds}

${transitionDefinitions}

${recurrenceWitness?.definitions ?? ''}
${countableQueueRecurrence?.definitions ?? ''}
`;

  if (stability.proof.kind === 'bounded-supremum') {
    const spectralWitness = buildSpectralWitness(spectralStrategy, 'kernel');
    const spectralProof = indentBlock(spectralWitness.proof, 2);
    const recurrenceProof = recurrenceWitness
      ? indentBlock(
          recurrenceWitness.proof.replaceAll('kernelExpression', 'kernel'),
          2
        )
      : '';
    const recurrenceTheorem = recurrenceWitness
      ? `

theorem ${theoremName}_finitely_recurrent :
  FiniteSmallSetRecurrent kernel smallSet := by
${recurrenceProof}
  exact h_recurrence`
      : '';
    const countableQueueTheorem = countableQueueRecurrence?.theorem ?? '';
    return {
      nodeIds,
      definitions: `${sharedDefinitions}
${spectralWitness.definitions}
noncomputable def kernel : CertifiedKernel topologyNodeCount := {
  transition := transition
  topologyNodes := topologyNodes
  smallSetNodeIds := smallSetNodeIds
  spectralCeiling := ${spectralCeiling}
  redline := ${redline}
  geometricCeiling := ${geometricCeiling}
  drift := none
} 
`,
      theorem: `theorem ${theoremName} :
  GeometricStability kernel := by
${spectralProof}
  apply certifiedKernel_stable_of_supremum (kernel := kernel)
  · exact h_spectral
  · rfl${recurrenceTheorem}${countableQueueTheorem}`,
    };
  }

  if (stability.proof.kind === 'numeric') {
    const firstAssessment = stability.stateAssessments[0];
    const lamValue = firstAssessment?.arrival ?? '0';
    const muValue = firstAssessment?.service ?? '0';
    const alphaValue = firstAssessment?.vent ?? '0';

    const spectralWitness = buildSpectralWitness(spectralStrategy, 'kernel');
    const spectralProof = indentBlock(spectralWitness.proof, 2);
    const recurrenceProof = recurrenceWitness
      ? indentBlock(
          recurrenceWitness.proof.replaceAll('kernelExpression', 'kernel'),
          2
        )
      : '';
    const recurrenceTheorem = recurrenceWitness
      ? `

theorem ${theoremName}_finitely_recurrent :
  FiniteSmallSetRecurrent kernel smallSet := by
${recurrenceProof}
  exact h_recurrence`
      : '';
    const countableQueueTheorem = countableQueueRecurrence?.theorem ?? '';
    return {
      nodeIds,
      definitions: `${sharedDefinitions}
${spectralWitness.definitions}
def lam : Real := ${lamValue}
def mu : Real := ${muValue}
def alpha : Nat -> Real := fun _ => ${alphaValue}

def driftCertificate : DriftCertificate := {
  gamma := ${gammaValue}
  arrivalRate := lam
  serviceRate := mu
  ventRate := alpha
}

noncomputable def kernel : CertifiedKernel topologyNodeCount := {
  transition := transition
  topologyNodes := topologyNodes
  smallSetNodeIds := smallSetNodeIds
  spectralCeiling := ${spectralCeiling}
  redline := ${redline}
  geometricCeiling := ${geometricCeiling}
  drift := some driftCertificate
}
`,
      theorem: `theorem ${theoremName} :
  GeometricStability kernel := by
${spectralProof}
  apply certifiedKernel_stable_of_drift_certificate
    (kernel := kernel)
    (certificate := driftCertificate)
  · rfl
  · exact h_spectral
  · norm_num [driftCertificate]
  · intro queueDepth
    norm_num [driftAt, driftCertificate, lam, mu, alpha]${recurrenceTheorem}${countableQueueTheorem}`,
    };
  }

  const driftFloorType = stability.proof.assumptions.find(
    (assumption) => assumption.name === 'h_drift_floor'
  )?.leanType;
  const driftFloorAssumption =
    driftFloorType ?? `forall n : Nat, driftAt (driftCertificate lam mu alpha) n <= -${gammaValue}`;

  const spectralWitness = buildSpectralWitness(spectralStrategy, '(kernel lam mu alpha)');
  const spectralProof = indentBlock(spectralWitness.proof, 2);
  const recurrenceProof = recurrenceWitness
    ? indentBlock(
        recurrenceWitness.proof.replaceAll(
          'kernelExpression',
          '(kernel lam mu alpha)'
        ),
        2
      )
    : '';
  const recurrenceTheorem = recurrenceWitness
    ? `

theorem ${theoremName}_finitely_recurrent
  (lam mu : Real)
  (alpha : Nat -> Real) :
  FiniteSmallSetRecurrent (kernel lam mu alpha) smallSet := by
${recurrenceProof}
  exact h_recurrence`
    : '';
  const countableQueueTheorem = countableQueueRecurrence?.theorem ?? '';
  return {
    nodeIds,
    definitions: `${sharedDefinitions}
${spectralWitness.definitions}
def driftCertificate (lam mu : Real) (alpha : Nat -> Real) : DriftCertificate := {
  gamma := ${gammaValue}
  arrivalRate := lam
  serviceRate := mu
  ventRate := alpha
}

noncomputable def kernel (lam mu : Real) (alpha : Nat -> Real) : CertifiedKernel topologyNodeCount := {
  transition := transition
  topologyNodes := topologyNodes
  smallSetNodeIds := smallSetNodeIds
  spectralCeiling := ${spectralCeiling}
  redline := ${redline}
  geometricCeiling := ${geometricCeiling}
  drift := some (driftCertificate lam mu alpha)
}
`,
    theorem: `theorem ${theoremName}
  (lam mu : Real)
  (alpha : Nat -> Real)
  (h_drift_floor : ${driftFloorAssumption}) :
  GeometricStability (kernel lam mu alpha) := by
${spectralProof}
  apply certifiedKernel_stable_of_drift_certificate
    (kernel := kernel lam mu alpha)
    (certificate := driftCertificate lam mu alpha)
  · rfl
  · exact h_spectral
  · norm_num [driftCertificate]
  · simpa [driftAt, driftCertificate] using h_drift_floor${recurrenceTheorem}${countableQueueTheorem}`,
  };
}

export function generateLeanFromGnosisAst(
  ast: GraphAST | null,
  stability: StabilityReport | null,
  options: GnosisLeanOptions = {},
  optimizerCertificates: OptimizationCertificate[] = []
): GnosisLeanArtifact | null {
  if (!ast || !stability?.enabled) {
    return null;
  }

  const moduleName = buildModuleName(options);
  const theoremName =
    options.theoremName ?? sanitizeLeanIdentifier(stability.proof.theoremName);
  const { definitions, theorem } = buildKernelDefinitions(ast, stability, theoremName);
  const countableQueueTheoremEnabled = stability.countableQueue !== null;

  const optimizerSection = buildOptimizerLeanSection(optimizerCertificates);

  const lean = `import GnosisProofs
import Mathlib.Tactic

open GnosisProofs

namespace ${moduleName}

${definitions}

/- Auto-generated by Betti thermodynamic auditor.
   proof-kind: ${stability.proof.kind}
   proof-summary: ${stability.proof.summary}
   harris-recurrent: ${stability.harrisRecurrent}
   finite-state-recurrent: ${stability.recurrence.finiteStateCertified}
   countable-queue-theorem: ${countableQueueTheoremEnabled}
   vent-isolation-ok: ${stability.ventIsolationOk}
   optimizer-passes: ${optimizerCertificates.length > 0 ? optimizerCertificates.map((c) => c.passName).join(', ') : 'none'}
-/

${theorem}
${optimizerSection}
end ${moduleName}
`;

  return {
    moduleName,
    theoremName,
    lean,
  };
}

// ─── Optimizer certificate → Lean section ────────────────────────────

function buildOptimizerLeanSection(
  certificates: OptimizationCertificate[]
): string {
  if (certificates.length === 0) {
    return '';
  }

  const sections: string[] = [];

  sections.push('');
  sections.push('/- ── Theorem-backed optimization certificates ─────────────────────── -/');
  sections.push('');

  for (const cert of certificates) {
    if (cert.passName === 'coarsening') {
      const data = cert.data as {
        fineNodeCount: number;
        coarseNodeCount: number;
        totalFineDrift: number;
        totalCoarseDrift: number;
        allStable: boolean;
        groups: { coarseId: string; fineCount: number; drift: number }[];
      };

      sections.push(`/-- ${cert.theoremId}: ${cert.summary} -/`);
      sections.push(`-- Lean reference: ${cert.leanTheoremName}`);
      sections.push(`-- Fine nodes: ${data.fineNodeCount}, Coarse nodes: ${data.coarseNodeCount}`);
      sections.push(`-- Total fine drift: ${data.totalFineDrift}`);
      sections.push(`-- Total coarse drift: ${data.totalCoarseDrift}`);
      sections.push(`-- Conservation residual: ${Math.abs(data.totalFineDrift - data.totalCoarseDrift)}`);
      if (data.allStable) {
        sections.push(`-- Certificate VALID: all coarse nodes have negative drift`);
      }
      sections.push('');
    } else if (cert.passName === 'codec-racing') {
      const data = cert.data as {
        codecCount: number;
        resourceCount: number;
        internalBeta1: number;
        externalDeficit: number;
      };

      sections.push(`/-- ${cert.theoremId}: ${cert.summary} -/`);
      sections.push(`-- Lean reference: ${cert.leanTheoremName}`);
      sections.push(`-- Codecs: ${data.codecCount}, Resources: ${data.resourceCount}`);
      sections.push(`-- Internal beta1: ${data.internalBeta1}, External deficit: ${data.externalDeficit}`);
      sections.push('');
    } else if (cert.passName === 'warmup-efficiency') {
      const data = cert.data as {
        forkWidth: number;
        foldWidth: number;
        sequentialWallace: number;
        wallaceDropCross: number;
        warmupWorth: boolean;
      };

      sections.push(`/-- ${cert.theoremId}: ${cert.summary} -/`);
      sections.push(`-- Lean reference: ${cert.leanTheoremName}`);
      sections.push(`-- Fork width: ${data.forkWidth}, Fold width: ${data.foldWidth}`);
      sections.push(`-- Wallace drop cross: ${data.wallaceDropCross}`);
      sections.push(`-- Warmup recommended: ${data.warmupWorth}`);
      sections.push('');
    }
  }

  return sections.join('\n');
}

// ─── Coarsening synthesis → Lean codegen ──────────────────────────────

export function generateCoarseningLean(
  ast: GraphAST | null,
  stability: StabilityReport | null,
  coarsening: CoarseningSynthesisResult | null,
  options: GnosisLeanOptions = {}
): GnosisLeanArtifact | null {
  if (!ast || !stability || !coarsening || coarsening.kind !== 'success' || !coarsening.leanData) {
    return null;
  }

  const leanData = coarsening.leanData;
  const moduleName = buildModuleName(options) + '_coarsening';
  const theoremName =
    (options.theoremName ?? sanitizeLeanIdentifier(stability.proof.theoremName)) +
    '_coarsening_synthesis';

  const fineCount = leanData.fineNodeIds.length;
  const coarseCount = leanData.coarseNodeIds.length;

  const quotientClauses = leanData.quotientMapIndices
    .map((coarseIdx, fineIdx) => `    | ${fineIdx} => ⟨${coarseIdx}, by omega⟩`)
    .join('\n');

  const arrivalClauses = leanData.arrivalRates
    .map((rate, idx) => `    | ${idx} => ${formatLeanReal(rate)}`)
    .join('\n');

  const serviceClauses = leanData.serviceRates
    .map((rate, idx) => `    | ${idx} => ${formatLeanReal(rate)}`)
    .join('\n');

  const fineNodeComments = leanData.fineNodeIds
    .map((id, idx) => `-- Fine node ${idx}: ${id}`)
    .join('\n');

  const coarseNodeComments = leanData.coarseNodeIds
    .map((id, idx) => `-- Coarse node ${idx}: ${id}`)
    .join('\n');

  const lean = `import GnosisProofs
import Mathlib.Tactic

open GnosisProofs

namespace ${moduleName}

/- Node mapping -/
${fineNodeComments}
${coarseNodeComments}

def fineCount : Nat := ${fineCount}
def coarseCount : Nat := ${coarseCount}

def quotientMap : Fin fineCount -> Fin coarseCount :=
  fun source =>
    match source.1 with
${quotientClauses}
    | _ => ⟨0, by omega⟩

def arrivalRate : Fin fineCount -> Real :=
  fun source =>
    match source.1 with
${arrivalClauses}
    | _ => 0

def serviceRate : Fin fineCount -> Real :=
  fun source =>
    match source.1 with
${serviceClauses}
    | _ => 0

/- Auto-generated coarsening synthesis certificate.
   drift-gap: ${leanData.driftGap}
   fine-nodes: ${fineCount}
   coarse-nodes: ${coarseCount}
   coarse-fibers: ${leanData.coarseNodeIds.join(', ')}
-/

def graphData : RawGraphData fineCount coarseCount where
  quotientMap := quotientMap
  arrivalRate := arrivalRate
  serviceRate := serviceRate
  hServicePositive := by
    intro node
    fin_cases node <;> simp [serviceRate] <;> norm_num

def driftGapValue : Real := ${formatLeanReal(leanData.driftGap)}

theorem ${theoremName}_certificate :
  CoarseDriftCertificate fineCount coarseCount :=
  { data := graphData
    driftGap := driftGapValue
    hDriftGapPositive := by simp [driftGapValue]; norm_num
    hAllCoarseDriftNegative := by
      intro coarseNode
      fin_cases coarseNode <;>
        simp [coarseDrift, aggregateArrival, aggregateService, graphData, quotientMap, arrivalRate, serviceRate, driftGapValue] <;>
        norm_num }

theorem ${theoremName} (coarseNode : Fin coarseCount) :
    coarseDrift graphData coarseNode <= -driftGapValue :=
  synthesis_sound ${theoremName}_certificate coarseNode

end ${moduleName}
`;

  return {
    moduleName,
    theoremName,
    lean,
  };
}
