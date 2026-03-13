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

  it('preserves tuple and path destructuring bindings', () => {
    const { ast } = compiler.parse(`
            (extract:Destructure { items: "0.id:firstId,2.id:thirdId", fields: "left.score:leftScore" })-[:PROCESS]->(sink)
        `);

    const node = ast?.nodes.get('extract');
    expect(node?.properties.items).toBe('0.id:firstId,2.id:thirdId');
    expect(node?.properties.fields).toBe('left.score:leftScore');
  });

  it('lowers single-receiver canonical call syntax into PROCESS edges', () => {
    const { ast } = compiler.parse(`
            (start)
            (wrap:Result { kind: "ok" })
            wrap(start)
        `);

    expect(ast?.edges).toHaveLength(1);
    expect(ast?.edges[0]).toMatchObject({
      sourceIds: ['start'],
      targetIds: ['wrap'],
      type: 'PROCESS',
    });
  });

  it('lowers UFCS chains into PROCESS edges', () => {
    const { ast } = compiler.parse(`
            (start)
            (wrap:Result { kind: "ok" })
            (extract:Destructure { from: "value", fields: "name" })
            start.wrap().extract()
        `);

    expect(ast?.edges).toHaveLength(2);
    expect(ast?.edges[0]).toMatchObject({
      sourceIds: ['start'],
      targetIds: ['wrap'],
      type: 'PROCESS',
    });
    expect(ast?.edges[1]).toMatchObject({
      sourceIds: ['wrap'],
      targetIds: ['extract'],
      type: 'PROCESS',
    });
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

  it('rejects unstable thermodynamic cycles with spectral explosion', () => {
    const { diagnostics, stability } = compiler.parse(`
            (inbound:Source { pressure: "5" })
            (queue:State { potential: "beta1" })
            (resolved:Sink { capacity: "1" })
            (inbound)-[:FORK { weight: "1.0" }]->(queue)
            (queue)-[:FORK { weight: "1.0" }]->(queue)
            (queue)-[:FOLD { service_rate: "2", drift_gamma: "1.0" }]->(resolved)
        `);

    expect(stability?.enabled).toBe(true);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'ERR_SPECTRAL_EXPLOSION')
    ).toBe(true);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'ERR_DRIFT_POSITIVE')
    ).toBe(true);
  });

  it('recognizes the symbolic reneging proof family', () => {
    const { diagnostics, stability } = compiler.parse(`
            (traffic:Source { pressure: "lambda" })
            (processing:State { potential: "beta1" })
            (complete:Sink { beta1_target: "0", capacity: "64" })
            (traffic)-[:FORK { weight: "1.0" }]->(processing)
            (processing)-[:FOLD { service_rate: "mu", drift_gamma: "1.0" }]->(complete)
            (processing)-[:VENT { drift_coefficient: "alpha(n)", repair_debt: "0" }]->(complete)
        `);

    expect(stability?.proof.kind).toBe('symbolic-reneging');
    expect(stability?.metadata.redline).toBe(64);
    expect(stability?.countableQueue?.predecessorStepMode).toBe('margin-predecessor');
    expect(stability?.countableQueue?.queueBoundary).toBe(64);
    expect(stability?.countableQueue?.laminarAtom).toBe(0);
    expect(stability?.countableQueue?.arrivalExpression).toBe('lambda');
    expect(stability?.countableQueue?.serviceExpression).toBe('mu');
    expect(stability?.countableQueue?.ventExpression).toBe('alpha(n)');
    expect(stability?.metadata.countableQueueCertified).toBe(true);
    expect(stability?.metadata.queueBoundary).toBe(64);
    expect(stability?.metadata.laminarAtom).toBe(0);
    expect(stability?.metadata.queuePotential).toBe('beta1');
    expect(stability?.metadata.laminarGeometricTheoremName).toBe(
      'complete_is_geometrically_stable_laminar_geometric_stable'
    );
    expect(stability?.metadata.measurableHarrisTheoremName).toBe(
      'complete_is_geometrically_stable_measurable_harris_certified'
    );
    expect(stability?.recurrence.finiteStateCertified).toBe(true);
    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'ERR_DRIFT_POSITIVE')
    ).toBe(false);
  });

  it('flags repair debt leaking through vents', () => {
    const { diagnostics } = compiler.parse(`
            (traffic:Source { pressure: "1" })
            (processing:State { potential: "beta1" })
            (left:State { potential: "queue_depth" })
            (right:State { potential: "queue_depth" })
            (complete:Sink { capacity: "16" })
            (traffic)-[:FORK]->(left|right)
            (left)-[:VENT { drift_coefficient: "1", repair_debt: "1" }]->(complete)
            (right)-[:FOLD { service_rate: "4", drift_gamma: "1" }]->(complete)
        `);

    expect(
      diagnostics.some((diagnostic) => diagnostic.code === 'ERR_REPAIR_DEBT_LEAK')
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
