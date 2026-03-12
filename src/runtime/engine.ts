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
        let currentPayload = initialPayload;

        // 1. Find the Root nodes (no incoming edges)
        const allTargetIds = new Set<string>();
        ast.edges.forEach(e => e.targetIds.forEach(id => allTargetIds.add(id.trim())));
        const roots = Array.from(ast.nodes.keys()).filter(id => !allTargetIds.has(id.trim()));

        if (roots.length === 0 && ast.nodes.size > 0) {
            roots.push(Array.from(ast.nodes.keys())[0]);
        }

        let currentNodeId: string | undefined = roots[0];
        let visited = new Set<string>();

        execLogs.push(`Tracing from root: ${currentNodeId}`);

        // 2. Sequential Execution until we hit a FORK
        while (currentNodeId) {
            currentNodeId = currentNodeId.trim();
            if (visited.has(currentNodeId)) {
                execLogs.push(`Cycle detected at ${currentNodeId}. Breaking.`);
                break;
            }
            visited.add(currentNodeId);

            const node = ast.nodes.get(currentNodeId);
            if (node) {
                const handler = this.findHandler(node);
                if (handler) {
                    execLogs.push(`  -> Executing [${currentNodeId}] (${node.labels.join(',')})`);
                    currentPayload = await handler(currentPayload, node.properties);
                } else {
                    execLogs.push(`  -> Skipping [${currentNodeId}] (No handler)`);
                }
            } else {
                execLogs.push(`  -> Error: Node [${currentNodeId}] not found in AST.`);
            }

            // Find the outgoing edge
            const edge = ast.edges.find(e => e.sourceIds.map(s => s.trim()).includes(currentNodeId!));
            if (!edge) {
                execLogs.push(`No outgoing edge from ${currentNodeId}. Final node.`);
                break;
            }

            if (edge.type === 'FORK') {
                execLogs.push(`  !! Hit FORK edge: [${edge.sourceIds.join(',')}] -> [${edge.targetIds.join(',')}]`);
                
                const workFns = edge.targetIds.map(id => {
                    const tid = id.trim();
                    return async () => {
                        const node = ast.nodes.get(tid);
                        if (node) {
                            const handler = this.findHandler(node);
                            if (handler) {
                                const start = Date.now();
                                const result = await handler(currentPayload, node.properties);
                                const time = Date.now() - start;
                                return { path: tid, value: result, time };
                            }
                        }
                        return { path: tid, value: `Simulated Result from ${tid}`, time: 0 };
                    };
                });

                const superposition = Pipeline.from(workFns);

                const collapseEdge = ast.edges.find(e => 
                    (e.type === 'RACE' || e.type === 'FOLD' || e.type === 'COLLAPSE') &&
                    e.sourceIds.some(sid => edge.targetIds.map(t => t.trim()).includes(sid.trim()))
                );

                if (!collapseEdge) {
                    execLogs.push(`Pipeline suspended in superposition. No collapse found.`);
                    break;
                }

                if (collapseEdge.type === 'RACE') {
                    execLogs.push(`  🏎️ Racing paths: [${collapseEdge.sourceIds.join(', ')}]`);
                    const { result } = await superposition.race();
                    execLogs.push(`  🏆 Race concluded! Winner: ${result.path}`);
                    currentPayload = result.value;
                } else {
                    execLogs.push(`  🗜️ Folding paths: [${collapseEdge.sourceIds.join(', ')}]`);
                    currentPayload = await superposition.fold({
                        type: 'merge-all',
                        merge: (results: Map<number, any>) => {
                            const values = Array.from(results.values()).map((r: any) => r.value);
                            if (Array.isArray(values[0]) && typeof values[0][0] === 'number') {
                                return (values[0] as number[]).map((_, i) => 
                                    values.reduce((acc, v) => acc + (v[i] || 0), 0)
                                );
                            }
                            const merged: Record<string, any> = {};
                            Array.from(results.values()).forEach((r: any) => {
                                merged[r.path] = r.value;
                            });
                            return merged;
                        }
                    });
                    execLogs.push(`  📦 Folded result: ${JSON.stringify(currentPayload).substring(0, 50)}...`);
                }

                currentNodeId = collapseEdge.targetIds[0].trim();
                continue;
            }

            // Normal sequential flow
            currentNodeId = edge.targetIds[0].trim();
        }

        execLogs.push(`Final System Result: ${JSON.stringify(currentPayload)}`);
        return execLogs.join('\n');
    }

    private findHandler(node: ASTNode): import('./registry.js').GnosisHandler | null {
        for (const label of node.labels) {
            const handler = this.registry.getHandler(label);
            if (handler) return handler;
        }
        return null;
    }
}
