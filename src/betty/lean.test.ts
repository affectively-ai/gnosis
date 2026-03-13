import { describe, expect, it } from 'bun:test';
import { BettyCompiler } from './compiler.js';
import { generateLeanFromGnosisAst } from './lean.js';

describe('generateLeanFromGnosisAst', () => {
  it('emits a proof scaffold for thermodynamic topologies', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (traffic:Source { pressure: "lambda" })
      (processing:State { potential: "beta1" })
      (complete:Sink { beta1_target: "0", capacity: "64" })
      (traffic)-[:FORK { weight: "1.0" }]->(processing)
      (processing)-[:FOLD { service_rate: "mu", drift_gamma: "1.0" }]->(complete)
      (processing)-[:VENT { drift_coefficient: "alpha(n)", repair_debt: "0" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/pipeline.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.moduleName).toBe('pipeline');
    expect(artifact?.theoremName).toContain('complete_is_geometrically_stable');
    expect(artifact?.lean).toContain('import GnosisProofs');
    expect(artifact?.lean).toContain('CertifiedKernel');
    expect(artifact?.lean).toContain('certifiedKernel_stable_of_drift_certificate');
    expect(artifact?.lean).toContain('spectrallyStable_of_nilpotent');
    expect(artifact?.lean).toContain('transitionRat ^ topologyNodeCount = 0');
    expect(artifact?.lean).toContain('topologyNodes');
    expect(artifact?.lean).toContain('proof-kind: symbolic-reneging');
    expect(artifact?.lean).not.toContain('GnosisKernel (_lam _mu : Real)');
  });

  it('emits a row-contractive proof for bounded supremum routing', () => {
    const compiler = new BettyCompiler();
    const { ast, stability } = compiler.parse(`
      (inbound:Source { pressure: "1" })
      (complete:Sink { beta1_target: "0", capacity: "64" })
      (inbound)-[:RACE { weight: "0.4", supremum_bound: "0.95" }]->(inbound)
      (inbound)-[:RACE { weight: "0.4", supremum_bound: "0.95" }]->(complete)
    `);

    const artifact = generateLeanFromGnosisAst(ast, stability, {
      sourceFilePath: '/tmp/router.gg',
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.lean).toContain('proof-kind: bounded-supremum');
    expect(artifact?.lean).toContain('HasNonnegativeTransitions');
    expect(artifact?.lean).toContain('spectrallyStable_of_rowMass');
    expect(artifact?.lean).toContain('rowBoundRat');
  });
});
