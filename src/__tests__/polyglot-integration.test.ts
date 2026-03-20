import { describe, test, expect } from 'bun:test';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  invokeSubprocess,
  invokeFunction,
  type InvokeRequest,
} from '../runtime/subprocess-invoker';
import {
  registerPolyglotBridgeHandlers,
  registerMultiLanguageBridgeHandlers,
  buildMultiLanguageManifest,
  type PolyglotExecutionManifest,
} from '../polyglot-execution-bridge';
import { GnosisRegistry } from '../runtime/registry';
import {
  buildExecutionTrace,
  formatExecutionTrace,
} from '../polyglot-trace';
import {
  compose,
  translate,
  findBestLanguage,
  computeBetaCost,
  extractFunctions,
  generateTopoRaceTopology,
} from '../polyglot-compose';
import { scaffoldTopology } from '../polyglot-scaffold';
import {
  PolyglotStrategyMemory,
  type LanguageObservation,
} from '../polyglot-memory';
import {
  analyzeForOptimizations,
  TopologyProfiler,
} from '../polyglot-optimizer';
import type { ASTNode, ASTEdge, GraphAST } from '../betty/compiler';

const FIXTURES_DIR = path.resolve(__dirname, '../../harnesses/fixtures');
const HARNESSES_DIR = path.resolve(__dirname, '../../harnesses');

// ─── Subprocess Harness Tests ────────────────────────────────────────────────

describe('subprocess invoker', () => {
  test('python harness executes function and returns result', async () => {
    const response = await invokeFunction(
      'python',
      path.join(FIXTURES_DIR, 'e2e_test.py'),
      'add',
      [3, 4]
    );
    expect(response.status).toBe('ok');
    expect(response.value).toBe(7);
  }, 10000);

  test('python harness handles complex return values', async () => {
    const response = await invokeFunction(
      'python',
      path.join(FIXTURES_DIR, 'e2e_test.py'),
      'main',
      []
    );
    expect(response.status).toBe('ok');
    expect(response.value).toMatchObject({
      add_result: 7,
      fib_10: 55,
    });
  }, 10000);

  test('python harness reports errors with mapped location', async () => {
    // Create a file with an intentional error.
    const tempFile = path.join(FIXTURES_DIR, '_error_test.py');
    fs.writeFileSync(
      tempFile,
      'def broken(x):\n    return x / 0\n',
      'utf8'
    );

    try {
      const response = await invokeFunction('python', tempFile, 'broken', [42]);
      expect(response.status).toBe('error');
      expect(response.mappedError).toBeDefined();
      expect(response.mappedError!.language).toBe('python');
      expect(response.mappedError!.line).toBe(2); // division by zero on line 2
    } finally {
      fs.unlinkSync(tempFile);
    }
  }, 10000);

  test('node harness executes function', async () => {
    const tempFile = path.join(FIXTURES_DIR, '_node_test.mjs');
    fs.writeFileSync(
      tempFile,
      'export function multiply(a, b) { return a * b; }\n',
      'utf8'
    );

    try {
      const response = await invokeFunction(
        'javascript',
        tempFile,
        'multiply',
        [6, 7]
      );
      expect(response.status).toBe('ok');
      expect(response.value).toBe(42);
    } finally {
      fs.unlinkSync(tempFile);
    }
  }, 10000);

  test('ping action returns pong', async () => {
    const response = await invokeSubprocess({
      action: 'ping',
      language: 'python',
      filePath: '',
      functionName: '',
      args: [],
    });
    expect(response.status).toBe('ok');
    expect(response.value).toBe('pong');
  }, 10000);
});

// ─── Polyglot Bridge Handler Tests ───────────────────────────────────────────

describe('polyglot bridge handlers', () => {
  test('registers all five handler types', () => {
    const registry = new GnosisRegistry();
    const manifest: PolyglotExecutionManifest = {
      language: 'python',
      file_path: '/test.py',
      entry_function: 'main',
      node_execution_plans: [],
    };

    registerPolyglotBridgeHandlers(registry, manifest);

    expect(registry.hasHandler('PolyglotBridgeEntry')).toBe(true);
    expect(registry.hasHandler('PolyglotBridgeCall')).toBe(true);
    expect(registry.hasHandler('PolyglotBridgeStatement')).toBe(true);
    expect(registry.hasHandler('PolyglotBridgeReturn')).toBe(true);
    expect(registry.hasHandler('PolyglotBridgeJoin')).toBe(true);
  });

  test('entry handler initializes state', async () => {
    const registry = new GnosisRegistry();
    const manifest: PolyglotExecutionManifest = {
      language: 'python',
      file_path: '/test.py',
      entry_function: 'main',
      node_execution_plans: [],
    };

    registerPolyglotBridgeHandlers(registry, manifest);

    const handler = registry.getHandler('PolyglotBridgeEntry')!;
    const result = await handler({ x: 42 }, {});

    expect(result).toMatchObject({
      input: { x: 42 },
      locals: {},
      language: 'python',
      filePath: '/test.py',
    });
  });

  test('return handler extracts last value', async () => {
    const registry = new GnosisRegistry();
    const manifest: PolyglotExecutionManifest = {
      language: 'python',
      file_path: '/test.py',
      entry_function: 'main',
      node_execution_plans: [],
    };

    registerPolyglotBridgeHandlers(registry, manifest);

    const handler = registry.getHandler('PolyglotBridgeReturn')!;
    const result = await handler(
      {
        input: {},
        locals: { __last__: 'final_value' },
        language: 'python',
        filePath: '/test.py',
      },
      {},
      { nodeId: 'return_0' }
    );

    expect(result).toBe('final_value');
  });
});

// ─── Multi-Language Bridge Tests ─────────────────────────────────────────────

describe('multi-language bridge', () => {
  test('buildMultiLanguageManifest extracts overrides from node properties', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('ml_predict', {
      id: 'ml_predict',
      labels: ['Statement', 'PolyglotBridgeCall'],
      properties: { language: 'python', file: 'ml.py', callee: 'predict' },
    });
    nodes.set('api_call', {
      id: 'api_call',
      labels: ['Statement', 'PolyglotBridgeCall'],
      properties: { language: 'go', file: 'api.go', callee: 'fetch' },
    });
    nodes.set('entry', {
      id: 'entry',
      labels: ['Entry'],
      properties: {},
    });

    const ast: GraphAST = { nodes, edges: [] };
    const manifest = buildMultiLanguageManifest(ast, 'javascript', '/default.js');

    expect(manifest.defaultLanguage).toBe('javascript');
    expect(manifest.nodeOverrides.size).toBe(2);
    expect(manifest.nodeOverrides.get('ml_predict')).toMatchObject({
      language: 'python',
      filePath: 'ml.py',
    });
    expect(manifest.nodeOverrides.get('api_call')).toMatchObject({
      language: 'go',
      filePath: 'api.go',
    });
  });
});

// ─── Cross-Language Trace Tests ──────────────────────────────────────────────

describe('cross-language execution trace', () => {
  test('builds backward trace from failed node', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('entry', { id: 'entry', labels: ['Entry', 'PolyglotBridgeEntry'], properties: { name: 'pipeline', language: 'javascript' } });
    nodes.set('parse', { id: 'parse', labels: ['Statement', 'PolyglotBridgeCall'], properties: { language: 'rust', callee: 'parse_input' } });
    nodes.set('fetch', { id: 'fetch', labels: ['Statement', 'PolyglotBridgeCall'], properties: { language: 'go', callee: 'fetch_data' } });
    nodes.set('predict', { id: 'predict', labels: ['Statement', 'PolyglotBridgeCall'], properties: { language: 'python', callee: 'ml_predict' } });

    const edges: ASTEdge[] = [
      { sourceIds: ['entry'], targetIds: ['parse'], type: 'PROCESS', properties: {} },
      { sourceIds: ['parse'], targetIds: ['fetch'], type: 'PROCESS', properties: {} },
      { sourceIds: ['fetch'], targetIds: ['predict'], type: 'PROCESS', properties: {} },
    ];

    const ast: GraphAST = { nodes, edges };
    const manifest: PolyglotExecutionManifest = {
      language: 'javascript',
      file_path: '/pipeline.js',
      entry_function: 'pipeline',
      node_execution_plans: [
        { node_id: 'entry', source_range: { start_byte: 0, end_byte: 10 }, kind: 'entry' },
        { node_id: 'parse', source_range: { start_byte: 10, end_byte: 50 }, kind: 'call', callee: 'parse_input' },
        { node_id: 'fetch', source_range: { start_byte: 50, end_byte: 90 }, kind: 'call', callee: 'fetch_data' },
        { node_id: 'predict', source_range: { start_byte: 90, end_byte: 130 }, kind: 'call', callee: 'ml_predict' },
      ],
    };

    const mappedError = {
      language: 'python',
      filePath: 'ml.py',
      functionName: 'ml_predict',
      message: 'ValueError: could not convert string to float',
      line: 42,
      traceback: 'Traceback...',
    };

    const trace = buildExecutionTrace(ast, 'predict', mappedError, manifest);

    expect(trace.frames.length).toBe(4);
    expect(trace.failedNode).toBe('predict');
    expect(trace.analysis.languages).toContain('python');
    expect(trace.analysis.languages).toContain('go');
    expect(trace.analysis.languages).toContain('rust');
    expect(trace.analysis.errorKind).toBe('semantic');
    expect(trace.frames[3]!.status).toBe('error');
    expect(trace.frames[3]!.line).toBe(42);
  });

  test('formatExecutionTrace produces readable output', () => {
    const trace = {
      frames: [
        { nodeId: 'entry', labels: ['Entry'], language: 'javascript', filePath: '/p.js', functionName: 'pipeline', status: 'completed' as const, incomingEdgeType: undefined },
        { nodeId: 'predict', labels: ['Statement'], language: 'python', filePath: 'ml.py', functionName: 'ml_predict', status: 'error' as const, line: 42, incomingEdgeType: 'PROCESS' },
      ],
      failedNode: 'predict',
      mappedError: { language: 'python', filePath: 'ml.py', functionName: 'ml_predict', message: 'ValueError', line: 42, traceback: '' },
      analysis: { pathLength: 2, languages: ['javascript', 'python'], errorKind: 'semantic' as const, edgeTypes: ['PROCESS'] },
    };

    const formatted = formatExecutionTrace(trace);
    expect(formatted).toContain('predict');
    expect(formatted).toContain('python');
    expect(formatted).toContain('42');
    expect(formatted).toContain('semantic');
  });
});

// ─── Compose Tests ───────────────────────────────────────────────────────────

describe('polyglot compose', () => {
  test('composes two analysis results into a topology', () => {
    const pyAnalysis = {
      functions: [{
        functionName: 'process',
        ast: { nodes: new Map(), edges: [] } as GraphAST,
        ggSource: '(entry_0: Entry)',
      }],
      language: 'python',
      errors: [],
    };

    const goAnalysis = {
      functions: [{
        functionName: 'serve',
        ast: { nodes: new Map(), edges: [] } as GraphAST,
        ggSource: '(entry_0: Entry)',
      }],
      language: 'go',
      errors: [],
    };

    const result = compose([pyAnalysis, goAnalysis], ['/app.py', '/server.go']);

    expect(result.languages).toContain('python');
    expect(result.languages).toContain('go');
    expect(result.functions.length).toBe(2);
    expect(result.ggSource).toContain('PolyglotBridgeCall');
    expect(result.ggSource).toContain("language='python'");
    expect(result.ggSource).toContain("language='go'");
    expect(result.connections.length).toBeGreaterThanOrEqual(1);
  });

  test('infers pipeline connections from function names', () => {
    const analysis = {
      functions: [
        { functionName: 'parse_input', ast: { nodes: new Map(), edges: [] } as GraphAST, ggSource: '' },
        { functionName: 'transform_data', ast: { nodes: new Map(), edges: [] } as GraphAST, ggSource: '' },
        { functionName: 'output_result', ast: { nodes: new Map(), edges: [] } as GraphAST, ggSource: '' },
      ],
      language: 'python',
      errors: [],
    };

    const result = compose([analysis, analysis], ['/a.py', '/b.py']);
    // Should detect pipeline pattern: parse → transform → output.
    expect(result.connections.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Translate Tests ─────────────────────────────────────────────────────────

describe('polyglot translate', () => {
  test('generates skeleton in target language', () => {
    const analysis = {
      functions: [{
        functionName: 'process_data',
        ast: { nodes: new Map(), edges: [] } as GraphAST,
        ggSource: '(entry_0: Entry)',
      }],
      language: 'python',
      errors: [],
    };

    const result = translate(analysis, '/app.py', 'go');

    expect(result.files.length).toBe(1);
    expect(result.files[0]!.fileName).toContain('.go');
    expect(result.files[0]!.source).toContain('func');
    expect(result.files[0]!.source).toContain('ProcessData');
  });

  test('translates to rust', () => {
    const analysis = {
      functions: [{
        functionName: 'compute',
        ast: { nodes: new Map(), edges: [] } as GraphAST,
        ggSource: '(entry_0: Entry)',
      }],
      language: 'python',
      errors: [],
    };

    const result = translate(analysis, '/app.py', 'rust');
    expect(result.files[0]!.fileName).toContain('.rs');
    expect(result.files[0]!.source).toContain('pub fn');
  });
});

// ─── Best Language Tests ─────────────────────────────────────────────────────

describe('best language fitness', () => {
  test('ranks languages by fitness for compute-heavy function', () => {
    const func = {
      filePath: '/compute.py',
      language: 'python',
      name: 'matrix_multiply',
      params: [],
      callees: ['numpy.dot', 'reshape'],
      ast: { nodes: new Map(), edges: [] } as GraphAST,
      ggSource: '',
      nodeCount: 15,
      edgeTypes: ['PROCESS', 'FORK', 'FOLD'],
    };

    const fitness = findBestLanguage(func);
    expect(fitness.length).toBeGreaterThan(5);
    // Compiled languages should rank higher for compute.
    const topThree = fitness.slice(0, 3).map((f) => f.language);
    expect(
      topThree.includes('rust') || topThree.includes('go') || topThree.includes('c')
    ).toBe(true);
  });

  test('computeBetaCost calculates correctly', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('a', { id: 'a', labels: ['Entry'], properties: {} });
    nodes.set('b', { id: 'b', labels: ['Statement'], properties: {} });
    nodes.set('c', { id: 'c', labels: ['Statement'], properties: {} });
    nodes.set('d', { id: 'd', labels: ['Return'], properties: {} });

    const edges: ASTEdge[] = [
      { sourceIds: ['a'], targetIds: ['b', 'c'], type: 'FORK', properties: {} },
      { sourceIds: ['b', 'c'], targetIds: ['d'], type: 'FOLD', properties: {} },
    ];

    const func = {
      filePath: '/t.py', language: 'python', name: 'test',
      params: [], callees: [],
      ast: { nodes, edges } as GraphAST,
      ggSource: '', nodeCount: 4, edgeTypes: ['FORK', 'FOLD'],
    };

    const cost = computeBetaCost(func);
    expect(cost.totalBeta).toBe(2); // FORK(2 targets)=1, FOLD(2 sources)=1
    expect(cost.leastBuleScore).toBeGreaterThan(0);
  });
});

// ─── Topo-Race Tests ─────────────────────────────────────────────────────────

describe('topo-race topology generation', () => {
  test('generates valid RACE topology', () => {
    const topology = generateTopoRaceTopology(
      'fibonacci',
      '/fib.py',
      ['python', 'go', 'rust']
    );

    expect(topology).toContain('RACE');
    expect(topology).toContain('FOLD');
    expect(topology).toContain("language='python'");
    expect(topology).toContain("language='go'");
    expect(topology).toContain("language='rust'");
    expect(topology).toContain('fibonacci_python');
    expect(topology).toContain('fibonacci_go');
    expect(topology).toContain('fibonacci_rust');
  });
});

// ─── Scaffold Tests ──────────────────────────────────────────────────────────

describe('topology scaffolder', () => {
  test('generates code for multiple languages', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('ml_node', {
      id: 'ml_node',
      labels: ['Statement', 'PolyglotBridgeCall'],
      properties: { callee: 'predict' },
    });
    nodes.set('api_node', {
      id: 'api_node',
      labels: ['Statement', 'PolyglotBridgeCall'],
      properties: { callee: 'serve' },
    });

    const ast: GraphAST = { nodes, edges: [] };

    const result = scaffoldTopology(ast, [
      { nodeId: 'ml_node', language: 'python', functionName: 'predict' },
      { nodeId: 'api_node', language: 'go', functionName: 'serve' },
    ]);

    expect(result.files.length).toBe(2);
    expect(result.files[0]!.language).toBe('python');
    expect(result.files[0]!.source).toContain('def predict');
    expect(result.files[1]!.language).toBe('go');
    expect(result.files[1]!.source).toContain('func Serve');
  });
});

// ─── Strategy Memory Tests ───────────────────────────────────────────────────

describe('strategy memory CRDT', () => {
  test('records observations and computes scores', () => {
    const memory = new PolyglotStrategyMemory({ decay: { halfLife: 5, maxObservations: 20, maxAgeDays: 7 } });

    memory.record({ functionName: 'fib', language: 'python', filePath: '/f.py', durationMs: 100, success: true, timestamp: new Date().toISOString() });
    memory.record({ functionName: 'fib', language: 'rust', filePath: '/f.rs', durationMs: 5, success: true, timestamp: new Date().toISOString() });

    const pyScore = memory.score('fib', 'python');
    const rsScore = memory.score('fib', 'rust');

    expect(pyScore).not.toBeNull();
    expect(rsScore).not.toBeNull();
    expect(rsScore!.fitnessScore).toBeGreaterThan(pyScore!.fitnessScore);
  });

  test('ranks languages correctly', () => {
    const memory = new PolyglotStrategyMemory();

    for (let i = 0; i < 5; i++) {
      memory.record({ functionName: 'sort', language: 'python', filePath: '/s.py', durationMs: 200, success: true, timestamp: new Date().toISOString() });
      memory.record({ functionName: 'sort', language: 'go', filePath: '/s.go', durationMs: 10, success: true, timestamp: new Date().toISOString() });
      memory.record({ functionName: 'sort', language: 'rust', filePath: '/s.rs', durationMs: 3, success: true, timestamp: new Date().toISOString() });
    }

    const ranked = memory.rank('sort');
    expect(ranked.length).toBe(3);
    expect(ranked[0]!.language).toBe('rust'); // fastest
    expect(ranked[2]!.language).toBe('python'); // slowest
  });

  test('recommend returns best language', () => {
    const memory = new PolyglotStrategyMemory();

    memory.record({ functionName: 'calc', language: 'python', filePath: '/c.py', durationMs: 500, success: true, timestamp: new Date().toISOString() });
    memory.record({ functionName: 'calc', language: 'go', filePath: '/c.go', durationMs: 20, success: true, timestamp: new Date().toISOString() });

    expect(memory.recommend('calc')).toBe('go');
  });

  test('serialize and restore preserves state', () => {
    const memory = new PolyglotStrategyMemory();
    memory.record({ functionName: 'f', language: 'python', filePath: '/f.py', durationMs: 100, success: true, timestamp: new Date().toISOString() });

    const serialized = memory.serialize();
    const restored = new PolyglotStrategyMemory();
    restored.restore(serialized);

    expect(restored.score('f', 'python')).not.toBeNull();
    expect(restored.score('f', 'python')!.observations).toBe(1);
  });

  test('penalizes error-prone languages', () => {
    const memory = new PolyglotStrategyMemory();

    // Python succeeds but is slow.
    for (let i = 0; i < 5; i++) {
      memory.record({ functionName: 'api', language: 'python', filePath: '/a.py', durationMs: 100, success: true, timestamp: new Date().toISOString() });
    }

    // Go is fast but errors often.
    for (let i = 0; i < 5; i++) {
      memory.record({ functionName: 'api', language: 'go', filePath: '/a.go', durationMs: 10, success: i < 2, timestamp: new Date().toISOString() });
    }

    const ranked = memory.rank('api');
    // Python should win because Go has 60% error rate.
    expect(ranked[0]!.language).toBe('python');
  });
});

// ─── Optimizer Tests ─────────────────────────────────────────────────────────

describe('autonomous optimizer', () => {
  test('suggests RACE for slow nodes', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('slow', { id: 'slow', labels: ['Statement'], properties: {} });
    const ast: GraphAST = { nodes, edges: [] };

    const profiler = new TopologyProfiler();
    for (let i = 0; i < 10; i++) {
      profiler.record('slow', 'python', 'compute', 1000, false);
    }

    const suggestions = analyzeForOptimizations(ast, profiler, {
      slowThresholdMs: 500,
      minExecutions: 5,
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]!.kind).toBe('race');
    expect(suggestions[0]!.description).toContain('slow');
  });

  test('suggests fallback for error-prone nodes', () => {
    const nodes = new Map<string, ASTNode>();
    nodes.set('flaky', { id: 'flaky', labels: ['Statement'], properties: {} });
    const ast: GraphAST = { nodes, edges: [] };

    const profiler = new TopologyProfiler();
    for (let i = 0; i < 10; i++) {
      profiler.record('flaky', 'python', 'api_call', 50, i < 3); // 70% error rate
    }

    const suggestions = analyzeForOptimizations(ast, profiler, {
      errorRateThreshold: 0.1,
      minExecutions: 5,
    });

    const fallback = suggestions.find((s) => s.kind === 'fallback');
    expect(fallback).toBeDefined();
    expect(fallback!.description).toContain('error rate');
  });
});
