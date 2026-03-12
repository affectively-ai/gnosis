import { Pipeline } from '@affectively/aeon-pipelines';
import { GraphAST, ASTNode } from '../betty/compiler.js';
import { GnosisRegistry } from './registry.js';
import { QuantumWasmBridge } from '../betty/quantum/bridge.js';

export class GnosisEngine {
    private registry: GnosisRegistry;
    private bridge: QuantumWasmBridge;

    constructor(registry?: GnosisRegistry) {
        this.registry = registry || new GnosisRegistry();
        this.bridge = new QuantumWasmBridge();
    }

    public async execute(ast: GraphAST, initialPayload: any = null): Promise<string> {
        if (ast.edges.length === 0) return "[Engine] No graph to execute.";
        
        let execLogs: string[] = ["\n[Gnosis Engine Execution]"];
        
        // Find the first FORK edge to use as our pipeline root
        // In a full implementation, we would do a topological sort and trace from root nodes.
        // For now, we find the first FORK as the entry point to Superposition.
        const forkEdge = ast.edges.find(e => e.type === 'FORK');
        if (!forkEdge) {
            return execLogs.join('\n') + "\n[Engine] Cannot execute: Graph missing a starting FORK.";
        }

        execLogs.push(`Starting pipeline from root node(s): [${forkEdge.sourceIds.join(', ')}]`);
        
        // Compute input payload by running the source node(s) if they have handlers
        let currentPayload = initialPayload;
        for (const sourceId of forkEdge.sourceIds) {
            const sourceNode = ast.nodes.get(sourceId);
            if (sourceNode) {
                const handler = this.findHandler(sourceNode);
                if (handler) {
                    execLogs.push(`Executing source node: ${sourceId}`);
                    currentPayload = await handler(currentPayload, sourceNode.properties);
                }
            }
        }

        execLogs.push(`Forking into paths: [${forkEdge.targetIds.join(', ')}]`);

        // Generate work functions based on target node IDs
        const workFns = forkEdge.targetIds.map(id => {
            return async () => {
                const node = ast.nodes.get(id);
                if (node) {
                    const handler = this.findHandler(node);
                    if (handler) {
                        const start = Date.now();
                        const result = await handler(currentPayload, node.properties);
                        const time = Date.now() - start;
                        return { path: id, value: result, time };
                    }
                }
                // Fallback simulation if no handler is registered
                const delay = Math.random() * 500 + 100;
                await new Promise(r => setTimeout(r, delay));
                return { path: id, value: `Simulated Result from ${id}`, time: delay };
            };
        });

        const superposition = Pipeline.from(workFns);

        // Find what happens to these paths next (RACE, FOLD, COLLAPSE)
        const nextEdge = ast.edges.find(e => e.type === 'RACE' || e.type === 'FOLD' || e.type === 'COLLAPSE');
        
        if (nextEdge?.type === 'RACE') {
            execLogs.push(`Racing paths: [${nextEdge.sourceIds.join(', ')}] -> (${nextEdge.targetIds.join(', ')})`);
            const { result } = await superposition.race();
            execLogs.push(`Race concluded! Winner is: ${result.path} (Time: ${result.time.toFixed(0)}ms)`);
            execLogs.push(`Winner Value: ${JSON.stringify(result.value)}`);
            
        } else if (nextEdge?.type === 'FOLD' || nextEdge?.type === 'COLLAPSE') {
            const strategyType = nextEdge.properties['strategy'] || 'merge-all';
            execLogs.push(`Folding paths with strategy [${strategyType}]`);
            
            if (strategyType === 'quorum') {
                 const threshold = parseInt(nextEdge.properties['threshold'] || '2');
                 execLogs.push(`Requiring quorum of ${threshold}`);
                 const result = await superposition.fold({
                     type: 'winner-take-all',
                     selector: (results: Map<number, any>) => Array.from(results.values())[0] 
                 });
                 execLogs.push(`Folded result: ${JSON.stringify(result.value)}`);
            } else {
                 const result = await superposition.fold({
                     type: 'merge-all',
                     merge: (results: Map<number, any>) => {
                         const merged: Record<string, any> = {};
                         Array.from(results.values()).forEach((r: any) => {
                             merged[r.path] = r.value;
                         });
                         return merged;
                     }
                 });
                 execLogs.push(`Folded merged results: ${JSON.stringify(result)}`);
            }
        } else {
             execLogs.push(`Pipeline suspended in superposition. Awaiting fold or race.`);
        }

        return execLogs.join('\n');
    }

    private findHandler(node: ASTNode): import('./registry.js').GnosisHandler | null {
        // Find the first registered handler matching any of the node's labels
        for (const label of node.labels) {
            const handler = this.registry.getHandler(label);
            if (handler) return handler;
        }
        return null;
    }
}
