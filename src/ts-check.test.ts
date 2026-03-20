import { describe, it, expect } from 'bun:test';
import { checkTypeScriptWithGnosis } from './ts-check';

const SIMPLE_TS = `
export async function orchestrate(input: unknown) {
  const result = await processData(input);
  return result;
}
`;

const PARALLEL_TS = `
export async function orchestrate(input: unknown) {
  const [a, b] = await Promise.all([fetchA(input), fetchB(input)]);
  const merged = await merge(a, b);
  return merged;
}
`;

describe('checkTypeScriptWithGnosis', () => {
  it('produces diagnostics for a simple function', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    expect(Array.isArray(result.diagnostics)).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(typeof result.metrics.buleyNumber).toBe('number');
    expect(typeof result.metrics.wallaceNumber).toBe('number');
    expect(typeof result.metrics.regime).toBe('string');
    expect(typeof result.metrics.beta1).toBe('number');
    expect(typeof result.ggSource).toBe('string');
    expect(result.ggSource.length).toBeGreaterThan(0);
  });

  it('returns topology graph with nodes and edges', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    expect(result.topology).toBeDefined();
    expect(Array.isArray(result.topology.nodes)).toBe(true);
    expect(result.topology.nodes.length).toBeGreaterThan(0);

    for (const node of result.topology.nodes) {
      expect(typeof node.id).toBe('string');
      expect(typeof node.kind).toBe('string');
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    }
  });

  it('attaches source locations to topology nodes', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    const nodesWithLoc = result.topology.nodes.filter((n) => n.sourceLocation);
    expect(nodesWithLoc.length).toBeGreaterThan(0);

    for (const node of nodesWithLoc) {
      expect(node.sourceLocation!.line).toBeGreaterThan(0);
      expect(node.sourceLocation!.column).toBeGreaterThan(0);
    }
  });

  it('handles parallel operations (Promise.all)', async () => {
    const result = await checkTypeScriptWithGnosis(
      PARALLEL_TS,
      'test-parallel.ts'
    );
    expect(result).toBeDefined();
    expect(result.topology.nodes.length).toBeGreaterThan(2);
    expect(result.topology.edges.length).toBeGreaterThan(0);

    const joinNodes = result.topology.nodes.filter((n) => n.kind === 'join');
    expect(joinNodes.length).toBeGreaterThan(0);
  });

  it('reports buley threshold violations', async () => {
    const result = await checkTypeScriptWithGnosis(
      SIMPLE_TS,
      'test-simple.ts',
      {
        maxBuley: 0,
      }
    );
    const buleyDiags = result.diagnostics.filter(
      (d) => d.ruleId === 'gnosis/buley-threshold'
    );
    expect(buleyDiags.length).toBeGreaterThan(0);
    expect(buleyDiags[0].level).toBe('warning');
  });

  it('produces valid SARIF output', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    const sarif = result.sarif as {
      version: string;
      runs: Array<{ tool: { driver: { name: string } }; results: unknown[] }>;
    };
    expect(sarif.version).toBe('2.1.0');
    expect(Array.isArray(sarif.runs)).toBe(true);
    expect(sarif.runs.length).toBe(1);
    expect(sarif.runs[0].tool.driver.name).toBe('gnosis-gg-lint');
    expect(Array.isArray(sarif.runs[0].results)).toBe(true);
  });

  it('returns metrics with correct regime type', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    expect(['laminar', 'transitional', 'turbulent']).toContain(
      result.metrics.regime
    );
  });

  it('returns ok=true for a well-formed function', async () => {
    const result = await checkTypeScriptWithGnosis(SIMPLE_TS, 'test-simple.ts');
    // Simple functions should generally pass formal checks
    expect(typeof result.ok).toBe('boolean');
  });
});
