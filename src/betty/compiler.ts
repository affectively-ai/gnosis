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

    public async execute(): Promise<string> {
        if (this.ast.edges.length === 0) return "[Betty Execution] No graph to execute.";
        
        let execLogs: string[] = ["\n[Betty Runtime Execution]"];
        
        // Find the first FORK edge to use as our pipeline root
        const forkEdge = this.ast.edges.find(e => e.type === 'FORK');
        if (!forkEdge) {
            return execLogs.join('\n') + "\n[Betty] Cannot execute: Graph missing a starting FORK.";
        }

        execLogs.push(` Starting pipeline from root node(s): [${forkEdge.sourceIds.join(', ')}]`);
        execLogs.push(` Forking into paths: [${forkEdge.targetIds.join(', ')}]`);

        // Mock work functions based on target node IDs
        const workFns = forkEdge.targetIds.map(id => {
            return async () => {
                // Simulate some work with a random delay
                const delay = Math.random() * 500 + 100;
                await new Promise(r => setTimeout(r, delay));
                return { path: id, value: `Result from ${id}`, time: delay };
            };
        });

        const superposition = Pipeline.from(workFns);

        // Find what happens to these paths next (RACE or FOLD or COLLAPSE)
        const nextEdge = this.ast.edges.find(e => e.type === 'RACE' || e.type === 'FOLD' || e.type === 'COLLAPSE');
        
        if (nextEdge?.type === 'RACE') {
            execLogs.push(`  Racing paths: [${nextEdge.sourceIds.join(', ')}] -> (${nextEdge.targetIds.join(', ')})`);
            const { result } = await superposition.race();
            execLogs.push(` Race concluded! Winner is: ${result.path} (Time: ${result.time.toFixed(0)}ms)`);
            
        } else if (nextEdge?.type === 'FOLD' || nextEdge?.type === 'COLLAPSE') {
            const strategyType = nextEdge.properties['strategy'] || 'merge-all';
            execLogs.push(`  Folding paths with strategy [${strategyType}]`);
            
            if (strategyType === 'quorum') {
                 const threshold = parseInt(nextEdge.properties['threshold'] || '2');
                 execLogs.push(`  Requiring quorum of ${threshold}`);
                 // Note: we'd ideally map this to actual quorum strategy, using winnerTakeAll as mock for REPL simplicity if quorum unsupported in basic generic
                 const result = await superposition.fold({
                     type: 'winner-take-all',
                     selector: (results: Map<number, any>) => Array.from(results.values())[0] 
                 });
                 execLogs.push(` Folded result: ${JSON.stringify(result)}`);
            } else {
                 const result = await superposition.fold({
                     type: 'merge-all',
                     merge: (results: Map<number, any>) => ({ paths: Array.from(results.values()).map((r: any) => r.path) })
                 });
                 execLogs.push(` Folded merged results: ${JSON.stringify(result)}`);
            }
        } else {
             execLogs.push(`  Pipeline suspended in superposition (WASM ${this.wasmBridge.getMetrics()}). Awaiting fold or race.`);
        }

        return execLogs.join('\n');
    }

    public parse(input: string): { ast: GraphAST | null, output: string, b1: number } {
        if (!input.trim()) return { ast: null, output: '', b1: this.b1 };

        this.logs = [];

        // Reset AST per line for simple REPL (In a real system, we'd append or mutate)
        this.ast = { nodes: new Map(), edges: [] };
        // We will now rely on the WASM bridge for tracking topology state
        this.wasmBridge = new QuantumWasmBridge(); 

        // Check for imperative code
        if (input.includes('function') || input.includes('=>') || input.includes('return ')) {
             this.logs.push(`[Betty]  Imperative code rejected. The system requires pure graph representation.`);
             return { ast: null, output: this.logs.join('\n'), b1: this.b1 };
        }

        // Parse Node Declarations e.g. (name:Label { key: 'value' })
        const nodeRegex = /\(([^:)\s]+)(?:\s*:\s*([^{\s)]+))?(?:\s*{([^}]+)})?\)/g;
        let nodeMatch;
        while ((nodeMatch = nodeRegex.exec(input)) !== null) {
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

        const edgeRegex = /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;

        
        let match;
        let matched = false;

        while ((match = edgeRegex.exec(input)) !== null) {
            matched = true;
            const sourceRaw = match[1].trim();
            const edgeType = match[2].trim();
            const propertiesRaw = match[3] ? match[3].trim() : '';
            const targetRaw = match[4].trim();

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
