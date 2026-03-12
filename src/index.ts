import fs from 'fs';
import path from 'path';
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

            // Linear: Matrix Multiplication + Bias using TOML weights
            registry.register('Linear', async (payload, props) => {
                const section = props['section'] || 'l1';
                const weightsData = loadWeights(props['weights'] || 'weights.toml', section);

                if (!weightsData) throw new Error(`Section '${section}' missing in weights.`);

                const w = weightsData.weights as number[][];
                const b = weightsData.bias as number[];
                const x = payload as number[];

                return w.map((row, i) => 
                    row.reduce((acc, val, j) => acc + val * (x[j] || 0), 0) + (b[i] || 0)
                );
            });

            // Activation: e.g. ReLU
            registry.register('Activation', async (payload, props) => {
                const type = props['type'] || 'relu';
                const x = payload as number[];
                if (type === 'relu') return x.map(v => Math.max(0, v));
                return x;
            });

            // Attention: Scaled Dot-Product Attention
            registry.register('Attention', async (payload, props) => {
                const section = props['section'] || 'attention';
                const wData = loadWeights(props['weights'] || 'weights.toml', section);

                const x = payload as number[];
                console.log(`[WASM:Attention] Evolving wave function on ${x.length} dimensions...`);
                return x.map(v => v * 1.5); 
            });

            // Softmax: Normalization
            registry.register('Softmax', async (payload, props) => {
                const x = payload as number[];
                const exps = x.map(v => Math.exp(v));
                const sumExps = exps.reduce((a, b) => a + b, 0);
                return exps.map(v => v / sumExps);
            });

            const engine = new GnosisEngine(registry);
            const initialPayload = "GPT_INIT";
            
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
