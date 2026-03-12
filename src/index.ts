import fs from 'fs';
import path from 'path';
import { Pipeline } from '@affectively/aeon-pipelines';
import { ForkRaceFoldModelChecker, TemporalModel } from '@affectively/aeon-logic';
import * as twokeys from 'twokeys';
import { BettyCompiler } from './betty/compiler.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine } from './runtime/engine.js';
import { ModManager } from './mod/manager.js';

const args = process.argv.slice(2);

async function main() {
    // ... rest of main ...
    if (args[0] === 'mod') {
        const modManager = new ModManager();
        try {
            if (args[1] === 'init' && args[2]) {
                modManager.init(args[2]);
            } else if (args[1] === 'tidy') {
                modManager.tidy();
            } else {
                console.error(`[Gnosis] Usage: gnosis mod init <module-name> | gnosis mod tidy`);
            }
        } catch (e: any) {
            console.error(`[Gnosis Error] ${e.message}`);
        }
        process.exit(0);
    } else if (args[0] === 'run' && args[1]) {
        const filePath = path.resolve(process.cwd(), args[1]);
        if (!fs.existsSync(filePath)) {
            console.error(`[Gnosis Error] File not found: ${filePath}`);
            process.exit(1);
        }
        
        console.log(`[Gnosis] Reading topology from ${filePath}...`);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const betty = new BettyCompiler();
        const { ast, output } = betty.parse(content);
        console.log(output);
        
        if (!ast) {
            console.error(`[Gnosis Error] Failed to parse AST.`);
            process.exit(1);
        }

        console.log(`\n[Gnosis] Executing topology...`);
        try {
            const registry = new GnosisRegistry();

            const loadWeights = (tomlPath: string, section: string) => {
                const fullPath = path.resolve(process.cwd(), tomlPath);
                if (!fs.existsSync(fullPath)) throw new Error(`Weights file not found: ${fullPath}`);
                const content = fs.readFileSync(fullPath, 'utf-8');
                try {
                    const parsed = (Bun as any).TOML.parse(content);
                    return parsed[section];
                } catch (e: any) {
                    throw new Error(`TOML Parse Error in ${tomlPath}: ${e.message}`);
                }
            };

            // Source: Reads initial data
            registry.register('Source', async (payload, props) => {
                const dataRaw = props['data'] || '[1.0, 2.0]';
                try {
                    return JSON.parse(dataRaw);
                } catch (e) {
                    const matches = dataRaw.match(/-?\d+\.?\d*/g);
                    if (matches) return matches.map(Number);
                    return [1.0, 2.0];
                }
            });

            // Linear: Matrix Multiplication using Aeon Pipelines
            registry.register('Linear', async (payload, props) => {
                const section = props['section'] || 'l1';
                const weightsData = loadWeights(props['weights'] || 'weights.toml', section);
                const w = weightsData.weights as number[][];
                const b = weightsData.bias as number[];
                const x = payload as number[];

                const rowWork = w.map((row, i) => async () => {
                    const dotProduct = row.reduce((acc, val, j) => acc + val * (x[j] || 0), 0);
                    return dotProduct + (b[i] || 0);
                });

                return await Pipeline.from(rowWork).fold({
                    type: 'merge-all',
                    merge: (results: Map<number, any>) => Array.from(results.values()).map(r => r)
                });
            });

            // Activation: Parallel ReLU
            registry.register('Activation', async (payload, props) => {
                const x = payload as number[];
                const work = x.map(v => async () => Math.max(0, v));
                
                return await Pipeline.from(work).fold({
                    type: 'merge-all',
                    merge: (results: Map<number, any>) => Array.from(results.values()).map(r => r)
                });
            });

            // Attention: Weighted parallel evolution
            registry.register('Attention', async (payload, props) => {
                const x = payload as number[];
                console.log(`[WASM:Attention] Pipelining ${x.length}-dim wave function...`);
                
                const work = x.map(v => async () => {
                    await new Promise(r => setTimeout(r, 10));
                    return v * 1.5;
                });

                return await Pipeline.from(work).fold({
                    type: 'merge-all',
                    merge: (results: Map<number, any>) => Array.from(results.values()).map(r => r)
                });
            });

            // Softmax: Pipelined normalization with topological Venting
            registry.register('Softmax', async (payload, props) => {
                const x = payload as number[];
                const threshold = parseFloat(props['threshold'] || '0.001');
                const expWork = x.map(v => async () => Math.exp(v));
                
                const exps = await Pipeline.from(expWork)
                    .vent((val: number) => val < threshold)
                    .fold({
                        type: 'merge-all',
                        merge: (results: Map<number, any>) => Array.from(results.values()).map(r => r)
                    });

                const sum = (exps as number[]).reduce((a: number, b: number) => a + b, 0);
                return (exps as number[]).map((v: number) => v / sum);
            });

            // Compiler Handlers for Betti self-hosting
            registry.register('IO', async (payload, props) => {
                const op = props['op'];
                if (op === 'read_file') {
                    const filePath = path.resolve(process.cwd(), payload as string || 'transformer.gg');
                    console.log(`[Betti:IO] Reading source: ${filePath}`);
                    return fs.readFileSync(filePath, 'utf-8');
                }
                return payload;
            });

            registry.register('Logic', async (payload, props) => {
                const pattern = props['pattern'];
                if (pattern === '//') {
                    console.log(`[Betti:Logic] Stripping comments...`);
                    return (payload as string).split('\n')
                        .map(line => line.trim())
                        .filter(line => line && !line.startsWith('//'))
                        .join('\n');
                }
                return payload;
            });

            registry.register('Lexer', async (payload, props) => {
                const target = props['target'];
                const input = payload as string;
                console.log(`[Betti:Lexer] Extracting ${target}...`);

                if (target === 'nodes') {
                    const nodeRegex = /\(([^:)\s]+)(?:\s*:\s*([^{\s)]+))?(?:\s*{([^}]+)})?\)/g;
                    const nodes: any[] = [];
                    let match;
                    while ((match = nodeRegex.exec(input)) !== null) {
                        if (match[1].includes('|')) continue;
                        nodes.push({ id: match[1], label: match[2], props: match[3] });
                    }
                    return nodes;
                }

                if (target === 'edges') {
                    const edgeRegex = /\(([^)]+)\)\s*-\[:([A-Z]+)(?:\s*{([^}]+)})?\]->\s*\(([^)]+)\)/g;
                    const edges: any[] = [];
                    let match;
                    while ((match = edgeRegex.exec(input)) !== null) {
                        edges.push({ 
                            src: match[1], 
                            type: match[2], 
                            props: match[3], 
                            target: match[4] 
                        });
                    }
                    return edges;
                }

                return [];
            });

            registry.register('Compiler', async (payload, props) => {
                const phase = props['phase'];
                if (phase === 'assemble') {
                    console.log(`[Betti:Compiler] Assembling AST from fragmented tokens...`);
                    return { type: 'GraphAST', data: payload, timestamp: Date.now() };
                }
                return payload;
            });

            registry.register('Topology', async (payload, props) => {
                const astData = payload.data as any;
                console.log(`[Betti:Topology] Verifying quantum bounds with aeon-logic...`);

                interface VerifyState {
                    nodeId: string;
                    beta1: number;
                }

                const edges = (astData.edge_lexer || []) as any[];
                
                // Find roots (nodes with no incoming edges)
                const allTargets = new Set(
                    edges.flatMap((e: any) => e.target.split('|').map((t: string) => t.trim()))
                );
                const allSources = new Set(
                    edges.flatMap((e: any) => e.src.split('|').map((src: string) => src.trim()))
                );
                const roots = Array.from(allSources).filter(s => !allTargets.has(s));
                
                const initialNode = roots.length > 0
                    ? roots[0]
                    : (edges.length > 0 ? edges[0].src.split('|')[0].trim() : 'root');

                const model: TemporalModel<VerifyState> = {
                    initialStates: [{ nodeId: initialNode, beta1: 0 }],
                    fingerprint: (s: VerifyState) => `${s.nodeId.trim()}:${s.beta1}`,
                    actions: [{
                        name: 'step',
                        successors: (s: VerifyState) => {
                            const outgoing = edges.filter((e: any) =>
                                e.src
                                    .split('|')
                                    .map((src: string) => src.trim())
                                    .includes(s.nodeId.trim())
                            );
                            return outgoing.flatMap((e: any) => {
                                const sources = e.src.split('|').map((src: string) => src.trim());
                                const targets = e.target.split('|').map((t: string) => t.trim());
                                if (e.type === 'FORK') {
                                    const nextBeta1 = s.beta1 + (targets.length - 1);
                                    return targets.map((t: string) => ({ nodeId: t, beta1: nextBeta1 }));
                                }
                                if (e.type === 'FOLD' || e.type === 'COLLAPSE') {
                                    return targets.map((t: string) => ({ nodeId: t, beta1: 0 }));
                                }
                                if (e.type === 'RACE') {
                                    const nextBeta1 = Math.max(0, s.beta1 - (sources.length - 1));
                                    return targets.map((t: string) => ({ nodeId: t, beta1: nextBeta1 }));
                                }
                                return targets.map((t: string) => ({ nodeId: t, beta1: s.beta1 }));
                            });
                        }
                    }]
                };

                const checker = new ForkRaceFoldModelChecker<VerifyState>();
                const result = await checker.check(model, {
                    maxDepth: 20,
                    invariants: [{
                        name: 'Beta1 Bounds',
                        test: (s: VerifyState) => s.beta1 >= 0 && s.beta1 < 10
                    }]
                });

                if (!result.ok) {
                    console.error(`[Betti:Topology] Verification Failed: ${result.violations[0].message}`);
                    return { ...payload, verified: false, errors: result.violations };
                }

                console.log(`[Betti:Topology] Verified! States explored: ${result.stateCount}, Beta1: ${result.topology.beta1}`);
                return { ...payload, verified: true, stats: result.topology };
            });

            registry.register('Runtime', async (payload, props) => {
                const target = props['target'];
                console.log(`[Betti:Runtime] Emitting binary for ${target}...`);
                return Buffer.from([0x0a, 0x0e, 0x00, 0x46, 0x4c, 0x4f, 0x57]);
            });

            // Twokeys Statistical Handlers
            registry.register('Statistics', async (payload, props) => {
                const op = props['op'] || 'describe';
                console.log(`[Twokeys:Statistics] Running ${op}...`);

                if (Array.isArray(payload) && typeof payload[0] === 'number') {
                    const series = new (twokeys as any).Series({ data: payload });
                    if (op === 'mean') return series.mean();
                    if (op === 'median') return series.median().datum;
                    if (op === 'outliers') return series.outliers();
                    if (op === 'describe') return series.describe();
                }

                if (Array.isArray(payload) && Array.isArray(payload[0])) {
                    const points = new (twokeys as any).Points({ data: payload });
                    if (op === 'centroid') return points.centroid();
                    if (op === 'describe') return points.describe();
                }

                return payload;
            });

            registry.register('Graph', async (payload, props) => {
                const op = props['op'] || 'pageRank';
                console.log(`[Twokeys:Graph] Running ${op}...`);

                const nodes = payload.nodes || [];
                const edges = payload.edges || [];

                if (op === 'pageRank') return (twokeys as any).pageRank(nodes, edges);
                if (op === 'louvain') return (twokeys as any).louvainCommunities(nodes, edges);
                if (op === 'eda') return (twokeys as any).graphEda(nodes, edges);

                return payload;
            });

            const engine = new GnosisEngine(registry);
            const initialPayload = args[1] === 'betti.gg' ? 'transformer.gg' : 'GPT_INIT';
            
            const execOutput = await engine.execute(ast, initialPayload);
            console.log(execOutput);
            process.exit(0);
        } catch (err: any) {
            console.error(`[Execution Error] ${err.message}`);
            process.exit(1);
        }
    } else {
        const { startRepl } = await import('./repl.js');
        startRepl();
    }
}

main();
