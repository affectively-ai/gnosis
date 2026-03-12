import { describe, it, expect, mock } from 'bun:test';
import { GnosisEngine } from './engine.js';
import { GnosisRegistry } from './registry.js';
import { BettyCompiler } from '../betty/compiler.js';

describe('GnosisEngine', () => {
    const compiler = new BettyCompiler();

    it('should execute a simple sequential topology', async () => {
        const registry = new GnosisRegistry();
        const mockHandler = mock(async (payload) => payload + ' -> processed');
        registry.register('Step', mockHandler);

        const engine = new GnosisEngine(registry);
        const { ast } = compiler.parse('(a:Step)-[:PROCESS]->(b:Step)');
        
        const result = await engine.execute(ast!, 'start');
        expect(result).toContain('start -> processed -> processed');
        expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should execute parallel topologies with FORK/FOLD', async () => {
        const registry = new GnosisRegistry();
        registry.register('Forker', async (payload) => [payload, payload]);
        registry.register('Work', async (payload) => payload + '1');
        registry.register('Folder', async (payload) => {
            // The engine's merge-all strategy returns a Record<string, any> of results
            const values = Object.values(payload as Record<string, any>);
            return values.join(',');
        });

        const engine = new GnosisEngine(registry);
        const { ast } = compiler.parse(`
            (s:Forker)-[:FORK]->(w1:Work|w2:Work)
            (w1|w2)-[:FOLD]->(j:Folder)
        `);

        const result = await engine.execute(ast!, 'input');
        expect(result).toContain('input1,input1');
    });

    it('should handle missing handlers by skipping them', async () => {
        const registry = new GnosisRegistry();
        const engine = new GnosisEngine(registry);
        const { ast } = compiler.parse('(a:Unknown)-[:PROCESS]->(b:Known)');
        
        registry.register('Known', async (p) => p + '!');

        const result = await engine.execute(ast!, 'input');
        expect(result).toContain('Skipping [a]');
        expect(result).toContain('input!');
    });

    it('should pass properties from GGL to handlers', async () => {
        const registry = new GnosisRegistry();
        const mockHandler = mock(async (payload, props) => props.val);
        registry.register('PropCheck', mockHandler);

        const engine = new GnosisEngine(registry);
        // The engine requires at least one edge to execute
        const { ast } = compiler.parse('(a:PropCheck {val: "secret"})-[:PROCESS]->(b)');

        const result = await engine.execute(ast!, 'input');
        expect(result).toContain('secret');
    });

    it('should handle MEASURE and HALT edges', async () => {
        const registry = new GnosisRegistry();
        registry.register('Step', async (p) => p);
        
        const engine = new GnosisEngine(registry);
        const { ast } = compiler.parse(`
            (a:Step)-[:MEASURE]->(b:Step)
            (b)-[:HALT]->(c:Step)
        `);

        const result = await engine.execute(ast!, 'input');
        expect(result).toContain('[MEASURE]');
        expect(result).toContain('[HALT]');
        expect(result).toContain('Re:'); // Reynolds number
        expect(result).toContain('Breakpoint reached');
    });

    it('should handle Quantum Pillars (EVOLVE, SUPERPOSE, ENTANGLE)', async () => {
        const registry = new GnosisRegistry();
        registry.register('Source', async () => 'data');
        registry.register('Worker', async (p, props, shared) => {
            if (shared) {
                shared.value = (shared.value || 0) + 1;
                return shared.value;
            }
            return p;
        });
        registry.register('Sink', async (p) => p);

        const engine = new GnosisEngine(registry);

        // 1. Test ENTANGLE
        const gglEntangle = `
            (s:Source)-[:ENTANGLE]->(w1:Worker | w2:Worker)
            (w1 | w2)-[:FOLD]->(sink:Sink)
        `;
        const { ast: astEnt } = compiler.parse(gglEntangle);
        const resEnt = await engine.execute(astEnt!);
        expect(resEnt).toContain('[ENTANGLE]');
        // Shared state should have been incremented twice
        expect(resEnt).toContain('2');

        // 2. Test SUPERPOSE (probabilistic)
        const gglSuper = `
            (s:Source)-[:SUPERPOSE { p: 0.0 }]->(w1:Worker | w2:Worker)
            (w1 | w2)-[:FOLD]->(sink:Sink)
        `;
        const { ast: astSuper } = compiler.parse(gglSuper);
        const resSuper = await engine.execute(astSuper!);
        expect(resSuper).toContain('[SUPERPOSE]');
        expect(resSuper).toContain('Active wave-function: [w1]'); // Fallback to first

        // 3. Test EVOLVE (fluidic)
        const gglEvolve = `
            (s:Source)-[:EVOLVE { max_re: 1.0 }]->(w1:Worker | w2:Worker)
            (w1 | w2)-[:FOLD]->(sink:Sink)
        `;
        const { ast: astEvolve } = compiler.parse(gglEvolve);
        const resEvolve = await engine.execute(astEvolve!);
        expect(resEvolve).toContain('[EVOLVE]');
        expect(resEvolve).toContain('Laminar Flow');
    });
});
