import { describe, expect, test } from 'bun:test';

import { parseGgProgram } from '@affectively/aeon-logic';

import { expandStructuredPrimitivesSource } from './structured-primitives.js';
import { lowerUfcsSource } from './ufcs.js';

describe('structured GG primitives', () => {
  test('expands StructuredMoA into nested Rotation/FORK/FOLD topology', () => {
    const expanded = expandStructuredPrimitivesSource(
      "(moa_out: StructuredMoA { blocks: '4', activeBlocks: '2', heads: '4', activeHeads: '2', stages: '4', chunks: '2', parameters: '18', headParameters: '4', blockNames: '[x_pos,x_neg,y_pos,y_neg]' })"
    );

    expect(expanded).toContain('(moa_out__outer_rotation: RotationScheduler');
    expect(expanded).toContain('(moa_out__router: RoutingGate');
    expect(expanded).toContain('(x_pos: MoATransformerlet');
    expect(expanded).toContain('(x_pos__h0: AttentionHeadChain');
    expect(expanded).toContain(
      "(x_pos__h0 | x_pos__h1 | x_pos__h2 | x_pos__h3)-[:FOLD { strategy: 'linear', boundary: 'head-whip' }]->(x_pos__head_whip)"
    );
    expect(expanded).toContain(
      "(x_pos__out | x_neg__out | y_pos__out | y_neg__out)-[:FOLD { strategy: 'linear', boundary: 'outer-whip' }]->(moa_out)"
    );
  });

  test('expands WallingtonRotation into chunk scheduler, stage chain, and named output', () => {
    const normalized = lowerUfcsSource(`
(prompt: FlowFrame { role: 'prompt-sequence' })
(rotated: WallingtonRotation { stages: '4', chunks: '4', stageNames: '[embed,attend,ffn,project]' })
(prompt)-[:PROCESS]->(rotated)
(rotated)-[:PROCESS]->(sink:Tensor)
`);
    const program = parseGgProgram(normalized);

    const ingressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'prompt' &&
        edge.targetIds[0] === 'rotated__ingress'
    );
    const egressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'rotated' &&
        edge.targetIds[0] === 'sink:Tensor'
    );
    const chunkNodes = program.nodes.filter((node) =>
      node.labels.includes('EncoderChunk')
    );
    const stageNodes = program.nodes.filter((node) =>
      node.labels.includes('EncoderShard')
    );

    expect(normalized).toContain('(rotated__scheduler: RotationScheduler');
    expect(normalized).toContain('(embed: EncoderShard');
    expect(normalized).toContain('(project)-[:PROCESS]->(rotated)');
    expect(ingressEdge).toBeDefined();
    expect(egressEdge).toBeDefined();
    expect(chunkNodes).toHaveLength(4);
    expect(stageNodes).toHaveLength(4);
  });

  test('expands WorthingtonWhip into shard-local Wallington rotations plus one collapse', () => {
    const normalized = lowerUfcsSource(`
(prompt: FlowFrame { role: 'prompt-sequence' })
(collapsed: WorthingtonWhip { shardCount: '2', stages: '2', chunks: '2', shardNames: '[left,right]', stageNames: '[encode,project]' })
(prompt)-[:PROCESS]->(collapsed)
(collapsed)-[:PROCESS]->(sink:Tensor)
`);
    const program = parseGgProgram(normalized);

    const ingressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'prompt' &&
        edge.targetIds[0] === 'collapsed__ingress'
    );
    const egressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'collapsed' &&
        edge.targetIds[0] === 'sink:Tensor'
    );
    const collapseEdge = program.edges.find(
      (edge) =>
        edge.type === 'FOLD' && edge.targetIds[0] === 'collapsed__collapse'
    );
    const rotationSchedulers = program.nodes.filter((node) =>
      node.labels.includes('RotationScheduler')
    );

    expect(normalized).toContain('(collapsed__router: RoutingGate');
    expect(normalized).toContain('(left__rotation__scheduler: RotationScheduler');
    expect(normalized).toContain('(right__rotation__scheduler: RotationScheduler');
    expect(normalized).toContain(
      "(left__rotation | right__rotation)-[:FOLD { strategy: 'worthington_whip', boundary: 'shards' }]->(collapsed__collapse)"
    );
    expect(ingressEdge).toBeDefined();
    expect(egressEdge).toBeDefined();
    expect(collapseEdge?.sourceIds).toEqual(['left__rotation', 'right__rotation']);
    expect(rotationSchedulers).toHaveLength(2);
  });

  test('rewrites incoming edges to StructuredMoA ingress while keeping output edges on the named node', () => {
    const normalized = lowerUfcsSource(`
(frame_in: FlowFrame { role: 'token-frame' })
(moa_out: StructuredMoA { blocks: '4', activeBlocks: '2', heads: '4', activeHeads: '2' })
(frame_in)-[:PROCESS]->(moa_out)
(moa_out)-[:PROCESS]->(sink:Tensor)
`);
    const program = parseGgProgram(normalized);

    const ingressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'frame_in' &&
        edge.targetIds[0] === 'moa_out__ingress'
    );
    const egressEdge = program.edges.find(
      (edge) =>
        edge.type === 'PROCESS' &&
        edge.sourceIds[0] === 'moa_out' &&
        edge.targetIds[0] === 'sink:Tensor'
    );
    const transformerlets = program.nodes.filter((node) =>
      node.labels.includes('MoATransformerlet')
    );
    const headChains = program.nodes.filter((node) =>
      node.labels.includes('AttentionHeadChain')
    );

    expect(ingressEdge).toBeDefined();
    expect(egressEdge).toBeDefined();
    expect(transformerlets).toHaveLength(4);
    expect(headChains).toHaveLength(16);
  });
});
