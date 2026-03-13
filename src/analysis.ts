import { performance } from 'node:perf_hooks';
import {
  checkGgProgram,
  parseGgProgram,
  type CheckerResult,
  type GgTopologyState,
} from '@affectively/aeon-logic';
import {
  inferCapabilitiesFromGgSource,
  validateCapabilitiesForTarget,
  type CapabilityIssue,
  type CapabilityRequirement,
  type HostCapability,
  type RuntimeTarget,
} from './capabilities/index.js';
import { lowerUfcsSource } from './ufcs.js';
import {
  Points,
  Series,
  graphEda,
  graphOutliers,
  type GraphEdaSummary,
  type GraphEdge,
  type GraphOutlierResult,
  type PointsDescription,
  type SeriesDescription,
} from 'twokeys';

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
  expandedEdgeCount: number;
  structuralBeta1: number;
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

export const VALID_GNOSIS_STEERING_MODES = [
  'off',
  'report',
  'suggest',
  'apply',
] as const;

export type GnosisSteeringMode = (typeof VALID_GNOSIS_STEERING_MODES)[number];

export const DEFAULT_GNOSIS_STEERING_MODE: GnosisSteeringMode = 'suggest';

export type GnosisSteeringRegime = 'laminar' | 'transitional' | 'turbulent';

export type GnosisSteeringAction =
  | 'expand'
  | 'staggered-expand'
  | 'hold'
  | 'multiplex'
  | 'constrain';

export interface GnosisSteeringTelemetry {
  /**
   * Observed wall-clock time in micro-Charleys.
   * A micro-Charley is one millisecond.
   */
  wallMicroCharleys: number | null;
  /** Observed CPU time in micro-Charleys. */
  cpuMicroCharleys: number | null;
  /** wall / cpu, when both are available. */
  wallToCpuRatio: number | null;
}

export interface GnosisSteeringStopwatch {
  wallStartedAtMs: number;
  cpuStartedAt: NodeJS.CpuUsage;
}

export interface GnosisSteeringEda {
  frontierWidths: SeriesDescription;
  layerOccupancy: SeriesDescription;
  wavefrontShape: PointsDescription;
  graph: GraphEdaSummary<string>;
  graphOutliers: GraphOutlierResult<string>[];
}

export interface GnosisSteeringMetrics {
  mode: GnosisSteeringMode;
  autoApplyEnabled: boolean;
  /** Steering actuators are not wired yet; `apply` is contract-only for now. */
  applySupported: boolean;
  /** Primary scalar statistic for frontier pessimism / underfill; canonical Wallace surface. */
  wallaceNumber: number;
  wallaceUnit: 'wally';
  /** Short-form alias for Wallace output. Legacy `charleyNumber` is removed. */
  wally: number;
  topologyDeficit: number;
  frontierFill: number;
  /** Descriptive underfill field kept alongside the canonical Wallace surface. */
  frontierDeficit: number;
  regime: GnosisSteeringRegime;
  recommendedAction: GnosisSteeringAction | null;
  eda: GnosisSteeringEda;
  telemetry: GnosisSteeringTelemetry;
}

export interface GnosisComplexityReport {
  fileCount: number;
  line: GnosisLineMetrics;
  topology: GnosisTopologyMetrics;
  quantum: GnosisQuantumMetrics;
  steering: GnosisSteeringMetrics;
  buleyNumber: number;
  correctness: CheckerResult<GgTopologyState>;
  capabilities: GnosisCapabilityReport;
}

export interface GnosisCapabilityReport {
  target: RuntimeTarget;
  required: CapabilityRequirement[];
  requiredUnique: HostCapability[];
  issues: CapabilityIssue[];
  ok: boolean;
}

export interface GnosisAnalyzeOptions {
  target?: RuntimeTarget;
  steeringMode?: GnosisSteeringMode;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildLineMetrics(source: string): GnosisLineMetrics {
  const lines = source.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0).length;
  const commentLines = lines.filter((line) =>
    line.trim().startsWith('//')
  ).length;
  const topologyLines = lines.filter((line) => line.includes('-[:')).length;

  return {
    totalLines,
    nonEmptyLines,
    commentLines,
    topologyLines,
  };
}

type ParsedGgProgram = ReturnType<typeof parseGgProgram>;

function expandGraphEdges(program: ParsedGgProgram): GraphEdge<string>[] {
  const expandedEdges: GraphEdge<string>[] = [];

  for (const edge of program.edges) {
    for (const sourceId of edge.sourceIds) {
      for (const targetId of edge.targetIds) {
        expandedEdges.push({
          from: sourceId,
          to: targetId,
          weight: 1,
        });
      }
    }
  }

  return expandedEdges;
}

function countConnectedComponents(program: ParsedGgProgram): number {
  const neighbors = new Map<string, Set<string>>();

  for (const node of program.nodes) {
    neighbors.set(node.id, new Set<string>());
  }

  for (const edge of program.edges) {
    for (const sourceId of edge.sourceIds) {
      const sourceNeighbors = neighbors.get(sourceId);
      if (!sourceNeighbors) {
        continue;
      }

      for (const targetId of edge.targetIds) {
        sourceNeighbors.add(targetId);
        const targetNeighbors = neighbors.get(targetId);
        if (targetNeighbors) {
          targetNeighbors.add(sourceId);
        }
      }
    }
  }

  let components = 0;
  const visited = new Set<string>();

  for (const nodeId of neighbors.keys()) {
    if (visited.has(nodeId)) {
      continue;
    }

    components += 1;
    const frontier = [nodeId];

    while (frontier.length > 0) {
      const currentNodeId = frontier.pop();
      if (!currentNodeId || visited.has(currentNodeId)) {
        continue;
      }

      visited.add(currentNodeId);
      const currentNeighbors = neighbors.get(currentNodeId);
      if (!currentNeighbors) {
        continue;
      }

      for (const neighborId of currentNeighbors) {
        if (!visited.has(neighborId)) {
          frontier.push(neighborId);
        }
      }
    }
  }

  return Math.max(1, components);
}

function buildTopologyMetrics(program: ParsedGgProgram): GnosisTopologyMetrics {
  const edgeTypes = program.edges.map((edge) => edge.type.toUpperCase());
  const forkEdgeCount = edgeTypes.filter((type) => type === 'FORK').length;
  const raceEdgeCount = edgeTypes.filter((type) => type === 'RACE').length;
  const foldEdgeCount = edgeTypes.filter(
    (type) => type === 'FOLD' || type === 'COLLAPSE'
  ).length;
  const ventEdgeCount = edgeTypes.filter(
    (type) => type === 'VENT' || type === 'TUNNEL'
  ).length;
  const interfereEdgeCount = edgeTypes.filter(
    (type) => type === 'INTERFERE'
  ).length;
  const processEdgeCount = edgeTypes.filter(
    (type) => type === 'PROCESS'
  ).length;
  const observeEdgeCount = edgeTypes.filter(
    (type) => type === 'OBSERVE'
  ).length;
  const forkWidths = program.edges
    .filter((edge) => edge.type.toUpperCase() === 'FORK')
    .map((edge) => edge.targetIds.length);
  const maxBranchFactor = Math.max(1, ...forkWidths);
  const avgBranchFactor =
    forkWidths.length === 0
      ? 1
      : round2(
          forkWidths.reduce((sum, width) => sum + width, 0) / forkWidths.length
        );
  const expandedEdgeCount = program.edges.reduce(
    (sum, edge) => sum + edge.sourceIds.length * edge.targetIds.length,
    0
  );
  const connectedComponents = countConnectedComponents(program);
  const structuralBeta1 = Math.max(
    0,
    expandedEdgeCount - program.nodes.length + connectedComponents
  );

  return {
    nodeCount: program.nodes.length,
    functionNodeCount: program.nodes.filter((node) => node.labels.length > 0)
      .length,
    edgeCount: program.edges.length,
    expandedEdgeCount,
    structuralBeta1,
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
    cyclomaticApprox: Math.max(
      1,
      program.edges.length - program.nodes.length + 2
    ),
  };
}

export function classifySteeringRegime(wally: number): GnosisSteeringRegime {
  if (wally >= 0.4) {
    return 'turbulent';
  }
  if (wally >= 0.15) {
    return 'transitional';
  }
  return 'laminar';
}

export function surfaceSteeringMetrics(mode: GnosisSteeringMode): boolean {
  return mode !== 'off';
}

export function surfaceSteeringRecommendations(
  mode: GnosisSteeringMode
): boolean {
  return mode === 'suggest' || mode === 'apply';
}

function resolveSteeringMode(
  steeringMode?: GnosisSteeringMode
): GnosisSteeringMode {
  return steeringMode ?? DEFAULT_GNOSIS_STEERING_MODE;
}

export function recommendSteeringAction(
  topologyDeficit: number,
  wally: number,
  regime: GnosisSteeringRegime
): GnosisSteeringAction {
  if (topologyDeficit > 0.5 && wally >= 0.25) {
    return 'staggered-expand';
  }
  if (topologyDeficit > 0.5) {
    return 'expand';
  }
  if (topologyDeficit < -0.5 && wally >= 0.25) {
    return 'constrain';
  }
  if (regime === 'turbulent') {
    return 'multiplex';
  }
  return 'hold';
}

function buildSteeringEda(
  program: ParsedGgProgram,
  correctness: CheckerResult<GgTopologyState>
): GnosisSteeringEda {
  const frontierWidths =
    correctness.topology.frontierByLayer.length > 0
      ? [...correctness.topology.frontierByLayer]
      : [0];
  const peakFrontier = Math.max(1, ...frontierWidths);
  const occupancyByLayer = frontierWidths.map((width) => width / peakFrontier);
  const wavefrontPoints = frontierWidths.map((width, index) => [
    index + 1,
    width,
    occupancyByLayer[index] ?? 0,
  ]);
  const nodes = program.nodes.map((node) => ({ id: node.id }));
  const edges = expandGraphEdges(program);

  return {
    frontierWidths: new Series({ data: frontierWidths }).describe(),
    layerOccupancy: new Series({ data: occupancyByLayer }).describe(),
    wavefrontShape: new Points({ data: wavefrontPoints }).describe(),
    graph: graphEda(nodes, edges, { directed: true }),
    graphOutliers: graphOutliers(nodes, edges, { method: 'combined' }),
  };
}

export function createEmptySteeringTelemetry(): GnosisSteeringTelemetry {
  return {
    wallMicroCharleys: null,
    cpuMicroCharleys: null,
    wallToCpuRatio: null,
  };
}

export function startSteeringTelemetry(): GnosisSteeringStopwatch {
  return {
    wallStartedAtMs: performance.now(),
    cpuStartedAt: process.cpuUsage(),
  };
}

export function finishSteeringTelemetry(
  stopwatch: GnosisSteeringStopwatch
): GnosisSteeringTelemetry {
  const wallMicroCharleys = round2(
    performance.now() - stopwatch.wallStartedAtMs
  );
  const cpuUsage = process.cpuUsage(stopwatch.cpuStartedAt);
  const cpuMicroCharleys = round2((cpuUsage.user + cpuUsage.system) / 1000);

  return {
    wallMicroCharleys,
    cpuMicroCharleys,
    wallToCpuRatio:
      cpuMicroCharleys === 0
        ? null
        : round2(wallMicroCharleys / cpuMicroCharleys),
  };
}

export function withSteeringTelemetry(
  steering: GnosisSteeringMetrics,
  telemetry: GnosisSteeringTelemetry
): GnosisSteeringMetrics {
  return {
    ...steering,
    telemetry,
  };
}

function buildSteeringMetrics(
  program: ParsedGgProgram,
  topology: GnosisTopologyMetrics,
  correctness: CheckerResult<GgTopologyState>,
  steeringMode?: GnosisSteeringMode
): GnosisSteeringMetrics {
  const mode = resolveSteeringMode(steeringMode);
  const frontierFill = round2(correctness.topology.frontierFill);
  const checkerTopology =
    correctness.topology as typeof correctness.topology & {
      wally?: number;
    };
  const wally = round2(
    checkerTopology.wally ?? correctness.topology.frontierDeficit
  );
  const topologyDeficit = round2(
    topology.structuralBeta1 - correctness.topology.beta1
  );
  const regime = classifySteeringRegime(wally);
  const recommendedAction = recommendSteeringAction(
    topologyDeficit,
    wally,
    regime
  );

  return {
    mode,
    autoApplyEnabled: mode === 'apply',
    applySupported: false,
    wallaceNumber: wally,
    wallaceUnit: 'wally',
    wally,
    topologyDeficit,
    frontierFill,
    frontierDeficit: wally,
    regime,
    recommendedAction: surfaceSteeringRecommendations(mode)
      ? recommendedAction
      : null,
    eda: buildSteeringEda(program, correctness),
    telemetry: createEmptySteeringTelemetry(),
  };
}

function buildQuantumMetrics(
  topology: GnosisTopologyMetrics,
  correctness: CheckerResult<GgTopologyState>
): GnosisQuantumMetrics {
  const superpositionEdgeCount =
    topology.forkEdgeCount + topology.interfereEdgeCount;
  // OBSERVE is a collapse operation — reading forces superposition to resolve
  const collapseEdgeCount =
    topology.raceEdgeCount +
    topology.foldEdgeCount +
    topology.ventEdgeCount +
    topology.observeEdgeCount;
  const collapseCoverage =
    topology.forkEdgeCount === 0
      ? 1
      : round2(collapseEdgeCount / topology.forkEdgeCount);
  const collapseDeficit = Math.max(
    0,
    topology.forkEdgeCount - collapseEdgeCount
  );
  const interferenceDensity =
    topology.edgeCount === 0
      ? 0
      : round2(topology.interfereEdgeCount / topology.edgeCount);
  const betaPressure = round2(
    topology.maxBranchFactor * Math.max(1, topology.forkEdgeCount) +
      topology.interfereEdgeCount * 1.5 +
      correctness.topology.beta1
  );
  const betaHeadroom = round2(Math.max(0, 10 - correctness.topology.beta1));
  const quantumIndex = round2(
    betaPressure +
      collapseDeficit * 2 +
      Math.max(0, 1 - collapseCoverage) * 4 +
      interferenceDensity * 5
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
  topology: GnosisTopologyMetrics
): number {
  const sizeComponent = Math.log2(line.nonEmptyLines + 1);
  const branchComponent =
    topology.forkEdgeCount * 2.3 +
    topology.raceEdgeCount * 1.6 +
    topology.interfereEdgeCount * 1.4 +
    topology.maxBranchFactor * 1.1;
  const collapsePenalty =
    Math.max(
      0,
      topology.forkEdgeCount -
        (topology.foldEdgeCount +
          topology.raceEdgeCount +
          topology.ventEdgeCount)
    ) * 1.75;
  const shapeComponent = topology.cyclomaticApprox * 1.35;
  const functionDensity =
    topology.nodeCount > 0
      ? topology.functionNodeCount / topology.nodeCount
      : 0;

  return round2(
    sizeComponent +
      branchComponent +
      collapsePenalty +
      shapeComponent +
      functionDensity * 2
  );
}

export function formatGnosisViolations(
  result: CheckerResult<GgTopologyState>
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
  options: GnosisAnalyzeOptions = {}
): Promise<GnosisComplexityReport> {
  const normalizedSource = lowerUfcsSource(source);
  const line = buildLineMetrics(source);
  const program = parseGgProgram(normalizedSource);
  const topology = buildTopologyMetrics(program);
  const target = options.target ?? 'agnostic';
  const correctness = await checkGgProgram(normalizedSource, {
    defaults: {
      maxDepth: 64,
      maxBeta1Exclusive: 10,
    },
  });
  const quantum = buildQuantumMetrics(topology, correctness);
  const steering = buildSteeringMetrics(
    program,
    topology,
    correctness,
    options.steeringMode
  );
  const capabilityRequirements = inferCapabilitiesFromGgSource(source);
  const capabilityValidation = validateCapabilitiesForTarget(
    capabilityRequirements,
    target
  );

  return {
    fileCount: 1,
    line,
    topology,
    quantum,
    steering,
    buleyNumber: computeBuleyNumber(line, topology),
    correctness,
    capabilities: {
      target: capabilityValidation.target,
      required: capabilityValidation.required,
      requiredUnique: capabilityValidation.requiredUnique,
      issues: capabilityValidation.issues,
      ok: capabilityValidation.ok,
    },
  };
}
