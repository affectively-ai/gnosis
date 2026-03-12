import fs from 'fs';
import path from 'path';
import { BettyCompiler } from './betty/compiler.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine } from './runtime/engine.js';

const args = process.argv.slice(2);

async function main() {
    if (args[0] === 'run' && args[1]) {
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
            // Setup registry with data bindings
            const registry = new GnosisRegistry();
            registry.register('Codec', async (payload, props) => {
                const type = props['type'] || 'unknown';
                // Simulate some codec processing time
                await new Promise(r => setTimeout(r, Math.random() * 200 + 50));
                return `[Codec:${type}] Encoded payload: ${payload}`;
            });

            const engine = new GnosisEngine(registry);
            const initialPayload = "SampleDataChunk_0x01";
            
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
