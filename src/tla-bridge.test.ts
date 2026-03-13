import { describe, expect, it } from 'bun:test';
import { generateTlaFromGnosisSource } from './tla-bridge.js';

describe('TLA bridge', () => {
  it('generates a TLA+ module and cfg from a fork-race-fold topology', () => {
    const source = [
      '(input)-[:FORK]->(left|right)',
      '(left|right)-[:RACE]->(winner|fallback)',
      '(winner|fallback)-[:FOLD]->(sink)',
    ].join('\n');

    const result = generateTlaFromGnosisSource(source, {
      moduleName: 'ForkRaceFoldSpec',
    });

    expect(result.moduleName).toBe('ForkRaceFoldSpec');
    expect(result.tla).toContain('MODULE ForkRaceFoldSpec');
    expect(result.tla).toContain('Edge_01_FORK');
    expect(result.tla).toContain('Edge_02_RACE');
    expect(result.tla).toContain('\\E winner \\in {"winner", "fallback"}');
    expect(result.tla).toContain('EventuallyConsensus');
    expect(result.cfg).toContain('SPECIFICATION Spec');
    expect(result.cfg).toContain('PROPERTY EventuallyConsensus');
    expect(result.stats.edgeCount).toBe(3);
    expect(result.stats.raceEdgeCount).toBe(1);
  });

  it('derives a valid TLA module name from file path when omitted', () => {
    const result = generateTlaFromGnosisSource('(a)-[:PROCESS]->(b)', {
      sourceFilePath: '/tmp/my-topology.v2.gg',
    });

    expect(result.moduleName).toBe('my_topology_v2');
    expect(result.tla).toContain('MODULE my_topology_v2');
  });

  it('includes safety and liveness checks for TLC', () => {
    const result = generateTlaFromGnosisSource('(start)-[:PROCESS]->(end)');

    expect(result.tla).toContain(
      'NoLostPayloadInvariant == payloadPresent = TRUE'
    );
    expect(result.tla).toContain(
      'EventuallyTerminal == <> (active \\cap TERMINALS # {})'
    );
    expect(result.tla).toContain(
      'EventuallyConsensus == IF HasFoldTargets THEN <> consensusReached ELSE TRUE'
    );
    expect(result.cfg).toContain('INVARIANT TypeInvariant');
    expect(result.cfg).toContain('PROPERTY DeadlockFree');
  });

  it('lowers UFCS source before generating TLA artifacts', () => {
    const result = generateTlaFromGnosisSource('start.finish()');

    expect(result.stats.nodeCount).toBe(2);
    expect(result.stats.edgeCount).toBe(1);
    expect(result.tla).toContain('ROOTS == {"start"}');
    expect(result.tla).toContain('TERMINALS == {"finish"}');
  });
});
