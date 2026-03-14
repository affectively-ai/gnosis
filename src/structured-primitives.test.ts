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
