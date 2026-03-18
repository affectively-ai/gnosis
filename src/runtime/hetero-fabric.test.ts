import { describe, expect, test } from 'bun:test';
import {
  HeteroMoAFabricCommunityMemory,
  createDashRelayConfigFromEnv,
  runHeteroMoAFabric,
  type HeteroMoAFabricBackendDescriptor,
} from './hetero-fabric.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('HeteroMoAFabric runtime', () => {
  test('skips the shadow hedge when the primary lane is already sufficient', async () => {
    const backends: HeteroMoAFabricBackendDescriptor[] = [
      {
        id: 'cpu-fast',
        label: 'CPU fast lane',
        kind: 'cpu',
        layer: 'cpu',
        async execute() {
          await sleep(2);
          return {
            value: new Float32Array([1, 2]),
          };
        },
      },
      {
        id: 'gpu-slower',
        label: 'GPU slower lane',
        kind: 'webgpu',
        layer: 'gpu',
        async execute() {
          await sleep(15);
          return {
            value: new Float32Array([1, 2]),
          };
        },
      },
    ];

    const result = await runHeteroMoAFabric(backends, new Float32Array([1, 2]), {
      plan: {
        hedgeDelayMs: 10,
        laneCounts: {
          cpu: 1,
          gpu: 1,
          npu: 0,
          wasm: 0,
        },
      },
    });

    expect(result.winner?.backendId).toBe('cpu-fast');
    expect(result.telemetry.skippedHedges).toBeGreaterThanOrEqual(1);
    expect(result.frame).not.toBeNull();
    expect(result.frame?.length).toBeGreaterThan(10);
  });

  test('vents disagreement pairs and writes decayed community scores', async () => {
    const communityMemory = new HeteroMoAFabricCommunityMemory({
      decayHalfLifeMs: 10_000,
    });
    const backends: HeteroMoAFabricBackendDescriptor[] = [
      {
        id: 'cpu-a',
        label: 'CPU lane A',
        kind: 'cpu',
        layer: 'cpu',
        async execute() {
          return {
            value: new Float32Array([1, 0]),
          };
        },
      },
      {
        id: 'cpu-b',
        label: 'CPU lane B',
        kind: 'cpu',
        layer: 'cpu',
        async execute() {
          return {
            value: new Float32Array([0, 1]),
          };
        },
      },
    ];

    const result = await runHeteroMoAFabric(backends, new Float32Array([1, 2]), {
      fabricKey: 'community-fabric',
      communityMemory,
      plan: {
        hedgeDelayMs: 0,
        laneCounts: {
          cpu: 2,
          gpu: 0,
          npu: 0,
          wasm: 0,
        },
      },
    });

    expect(result.winner).toBeNull();
    expect(result.layerResults[0]?.pairs.every((pair) => pair.escalated)).toBe(
      true
    );
    expect(result.telemetry.ventShare).toBeGreaterThan(0);

    const scores = communityMemory.snapshotScores('community-fabric');
    expect(scores['cpu-a']?.disagreements).toBeGreaterThan(0);
    expect(scores['cpu-b']?.disagreements).toBeGreaterThan(0);
    expect(communityMemory.runs()).toHaveLength(1);
  });

  test('parses DashRelay and Aeon relay environment variables', () => {
    const config = createDashRelayConfigFromEnv({
      GNOSIS_DASHRELAY_URL: 'wss://relay.example.test',
      GNOSIS_DASHRELAY_ROOM: 'fabric-room',
      GNOSIS_DASHRELAY_KEY: 'secret',
      GNOSIS_DASHRELAY_CLIENT_ID: 'client-1',
      GNOSIS_DASHRELAY_PROTOCOL: 'aeon-relay-v2',
      GNOSIS_DASHRELAY_MODE: 'qdoc-federated',
      GNOSIS_DASHRELAY_PRODUCT: 'aeon-relay',
    });

    expect(config).toEqual({
      url: 'wss://relay.example.test',
      roomName: 'fabric-room',
      apiKey: 'secret',
      clientId: 'client-1',
      protocol: 'aeon-relay-v2',
      joinMode: 'qdoc-federated',
      relayProduct: 'aeon-relay',
      readyStrategy: 'snapshot',
    });
  });
});
