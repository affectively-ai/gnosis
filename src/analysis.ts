import {
  checkGgProgram,
  parseGgProgram,
  type CheckerResult,
  type GgTopologyState,
} from '@affectively/aeon-logic';

export interface GnosisLineMetrics {
  totalLines: number;
  nonEmptyLines: number;
  commentLines: number;
  topologyLines: number;
}

export interface GnosisTopologyMetrics {
  nodeCount: number;
  functionNodeCount: number;
  edgeCount: number;
  forkEdgeCount: number;
  raceEdgeCount: number;
  foldEdgeCount: number;
  ventEdgeCount: number;
  interfereEdgeCount: number;
  processEdgeCount: number;
  observeEdgeCount: number;
  maxBranchFactor: number;
  avgBranchFactor: number;
  cyclomaticApprox: number;
}

export interface GnosisQuantumMetrics {
  superpositionEdgeCount: number;
  collapseEdgeCount: number;
  collapseCoverage: number;
  collapseDeficit: number;
  interferenceDensity: number;
  betaPressure: number;
  betaHeadroom: number;
  quantumIndex: number;
}

export interface GnosisComplexityReport {
  fileCount: number;
  line: GnosisLineMetrics;
  topology: GnosisTopologyMetrics;
  quantum: GnosisQuantumMetrics;
  buleyNumber: number;
  correctness: CheckerResult<GgTopologyState>;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildLineMetrics(source: string): GnosisLineMetrics {
  const lines = source.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const commentLines = lines.filter((line) => line.trim().startsWith('//')).length;
  const topologyLines = lines.filter((line) => line.includes('-[:')).length;

  return {
    totalLines,
    nonEmptyLines,
    commentLines,
    topologyLines,
  };
}

function buildTopologyMetrics(source: string): GnosisTopologyMetrics {
  const program = parseGgProgram(source);
  const edgeTypes = program.edges.map((edge) => edge.type.toUpperCase());
  const forkEdgeCount = edgeTypes.filter((type) => type === 'FORK').length;
  const raceEdgeCount = edgeTypes.filter((type) => type === 'RACE').length;
  const foldEdgeCount = edgeTypes.filter((type) => type === 'FOLD' || type === 'COLLAPSE').length;
  const ventEdgeCount = edgeTypes.filter((type) => type === 'VENT' || type === 'TUNNEL').length;
  const interfereEdgeCount = edgeTypes.filter((type) => type === 'INTERFERE').length;
  const processEdgeCount = edgeTypes.filter((type) => type === 'PROCESS').length;
  const observeEdgeCount = edgeTypes.filter((type) => type === 'OBSERVE').length;
  const forkWidths = program.edges
    .filter((edge) => edge.type.toUpperCase() === 'FORK')
    .map((edge) => edge.targetIds.length);
  const maxBranchFactor = Math.max(
    1,
    ...forkWidths,
  );
  const avgBranchFactor =
    forkWidths.length === 0
      ? 1
      : round2(forkWidths.reduce((sum, width) => sum + width, 0) / forkWidths.length);

  return {
    nodeCount: program.nodes.length,
    functionNodeCount: program.nodes.filter((node) => node.labels.length > 0).length,
    edgeCount: program.edges.length,
    forkEdgeCount,
    raceEdgeCount,
    foldEdgeCount,
    ventEdgeCount,
    interfereEdgeCount,
    processEdgeCount,
    observeEdgeCount,
    maxBranchFactor,
    avgBranchFactor,
    // McCabe-style approximation for directed graph workflows.
    cyclomaticApprox: Math.max(1, program.edges.length - program.nodes.length + 2),
  };
}

function buildQuantumMetrics(
  topology: GnosisTopologyMetrics,
  correctness: CheckerResult<GgTopologyState>,
): GnosisQuantumMetrics {
  const superpositionEdgeCount = topology.forkEdgeCount + topology.interfereEdgeCount;
  // OBSERVE is a collapse operation — reading forces superposition to resolve
  const collapseEdgeCount = topology.raceEdgeCount + topology.foldEdgeCount + topology.ventEdgeCount + topology.observeEdgeCount;
  const collapseCoverage =
    topology.forkEdgeCount === 0 ? 1 : round2(collapseEdgeCount / topology.forkEdgeCount);
  const collapseDeficit = Math.max(0, topology.forkEdgeCount - collapseEdgeCount);
  const interferenceDensity =
    topology.edgeCount === 0 ? 0 : round2(topology.interfereEdgeCount / topology.edgeCount);
  const betaPressure = round2(
    topology.maxBranchFactor * Math.max(1, topology.forkEdgeCount) +
      topology.interfereEdgeCount * 1.5 +
      correctness.topology.beta1,
  );
  const betaHeadroom = round2(Math.max(0, 10 - correctness.topology.beta1));
  const quantumIndex = round2(
    betaPressure +
      collapseDeficit * 2 +
      Math.max(0, 1 - collapseCoverage) * 4 +
      interferenceDensity * 5,
  );

  return {
    superpositionEdgeCount,
    collapseEdgeCount,
    collapseCoverage,
    collapseDeficit,
    interferenceDensity,
    betaPressure,
    betaHeadroom,
    quantumIndex,
  };
}

function computeBuleyNumber(
  line: GnosisLineMetrics,
  topology: GnosisTopologyMetrics,
): number {
  const sizeComponent = Math.log2(line.nonEmptyLines + 1);
  const branchComponent =
    topology.forkEdgeCount * 2.3 +
    topology.raceEdgeCount * 1.6 +
    topology.interfereEdgeCount * 1.4 +
    topology.maxBranchFactor * 1.1;
  const collapsePenalty =
    Math.max(0, topology.forkEdgeCount - (topology.foldEdgeCount + topology.raceEdgeCount + topology.ventEdgeCount)) *
    1.75;
  const shapeComponent = topology.cyclomaticApprox * 1.35;
  const functionDensity =
    topology.nodeCount > 0 ? topology.functionNodeCount / topology.nodeCount : 0;

  return round2(
    sizeComponent +
      branchComponent +
      collapsePenalty +
      shapeComponent +
      functionDensity * 2,
  );
}

export function formatGnosisViolations(
  result: CheckerResult<GgTopologyState>,
): string[] {
  if (result.ok) {
    return [];
  }

  return result.violations.map((violation) => {
    const trace = violation.trace.map((step) => step.stateId).join(' -> ');
    if (trace.length === 0) {
      return `${violation.kind}:${violation.name} ${violation.message}`;
    }
    return `${violation.kind}:${violation.name} ${violation.message} trace=${trace}`;
  });
}

export async function analyzeGnosisSource(
  source: string,
): Promise<GnosisComplexityReport> {
  const line = buildLineMetrics(source);
  const topology = buildTopologyMetrics(source);
  const correctness = await checkGgProgram(source, {
    defaults: {
      maxDepth: 64,
      maxBeta1Exclusive: 10,
    },
  });
  const quantum = buildQuantumMetrics(topology, correctness);

  return {
    fileCount: 1,
    line,
    topology,
    quantum,
    buleyNumber: computeBuleyNumber(line, topology),
    correctness,
  };
}
