import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  NeuralEngine,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY,
} from './neural-compat.js';

const temporaryDirectories = new Set<string>();
const tempRoot = join(process.cwd(), '.tmp-test-workspaces');

afterEach(async () => {
  await Promise.all(
    Array.from(temporaryDirectories.values()).map(async (directoryPath) => {
      await rm(directoryPath, { recursive: true, force: true });
      temporaryDirectories.delete(directoryPath);
    })
  );
});

describe('NeuralEngine (.gg-native)', () => {
  test('initializes from canonical topic-domain topology', async () => {
    const engine = new NeuralEngine();
    const graph = await engine.init();

    expect(graph.nodeCount).toBeGreaterThanOrEqual(10);
    expect(
      graph.nodes.some(
        (node) => node.id === 'topic_tokens' && node.type === 'input'
      )
    ).toBe(true);
    expect(
      graph.nodes.some(
        (node) => node.id === 'topic_distribution' && node.type === 'output'
      )
    ).toBe(true);
    expect(engine.getTopologySource()).toContain('topic_distribution');
  });

  test('loads custom topology from .gg file path', async () => {
    await mkdir(tempRoot, { recursive: true });
    const dir = await mkdtemp(join(tempRoot, 'gnosis-neural-'));
    temporaryDirectories.add(dir);
    const topologyPath = join(dir, 'mini-topic.gg');
    await writeFile(
      topologyPath,
      `
      (a: Tensor { activation: 'identity', bias: '0.0' })
      (a)-[:PROCESS]->(b: Tensor { activation: 'tanh', bias: '0.1' })
      `.trim(),
      'utf-8'
    );

    const engine = new NeuralEngine(TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY);
    const graph = await engine.loadTopologyFile(topologyPath);

    expect(graph.nodes.some((node) => node.id === 'a')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'b')).toBe(true);
    expect(graph.edges).toHaveLength(1);
  });

  test('loads custom topology from .mgg module path', async () => {
    await mkdir(tempRoot, { recursive: true });
    const dir = await mkdtemp(join(tempRoot, 'gnosis-neural-'));
    temporaryDirectories.add(dir);
    const basePath = join(dir, 'base.gg');
    const topologyPath = join(dir, 'mini-topic.mgg');

    await writeFile(
      basePath,
      "(input: Tensor { activation: 'identity', bias: '0.0' })\n",
      'utf-8'
    );
    await writeFile(
      topologyPath,
      [
        "import { input } from './base.gg'",
        '',
        "(input)-[:PROCESS]->(output: Tensor { activation: 'tanh', bias: '0.1' })",
        '',
        'export { output }',
        '',
      ].join('\n'),
      'utf-8'
    );

    const engine = new NeuralEngine(TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY);
    const graph = await engine.loadTopologyFile(topologyPath);

    expect(graph.nodes.some((node) => node.id === 'input')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'output')).toBe(true);
    expect(graph.edges).toHaveLength(1);
  });

  test('rejects non-.gg topology files', async () => {
    const engine = new NeuralEngine();
    await expect(engine.loadTopologyFile('topology.txt')).rejects.toThrow(
      'Topology file must end with .gg or .ggx or .mgg'
    );
  });

  test('runs the hetero fabric runtime on the compiled neural graph', async () => {
    const engine = new NeuralEngine();
    engine.setAdapterTrainingConfig({ microBatchSize: 1 });
    await engine.loadTopology(
      `
      (a: Tensor { activation: 'identity', bias: '0.0' })
      (a)-[:PROCESS]->(b: Tensor { activation: 'tanh', bias: '0.1' })
      `.trim()
    );
    const compiled = await engine.compile();

    const result = await engine.runHeteroMoAFabric(
      new Float32Array(compiled.size).fill(1),
      {
        plan: {
          hedgeDelayMs: 0,
          laneCounts: {
            cpu: 1,
            gpu: 0,
            npu: 0,
            wasm: 0,
          },
        },
        includeEnvCommandBackends: false,
      }
    );

    expect(result.winner?.backendId).toBe('cpu-js');
    expect(result.winner?.value).toBeInstanceOf(Float32Array);
    expect((result.winner?.value as Float32Array).length).toBe(compiled.size);
    expect(result.frame).not.toBeNull();
  });
});
