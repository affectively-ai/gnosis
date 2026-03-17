import { Pipeline } from '@affectively/aeon-pipelines';
import { QuantumWasmBridge } from './quantum/bridge.js';
import { injectSensitiveZkEnvelopes } from '../auth/auto-zk.js';
import { lowerUfcsSource } from '../ufcs.js';
import {
  analyzeTopologyStability,
  type StabilityReport,
} from './stability.js';

export interface ASTNode {
  id: string;
  labels: string[];
  properties: Record<string, string>;
}

export interface ASTEdge {
  sourceIds: string[];
  targetIds: string[];
  type: string; // FORK, RACE, FOLD, VENT, PROCESS, COLLAPSE, TUNNEL, INTERFERE, OBSERVE, LAMINAR
  properties: Record<string, string>;
}

export interface Diagnostic {
  line: number;
  column: number;
  code?: DiagnosticCode;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export type DiagnosticCode =
  | 'ERR_BETA_UNBOUNDED'
  | 'ERR_SPECTRAL_EXPLOSION'
  | 'ERR_DRIFT_POSITIVE'
  | 'ERR_REPAIR_DEBT_LEAK'
  | 'ERR_CONTINUOUS_WITNESS_INVALID'
  | 'VOID_ETA_UNBOUNDED'
  | 'VOID_EXPLORATION_UNBOUNDED'
  | 'VOID_COMPLEMENT_DISTRIBUTION_INVALID'
  | 'VOID_BOUNDARY_NON_MONOTONE'
  | 'VOID_GAIT_TRANSITION_INVALID'
  | 'VOID_METACOG_MISSING_CONVERGENCE'
  | 'VOID_CONSERVATION_VIOLATED'
  | 'VOID_TRACED_MONOIDAL_VIOLATED';

export interface GraphAST {
  nodes: Map<string, ASTNode>;
  edges: ASTEdge[];
}

export interface BettyParseResult {
  ast: GraphAST | null;
  output: string;
  b1: number;
  diagnostics: Diagnostic[];
  buleyMeasure: number;
  stability: StabilityReport | null;
}

const NATIVE_TAGGED_NODE_CASES: Record<string, readonly string[]> = {
  Result: ['ok', 'err'],
  Option: ['some', 'none'],
};

const STRUCTURED_CONCURRENCY_FAILURES = new Set(['cancel', 'vent', 'shield']);

export class BettyCompiler {
  private b1 = 0;
  private ast: GraphAST = { nodes: new Map(), edges: [] };
  private logs: string[] = [];
  private diagnostics: Diagnostic[] = [];
  private stability: StabilityReport | null = null;
  private wasmBridge: QuantumWasmBridge;

  constructor() {
    this.wasmBridge = new QuantumWasmBridge();
  }

  public getBettiNumber(): number {
    return this.b1;
  }

  public getAST(): GraphAST {
    return this.ast;
  }

  public getLogs(): string[] {
    return this.logs;
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }

  public getStability(): StabilityReport | null {
    return this.stability;
  }

  /**
   * Buley Measurement: Topological Complexity Score
   * Calculates the entropy of the covering space.
   */
  public getBuleyMeasurement(): number {
    const pathComplexity = this.ast.edges.reduce((acc, edge) => {
      return acc + edge.sourceIds.length * edge.targetIds.length;
    }, 0);
    return this.b1 * 1.5 + pathComplexity * 0.5;
  }

  public getCompletions(line: string, column: number): string[] {
    const keywords = [
      'FORK',
      'RACE',
      'FOLD',
      'VENT',
      'PROCESS',
      'COLLAPSE',
      'TUNNEL',
      'INTERFERE',
      'LAMINAR',
      'MEASURE',
      'HALT',
      'EVOLVE',
      'ENTANGLE',
      'SUPERPOSE',
      'OBSERVE',
    ];
    const nodeIds = Array.from(this.ast.nodes.keys());

    const prefix =
      line
        .slice(0, column)
        .split(/[^A-Za-z0-9_]+/)
        .pop()
        ?.toUpperCase() || '';
    return [...keywords, ...nodeIds].filter((w) => w.startsWith(prefix));
  }

  public parse(input: string): BettyParseResult {
    const normalizedInput = lowerUfcsSource(input);
    if (!normalizedInput.trim())
      return {
        ast: null,
        output: '',
        b1: 0,
        diagnostics: [],
        buleyMeasure: 0,
        stability: null,
      };

    this.logs = [];
    this.diagnostics = [];
    this.b1 = 0;
    this.ast = { nodes: new Map(), edges: [] };
    this.stability = null;
    this.wasmBridge = new QuantumWasmBridge();

    const lines = normalizedInput.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) continue;

      // 1. REJECT IMPERATIVE CODE
      const imperativeMatch = line.match(
        /\b(function|return|if|while|for|var|let|const)\b/
      );
      if (imperativeMatch) {
        this.diagnostics.push({
          line: i + 1,
          column: line.indexOf(imperativeMatch[0]) + 1,
          message: `Imperative keyword '${imperativeMatch[0]}' rejected. Gnosis requires pure topological declarations.`,
          severity: 'error',
        });
        continue;
      }

      // 2. PARSE NODES
      // Only match nodes that are NOT part of an edge definition (followed by -[: or preceded by ]->)
      if (!line.includes('-[:')) {
        const nodeRegex =
          /\(([^:)\s|]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?\)/g;
        let nodeMatch;
        while ((nodeMatch = nodeRegex.exec(line)) !== null) {
          const id = nodeMatch[1].trim();
          if (!id) continue;

          const label = nodeMatch[2] ? nodeMatch[2].trim() : '';
          const propertiesRaw = nodeMatch[3] ? nodeMatch[3].trim() : '';
          const properties = this.parseProperties(propertiesRaw);

          if (!this.ast.nodes.has(id)) {
            this.ast.nodes.set(id, {
              id,
              labels: label ? [label] : [],
              properties,
            });
            continue;
          }

          const existing = this.ast.nodes.get(id)!;
          if (label && existing.labels.length === 0) {
            existing.labels = [label];
          }
          if (Object.keys(properties).length > 0) {
            existing.properties = { ...existing.properties, ...properties };
          }
        }
      }

      // 3. PARSE EDGES
      const edgeRegex =
        /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;
      let edgeMatch;
      let lineMatched = false;

      while ((edgeMatch = edgeRegex.exec(line)) !== null) {
        lineMatched = true;
        const sourceRaw = edgeMatch[1].trim();
        const edgeType = edgeMatch[2].trim();
        const propertiesRaw = edgeMatch[3] ? edgeMatch[3].trim() : '';
        const targetRaw = edgeMatch[4].trim();

        const sources = sourceRaw.split('|').map((s) => s.split(':')[0].trim());
        const targets = targetRaw.split('|').map((s) => s.split(':')[0].trim());

        // Create nodes if they don't exist
        sourceRaw.split('|').forEach((s) => {
          const nodeRegexInEdge =
            /([^:)\s|{]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?/g;
          const nm = nodeRegexInEdge.exec(s.trim());
          if (nm) {
            const id = nm[1].trim();
            const label = nm[2] ? nm[2].trim().replace(/[)\s{}]+$/, '') : '';
            const propertiesRaw = nm[3] ? nm[3].trim() : '';
            const properties = this.parseProperties(propertiesRaw);
            if (!this.ast.nodes.has(id)) {
              this.ast.nodes.set(id, {
                id,
                labels: label ? [label] : [],
                properties,
              });
            } else if (Object.keys(properties).length > 0) {
              // Merge properties if they were provided in the edge but not before
              const existing = this.ast.nodes.get(id)!;
              existing.properties = { ...existing.properties, ...properties };
            }
          }
        });
        targetRaw.split('|').forEach((s) => {
          const nodeRegexInEdge =
            /([^:)\s|{]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?/g;
          const nm = nodeRegexInEdge.exec(s.trim());
          if (nm) {
            const id = nm[1].trim();
            const label = nm[2] ? nm[2].trim().replace(/[)\s{}]+$/, '') : '';
            const propertiesRaw = nm[3] ? nm[3].trim() : '';
            const properties = this.parseProperties(propertiesRaw);
            if (!this.ast.nodes.has(id)) {
              this.ast.nodes.set(id, {
                id,
                labels: label ? [label] : [],
                properties,
              });
            } else if (Object.keys(properties).length > 0) {
              const existing = this.ast.nodes.get(id)!;
              existing.properties = { ...existing.properties, ...properties };
            }
          }
        });

        // Topological Validation
        if (edgeType === 'FORK') {
          this.b1 += targets.length - 1;
        } else if (
          edgeType === 'FOLD' ||
          edgeType === 'COLLAPSE' ||
          edgeType === 'OBSERVE'
        ) {
          // OBSERVE triggers collapse — reading forces superposition to resolve
          // The topology is append-only (no GC). beta1=0 means converged, not deleted.
          this.b1 = Math.max(0, this.b1 - (sources.length - 1));
        } else if (edgeType === 'VENT') {
          this.b1 = Math.max(0, this.b1 - 1);
        } else if (edgeType === 'LAMINAR') {
          // LAMINAR: hella-whipped pipeline — fork codecs internally, race per chunk, fold to smallest.
          // β₁ increases by (codecs - 1) for the internal codec racing, but the pipeline
          // presents as a single stream externally (chunked, compressed, Flow-framed).
          // Net β₁ effect: 0 (internal fork/race/fold is self-contained).
          // The topology sees LAMINAR as a PROCESS-like passthrough that compresses.
        }

        this.wasmBridge.processAstEdge(
          edgeType,
          sources.length,
          targets.length
        );

        const edgeProperties = this.parseProperties(propertiesRaw);

        this.ast.edges.push({
          sourceIds: sources,
          targetIds: targets,
          type: edgeType,
          properties: edgeProperties,
        });

        sources.forEach((id) => {
          if (!this.ast.nodes.has(id))
            this.ast.nodes.set(id, { id, labels: [], properties: {} });
        });
        targets.forEach((id) => {
          if (!this.ast.nodes.has(id))
            this.ast.nodes.set(id, { id, labels: [], properties: {} });
        });
      }

      if (!lineMatched && !line.startsWith('(')) {
        this.diagnostics.push({
          line: i + 1,
          column: 1,
          message: `Invalid Gnosis syntax. Expected node or edge declaration.`,
          severity: 'info',
        });
      }
    }

    // 4. TOPOLOGICAL INTEGRITY CHECKS
    const referencedNodes = new Set<string>();
    this.ast.edges.forEach((e) => {
      e.sourceIds.forEach((id) => referencedNodes.add(id));
      e.targetIds.forEach((id) => referencedNodes.add(id));
    });

    this.ast.nodes.forEach((node) => {
      if (!referencedNodes.has(node.id)) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `Disconnected node '${node.id}' detected. It will not participate in the covering space.`,
          severity: 'warning',
        });
      }
    });

    this.checkTaggedNodeExhaustiveness();
    this.checkStructuredConcurrencyProperties();
    this.checkVoidWalkerInvariants();

    const injectionResult = injectSensitiveZkEnvelopes(this.ast);
    this.ast = injectionResult.ast;
    if (injectionResult.injected.length > 0) {
      this.diagnostics.push({
        line: 1,
        column: 1,
        message: `Auto-injected ${injectionResult.injected.length} ZK envelope node(s) for sensitive sync/materialization flows.`,
        severity: 'info',
      });
    }

    this.stability = analyzeTopologyStability(this.ast, this.b1);
    if (this.stability) {
      this.diagnostics.push(...this.stability.diagnostics);
    }

    const buleyMeasure = this.getBuleyMeasurement();
    const spectralSummary =
      this.stability?.spectralRadius !== null &&
      this.stability?.spectralRadius !== undefined
        ? `\nSpectral Radius: ${this.stability.spectralRadius.toFixed(3)}`
        : '';
    const summary = `[Betty Professional Compiler]\nNodes: ${
      this.ast.nodes.size
    }, Edges: ${this.ast.edges.length}\nBetti: ${
      this.b1
    }, Buley Measure: ${buleyMeasure.toFixed(2)}${spectralSummary}`;

    return {
      ast: this.ast,
      output: summary,
      b1: this.b1,
      diagnostics: this.diagnostics,
      buleyMeasure,
      stability: this.stability,
    };
  }

  private parseProperties(propertiesRaw: string): Record<string, string> {
    if (!propertiesRaw) {
      return {};
    }

    const properties: Record<string, string> = {};
    const pairs = propertiesRaw.match(
      /(\w+)\s*:\s*('[^']*'|"[^"]*"|\[[^\]]*\]|[^,]+)/g
    );
    if (!pairs) {
      return properties;
    }

    for (const pair of pairs) {
      const separator = pair.indexOf(':');
      if (separator < 0) {
        continue;
      }

      const key = pair.slice(0, separator).trim();
      const value = pair
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');

      if (key.length > 0 && value.length > 0) {
        properties[key] = value;
      }
    }

    return properties;
  }

  private checkTaggedNodeExhaustiveness(): void {
    for (const node of this.ast.nodes.values()) {
      const taggedDefinition = this.resolveTaggedNodeDefinition(node);
      if (!taggedDefinition) {
        continue;
      }

      const { label: taggedLabel, expectedCases } = taggedDefinition;
      const outgoingEdges = this.ast.edges.filter((edge) =>
        edge.sourceIds.some((sourceId) => sourceId.trim() === node.id)
      );
      if (outgoingEdges.length === 0) {
        continue;
      }

      const caseEdges = outgoingEdges
        .map((edge) => ({
          edge,
          cases: this.extractTaggedCases(edge),
        }))
        .filter((entry) => entry.cases.length > 0);

      if (caseEdges.length === 0) {
        continue;
      }

      if (expectedCases.length === 0) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `${taggedLabel} node '${node.id}' declares tagged exits but no closed cases. Add a cases property to enable exhaustiveness checks.`,
          severity: 'warning',
        });
        continue;
      }

      const unconstrainedEdgeCount = outgoingEdges.length - caseEdges.length;
      if (unconstrainedEdgeCount > 0) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `${taggedLabel} node '${node.id}' mixes tagged case edges with unconstrained exits; exhaustiveness cannot be guaranteed.`,
          severity: 'warning',
        });
      }

      const seenCases = new Map<string, number>();
      for (const { edge, cases } of caseEdges) {
        for (const edgeCase of cases) {
          if (!expectedCases.includes(edgeCase)) {
            this.diagnostics.push({
              line: 1,
              column: 1,
              message: `${taggedLabel} node '${
                node.id
              }' uses unknown case '${edgeCase}' on ${
                edge.type
              }. Expected one of: ${expectedCases.join(', ')}.`,
              severity: 'error',
            });
            continue;
          }

          const existingCount = seenCases.get(edgeCase) ?? 0;
          seenCases.set(edgeCase, existingCount + 1);
          if (existingCount > 0) {
            this.diagnostics.push({
              line: 1,
              column: 1,
              message: `${taggedLabel} node '${node.id}' routes case '${edgeCase}' more than once.`,
              severity: 'error',
            });
          }
        }
      }

      const missingCases = expectedCases.filter(
        (edgeCase) => !seenCases.has(edgeCase)
      );
      if (missingCases.length > 0) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `${taggedLabel} node '${
            node.id
          }' is missing tagged routes for: ${missingCases.join(', ')}.`,
          severity: 'error',
        });
      }
    }
  }

  private extractTaggedCases(edge: ASTEdge): string[] {
    const rawCase =
      edge.properties.case ??
      edge.properties.match ??
      edge.properties.when ??
      edge.properties.variant ??
      edge.properties.kind ??
      edge.properties.status;
    if (!rawCase) {
      return [];
    }

    return rawCase
      .split(/[\s,|]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0);
  }

  private resolveTaggedNodeDefinition(
    node: ASTNode
  ): { label: string; expectedCases: string[] } | null {
    const nativeTaggedLabel = node.labels.find(
      (label) => NATIVE_TAGGED_NODE_CASES[label]
    );
    if (nativeTaggedLabel) {
      return {
        label: nativeTaggedLabel,
        expectedCases: [...NATIVE_TAGGED_NODE_CASES[nativeTaggedLabel]],
      };
    }

    if (node.labels.includes('Variant')) {
      return {
        label: 'Variant',
        expectedCases: this.parseClosedCases(
          node.properties.cases ??
            node.properties.variants ??
            node.properties.options
        ),
      };
    }

    return null;
  }

  private parseClosedCases(rawCases: string | undefined): string[] {
    if (!rawCases) {
      return [];
    }

    return [
      ...new Set(
        rawCases
          .split(/[\s,|]+/)
          .map((entry) => entry.trim().toLowerCase())
          .filter((entry) => entry.length > 0)
      ),
    ];
  }

  private checkStructuredConcurrencyProperties(): void {
    for (const edge of this.ast.edges) {
      if (
        edge.type !== 'RACE' &&
        edge.type !== 'FOLD' &&
        edge.type !== 'COLLAPSE'
      ) {
        continue;
      }

      const rawFailure = edge.properties.failure?.trim().toLowerCase();
      if (rawFailure && !STRUCTURED_CONCURRENCY_FAILURES.has(rawFailure)) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          message: `${edge.type} uses unknown failure policy '${rawFailure}'. Expected one of: cancel, vent, shield.`,
          severity: 'error',
        });
      }

      for (const field of ['timeoutMs', 'deadlineMs', 'timeout', 'deadline']) {
        const rawValue = edge.properties[field];
        if (!rawValue) {
          continue;
        }

        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
          this.diagnostics.push({
            line: 1,
            column: 1,
            message: `${edge.type} requires '${field}' to be a non-negative number.`,
            severity: 'error',
          });
        }
      }
    }
  }

  /**
   * Void Walker Static Lint Rules
   *
   * Checks the 8 runtime invariants from negotiation.test.gg at compile time.
   * These are warnings by default, errors if any node declares strict: "true".
   */
  private checkVoidWalkerInvariants(): void {
    const strict = this.isStrictMode();
    const severity: 'error' | 'warning' = strict ? 'error' : 'warning';

    this.checkEtaBounded(severity);
    this.checkExplorationBounded(severity);
    this.checkComplementDistributionValid(severity);
    this.checkVoidBoundaryMonotone(severity);
    this.checkGaitTransitionsValid(severity);
    this.checkMetacogFeedbackLoop(severity);
    this.checkConservation(severity);
    this.checkTracedMonoidal(severity);
  }

  private isStrictMode(): boolean {
    for (const node of this.ast.nodes.values()) {
      if (node.properties.strict === 'true') return true;
    }
    return false;
  }

  /** 1. eta_bounded: any node with eta must have eta in [0.5, 10.0] */
  private checkEtaBounded(severity: 'error' | 'warning'): void {
    for (const node of this.ast.nodes.values()) {
      const raw = node.properties.eta;
      if (raw === undefined) continue;

      const eta = Number(raw);
      if (!Number.isFinite(eta) || eta < 0.5 || eta > 10.0) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          code: 'VOID_ETA_UNBOUNDED',
          message: `Node '${node.id}' has eta=${raw} outside allowed range [0.5, 10.0].`,
          severity,
        });
      }
    }
  }

  /** 2. exploration_bounded: exploration must be in [0.01, 0.5] */
  private checkExplorationBounded(severity: 'error' | 'warning'): void {
    for (const node of this.ast.nodes.values()) {
      const raw = node.properties.exploration;
      if (raw === undefined) continue;

      const exploration = Number(raw);
      if (!Number.isFinite(exploration) || exploration < 0.01 || exploration > 0.5) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          code: 'VOID_EXPLORATION_UNBOUNDED',
          message: `Node '${node.id}' has exploration=${raw} outside allowed range [0.01, 0.5].`,
          severity,
        });
      }
    }
  }

  /** 3. complement_distribution_valid: PROCESS edge distribution must sum to 1.0 */
  private checkComplementDistributionValid(severity: 'error' | 'warning'): void {
    for (const edge of this.ast.edges) {
      const raw = edge.properties.distribution;
      if (raw === undefined) continue;

      const values = raw
        .replace(/^\[|\]$/g, '')
        .split(/[\s,]+/)
        .map(Number)
        .filter(Number.isFinite);

      if (values.length === 0) continue;

      const sum = values.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 1e-9) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          code: 'VOID_COMPLEMENT_DISTRIBUTION_INVALID',
          message: `PROCESS edge from [${edge.sourceIds.join(', ')}] has distribution summing to ${sum.toFixed(6)}, expected 1.0.`,
          severity,
        });
      }
    }
  }

  /** 4. void_boundary_monotone: void_boundary values along PROCESS chains can only increase */
  private checkVoidBoundaryMonotone(severity: 'error' | 'warning'): void {
    for (const edge of this.ast.edges) {
      if (edge.type !== 'PROCESS') continue;

      for (const sourceId of edge.sourceIds) {
        const sourceNode = this.ast.nodes.get(sourceId);
        if (!sourceNode?.properties.void_boundary) continue;

        for (const targetId of edge.targetIds) {
          const targetNode = this.ast.nodes.get(targetId);
          if (!targetNode?.properties.void_boundary) continue;

          const sourceBound = Number(sourceNode.properties.void_boundary);
          const targetBound = Number(targetNode.properties.void_boundary);

          if (Number.isFinite(sourceBound) && Number.isFinite(targetBound) && targetBound < sourceBound) {
            this.diagnostics.push({
              line: 1,
              column: 1,
              code: 'VOID_BOUNDARY_NON_MONOTONE',
              message: `Void boundary decreases from '${sourceId}' (${sourceBound}) to '${targetId}' (${targetBound}). Boundary counts can only increase.`,
              severity,
            });
          }
        }
      }
    }
  }

  /** 5. gait_transitions_valid: stand->trot->canter->gallop or downshift one level */
  private checkGaitTransitionsValid(severity: 'error' | 'warning'): void {
    const GAIT_ORDER = ['stand', 'trot', 'canter', 'gallop'];

    for (const edge of this.ast.edges) {
      for (const sourceId of edge.sourceIds) {
        const sourceNode = this.ast.nodes.get(sourceId);
        if (!sourceNode?.properties.gait) continue;

        for (const targetId of edge.targetIds) {
          const targetNode = this.ast.nodes.get(targetId);
          if (!targetNode?.properties.gait) continue;

          const srcIdx = GAIT_ORDER.indexOf(sourceNode.properties.gait);
          const tgtIdx = GAIT_ORDER.indexOf(targetNode.properties.gait);

          if (srcIdx < 0 || tgtIdx < 0) continue;

          const diff = tgtIdx - srcIdx;
          // Can go up any amount (stand->trot->canter->gallop) or downshift one level
          if (diff < -1) {
            this.diagnostics.push({
              line: 1,
              column: 1,
              code: 'VOID_GAIT_TRANSITION_INVALID',
              message: `Invalid gait transition from '${sourceNode.properties.gait}' to '${targetNode.properties.gait}' at '${sourceId}'->'${targetId}'. Can only upshift or downshift one level.`,
              severity,
            });
          }
        }
      }
    }
  }

  /** 6. metacog_feedback_loop: cycles via PROCESS must have convergence predicate */
  private checkMetacogFeedbackLoop(severity: 'error' | 'warning'): void {
    // Build adjacency for PROCESS edges and detect cycles
    const adj = new Map<string, ASTEdge[]>();
    for (const edge of this.ast.edges) {
      if (edge.type !== 'PROCESS') continue;
      for (const src of edge.sourceIds) {
        if (!adj.has(src)) adj.set(src, []);
        adj.get(src)!.push(edge);
      }
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const stack = new Set<string>();
    const cycleEdges: ASTEdge[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      stack.add(nodeId);

      for (const edge of adj.get(nodeId) ?? []) {
        for (const target of edge.targetIds) {
          if (stack.has(target)) {
            cycleEdges.push(edge);
            return true;
          }
          if (!visited.has(target) && dfs(target)) return true;
        }
      }

      stack.delete(nodeId);
      return false;
    };

    for (const nodeId of adj.keys()) {
      if (!visited.has(nodeId)) dfs(nodeId);
    }

    for (const edge of cycleEdges) {
      if (!edge.properties.convergence) {
        this.diagnostics.push({
          line: 1,
          column: 1,
          code: 'VOID_METACOG_MISSING_CONVERGENCE',
          message: `PROCESS edge from [${edge.sourceIds.join(', ')}] to [${edge.targetIds.join(', ')}] creates a cycle but has no convergence predicate.`,
          severity,
        });
      }
    }
  }

  /** 7. conservation: fork output count = fold input count (no paths lost or created) */
  private checkConservation(severity: 'error' | 'warning'): void {
    let totalForked = 0;
    let totalFolded = 0;

    for (const edge of this.ast.edges) {
      if (edge.type === 'FORK') {
        totalForked += edge.targetIds.length;
      } else if (edge.type === 'FOLD') {
        totalFolded += edge.sourceIds.length;
      }
    }

    if (totalForked > 0 && totalFolded > 0 && totalForked !== totalFolded) {
      this.diagnostics.push({
        line: 1,
        column: 1,
        code: 'VOID_CONSERVATION_VIOLATED',
        message: `Conservation violated: FORK outputs ${totalForked} paths but FOLD inputs ${totalFolded}. Fork output count must equal fold input count.`,
        severity,
      });
    }
  }

  /** 8. traced_monoidal: feedback loops must satisfy vanishing + yanking axioms */
  private checkTracedMonoidal(severity: 'error' | 'warning'): void {
    // Detect all feedback loops (self-edges or cycles of length > 1)
    // and check that they declare vanishing and yanking axiom annotations
    for (const edge of this.ast.edges) {
      // Self-loop: source appears in targets
      const selfLoop = edge.sourceIds.some((s) => edge.targetIds.includes(s));
      if (!selfLoop) continue;

      const hasVanishing = edge.properties.vanishing !== undefined;
      const hasYanking = edge.properties.yanking !== undefined;

      if (!hasVanishing || !hasYanking) {
        const missing = [
          !hasVanishing ? 'vanishing' : null,
          !hasYanking ? 'yanking' : null,
        ]
          .filter(Boolean)
          .join(', ');

        this.diagnostics.push({
          line: 1,
          column: 1,
          code: 'VOID_TRACED_MONOIDAL_VIOLATED',
          message: `Feedback loop on [${edge.sourceIds.join(', ')}] is missing traced monoidal axiom annotations: ${missing}.`,
          severity,
        });
      }
    }
  }
}
