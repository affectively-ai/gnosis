import fs from 'fs';
import path from 'path';
import { BettyCompiler } from './betty/compiler.js';

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
        const { output } = betty.parse(content);
        console.log(output);
        
        console.log(`\n[Gnosis] Executing topology...`);
        try {
            const execOutput = await betty.execute();
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
