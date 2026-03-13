import path from 'node:path';
import type { GraphAST } from './compiler.js';
import type { StabilityKernelEdge, StabilityReport, StabilityStateAssessment } from './stability.js';

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

function buildModuleName(options: GnosisLeanOptions): string {
  const rawName =
    options.moduleName ??
    (options.sourceFilePath
      ? path.basename(options.sourceFilePath, path.extname(options.sourceFilePath))
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
  have h_nilpotent : transition ^ topologyNodeCount = 0 := by
    simpa [transition, Matrix.map_pow] using
      congrArg ((Rat.castHom Real).mapMatrix) h_nilpotent_rat
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
  const topologyNodeCount = nodeIds.length;
  const spectralCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const redline = formatLeanReal(stability.redline ?? 0);
  const geometricCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const gammaValue = buildGammaValue(stability);
  const transitionDefinitions = buildTransitionDefinitions(indexedKernelEdges);

  const sharedDefinitions = `abbrev NodeId := String

def topologyNodeCount : Nat := ${topologyNodeCount}
instance : NeZero topologyNodeCount := by
  simp [topologyNodeCount]

def topologyNodes : List NodeId := ${topologyNodes}
def smallSetNodeIds : List NodeId := ${smallSetNodeIds}

${transitionDefinitions}
`;

  if (stability.proof.kind === 'bounded-supremum') {
    const spectralWitness = buildSpectralWitness(spectralStrategy, 'kernel');
    const spectralProof = indentBlock(spectralWitness.proof, 2);
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
  · rfl`,
    };
  }

  if (stability.proof.kind === 'numeric') {
    const firstAssessment = stability.stateAssessments[0];
    const lamValue = firstAssessment?.arrival ?? '0';
    const muValue = firstAssessment?.service ?? '0';
    const alphaValue = firstAssessment?.vent ?? '0';

    const spectralWitness = buildSpectralWitness(spectralStrategy, 'kernel');
    const spectralProof = indentBlock(spectralWitness.proof, 2);
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
    norm_num [driftAt, driftCertificate, lam, mu, alpha]`,
    };
  }

  const driftFloorType = stability.proof.assumptions.find(
    (assumption) => assumption.name === 'h_drift_floor'
  )?.leanType;
  const driftFloorAssumption =
    driftFloorType ?? `forall n : Nat, driftAt (driftCertificate lam mu alpha) n <= -${gammaValue}`;

  const spectralWitness = buildSpectralWitness(spectralStrategy, '(kernel lam mu alpha)');
  const spectralProof = indentBlock(spectralWitness.proof, 2);
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
  · simpa [driftAt, driftCertificate] using h_drift_floor`,
  };
}

export function generateLeanFromGnosisAst(
  ast: GraphAST | null,
  stability: StabilityReport | null,
  options: GnosisLeanOptions = {}
): GnosisLeanArtifact | null {
  if (!ast || !stability?.enabled) {
    return null;
  }

  const moduleName = buildModuleName(options);
  const theoremName =
    options.theoremName ?? sanitizeLeanIdentifier(stability.proof.theoremName);
  const { definitions, theorem } = buildKernelDefinitions(ast, stability, theoremName);

  const lean = `import GnosisProofs
import Mathlib.Tactic

open GnosisProofs

namespace ${moduleName}

${definitions}

/- Auto-generated by Betti thermodynamic auditor.
   proof-kind: ${stability.proof.kind}
   proof-summary: ${stability.proof.summary}
   harris-recurrent: ${stability.harrisRecurrent}
   vent-isolation-ok: ${stability.ventIsolationOk}
-/

${theorem}

end ${moduleName}
`;

  return {
    moduleName,
    theoremName,
    lean,
  };
}
