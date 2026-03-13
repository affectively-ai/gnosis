import { readFileSync } from 'fs';
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
    const { buleyMeasure } = compiler.parse(
      '(a)-[:FORK]->(b|c)\n(b|c)-[:FOLD]->(d)'
    );
    // Buley = (beta1 * 1.5) + (pathComplexity * 0.5)
    // beta1 here should be 0 (forked 1, then folded 1)
    // pathComplexity = sum(sources * targets) = (1 * 2) + (2 * 1) = 4
    // (0 * 1.5) + (4 * 0.5) = 2.0
    expect(buleyMeasure).toBe(2.0);
  });

  it('should reject imperative keywords', () => {
    const { diagnostics } = compiler.parse('function invalid() { return 0; }');
    expect(diagnostics.some((d) => d.message.includes('rejected'))).toBe(true);
    expect(diagnostics[0].severity).toBe('error');
  });

  it('should handle multi-line input and comments', () => {
    const input =
      '// Start\n(source:Entry)\n(source)-[:PROCESS]->(target:Exit)';
    const { ast } = compiler.parse(input);
    expect(ast?.nodes.size).toBe(2);
    expect(ast?.edges.length).toBe(1);
  });

  it('should detect disconnected nodes', () => {
    const { diagnostics } = compiler.parse('(a)\n(b)-[:PROCESS]->(c)');
    expect(
      diagnostics.some((d) => d.message.includes('Disconnected node'))
    ).toBe(true);
    expect(
      diagnostics.find((d) => d.message.includes('Disconnected node'))?.severity
    ).toBe('warning');
  });

  it('should auto-inject ZK sync envelope nodes for sensitive sync properties', () => {
    const { ast, diagnostics } = compiler.parse(`
            (src:Source)-[:PROCESS { crossTenant: "true" }]->(dst:Sink)
        `);

    const labels = Array.from(ast?.nodes.values() ?? []).flatMap(
      (node) => node.labels
    );
    expect(labels).toContain('ZKSyncEnvelope');
    expect(diagnostics.some((d) => d.message.includes('Auto-injected'))).toBe(
      true
    );
  });

  it('preserves quoted comma-separated property values', () => {
    const { ast } = compiler.parse(`
            (extract:Destructure { fields: "user,score", from: "value" })-[:PROCESS]->(sink)
        `);

    const node = ast?.nodes.get('extract');
    expect(node?.properties.fields).toBe('user,score');
    expect(node?.properties.from).toBe('value');
  });

  it('reports missing tagged routes for Result nodes', () => {
    const { diagnostics } = compiler.parse(`
            (decision:Result)-[:PROCESS { case: "ok" }]->(success)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "Result node 'decision' is missing tagged routes for: err."
        )
      )
    ).toBe(true);
  });

  it('reports duplicate tagged routes for Result nodes', () => {
    const { diagnostics } = compiler.parse(`
            (decision:Result)-[:PROCESS { case: "ok" }]->(first_success)
            (decision)-[:PROCESS { case: "ok" }]->(second_success)
            (decision)-[:PROCESS { case: "err" }]->(failure)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "Result node 'decision' routes case 'ok' more than once."
        )
      )
    ).toBe(true);
  });

  it('accepts exhaustive Option routing', () => {
    const { diagnostics } = compiler.parse(`
            (maybe:Option)-[:PROCESS { case: "some" }]->(has_value)
            (maybe)-[:PROCESS { case: "none" }]->(no_value)
        `);

    expect(
      diagnostics.some((d) => d.message.includes('missing tagged routes'))
    ).toBe(false);
    expect(diagnostics.some((d) => d.message.includes('routes case'))).toBe(
      false
    );
  });

  it('reports missing tagged routes for closed Variant nodes', () => {
    const { diagnostics } = compiler.parse(`
            (state:Variant { cases: "ready,retry,timeout", case: "ready" })-[:PROCESS { case: "ready" }]->(done)
            (state)-[:PROCESS { case: "retry" }]->(again)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "Variant node 'state' is missing tagged routes for: timeout."
        )
      )
    ).toBe(true);
  });

  it('warns when Variant routing has no declared closed cases', () => {
    const { diagnostics } = compiler.parse(`
            (state:Variant { case: "ready" })-[:PROCESS { case: "ready" }]->(done)
            (state)-[:PROCESS { case: "retry" }]->(again)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "Variant node 'state' declares tagged exits but no closed cases."
        )
      )
    ).toBe(true);
  });

  it('reports invalid structured concurrency failure policies', () => {
    const { diagnostics } = compiler.parse(`
            (src)-[:FORK]->(fast|slow)
            (fast|slow)-[:RACE { failure: "explode" }]->(sink)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes("RACE uses unknown failure policy 'explode'")
      )
    ).toBe(true);
  });

  it('reports invalid structured concurrency timeout values', () => {
    const { diagnostics } = compiler.parse(`
            (src)-[:FORK]->(fast|slow)
            (fast|slow)-[:FOLD { timeoutMs: "soon" }]->(sink)
        `);

    expect(
      diagnostics.some((d) =>
        d.message.includes(
          "FOLD requires 'timeoutMs' to be a non-negative number."
        )
      )
    ).toBe(true);
  });

  it('keeps betti.gg exhaustive for tagged compiler routing', () => {
    const source = readFileSync(
      new URL('../../betti.gg', import.meta.url),
      'utf-8'
    );
    const { diagnostics } = compiler.parse(source);

    expect(
      diagnostics.some((d) => d.message.includes('missing tagged routes'))
    ).toBe(false);
    expect(diagnostics.some((d) => d.message.includes('routes case'))).toBe(
      false
    );
  });
});
