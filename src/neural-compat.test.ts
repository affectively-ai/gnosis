import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  NeuralEngine,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY,
} from './neural-compat.js';

const temporaryDirectories = new Set<string>();

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
      graph.nodes.some((node) => node.id === 'topic_tokens' && node.type === 'input')
    ).toBe(true);
    expect(
      graph.nodes.some(
        (node) => node.id === 'topic_distribution' && node.type === 'output'
      )
    ).toBe(true);
    expect(engine.getTopologySource()).toContain('topic_distribution');
  });

  test('loads custom topology from .gg file path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gnosis-neural-'));
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

  test('rejects non-.gg topology files', async () => {
    const engine = new NeuralEngine();
    await expect(engine.loadTopologyFile('topology.txt')).rejects.toThrow(
      'Topology file must end with .gg or .ggx'
    );
  });
});
