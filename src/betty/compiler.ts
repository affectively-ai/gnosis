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
  | 'ERR_CONTINUOUS_WITNESS_INVALID';

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
}
