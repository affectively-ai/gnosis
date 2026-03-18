import { describe, expect, test } from 'bun:test';
import {
  detectCloudRunStamp,
  runHeteroMoAFabricBenchmark,
} from './hetero-moa-fabric-benchmark.js';

describe('gnosis hetero MoA fabric benchmark', () => {
  test('reports fabric telemetry and a relative speedup against the sequential baseline', async () => {
    const report = await runHeteroMoAFabricBenchmark({
      iterations: 3,
      hedgeDelayMs: 1,
      laneCounts: {
        cpu: 1,
        gpu: 1,
        npu: 1,
        wasm: 0,
      },
    });

    expect(report.label).toBe('gnosis-hetero-moa-fabric-benchmark-v1');
    expect(report.iterations).toBe(3);
    expect(report.fabric.meanWallTimeMs).toBeGreaterThan(0);
    expect(report.fabric.meanCpuTimeMs).toBeGreaterThan(0);
    expect(report.fabric.meanQueueOccupancy).toBeGreaterThan(0);
    expect(report.relativeSpeedup).toBeGreaterThan(0);
  });

  test('surfaces Cloud Run execution metadata when present', () => {
    const stamp = detectCloudRunStamp({
      K_SERVICE: 'gnosis-bench',
      K_REVISION: 'gnosis-bench-00042',
      CLOUD_RUN_JOB: 'fabric-bench-job',
      CLOUD_RUN_TASK_INDEX: '2',
      CLOUD_RUN_REGION: 'us-central1',
      GOOGLE_CLOUD_PROJECT: 'neutral-418500',
    });

    expect(stamp.detected).toBe(true);
    expect(stamp.service).toBe('gnosis-bench');
    expect(stamp.job).toBe('fabric-bench-job');
    expect(stamp.taskIndex).toBe('2');
    expect(stamp.region).toBe('us-central1');
    expect(stamp.project).toBe('neutral-418500');
  });
});
