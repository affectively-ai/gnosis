import fs from 'fs';
import path from 'path';
import { Pipeline } from '@affectively/aeon-pipelines';
import * as twokeys from 'twokeys';
import { BettyCompiler } from './betty/compiler.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine } from './runtime/engine.js';
import { ModManager } from './mod/manager.js';
import { analyzeGnosisSource, formatGnosisViolations } from './analysis.js';
import {
    analyzeTypeScriptTargets,
    parseTsSonarThresholds
} from './ts-sonar.js';

const args = process.argv.slice(2);

function resolveTopologyPath(rawPath: string): string {
    return path.resolve(process.cwd(), rawPath);
}

function isGgTarget(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return extension === '.gg' || extension === '.ggx';
}

function parseMaxBuley(rawArgs: string[]): number | null {
    const flagIndex = rawArgs.indexOf('--max-buley');
    if (flagIndex < 0) return null;
    const rawValue = rawArgs[flagIndex + 1];
    if (!rawValue) return null;
    const parsed = Number.parseFloat(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
}

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
    } else if (args[0] === 'test' && args[1]) {
        const testPath = resolveTopologyPath(args[1]);
        if (!fs.existsSync(testPath)) {
            console.error(`[Gnosis Error] File not found: ${testPath}`);
            process.exit(1);
        }
        const { runGGTestFile, formatGGTestResults } = await import('./gg-test-runner.js');
        const result = await runGGTestFile(testPath);
        const jsonOutput = args.includes('--json');
        if (jsonOutput) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(formatGGTestResults(result));
        }
        process.exit(result.ok ? 0 : 1);
    } else if ((args[0] === 'lint' || args[0] === 'verify' || args[0] === 'analyze') && args[1]) {
        const filePath = resolveTopologyPath(args[1]);
        if (!fs.existsSync(filePath)) {
            console.error(`[Gnosis Error] File not found: ${filePath}`);
            process.exit(1);
        }

        const jsonOutput = args.includes('--json');
        if (isGgTarget(filePath)) {
            const maxBuley = parseMaxBuley(args);
            const source = fs.readFileSync(filePath, 'utf-8');
            const report = await analyzeGnosisSource(source);
            const violations = formatGnosisViolations(report.correctness);
            const buleyExceeded = maxBuley !== null && report.buleyNumber > maxBuley;
            const ok = report.correctness.ok && !buleyExceeded;

            if (jsonOutput) {
                console.log(JSON.stringify({
                    filePath,
                    mode: 'gg',
                    ok,
                    buleyNumber: report.buleyNumber,
                    maxBuley,
                    line: report.line,
                    topology: report.topology,
                    quantum: report.quantum,
                    correctness: {
                        ok: report.correctness.ok,
                        stateCount: report.correctness.stateCount,
                        topology: report.correctness.topology,
                        violationCount: report.correctness.violations.length,
                        violations
                    }
                }, null, 2));
            } else {
                console.log(`[Gnosis ${args[0]}] ${filePath}`);
                console.log(`  correctness: ${report.correctness.ok ? 'PASS' : 'FAIL'} (states=${report.correctness.stateCount}, beta1=${report.correctness.topology.beta1})`);
                console.log(`  buley-number: ${report.buleyNumber}${maxBuley !== null ? ` (max=${maxBuley})` : ''}`);
                console.log(`  lines: total=${report.line.totalLines} non-empty=${report.line.nonEmptyLines} comments=${report.line.commentLines} topology=${report.line.topologyLines}`);
                console.log(`  topology: nodes=${report.topology.nodeCount} functions=${report.topology.functionNodeCount} edges=${report.topology.edgeCount} forks=${report.topology.forkEdgeCount} races=${report.topology.raceEdgeCount} folds=${report.topology.foldEdgeCount} vents=${report.topology.ventEdgeCount} interfere=${report.topology.interfereEdgeCount}`);
                console.log(`  complexity: max-branch=${report.topology.maxBranchFactor} avg-branch=${report.topology.avgBranchFactor} cyclomatic≈${report.topology.cyclomaticApprox}`);
                console.log(`  quantum: superposition=${report.quantum.superpositionEdgeCount} collapse=${report.quantum.collapseEdgeCount} coverage=${report.quantum.collapseCoverage} deficit=${report.quantum.collapseDeficit} interference-density=${report.quantum.interferenceDensity}`);
                console.log(`  quantum-index: ${report.quantum.quantumIndex} beta-pressure=${report.quantum.betaPressure} beta-headroom=${report.quantum.betaHeadroom}`);
                if (violations.length > 0) {
                    violations.forEach((line) => console.error(`  ${line}`));
                }
                if (buleyExceeded) {
                    console.error(`  buley-threshold-failed: ${report.buleyNumber} > ${maxBuley}`);
                }
            }

            process.exit(ok ? 0 : 1);
        }

        const tsReport = analyzeTypeScriptTargets([filePath], parseTsSonarThresholds(args));
        if (jsonOutput) {
            console.log(JSON.stringify({
                mode: 'typescript',
                target: filePath,
                ...tsReport
            }, null, 2));
        } else {
            console.log(`[Gnosis ${args[0]}:ts] ${filePath}`);
            console.log(`  status: ${tsReport.ok ? 'PASS' : 'FAIL'}`);
            console.log(`  files=${tsReport.fileCount} lines=${tsReport.totals.totalLines} code=${tsReport.totals.codeLines} comments=${tsReport.totals.commentLines}`);
            console.log(`  structures: functions=${tsReport.totals.functionCount} classes=${tsReport.totals.classCount} interfaces=${tsReport.totals.interfaceCount} types=${tsReport.totals.typeAliasCount}`);
            console.log(`  complexity: max-cyclomatic=${tsReport.totals.maxCyclomatic} max-cognitive=${tsReport.totals.maxCognitive} max-nesting=${tsReport.totals.maxNesting} max-function-lines=${tsReport.totals.maxFunctionLines}`);
            console.log(`  totals: cyclomatic=${tsReport.totals.totalCyclomatic} cognitive=${tsReport.totals.totalCognitive} branches=${tsReport.totals.branchCount} loops=${tsReport.totals.loopCount}`);
            if (tsReport.hotspots.byCognitive.length > 0) {
                const hotspot = tsReport.hotspots.byCognitive[0];
                console.log(`  hotspot(cognitive): ${hotspot.filePath}:${hotspot.startLine} ${hotspot.name}=${hotspot.cognitive}`);
            }
            if (tsReport.violations.length > 0) {
                tsReport.violations.forEach((line) => console.error(`  ${line}`));
            }
        }

        process.exit(tsReport.ok ? 0 : 1);
    } else if (args[0] === 'lint' || args[0] === 'verify' || args[0] === 'analyze') {
        console.error(`[Gnosis] Usage: gnosis ${args[0]} <target> [--max-buley <number>] [--max-file-lines <number>] [--max-function-lines <number>] [--max-cyclomatic <number>] [--max-cognitive <number>] [--max-nesting <number>] [--json]`);
        process.exit(1);
    } else if (args[0] === 'run' && args[1]) {
        const filePath = resolveTopologyPath(args[1]);
        if (!fs.existsSync(filePath)) {
            console.error(`[Gnosis Error] File not found: ${filePath}`);
            process.exit(1);
        }
        
        console.log(`[Gnosis] Reading topology from ${filePath}...`);
        const content = fs.readFileSync(filePath, 'utf-8');

        const runtimeReport = await analyzeGnosisSource(content);
        if (!runtimeReport.correctness.ok) {
            console.error(`[Gnosis] Formal verification failed before execution.`);
            formatGnosisViolations(runtimeReport.correctness).forEach((line) => {
                console.error(`  ${line}`);
            });
            process.exit(1);
        }
        console.log(`[Gnosis] Formal check passed. Buley Number: ${runtimeReport.buleyNumber}, Quantum Index: ${runtimeReport.quantum.quantumIndex}`);
        
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
                const edges = (astData.edge_lexer || []) as Array<{ src: string; type: string; props?: string; target: string }>;
                const ggSource = edges
                    .map((edge) => {
                        const properties = edge.props ? ` { ${edge.props} }` : '';
                        return `(${edge.src})-[:${edge.type}${properties}]->(${edge.target})`;
                    })
                    .join('\n');

                const report = await analyzeGnosisSource(ggSource);
                if (!report.correctness.ok) {
                    const [firstViolation] = formatGnosisViolations(report.correctness);
                    console.error(`[Betti:Topology] Verification Failed: ${firstViolation || 'Unknown violation'}`);
                    return { ...payload, verified: false, errors: report.correctness.violations, buleyNumber: report.buleyNumber };
                }

                console.log(`[Betti:Topology] Verified! States explored: ${report.correctness.stateCount}, Beta1: ${report.correctness.topology.beta1}, Buley Number: ${report.buleyNumber}, Quantum Index: ${report.quantum.quantumIndex}`);
                return {
                    ...payload,
                    verified: true,
                    stats: report.correctness.topology,
                    buleyNumber: report.buleyNumber,
                    quantum: report.quantum,
                    complexity: report.topology
                };
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

            // Aeon-Flux Core Handlers
            registry.register('Router', async (payload, props) => {
                const path = payload.path || '/';
                console.log(`[Aeon-Flux:Router] Matching route for: ${path}`);
                return { route: 'ManuscriptPage', componentId: 'Ch17', sessionId: 'aeon-001' };
            });

            registry.register('UserContext', async (payload, props) => {
                console.log(`[Aeon-Flux:UserContext] Extracting context...`);
                return { userId: 'buley', device: 'darwin', preferences: { theme: 'dark' } };
            });

            registry.register('TreeBuilder', async (payload, props) => {
                console.log(`[Aeon-Flux:TreeBuilder] Building component tree...`);
                return { rootId: 'shell', nodes: [{ id: 'Ch17', type: 'page' }] };
            });

            registry.register('Decision', async (payload, props) => {
                const { context, tree } = payload;
                console.log(`[Aeon-Flux:Decision] Personalizing for ${context?.userId}...`);
                return { prefetch: ['/next-chapter'], theme: context?.preferences?.theme || 'light' };
            });

            registry.register('Renderer', async (payload, props) => {
                const type = props['type'] || 'html';
                console.log(`[Aeon-Flux:Renderer] Rendering ${type}...`);
                return `<html><body data-theme="${payload.theme}"><h1>Aeon Flux</h1></body></html>`;
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
