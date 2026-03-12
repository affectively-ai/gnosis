import { describe, it, expect } from 'bun:test';
import { BettyCompiler } from './compiler.js';

describe('BettyCompiler', () => {
    const compiler = new BettyCompiler();

    it('should parse simple node declarations', () => {
        const { ast } = compiler.parse('(a:Process {key: "val"})');
        expect(ast?.nodes.has('a')).toBe(true);
        const node = ast?.nodes.get('a');
        expect(node?.labels).toContain('Process');
        expect(node?.properties.key).toBe('val');
    });

    it('should parse edge declarations with types', () => {
        const { ast, b1 } = compiler.parse('(a)-[:FORK]->(b|c)');
        expect(ast?.edges.length).toBe(1);
        expect(ast?.edges[0].type).toBe('FORK');
        expect(ast?.edges[0].sourceIds).toEqual(['a']);
        expect(ast?.edges[0].targetIds).toEqual(['b', 'c']);
        expect(b1).toBe(1); // beta1 increases by targets.length - 1
    });

    it('should calculate Buley measurement correctly', () => {
        const { buleyMeasure } = compiler.parse('(a)-[:FORK]->(b|c)\n(b|c)-[:FOLD]->(d)');
        // Buley = (beta1 * 1.5) + (pathComplexity * 0.5)
        // beta1 here should be 0 (forked 1, then folded 1)
        // pathComplexity = sum(sources * targets) = (1 * 2) + (2 * 1) = 4
        // (0 * 1.5) + (4 * 0.5) = 2.0
        expect(buleyMeasure).toBe(2.0);
    });

    it('should reject imperative keywords', () => {
        const { diagnostics } = compiler.parse('function invalid() { return 0; }');
        expect(diagnostics.some(d => d.message.includes('rejected'))).toBe(true);
        expect(diagnostics[0].severity).toBe('error');
    });

    it('should handle multi-line input and comments', () => {
        const input = '// Start\n(source:Entry)\n(source)-[:PROCESS]->(target:Exit)';
        const { ast } = compiler.parse(input);
        expect(ast?.nodes.size).toBe(2);
        expect(ast?.edges.length).toBe(1);
    });

    it('should detect disconnected nodes', () => {
        const { diagnostics } = compiler.parse('(a)\n(b)-[:PROCESS]->(c)');
        expect(diagnostics.some(d => d.message.includes('Disconnected node'))).toBe(true);
        expect(diagnostics.find(d => d.message.includes('Disconnected node'))?.severity).toBe('warning');
    });
});
