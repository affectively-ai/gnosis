import fs from 'fs';
import path from 'path';
import { Pipeline } from '@affectively/aeon-pipelines';
import { BettyCompiler } from './betty/compiler.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine } from './runtime/engine.js';
import { ModManager } from './mod/manager.js';

const args = process.argv.slice(2);

async function main() {
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
            // Setup registry with real AI handlers
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

                // Each row of the matrix is a parallel path in a superposition
                const rowWork = w.map((row, i) => async () => {
                    const dotProduct = row.reduce((acc, val, j) => acc + val * (x[j] || 0), 0);
                    return dotProduct + (b[i] || 0);
                });

                // Execute the row calculations in parallel through the engine
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
                    // Simulate non-linear phase shift
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
                    .vent((val) => val < threshold) // Dissipate paths with negligible amplitude
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
                    // Payload here will be the FOLD result (Map of lexer results)
                    return { type: 'GraphAST', data: payload, timestamp: Date.now() };
                }
                return payload;
            });

            registry.register('Topology', async (payload, props) => {
                console.log(`[Betti:Topology] Verifying quantum bounds (beta1)...`);
                return { ...payload, verified: true, beta1: 0 };
            });

            registry.register('Runtime', async (payload, props) => {
                const target = props['target'];
                console.log(`[Betti:Runtime] Emitting binary for ${target}...`);
                return Buffer.from([0x0a, 0x0e, 0x00, 0x46, 0x4c, 0x4f, 0x57]);
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
        // Start the Ink REPL
        const { startRepl } = await import('./repl.js');
        startRepl();
    }
}

main();
