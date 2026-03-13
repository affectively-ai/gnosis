import { describe, expect, test } from 'bun:test';
import {
  analyzeGnosisSource,
  classifySteeringRegime,
  createEmptySteeringTelemetry,
  recommendSteeringAction,
  withSteeringTelemetry,
} from './analysis.js';

describe('Gnosis analysis steering', () => {
  test('reports laminar hold for a sequential topology', async () => {
    const report = await analyzeGnosisSource('(start)-[:PROCESS]->(finish)');

    expect(report.steering).toMatchObject({
      mode: 'suggest',
      autoApplyEnabled: false,
      applySupported: false,
      wallaceNumber: 0,
      wallaceUnit: 'wally',
      wally: 0,
      topologyDeficit: 0,
      frontierFill: 1,
      frontierDeficit: 0,
      regime: 'laminar',
      recommendedAction: 'hold',
      telemetry: createEmptySteeringTelemetry(),
    });
    expect(report.steering.eda.frontierWidths.summary.mean).toBe(1);
    expect(report.steering.eda.graph.nodeCount).toBe(2);
    expect(report.steering.eda.graph.edgeCount).toBe(1);
  });

  test('reports Wallace on a converging fork/fold topology', async () => {
    const report = await analyzeGnosisSource(
      [
        '(start)-[:FORK]->(left|right)',
        '(left)-[:FOLD]->(finish)',
        '(right)-[:FOLD]->(finish)',
      ].join('\n'),
    );

    expect(report.topology.structuralBeta1).toBe(1);
    expect(report.correctness.topology.beta1).toBe(1);
    expect(report.steering.wallaceNumber).toBe(report.steering.frontierDeficit);
    expect(report.steering.wally).toBe(report.steering.wallaceNumber);
    expect(report.steering.frontierFill).toBe(0.67);
    expect(report.steering.frontierDeficit).toBe(0.33);
    expect(report.steering.topologyDeficit).toBe(0);
    expect(report.steering.regime).toBe('transitional');
    expect(report.steering.recommendedAction).toBe('hold');
    expect(report.steering.eda.frontierWidths.summary.median.datum).toBe(1);
    expect(report.steering.eda.graph.edgeCount).toBe(4);
    expect(Array.isArray(report.steering.eda.graphOutliers)).toBe(true);
  });

  test('supports report and apply steering modes explicitly', async () => {
    const source = [
      '(start)-[:FORK]->(left|right)',
      '(left)-[:FOLD]->(finish)',
      '(right)-[:FOLD]->(finish)',
    ].join('\n');

    const reportOnly = await analyzeGnosisSource(source, {
      steeringMode: 'report',
    });
    const applyMode = await analyzeGnosisSource(source, {
      steeringMode: 'apply',
    });

    expect(reportOnly.steering.mode).toBe('report');
    expect(reportOnly.steering.recommendedAction).toBeNull();
    expect(reportOnly.steering.autoApplyEnabled).toBe(false);
    expect(applyMode.steering.mode).toBe('apply');
    expect(applyMode.steering.recommendedAction).toBe('hold');
    expect(applyMode.steering.autoApplyEnabled).toBe(true);
    expect(applyMode.steering.applySupported).toBe(false);
  });

  test('can attach runtime telemetry without mutating the steering baseline', async () => {
    const report = await analyzeGnosisSource('(start)-[:PROCESS]->(finish)');
    const telemetry = {
      wallMicroCharleys: 12.5,
      cpuMicroCharleys: 6.25,
      wallToCpuRatio: 2,
    };

    const withTelemetry = withSteeringTelemetry(report.steering, telemetry);

    expect(report.steering.telemetry).toEqual(createEmptySteeringTelemetry());
    expect(withTelemetry.telemetry).toEqual(telemetry);
    expect(withTelemetry.wallaceNumber).toBe(report.steering.wallaceNumber);
  });
});

describe('Gnosis steering policy', () => {
  test('classifies regimes by Wallace thresholds', () => {
    expect(classifySteeringRegime(0.05)).toBe('laminar');
    expect(classifySteeringRegime(0.2)).toBe('transitional');
    expect(classifySteeringRegime(0.45)).toBe('turbulent');
  });

  test('recommends actions from topology and frontier pressure', () => {
    expect(recommendSteeringAction(1, 0.1, 'laminar')).toBe('expand');
    expect(recommendSteeringAction(1, 0.3, 'transitional')).toBe('staggered-expand');
    expect(recommendSteeringAction(-1, 0.3, 'transitional')).toBe('constrain');
    expect(recommendSteeringAction(0, 0.45, 'turbulent')).toBe('multiplex');
    expect(recommendSteeringAction(0, 0.05, 'laminar')).toBe('hold');
  });
});
