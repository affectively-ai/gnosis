import { describe, test, expect } from 'bun:test';
import {
  runGGTestFile,
  runGGTestSuite,
  discoverTestFiles,
  formatGGTestResults,
  formatGGTestDiscoveryResults,
} from './gg-test-runner.js';
import { resolve } from 'path';

const EXAMPLES_DIR = resolve(__dirname, '../examples');

describe('gg test runner — auto-discovery', () => {
  test('discovers all .test.gg files', () => {
    const files = discoverTestFiles(EXAMPLES_DIR);
    expect(files.length).toBeGreaterThanOrEqual(3); // synth, transformer, crdt
    for (const f of files) {
      expect(f).toMatch(/\.test\.gg$/);
    }
  });

  test('runGGTestSuite — all discovered suites pass', async () => {
    const result = await runGGTestSuite(EXAMPLES_DIR);

    expect(result.ok).toBe(true);
    expect(result.suites.length).toBeGreaterThanOrEqual(3);
    expect(result.totalFailed).toBe(0);
    expect(result.totalPassed).toBe(result.totalModules);

    for (const suite of result.suites) {
      expect(suite.ok).toBe(true);
      for (const mod of suite.modules) {
        expect(mod.ok).toBe(true);
      }
      expect(suite.composition.ok).toBe(true);
    }
  });

  test('formatGGTestDiscoveryResults produces readable output', async () => {
    const result = await runGGTestSuite(EXAMPLES_DIR);
    const output = formatGGTestDiscoveryResults(result);

    expect(output).toContain('discovered');
    expect(output).toContain('PASS');
    expect(output).toContain('ALL PASSED');
    expect(output).toContain('modules');
  });
});

describe('gg test runner — individual suites', () => {
  test('synth.test.gg — all modules pass', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'synth/synth.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules.length).toBe(5);
    for (const mod of result.modules) {
      expect(mod.ok).toBe(true);
    }
    expect(result.composition.ok).toBe(true);
  });

  test('transformer.test.gg — all modules pass', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'transformer/transformer.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules.length).toBe(4);
    for (const mod of result.modules) {
      expect(mod.ok).toBe(true);
    }
    expect(result.composition.ok).toBe(true);
  });

  test('crdt.test.gg — all quantum CRDT modules pass', async () => {
    const result = await runGGTestFile(
      resolve(EXAMPLES_DIR, 'crdt/crdt.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules.length).toBe(7);
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
    expect(output).toContain('test-topology');
    expect(output).toContain('passed');
  });
});
