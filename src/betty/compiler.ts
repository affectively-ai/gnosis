import { Pipeline } from '@affectively/aeon-pipelines';
import { QuantumWasmBridge } from './quantum/bridge.js';
import { injectSensitiveZkEnvelopes } from '../auth/auto-zk.js';

export interface ASTNode {
  id: string;
  labels: string[];
  properties: Record<string, string>;
}

export interface ASTEdge {
  sourceIds: string[];
  targetIds: string[];
  type: string; // FORK, RACE, FOLD, VENT, PROCESS, COLLAPSE, TUNNEL, INTERFERE, OBSERVE
  properties: Record<string, string>;
}

export interface Diagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GraphAST {
  nodes: Map<string, ASTNode>;
  edges: ASTEdge[];
}

export class BettyCompiler {
  private b1 = 0;
  private ast: GraphAST = { nodes: new Map(), edges: [] };
  private logs: string[] = [];
  private diagnostics: Diagnostic[] = [];
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

  public parse(input: string): {
    ast: GraphAST | null;
    output: string;
    b1: number;
    diagnostics: Diagnostic[];
    buleyMeasure: number;
  } {
    if (!input.trim())
      return { ast: null, output: '', b1: 0, diagnostics: [], buleyMeasure: 0 };

    this.logs = [];
    this.diagnostics = [];
    this.b1 = 0;
    this.ast = { nodes: new Map(), edges: [] };
    this.wasmBridge = new QuantumWasmBridge();

    const lines = input.split('\n');

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
      const nodeRegex =
        /(?<!->)\(([^:)\s|]+)(?:\s*:\s*([^){\s]+))?(?:\s*{([^}]+)})?\)(?!-\[:)/g;
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

    const buleyMeasure = this.getBuleyMeasurement();
    const summary = `[Betty Professional Compiler]\nNodes: ${
      this.ast.nodes.size
    }, Edges: ${this.ast.edges.length}\nBetti: ${
      this.b1
    }, Buley Measure: ${buleyMeasure.toFixed(2)}`;

    return {
      ast: this.ast,
      output: summary,
      b1: this.b1,
      diagnostics: this.diagnostics,
      buleyMeasure,
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
}
