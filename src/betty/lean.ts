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

function buildTransitionDefinition(
  indexedKernelEdges: readonly IndexedKernelEdge[]
): string {
  const clauses = indexedKernelEdges
    .map(
      (edge) =>
        `    | ${edge.sourceIndex}, ${edge.targetIndex} => ${formatLeanReal(edge.weight)}`
    )
    .join('\n');

  return `def transition : Fin topologyNodeCount -> Fin topologyNodeCount -> Real :=
  fun source target =>
    match source.1, target.1 with
${clauses.length > 0 ? `${clauses}\n` : ''}    | _, _ => 0`;
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
  const topologyNodes = toLeanStringList(nodeIds);
  const smallSetNodeIds = toLeanStringList(stability.smallSetNodeIds);
  const topologyNodeCount = nodeIds.length;
  const spectralCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const redline = formatLeanReal(stability.redline ?? 0);
  const geometricCeiling = formatLeanReal(stability.geometricCeiling ?? stability.spectralRadius ?? 0);
  const gammaValue = buildGammaValue(stability);
  const transitionDefinition = buildTransitionDefinition(indexedKernelEdges);

  const sharedDefinitions = `abbrev NodeId := String

def topologyNodeCount : Nat := ${topologyNodeCount}
def topologyNodes : List NodeId := ${topologyNodes}
def smallSetNodeIds : List NodeId := ${smallSetNodeIds}

${transitionDefinition}
`;

  if (stability.proof.kind === 'bounded-supremum') {
    return {
      nodeIds,
      definitions: `${sharedDefinitions}
def kernel : CertifiedKernel topologyNodeCount := {
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
  apply certifiedKernel_stable_of_supremum (kernel := kernel)
  · norm_num [SpectrallyStable, kernel]
  · rfl`,
    };
  }

  if (stability.proof.kind === 'numeric') {
    const firstAssessment = stability.stateAssessments[0];
    const lamValue = firstAssessment?.arrival ?? '0';
    const muValue = firstAssessment?.service ?? '0';
    const alphaValue = firstAssessment?.vent ?? '0';

    return {
      nodeIds,
      definitions: `${sharedDefinitions}
def lam : Real := ${lamValue}
def mu : Real := ${muValue}
def alpha : Nat -> Real := fun _ => ${alphaValue}

def driftCertificate : DriftCertificate := {
  gamma := ${gammaValue}
  arrivalRate := lam
  serviceRate := mu
  ventRate := alpha
}

def kernel : CertifiedKernel topologyNodeCount := {
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
  apply certifiedKernel_stable_of_drift_certificate
    (kernel := kernel)
    (certificate := driftCertificate)
  · rfl
  · norm_num [SpectrallyStable, kernel]
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

  return {
    nodeIds,
    definitions: `${sharedDefinitions}
def driftCertificate (lam mu : Real) (alpha : Nat -> Real) : DriftCertificate := {
  gamma := ${gammaValue}
  arrivalRate := lam
  serviceRate := mu
  ventRate := alpha
}

def kernel (lam mu : Real) (alpha : Nat -> Real) : CertifiedKernel topologyNodeCount := {
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
  apply certifiedKernel_stable_of_drift_certificate
    (kernel := kernel lam mu alpha)
    (certificate := driftCertificate lam mu alpha)
  · rfl
  · norm_num [SpectrallyStable, kernel]
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
