import { Pipeline } from '@affectively/aeon-pipelines';
import { QuantumWasmBridge } from './quantum/bridge.js';

export interface ASTNode {
    id: string;
    labels: string[];
    properties: Record<string, string>;
}

export interface ASTEdge {
    sourceIds: string[];
    targetIds: string[];
    type: string; // FORK, RACE, FOLD, VENT, PROCESS, COLLAPSE, TUNNEL, INTERFERE
    properties: Record<string, string>;
}

export interface GraphAST {
    nodes: Map<string, ASTNode>;
    edges: ASTEdge[];
}

export class BettyCompiler {
    private b1: number = 0;
    private ast: GraphAST = { nodes: new Map(), edges: [] };
    private logs: string[] = [];
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

    public parse(input: string): { ast: GraphAST | null, output: string, b1: number } {
        if (!input.trim()) return { ast: null, output: '', b1: this.b1 };

        this.logs = [];

        // Reset AST per line for simple REPL (In a real system, we'd append or mutate)
        this.ast = { nodes: new Map(), edges: [] };
        // We will now rely on the WASM bridge for tracking topology state
        this.wasmBridge = new QuantumWasmBridge(); 

        // Strip out comments and empty lines
        const cleanedInput = input.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//'))
            .join('\n');

        // Check for imperative code
        if (cleanedInput.includes('function') || cleanedInput.includes('=>') || cleanedInput.includes('return ')) {
             this.logs.push(`[Betty]  Imperative code rejected. The system requires pure graph representation.`);
             return { ast: null, output: this.logs.join('\n'), b1: this.b1 };
        }

        // Parse Node Declarations e.g. (name:Label { key: 'value' })
        const nodeRegex = /\(([^:)\s]+)(?:\s*:\s*([^{\s)]+))?(?:\s*{([^}]+)})?\)/g;
        let nodeMatch;
        while ((nodeMatch = nodeRegex.exec(cleanedInput)) !== null) {
            // Only process if it's not part of an edge string. We'll refine this but for the REPL it's a good start
            // Actually, we can just pre-register these nodes. If they are used in edges, they get updated.
            const id = nodeMatch[1].trim();
            // Ignore if it's a multi-id from an edge like (a | b)
            if (id.includes('|')) continue;

            const label = nodeMatch[2] ? nodeMatch[2].trim() : '';
            const propertiesRaw = nodeMatch[3] ? nodeMatch[3].trim() : '';
            
            const properties: Record<string, string> = {};
            if (propertiesRaw) {
                propertiesRaw.split(',').forEach(prop => {
                    const parts = prop.split(':');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const val = parts.slice(1).join(':').trim().replace(/['"]/g, '');
                        if (key && val) properties[key] = val;
                    }
                });
            }

            if (!this.ast.nodes.has(id)) {
                this.ast.nodes.set(id, { id, labels: label ? [label] : [], properties });
                // We only log it if it has a label or properties to avoid spamming the REPL on simple nodes
                if (label || Object.keys(properties).length > 0) {
                    this.logs.push(`[Betty] Registered Node: ${id} (Label: ${label || 'None'})`);
                }
            } else {
                // Update existing node
                const node = this.ast.nodes.get(id)!;
                if (label && !node.labels.includes(label)) node.labels.push(label);
                Object.assign(node.properties, properties);
                if (label || Object.keys(properties).length > 0) {
                    this.logs.push(`[Betty] Updated Node: ${id} (Label: ${label || 'None'})`);
                }
            }
        }

        // Parse Edges e.g. (source)-[:TYPE { props }]->(target)
        let edgeMatch;
        let matched = false;
        const edgeRegex = /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;
        
        while ((edgeMatch = edgeRegex.exec(cleanedInput)) !== null) {
            matched = true;
            const sourceRaw = edgeMatch[1].trim();
            const edgeType = edgeMatch[2].trim();
            const propertiesRaw = edgeMatch[3] ? edgeMatch[3].trim() : '';
            const targetRaw = edgeMatch[4].trim();

            // Handle chained edges: set lastIndex to the start of the target node
            // so it can be re-parsed as the source of the next edge.
            const matchString = edgeMatch[0];
            const targetString = `(${edgeMatch[4]})`;
            const offset = matchString.lastIndexOf(targetString);
            edgeRegex.lastIndex = edgeMatch.index + offset;

            const sources = sourceRaw.split('|').map(s => s.trim());
            const targets = targetRaw.split('|').map(s => s.trim());

            const properties: Record<string, string> = {};
            if (propertiesRaw) {
                propertiesRaw.split(',').forEach(prop => {
                    const [key, val] = prop.split(':').map(s => s.trim().replace(/['"]/g, ''));
                    if (key && val) properties[key] = val;
                });
            }

            // Sync local AST calculation for Betty logs, while passing through the WASM engine
            if (edgeType === 'FORK') {
                this.b1 += (targets.length - 1);
                this.logs.push(`[Betty] Forked ${targets.length} paths. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else if (edgeType === 'FOLD' || edgeType === 'COLLAPSE') {
                this.b1 = Math.max(0, this.b1 - (sources.length - 1));
                const strategy = properties['strategy'] ? `[${properties['strategy']}]` : '';
                this.logs.push(`[Betty] Folded ${sources.length} paths ${strategy}. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else if (edgeType === 'VENT' || edgeType === 'TUNNEL') {
                this.b1 = Math.max(0, this.b1 - 1);
                this.logs.push(`[Betty] Vented path. Waste heat dissipated. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else if (edgeType === 'RACE') {
                this.logs.push(`[Betty] Racing ${sources.length} paths. Homotopy equivalence maintained. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else if (edgeType === 'PROCESS') {
                this.logs.push(`[Betty] Processed path sequentially. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else if (edgeType === 'INTERFERE') {
                const mode = properties['mode'] || 'unknown';
                this.logs.push(`[Betty] Quantum Interference applied [${mode}]. (WASM: ${this.wasmBridge.processAstEdge(edgeType, sources.length, targets.length)})`);
            } else {
                 this.logs.push(`[Betty] Unknown topology operation: ${edgeType}`);
            }

            this.ast.edges.push({
                sourceIds: sources,
                targetIds: targets,
                type: edgeType,
                properties
            });

            sources.forEach(id => {
                if (!this.ast.nodes.has(id)) this.ast.nodes.set(id, { id, labels: [], properties: {} });
            });
            targets.forEach(id => {
                if (!this.ast.nodes.has(id)) this.ast.nodes.set(id, { id, labels: [], properties: {} });
            });
        }

        if (!matched) {
            // Execution command check
            if (input.trim().toUpperCase() === 'EXECUTE') {
                return { ast: this.ast, output: "[Betty] Queuing execution...", b1: this.b1 };
            }
            this.logs.push(`[Betty]  Awaiting valid topology graph. Example: (data)-[:FORK]->(a | b)`);
            return { ast: null, output: this.logs.join('\n'), b1: this.b1 };
        }

        const summary = `[Betty AST Compiler]\n` + this.logs.join('\n') + `\nNodes tracked: ${Array.from(this.ast.nodes.keys()).join(', ')}`;
        return { 
            ast: this.ast, 
            output: summary,
            b1: this.b1
        };
    }
}
