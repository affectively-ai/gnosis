import { describe, test, expect } from 'bun:test';
import { runGGTestFile, formatGGTestResults } from './gg-test-runner';
import { resolve } from 'path';

const EXAMPLES_DIR = resolve(__dirname, '../examples');

describe('gg test runner', () => {
  test('synth.test.gg — all modules pass', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'synth/synth.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules.length).toBe(5); // oscillator, filter, envelope, lfo, effects
    for (const mod of result.modules) {
      expect(mod.ok).toBe(true);
    }
    // The test topology itself is verified
    expect(result.composition.ok).toBe(true);
  });

  test('transformer.test.gg — all modules pass', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'transformer/transformer.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules.length).toBe(4); // attention, ffn, norm, residual
    for (const mod of result.modules) {
      expect(mod.ok).toBe(true);
    }
    expect(result.composition.ok).toBe(true);
  });

  test('formatGGTestResults produces readable output', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'synth/synth.test.gg')
    );

    const output = formatGGTestResults(result);
    expect(output).toContain('PASS');
    expect(output).toContain('oscillator.gg');
    expect(output).toContain('filter.gg');
    expect(output).toContain('envelope.gg');
    expect(output).toContain('lfo.gg');
    expect(output).toContain('effects.gg');
    expect(output).toContain('test-topology');
    expect(output).toContain('passed');
  });
});
