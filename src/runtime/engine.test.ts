import { readFileSync } from 'fs';
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
    const { ast } = compiler.parse(
      '(a:PropCheck {val: "secret"})-[:PROCESS]->(b)'
    );

    const result = await engine.execute(ast!, 'input');
    expect(result).toContain('secret');
  });

  it('routes native Result cases and destructures payloads in .gg', async () => {
    const registry = new GnosisRegistry();
    registry.register('Source', async () => ({
      user: 'ada',
      score: 7,
      region: 'topology',
    }));
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const { ast } = compiler.parse(`
            (src:Source)-[:PROCESS]->(decision:Result { kind: "ok" })
            (decision)-[:PROCESS { case: "ok" }]->(extract:Destructure { from: "value", fields: "user,score" })
            (decision)-[:PROCESS { case: "err" }]->(fallback:Sink)
            (extract)-[:PROCESS]->(sink:Sink)
            (fallback)-[:PROCESS]->(sink)
        `);

    const result = await engine.execute(ast!);
    expect(result).toContain('"user":"ada"');
    expect(result).toContain('"score":7');
    expect(result).not.toContain('Executing [fallback]');
  });

  it('routes native Option none cases in .gg', async () => {
    const registry = new GnosisRegistry();
    registry.register('Source', async () => null);
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const { ast } = compiler.parse(`
            (src:Source)-[:PROCESS]->(maybe:Option)
            (maybe)-[:PROCESS { case: "some" }]->(extract:Destructure { fields: "user", strict: "false" })
            (maybe)-[:PROCESS { case: "none" }]->(fallback:Sink)
            (extract)-[:PROCESS]->(sink:Sink)
            (fallback)-[:PROCESS]->(sink)
        `);

    const result = await engine.execute(ast!);
    expect(result).toContain('"kind":"none"');
    expect(result).not.toContain('Executing [extract]');
  });

  it('derives Result cases from payload fields for Betti-style topologies', async () => {
    const registry = new GnosisRegistry();
    registry.register('Source', async () => ({
      verified: true,
      stats: { beta1: 0 },
      buleyNumber: 1.5,
    }));
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const { ast } = compiler.parse(`
            (src:Source)-[:PROCESS]->(decision:Result { kindFrom: "verified" })
            (decision)-[:PROCESS { case: "ok" }]->(extract:Destructure { from: "value", fields: "stats,buleyNumber" })
            (decision)-[:PROCESS { case: "err" }]->(fallback:Sink)
            (extract)-[:PROCESS]->(sink:Sink)
            (fallback)-[:PROCESS]->(sink)
        `);

    const result = await engine.execute(ast!);
    expect(result).toContain('"beta1":0');
    expect(result).toContain('"buleyNumber":1.5');
    expect(result).not.toContain('Executing [fallback]');
  });

  it('routes closed Variant cases from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Source', async () => ({
      status: 'retry',
      attempts: 2,
      message: 'warm cache and try again',
      score: 11,
    }));
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../closed_variant.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('"attempts":2');
    expect(result).toContain('"message":"warm cache and try again"');
    expect(result).not.toContain('Executing [ready_payload]');
    expect(result).not.toContain('Executing [timeout_payload]');
  });

  it('executes native qubit measurement topologies from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../qubit_measure.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('"kind":"one"');
    expect(result).toContain('"zero":0.5');
    expect(result).not.toContain('Executing [zero_path]');
  });

  it('executes native differentiable gradient steps from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../gradient_step.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('"type":"parameter"');
    expect(result).toContain('"value":1.85');
    expect(result).toContain('"gradient":1.5');
  });

  it('executes native differentiable loss topologies from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../loss_surface.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('"type":"loss"');
    expect(result).toContain('"value":4');
    expect(result).toContain('"delta":2');
  });

  it('cancels race losers under native structured concurrency from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../structured_race.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('Race concluded! Winner: fast');
    expect(result).toContain('[BRANCH fast] success');
    expect(result).toContain('[BRANCH slow] cancelled');
    expect(result).toContain('"fast-path"');
  });

  it('shields timed-out fold branches under native structured concurrency from .gg files', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const source = readFileSync(
      new URL('../../structured_fold_shield.gg', import.meta.url),
      'utf-8'
    );
    const { ast } = compiler.parse(source);

    const result = await engine.execute(ast!);
    expect(result).toContain('[BRANCH ready] success');
    expect(result).toContain('[BRANCH stalled] timeout');
    expect(result).toContain('"ready":"ready-path"');
    expect(result).toContain('"stalled":{"kind":"timeout"');
  });

  it('vents timed-out fold branches when the topology opts into vent semantics', async () => {
    const registry = new GnosisRegistry();
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const { ast } = compiler.parse(`
            (seed:Scalar { value: "0" })-[:FORK]->(fast:Delay { ms: "1", emit: "ready" } | slow:Delay { ms: "25", emit: "stale" })
            (fast | slow)-[:FOLD { timeoutMs: "5", failure: "vent" }]->(sink:Sink)
        `);

    const result = await engine.execute(ast!);
    expect(result).toContain('[BRANCH slow] vented');
    expect(result).toContain('"fast":"ready"');
    expect(result).not.toContain('"slow"');
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
    registry.register('Worker', async (p, props, context) => {
      const shared = context?.sharedState as
        | {
            value?: number;
          }
        | undefined;
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

  it('auto-injects and executes ZK sync envelopes for sensitive process edges', async () => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey']
    );
    const recipientPublicKey = await crypto.subtle.exportKey(
      'jwk',
      keyPair.publicKey
    );

    const registry = new GnosisRegistry();
    registry.register('Source', async () => ({
      data: { secret: 'sync-state' },
      recipientPublicKey,
    }));
    registry.register('Sink', async (payload) => payload);

    const engine = new GnosisEngine(registry);
    const ast = {
      nodes: new Map([
        ['src', { id: 'src', labels: ['Source'], properties: {} }],
        ['dst', { id: 'dst', labels: ['Sink'], properties: {} }],
      ]),
      edges: [
        {
          sourceIds: ['src'],
          targetIds: ['dst'],
          type: 'PROCESS',
          properties: { crossTenant: 'true' },
        },
      ],
    };

    const result = await engine.execute(ast, null);
    expect(result).toContain('Auto-injected 1 ZK envelope node');
    expect(result).toContain('ZKSyncEnvelope');
    expect(result).toContain('ECIES-P256');
  });

  it('emits evaluated edges to native runtime observers', async () => {
    const registry = new GnosisRegistry();
    registry.register('Step', async (payload) => payload);

    const seenEdges: string[] = [];
    const engine = new GnosisEngine(registry, {
      onEdgeEvaluated: (edge) => {
        seenEdges.push(edge.type);
      },
    });

    const { ast } = compiler.parse(`
            (s:Step)-[:FORK]->(a:Step|b:Step)
            (a|b)-[:FOLD]->(join:Step)
        `);

    await engine.execute(ast!, 'input');
    expect(seenEdges).toEqual(['FORK', 'FOLD']);
  });
});
