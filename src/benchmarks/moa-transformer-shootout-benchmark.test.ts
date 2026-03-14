import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';

import { runGGTestFile } from '../gg-test-runner.js';
import {
  DEFAULT_MOA_TRANSFORMER_TOPOLOGY_FILES,
  renderGnosisMoaTransformerShootoutMarkdown,
  runGnosisMoaTransformerShootoutBenchmark,
} from './moa-transformer-shootout-benchmark.js';

describe('gnosis MoA transformer shootout benchmark', () => {
  test('keeps the MoA family accuracy-competitive while using less compute', async () => {
    const report = await runGnosisMoaTransformerShootoutBenchmark();

    expect(report.sharedCapacity.parameterCount).toBe(72);
    expect(report.sharedCapacity.transformerletCount).toBe(4);
    expect(report.sharedCapacity.headChainCount).toBe(16);
    expect(report.sharedCapacity.rotationStageCount).toBe(4);
    expect(report.families.regular.meanActiveBlockCount).toBe(4);
    expect(report.families.regular.meanActiveHeadCount).toBe(16);
    expect(report.families.moa.meanActiveBlockCount).toBe(2);
    expect(report.families.moa.meanActiveHeadCount).toBe(4);
    expect(report.moaUsesLessCompute).toBe(true);
    expect(report.rawAccuracyCompetitive).toBe(true);
    expect(report.winnerByComputeAdjustedExactFraction).toBe('moa');
    expect(report.families.moa.computeAdjustedExactFraction).toBeGreaterThan(
      report.families.regular.computeAdjustedExactFraction
    );
    expect(report.families.moa.meanFrameCount).toBeLessThan(
      report.families.regular.meanFrameCount
    );
    expect(report.families.moa.meanEvalMeanSquaredError).toBeLessThan(0.06);
    expect(report.families.regular.meanEvalMeanSquaredError).toBeLessThan(0.08);
    expect(report.families.moa.meanCodecRoundTripExactFraction).toBe(1);
    expect(report.families.regular.meanReassemblyExactFraction).toBe(1);
    expect(report.families.moa.meanFoldInvarianceExactFraction).toBe(1);
  });

  test('ships a .test.gg suite for the regular and MoA benchmark modules', async () => {
    const result = await runGGTestFile(
      resolve(__dirname, '../../examples/benchmarks/moa-transformer.test.gg')
    );

    expect(result.ok).toBe(true);
    expect(result.modules).toHaveLength(2);
    expect(result.modules.every((moduleResult) => moduleResult.ok)).toBe(true);
    expect(result.composition.ok).toBe(true);
  });

  test('points at the checked-in regular and MoA topology modules', () => {
    expect(
      DEFAULT_MOA_TRANSFORMER_TOPOLOGY_FILES.regular.endsWith(
        'moa-transformer-regular.gg'
      )
    ).toBe(true);
    expect(
      DEFAULT_MOA_TRANSFORMER_TOPOLOGY_FILES.moa.endsWith(
        'moa-transformer-moa.gg'
      )
    ).toBe(true);
  });

  test('renders a markdown report with compute-adjusted metrics', async () => {
    const markdown = renderGnosisMoaTransformerShootoutMarkdown(
      await runGnosisMoaTransformerShootoutBenchmark()
    );

    expect(markdown).toContain('# Gnosis MoA Transformer Shootout');
    expect(markdown).toContain('Compute-adjusted exact');
    expect(markdown).toContain('regular');
    expect(markdown).toContain('moa');
  });
});
