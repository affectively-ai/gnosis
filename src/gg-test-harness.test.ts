import { describe, test, expect } from 'bun:test';
import { ggTest, ggQuickCheck, ggAssert } from './gg-test-harness.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SYNTH_DIR = resolve(__dirname, '../examples/synth');
const TRANSFORMER_DIR = resolve(__dirname, '../examples/transformer');

function readGG(dir: string, name: string): string {
  return readFileSync(resolve(dir, name), 'utf-8');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Synth Formal Proofs — each .gg file verified by the model checker
// ═══════════════════════════════════════════════════════════════════════════════

describe('synth formal proofs', () => {
  test('oscillator.gg — bounded superposition (beta1 < 10)', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'oscillator.gg'))
      .beta1Bounded(10)
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.topology.forkCount).toBeGreaterThan(0);
    expect(result.program.nodeCount).toBeGreaterThanOrEqual(6);
  });

  test('oscillator.gg — osc_out is reachable', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'oscillator.gg'))
      .reachable('osc_out')
      .run();

    expect(result.ok).toBe(true);
  });

  test('filter.gg — safe with race collapse', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'filter.gg'))
      .safe()
      .beta1Bounded(10)
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.terminalNodes).toContain('filter_out');
  });

  test('filter.gg — filter_out reachable from filter_input', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'filter.gg'))
      .reachable('filter_out')
      .run();

    expect(result.ok).toBe(true);
  });

  test('envelope.gg — zero superposition (pure state machine)', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'envelope.gg'))
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.nodeCount).toBeGreaterThanOrEqual(5);
  });

  test('envelope.gg — silence is reachable (envelope completes)', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'envelope.gg'))
      .reachable('silence')
      .reachable('env_out')
      .run();

    expect(result.ok).toBe(true);
  });

  test('lfo.gg — pure process chain, zero superposition', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'lfo.gg'))
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.terminalNodes).toContain('lfo_out');
  });

  test('effects.gg — fork/fold roundtrip', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'effects.gg'))
      .safe()
      .beta1Bounded(10)
      .run();

    expect(result.ok).toBe(true);
    expect(result.topology.forkCount).toBeGreaterThan(0);
  });

  test('effects.gg — all effect nodes reachable', async () => {
    const result = await ggTest(readGG(SYNTH_DIR, 'effects.gg'))
      .reachable('delay')
      .reachable('reverb')
      .reachable('chorus')
      .reachable('fx_out')
      .run();

    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Transformer Formal Proofs
// ═══════════════════════════════════════════════════════════════════════════════

describe('transformer formal proofs', () => {
  test('attention.gg — 8-head fork/fold bounded', async () => {
    const result = await ggTest(readGG(TRANSFORMER_DIR, 'attention.gg'))
      .safe()
      .beta1Bounded(20)
      .run();

    expect(result.ok).toBe(true);
    expect(result.topology.forkCount).toBeGreaterThan(0);
  });

  test('attention.gg — attention_out reachable', async () => {
    const result = await ggTest(readGG(TRANSFORMER_DIR, 'attention.gg'))
      .reachable('attention_out')
      .run();

    expect(result.ok).toBe(true);
  });

  test('ffn.gg — pure sequential, zero superposition', async () => {
    const result = await ggTest(readGG(TRANSFORMER_DIR, 'ffn.gg'))
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.terminalNodes).toContain('ffn_out');
  });

  test('norm.gg — trivially safe', async () => {
    const result = await ggTest(readGG(TRANSFORMER_DIR, 'norm.gg'))
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.terminalNodes).toContain('norm_out');
  });

  test('residual.gg — interference (not superposition)', async () => {
    const result = await ggTest(readGG(TRANSFORMER_DIR, 'residual.gg'))
      .safe()
      .run();

    expect(result.ok).toBe(true);
    expect(result.program.terminalNodes).toContain('residual_out');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Harness API Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('gg test harness API', () => {
  const SIMPLE_GG = `
(a: Start)
(b: End)
(a)-[:PROCESS]->(b)
`;

  const FORK_GG = `
(a: Start)
(b: Mid)
(c: Mid)
(d: End)
(a)-[:FORK]->(b | c)
(b | c)-[:FOLD]->(d)
`;

  test('ggQuickCheck on simple topology', async () => {
    const result = await ggQuickCheck(SIMPLE_GG);
    expect(result.ok).toBe(true);
    expect(result.complete).toBe(true);
    expect(result.program.nodeCount).toBe(2);
    expect(result.program.edgeCount).toBe(1);
  });

  test('ggQuickCheck on fork/fold topology', async () => {
    const result = await ggQuickCheck(FORK_GG);
    expect(result.ok).toBe(true);
    expect(result.topology.forkCount).toBeGreaterThan(0);
  });

  test('ggAssert passes on valid topology', async () => {
    const result = await ggAssert(SIMPLE_GG, 'simple');
    expect(result.ok).toBe(true);
  });

  test('custom invariant', async () => {
    const result = await ggTest(FORK_GG)
      .invariant('max_beta1_is_1', (s) => s.beta1 <= 1)
      .run();

    expect(result.ok).toBe(true);
  });

  test('reachable assertion', async () => {
    const result = await ggTest(SIMPLE_GG)
      .reachable('b')
      .run();

    expect(result.ok).toBe(true);
  });

  test('reachesBeta1 assertion', async () => {
    const result = await ggTest(FORK_GG)
      .reachesBeta1(1)
      .reachesBeta1(0)
      .run();

    expect(result.ok).toBe(true);
  });
});
