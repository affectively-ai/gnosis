import { Pipeline, ReynoldsTracker } from '@affectively/aeon-pipelines';
import { GraphAST, ASTEdge, ASTNode } from '../betty/compiler.js';
import { GnosisRegistry } from './registry.js';
import { QuantumWasmBridge } from '../betty/quantum/bridge.js';
import type { GnosisExecutionAuthContext } from '../auth/core.js';
import { authorizeTopologyEdge } from '../auth/core.js';
import { registerCoreAuthHandlers } from '../auth/handlers.js';
import { injectSensitiveZkEnvelopes } from '../auth/auto-zk.js';

export interface GnosisEngineOptions {
    onEdgeEvaluated?: (edge: ASTEdge) => Promise<void> | void;
}

export class GnosisEngine {
    private registry: GnosisRegistry;
    private bridge: QuantumWasmBridge;
    private tracker: ReynoldsTracker;
    private onEdgeEvaluated: ((edge: ASTEdge) => Promise<void> | void) | null;

    constructor(registry?: GnosisRegistry, options: GnosisEngineOptions = {}) {
        this.registry = registry || new GnosisRegistry();
        registerCoreAuthHandlers(this.registry);
        this.bridge = new QuantumWasmBridge();
        this.tracker = new ReynoldsTracker(128); // Default capacity
        this.onEdgeEvaluated = options.onEdgeEvaluated ?? null;
    }

    public async execute(ast: GraphAST, initialPayload: any = null): Promise<string> {
        if (ast.edges.length === 0) return "[Engine] No graph to execute.";

        const autoInjected = injectSensitiveZkEnvelopes(ast);
        const activeAst = autoInjected.ast;
        this.tracker = new ReynoldsTracker(activeAst.nodes.size || 128);
        const execLogs: string[] = ["\n[Gnosis Engine Execution]"];
        if (autoInjected.injected.length > 0) {
            execLogs.push(`Auto-injected ${autoInjected.injected.length} ZK envelope node(s) for sensitive flows.`);
        }
        let currentPayload = initialPayload;

        // ... root finding ...
        const allTargetIds = new Set<string>();
        activeAst.edges.forEach(e => e.targetIds.forEach(id => allTargetIds.add(id.trim())));
        const roots = Array.from(activeAst.nodes.keys()).filter(id => !allTargetIds.has(id.trim()));

        if (roots.length === 0 && activeAst.nodes.size > 0) {
            // If no roots (cycle?), pick the first node mentioned in edges as a fallback
            const firstEdge = activeAst.edges[0];
            if (firstEdge) {
                roots.push(firstEdge.sourceIds[0].trim());
            } else {
                roots.push(Array.from(activeAst.nodes.keys())[0]);
            }
        }

        let currentNodeId: string | undefined = roots[0];
        const visited = new Set<string>();
        let streamCounter = 0;

        execLogs.push(`Tracing from root: ${currentNodeId}`);

        // 2. Sequential Execution until we hit a FORK
        while (currentNodeId) {
            currentNodeId = currentNodeId.trim();
            const sid = streamCounter++;
            this.tracker.updateStream(sid, 'active');

            if (visited.has(currentNodeId)) {
                execLogs.push(`Cycle detected at ${currentNodeId}. Breaking.`);
                this.tracker.updateStream(sid, 'vented');
                break;
            }
            visited.add(currentNodeId);

            const node = activeAst.nodes.get(currentNodeId);
            if (node) {
                const handler = this.findHandler(node);
                if (handler) {
                    execLogs.push(`  -> Executing [${currentNodeId}] (${node.labels.join(',')})`);
                    currentPayload = await handler(currentPayload, node.properties);
                    this.tracker.updateStream(sid, 'completed');
                } else {
                    execLogs.push(`  -> Skipping [${currentNodeId}] (No handler)`);
                    this.tracker.updateStream(sid, 'vented');
                }
            } else {
                execLogs.push(`  -> Error: Node [${currentNodeId}] not found in AST.`);
                this.tracker.updateStream(sid, 'vented');
            }

            // Find all outgoing edges from this node
            const edges = activeAst.edges.filter(e => e.sourceIds.map(s => s.trim()).includes(currentNodeId!));
            if (edges.length === 0) {
                execLogs.push(`No outgoing edge from ${currentNodeId}. Final node.`);
                break;
            }

            // Prioritize HALT/MEASURE over control flow
            const specialEdge = edges.find(e => e.type === 'HALT' || e.type === 'MEASURE');
            if (specialEdge) {
                if (specialEdge.type === 'MEASURE') {
                    const metrics = this.tracker.metrics();
                    execLogs.push(`  [MEASURE] Re: ${metrics.reynoldsNumber.toFixed(2)}, B1: ${metrics.bettiNumber}, Laminar: ${(metrics.laminarFraction * 100).toFixed(1)}%`);
                } else if (specialEdge.type === 'HALT') {
                    execLogs.push(`  [HALT] Breakpoint reached at ${currentNodeId}. (Press any key to continue simulation)`);
                    // In a real TUI/REPL we'd wait for input here. 
                    // For CLI, we'll log the snapshot and continue.
                    execLogs.push(`    Snapshot: Payload=${JSON.stringify(currentPayload).substring(0, 30)}...`);
                }
            }

            // Prioritize FORK/RACE/FOLD/EVOLVE/SUPERPOSE/ENTANGLE/OBSERVE over PROCESS
            const edge = edges.find(e => ['FORK', 'RACE', 'FOLD', 'EVOLVE', 'SUPERPOSE', 'ENTANGLE', 'OBSERVE'].includes(e.type || '')) || edges[0];
            const edgeAuthorization = this.authorizeEdge(edge, currentNodeId, currentPayload);
            if (!edgeAuthorization.allowed) {
                execLogs.push(`  [AUTH] Denied ${edge.type}: ${edgeAuthorization.reason}`);
                this.tracker.updateStream(sid, 'vented');
                break;
            }
            await this.notifyEdgeEvaluated(edge);

            // OBSERVE: reading forces collapse — the measurement operator
            // CRDT is the only state model. Observation IS the merge.
            if (edge.type === 'OBSERVE') {
                const strategy = edge.properties.strategy || 'lww';
                execLogs.push(`  [OBSERVE] Collapsing superposition with strategy: ${strategy}`);
                // OBSERVE propagates through ENTANGLE edges — cascading collapse
                const entangleEdges = activeAst.edges.filter(e =>
                    e.type === 'ENTANGLE' && e.sourceIds.some(sid => edge.targetIds.map(t => t.trim()).includes(sid.trim()))
                );
                if (entangleEdges.length > 0) {
                    execLogs.push(`    [ENTANGLE] Cascading observation to ${entangleEdges.length} entangled subgraphs`);
                }
                currentNodeId = edge.targetIds[0].trim();
                continue;
            }

            if (edge.type === 'FORK' || edge.type === 'EVOLVE' || edge.type === 'SUPERPOSE' || edge.type === 'ENTANGLE') {
                execLogs.push(`  !! Hit ${edge.type} edge: [${edge.sourceIds.join(',')}] -> [${edge.targetIds.join(',')}]`);
                
                let activeTargets = [...edge.targetIds];

                // 1. EVOLVE corollary: Dynamic Scaling based on Reynolds Number
                if (edge.type === 'EVOLVE') {
                    const re = this.tracker.metrics().reynoldsNumber;
                    const maxRe = parseFloat(edge.properties.max_re || '0.7');
                    if (re > maxRe) {
                        const targetCount = Math.max(1, Math.floor(activeTargets.length * (maxRe / re)));
                        execLogs.push(`    [EVOLVE] High Pressure (Re=${re.toFixed(2)}). Constricting flow from ${activeTargets.length} to ${targetCount} paths.`);
                        activeTargets = activeTargets.slice(0, targetCount);
                    } else {
                        execLogs.push(`    [EVOLVE] Laminar Flow (Re=${re.toFixed(2)}). Maintaining full superposition.`);
                    }
                }

                // 2. SUPERPOSE corollary: Probabilistic Amplitude selection
                if (edge.type === 'SUPERPOSE') {
                    const threshold = parseFloat(edge.properties.p || '1.0');
                    activeTargets = activeTargets.filter(() => Math.random() <= threshold);
                    if (activeTargets.length === 0) activeTargets = [edge.targetIds[0]]; // Always keep at least one
                    execLogs.push(`    [SUPERPOSE] Amplitude p=${threshold}. Active wave-function: [${activeTargets.join(', ')}]`);
                }

                // Distribution logic
                const payloads = Array.isArray(currentPayload) && currentPayload.length === activeTargets.length 
                    ? currentPayload 
                    : activeTargets.map(() => currentPayload);

                // 3. ENTANGLE corollary: Shared Mutable State across parallel paths
                let sharedState: any = null;
                if (edge.type === 'ENTANGLE' || edge.properties.entangled === 'true') {
                    sharedState = { value: currentPayload, timestamp: Date.now(), metadata: {} };
                    execLogs.push(`    [ENTANGLE] Creating shared confluence state for parallel branches.`);
                }

                const workFns = activeTargets.map((id, index) => {
                    const tid = id.trim();
                    const branchPayload = payloads[index];
                    const branchSid = streamCounter++;
                    this.tracker.updateStream(branchSid, 'active');

                    return async () => {
                        const node = activeAst.nodes.get(tid);
                        if (node) {
                            const handler = this.findHandler(node);
                            if (handler) {
                                const start = Date.now();
                                // We pass sharedState as the third argument if it exists
                                const result = await (handler as any)(branchPayload, node.properties, sharedState);
                                const time = Date.now() - start;
                                this.tracker.updateStream(branchSid, 'completed');
                                return { path: tid, value: result, time };
                            }
                        }
                        this.tracker.updateStream(branchSid, 'vented');
                        return { path: tid, value: `Simulated Result from ${tid}`, time: 0 };
                    };
                });

                const superposition = Pipeline.from(workFns);

                // Handle TUNNEL edges (early exits from superposition)
                const tunnelEdge = activeAst.edges.find(e => e.type === 'TUNNEL' && e.sourceIds.some(sid => activeTargets.map(t => t.trim()).includes(sid.trim())));
                if (tunnelEdge) {
                    execLogs.push(`  -> Found TUNNEL path: ${tunnelEdge.sourceIds.join('|')} -> ${tunnelEdge.targetIds[0]}`);
                }

                const collapseEdge = activeAst.edges.find(e => 
                    (e.type === 'RACE' || e.type === 'FOLD' || e.type === 'COLLAPSE') &&
                    e.sourceIds.some(sid => activeTargets.map(t => t.trim()).includes(sid.trim()))
                );

                if (!collapseEdge) {
                    execLogs.push(`Pipeline suspended in superposition. No collapse found.`);
                    break;
                }
                const collapseAuthorization = this.authorizeEdge(collapseEdge, currentNodeId, currentPayload);
                if (!collapseAuthorization.allowed) {
                    execLogs.push(`  [AUTH] Denied ${collapseEdge.type}: ${collapseAuthorization.reason}`);
                    this.tracker.updateStream(sid, 'vented');
                    break;
                }
                await this.notifyEdgeEvaluated(collapseEdge);

                if (collapseEdge.type === 'RACE') {
                    execLogs.push(`   Racing paths: [${collapseEdge.sourceIds.join(', ')}]`);
                    const { result } = await superposition.race();
                    execLogs.push(`   Race concluded! Winner: ${result.path}`);
                    currentPayload = result.value;
                } else {
                    execLogs.push(`   Folding paths: [${collapseEdge.sourceIds.join(', ')}]`);
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
                    execLogs.push(`   Folded result: ${JSON.stringify(currentPayload).substring(0, 50)}...`);
                }

                currentNodeId = collapseEdge.targetIds[0].trim();
                continue;
            }

            if (edge.type === 'VENT') {
                execLogs.push(`  -> VENTING path: ${edge.sourceIds[0]}`);
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

    private extractExecutionAuth(payload: unknown): GnosisExecutionAuthContext | null {
        if (typeof payload !== 'object' || payload === null) {
            return null;
        }

        const record = payload as Record<string, unknown>;
        if (typeof record.executionAuth !== 'object' || record.executionAuth === null) {
            return null;
        }

        const executionAuth = record.executionAuth as Record<string, unknown>;
        const capabilities = Array.isArray(executionAuth.capabilities)
            ? (executionAuth.capabilities as GnosisExecutionAuthContext['capabilities'])
            : [];

        return {
            enforce: executionAuth.enforce === true,
            principal:
                typeof executionAuth.principal === 'string'
                    ? executionAuth.principal
                    : undefined,
            token:
                typeof executionAuth.token === 'string'
                    ? executionAuth.token
                    : undefined,
            capabilities,
        };
    }

    private authorizeEdge(
        edge: ASTEdge,
        currentNodeId: string,
        payload: unknown
    ): { allowed: boolean; reason?: string } {
        const executionAuth = this.extractExecutionAuth(payload);
        if (!executionAuth || executionAuth.enforce !== true) {
            return { allowed: true };
        }

        const sourceId = edge.sourceIds[0]?.trim() || currentNodeId;
        const targetIds = edge.targetIds.map((targetId) => targetId.trim());

        return authorizeTopologyEdge({
            edgeType: edge.type,
            sourceId,
            targetIds,
            auth: executionAuth,
        });
    }

    private async notifyEdgeEvaluated(edge: ASTEdge): Promise<void> {
        if (!this.onEdgeEvaluated) {
            return;
        }
        await this.onEdgeEvaluated(edge);
    }
}
