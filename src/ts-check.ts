/**
 * Gnosis TypeScript Check Engine
 *
 * Unified pipeline: TS source -> GG topology -> formal check -> flat diagnostics.
 * Bridges the ts-bridge, analysis, and SARIF modules into a single check API.
 */

import {
  compileTypeScriptToGnosis,
  type GnosisTypeScriptBridgeNodePlan,
  type GnosisTypeScriptBridgeResult,
  type GnosisTypeScriptBridgeSourceLocation,
} from './ts-bridge.js';
import {
  analyzeGnosisSource,
  formatGnosisViolations,
  type GnosisComplexityReport,
  type GnosisSteeringRegime,
} from './analysis.js';
import { ggReportToSarif } from './sarif.js';
import type { RuntimeTarget } from './capabilities/index.js';

export interface GnosisTypeScriptCheckOptions {
  readonly exportName?: string;
  readonly maxBuley?: number;
  readonly target?: RuntimeTarget;
}

export type GnosisTypeScriptCheckDiagnosticLevel = 'error' | 'warning' | 'note';

export interface GnosisTypeScriptCheckDiagnostic {
  readonly ruleId: string;
  readonly level: GnosisTypeScriptCheckDiagnosticLevel;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export interface GnosisTypeScriptCheckTopologyNode {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

export interface GnosisTypeScriptCheckTopologyEdge {
  readonly from: string;
  readonly to: string;
  readonly type: string;
}

export interface GnosisTypeScriptCheckTopologyGraph {
  readonly nodes: readonly GnosisTypeScriptCheckTopologyNode[];
  readonly edges: readonly GnosisTypeScriptCheckTopologyEdge[];
}

export interface GnosisTypeScriptCheckMetrics {
  readonly buleyNumber: number;
  readonly wallaceNumber: number;
  readonly regime: GnosisSteeringRegime;
  readonly beta1: number;
  readonly quantumIndex: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
}

export interface GnosisTypeScriptCheckResult {
  readonly ok: boolean;
  readonly diagnostics: readonly GnosisTypeScriptCheckDiagnostic[];
  readonly metrics: GnosisTypeScriptCheckMetrics;
  readonly topology: GnosisTypeScriptCheckTopologyGraph;
  readonly sarif: unknown;
  readonly ggSource: string;
}

function buildNodeLocationMap(
  nodePlans: readonly GnosisTypeScriptBridgeNodePlan[]
): Map<string, GnosisTypeScriptBridgeSourceLocation> {
  const map = new Map<string, GnosisTypeScriptBridgeSourceLocation>();
  for (const plan of nodePlans) {
    if (plan.sourceLocation) {
      map.set(plan.nodeId, plan.sourceLocation);
    }
  }
  return map;
}

function defaultLocation(): { line: number; column: number } {
  return { line: 1, column: 1 };
}

function buildTopologyGraph(
  bridgeResult: GnosisTypeScriptBridgeResult,
  report: GnosisComplexityReport
): GnosisTypeScriptCheckTopologyGraph {
  const locationMap = buildNodeLocationMap(bridgeResult.nodePlans);
  const plansByNodeId = new Map<string, GnosisTypeScriptBridgeNodePlan>();
  for (const plan of bridgeResult.nodePlans) {
    plansByNodeId.set(plan.nodeId, plan);
  }

  const layerAssignment = new Map<string, number>();
  let layerIndex = 0;
  for (const wave of bridgeResult.schedule) {
    for (const nodeId of wave.nodeIds) {
      layerAssignment.set(nodeId, layerIndex);
    }
    layerIndex += 1;
  }

  const nodesPerLayer = new Map<number, number>();
  for (const [, layer] of layerAssignment) {
    nodesPerLayer.set(layer, (nodesPerLayer.get(layer) ?? 0) + 1);
  }
  const layerCounters = new Map<number, number>();

  const nodes: GnosisTypeScriptCheckTopologyNode[] = [];
  for (const plan of bridgeResult.nodePlans) {
    const layer = layerAssignment.get(plan.nodeId) ?? 0;
    const indexInLayer = layerCounters.get(layer) ?? 0;
    layerCounters.set(layer, indexInLayer + 1);
    const totalInLayer = nodesPerLayer.get(layer) ?? 1;
    const xSpread =
      totalInLayer > 1 ? (indexInLayer / (totalInLayer - 1)) * 10 - 5 : 0;

    nodes.push({
      id: plan.nodeId,
      label: 'calleeName' in plan ? plan.calleeName : plan.kind,
      kind: plan.kind,
      x: xSpread,
      y: layer * -3,
      sourceLocation: locationMap.get(plan.nodeId),
    });
  }

  const edges: GnosisTypeScriptCheckTopologyEdge[] = [];
  for (const edge of bridgeResult.ast.edges) {
    for (const sourceId of edge.sourceIds) {
      for (const targetId of edge.targetIds) {
        edges.push({
          from: sourceId,
          to: targetId,
          type: edge.type,
        });
      }
    }
  }

  return { nodes, edges };
}

export async function checkTypeScriptWithGnosis(
  sourceText: string,
  filePath: string,
  options: GnosisTypeScriptCheckOptions = {}
): Promise<GnosisTypeScriptCheckResult> {
  const bridgeResult = compileTypeScriptToGnosis(sourceText, {
    exportName: options.exportName,
    sourceFilePath: filePath,
  });

  const report = await analyzeGnosisSource(bridgeResult.ggSource, {
    target: options.target,
  });

  const formattedViolations = formatGnosisViolations(report.correctness);
  const sarif = ggReportToSarif(
    filePath,
    report,
    formattedViolations,
    options.maxBuley ?? null
  );

  const locationMap = buildNodeLocationMap(bridgeResult.nodePlans);
  const diagnostics: GnosisTypeScriptCheckDiagnostic[] = [];

  for (const violation of formattedViolations) {
    const loc = locationMap.values().next().value ?? defaultLocation();
    diagnostics.push({
      ruleId: 'gnosis/formal-violation',
      level: 'error',
      message: violation,
      line: loc.line,
      column: loc.column,
    });
  }

  if (options.maxBuley !== undefined && report.buleyNumber > options.maxBuley) {
    diagnostics.push({
      ruleId: 'gnosis/buley-threshold',
      level: 'warning',
      message: `Buley number ${report.buleyNumber} exceeds threshold ${options.maxBuley}`,
      line: 1,
      column: 1,
    });
  }

  for (const issue of report.capabilities.issues) {
    const loc = issue.nodeId
      ? locationMap.get(issue.nodeId) ?? defaultLocation()
      : defaultLocation();
    diagnostics.push({
      ruleId: `gnosis/capability-${issue.capability}`,
      level: issue.severity === 'error' ? 'error' : 'warning',
      message: `${issue.message} (target=${issue.target})`,
      line: loc.line,
      column: loc.column,
    });
  }

  const regime = report.steering.regime;
  if (regime === 'turbulent') {
    diagnostics.push({
      ruleId: 'gnosis/steering-turbulent',
      level: 'warning',
      message: `Steering regime is turbulent (wallace=${report.steering.wallaceNumber}, bias=${report.steering.leanInBias})`,
      line: 1,
      column: 1,
    });
  }

  const topology = buildTopologyGraph(bridgeResult, report);

  const metrics: GnosisTypeScriptCheckMetrics = {
    buleyNumber: report.buleyNumber,
    wallaceNumber: report.steering.wallaceNumber,
    regime,
    beta1: report.topology.structuralBeta1,
    quantumIndex: report.quantum.quantumIndex,
    nodeCount: report.topology.nodeCount,
    edgeCount: report.topology.edgeCount,
  };

  return {
    ok: diagnostics.filter((d) => d.level === 'error').length === 0,
    diagnostics,
    metrics,
    topology,
    sarif,
    ggSource: bridgeResult.ggSource,
  };
}
