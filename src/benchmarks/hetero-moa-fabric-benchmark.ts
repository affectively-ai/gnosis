import {
  HeteroMoAFabricCommunityMemory,
  runHeteroMoAFabric,
  type HeteroMoAFabricBackendDescriptor,
  type HeteroMoAFabricLayerKind,
} from '../runtime/hetero-fabric.js';

export interface HeteroMoAFabricBenchmarkConfig {
  readonly iterations: number;
  readonly hedgeDelayMs: number;
  readonly laneCounts: {
    cpu: number;
    gpu: number;
    npu: number;
    wasm: number;
  };
  readonly layerLatencyMs: Record<HeteroMoAFabricLayerKind, number>;
}

export interface HeteroMoAFabricCloudRunStamp {
  readonly detected: boolean;
  readonly service?: string;
  readonly revision?: string;
  readonly job?: string;
  readonly taskIndex?: string;
  readonly region?: string;
  readonly project?: string;
}

export interface HeteroMoAFabricBenchmarkReport {
  readonly label: 'gnosis-hetero-moa-fabric-benchmark-v1';
  readonly iterations: number;
  readonly cloudRun: HeteroMoAFabricCloudRunStamp;
  readonly baseline: {
    readonly meanWallTimeMs: number;
  };
  readonly fabric: {
    readonly meanWallTimeMs: number;
    readonly meanCpuTimeMs: number;
    readonly meanSkippedHedges: number;
    readonly meanVentShare: number;
    readonly meanQueueOccupancy: number;
    readonly winnerCounts: Record<string, number>;
  };
  readonly relativeSpeedup: number;
}

const DEFAULT_CONFIG: HeteroMoAFabricBenchmarkConfig = {
  iterations: 8,
  hedgeDelayMs: 1,
  laneCounts: {
    cpu: 1,
    gpu: 1,
    npu: 1,
    wasm: 1,
  },
  layerLatencyMs: {
    cpu: 4,
    gpu: 2,
    npu: 3,
    wasm: 5,
  },
};

function nowMs(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function detectCloudRunStamp(
  env: Record<string, string | undefined> = process.env
): HeteroMoAFabricCloudRunStamp {
  const detected = Boolean(env.K_SERVICE || env.CLOUD_RUN_JOB);
  return {
    detected,
    service: env.K_SERVICE,
    revision: env.K_REVISION,
    job: env.CLOUD_RUN_JOB,
    taskIndex: env.CLOUD_RUN_TASK_INDEX,
    region: env.CLOUD_RUN_REGION ?? env.GOOGLE_CLOUD_REGION,
    project: env.GOOGLE_CLOUD_PROJECT,
  };
}

function createSyntheticBackends(
  config: HeteroMoAFabricBenchmarkConfig
): HeteroMoAFabricBackendDescriptor[] {
  const descriptors: HeteroMoAFabricBackendDescriptor[] = [];
  const layers: readonly HeteroMoAFabricLayerKind[] = [
    'cpu',
    'gpu',
    'npu',
    'wasm',
  ];

  for (const layer of layers) {
    const kind =
      layer === 'cpu'
        ? 'cpu'
        : layer === 'gpu'
        ? 'webgpu'
        : layer === 'npu'
        ? 'webnn'
        : 'wasm';
    descriptors.push({
      id: `${layer}-synthetic`,
      label: `${layer.toUpperCase()} synthetic lane`,
      kind,
      layer,
      priority: layer === 'gpu' ? 3 : layer === 'npu' ? 2 : 1,
      async execute(input) {
        await sleep(config.layerLatencyMs[layer]);
        return {
          value: {
            layer,
            input,
          },
          cpuTimeMs: config.layerLatencyMs[layer],
        };
      },
    });
  }

  return descriptors;
}

async function runBaselineSequential(
  backends: readonly HeteroMoAFabricBackendDescriptor[],
  input: Float32Array
): Promise<number> {
  const startedAt = nowMs();
  for (const backend of backends) {
    await backend.execute(input, {
      signal: new AbortController().signal,
      role: 'primary',
      lane: 0,
      layer: backend.layer,
      cursorPosition: 0,
      frameProtocol: 'aeon-10-byte-binary',
    });
  }
  return Math.max(0, nowMs() - startedAt);
}

export async function runHeteroMoAFabricBenchmark(
  overrides: Partial<HeteroMoAFabricBenchmarkConfig> = {},
  env: Record<string, string | undefined> = process.env
): Promise<HeteroMoAFabricBenchmarkReport> {
  const config: HeteroMoAFabricBenchmarkConfig = {
    ...DEFAULT_CONFIG,
    ...overrides,
    laneCounts: {
      ...DEFAULT_CONFIG.laneCounts,
      ...overrides.laneCounts,
    },
    layerLatencyMs: {
      ...DEFAULT_CONFIG.layerLatencyMs,
      ...overrides.layerLatencyMs,
    },
  };
  const backends = createSyntheticBackends(config);
  const communityMemory = new HeteroMoAFabricCommunityMemory({
    decayHalfLifeMs: 60_000,
  });
  const baselineWallTimes: number[] = [];
  const fabricWallTimes: number[] = [];
  const fabricCpuTimes: number[] = [];
  const skippedHedges: number[] = [];
  const ventShares: number[] = [];
  const queueOccupancies: number[] = [];
  const winnerCounts = new Map<string, number>();

  for (let iteration = 0; iteration < config.iterations; iteration++) {
    const input = new Float32Array([iteration + 1, iteration % 2, 1]);
    baselineWallTimes.push(await runBaselineSequential(backends, input));
    const result = await runHeteroMoAFabric(backends, input, {
      fabricKey: 'benchmark-fabric',
      communityMemory,
      plan: {
        hedgeDelayMs: config.hedgeDelayMs,
        laneCounts: config.laneCounts,
      },
    });
    fabricWallTimes.push(result.telemetry.wallTimeMs);
    fabricCpuTimes.push(result.telemetry.cpuTimeMs);
    skippedHedges.push(result.telemetry.skippedHedges);
    ventShares.push(result.telemetry.ventShare);
    queueOccupancies.push(result.telemetry.queueOccupancy);
    if (result.winner) {
      winnerCounts.set(
        result.winner.layer,
        (winnerCounts.get(result.winner.layer) ?? 0) + 1
      );
    }
  }

  const baselineMean = mean(baselineWallTimes);
  const fabricMean = mean(fabricWallTimes);
  return {
    label: 'gnosis-hetero-moa-fabric-benchmark-v1',
    iterations: config.iterations,
    cloudRun: detectCloudRunStamp(env),
    baseline: {
      meanWallTimeMs: baselineMean,
    },
    fabric: {
      meanWallTimeMs: fabricMean,
      meanCpuTimeMs: mean(fabricCpuTimes),
      meanSkippedHedges: mean(skippedHedges),
      meanVentShare: mean(ventShares),
      meanQueueOccupancy: mean(queueOccupancies),
      winnerCounts: Object.fromEntries(winnerCounts),
    },
    relativeSpeedup: fabricMean > 0 ? baselineMean / fabricMean : 0,
  };
}

if (import.meta.main) {
  const report = await runHeteroMoAFabricBenchmark();
  console.log(JSON.stringify(report, null, 2));
}
