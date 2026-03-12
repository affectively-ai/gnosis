'use aeon';

/**
 * GG Test Runner — Execute .test.gg topologies as verification suites
 *
 * A .test.gg file IS a topology. The test framework reads the graph:
 *
 *   - Verify nodes → load and check the referenced .gg module
 *   - FORK edges → verify modules in parallel
 *   - RACE edges → each module races its invariants (pass/fail)
 *   - FOLD edges → all must pass for the verdict
 *
 * The test IS the topology. Fork/race/fold all the way down.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname, relative } from 'path';
import {
  checkGgProgram,
  parseGgProgram,
  getGgRootNodeIds,
  getGgTerminalNodeIds,
} from '@affectively/aeon-logic';
import type { CheckerResult, GgTopologyState } from '@affectively/aeon-logic';

// ── Types ───────────────────────────────────────────────────────────────────

export interface GGTestModuleResult {
  name: string;
  path: string;
  ok: boolean;
  stateCount: number;
  beta1: number;
  nodeCount: number;
  edgeCount: number;
  forkCount: number;
  violations: string[];
}

export interface GGTestSuiteResult {
  testFile: string;
  ok: boolean;
  modules: GGTestModuleResult[];
  composition: GGTestModuleResult;
  elapsed: number;
}

export interface GGTestDiscoveryResult {
  ok: boolean;
  suites: GGTestSuiteResult[];
  totalModules: number;
  totalPassed: number;
  totalFailed: number;
  elapsed: number;
}

// ── Parse the .test.gg topology to extract Verify nodes ─────────────────────

interface VerifyDirective {
  nodeId: string;
  modulePath: string;
  beta1Max: number;
}

function extractVerifyDirectives(source: string): VerifyDirective[] {
  const directives: VerifyDirective[] = [];

  // Match: (nodeId: Verify { module: './path.gg', beta1_max: '10' })
  const re = /\((\w+)\s*:\s*Verify\s*\{([^}]+)\}\)/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const nodeId = match[1];
    const propsStr = match[2];

    // Extract module path
    const moduleMatch = propsStr.match(/module\s*:\s*'([^']+)'/);
    if (!moduleMatch) continue;

    // Extract beta1 max
    const beta1Match = propsStr.match(/beta1_max\s*:\s*'(\d+)'/);
    const beta1Max = beta1Match ? parseInt(beta1Match[1], 10) : 128;

    directives.push({
      nodeId,
      modulePath: moduleMatch[1],
      beta1Max,
    });
  }

  return directives;
}

// ── Verify a single .gg module ──────────────────────────────────────────────

async function verifyModule(
  name: string,
  filePath: string,
  source: string,
  beta1Max: number
): Promise<GGTestModuleResult> {
  try {
    const program = parseGgProgram(source);
    const terminalNodes = new Set(getGgTerminalNodeIds(program));

    const result = await checkGgProgram(source, {
      checker: {
        maxDepth: 64,
        invariants: [
          { name: 'beta1_non_negative', test: (s) => s.beta1 >= 0 },
          { name: 'beta1_lt_bound', test: (s) => s.beta1 < beta1Max },
        ],
        eventual: [
          { name: 'eventually_terminal', test: (s) => terminalNodes.has(s.nodeId) },
        ],
      },
    });

    return {
      name,
      path: filePath,
      ok: result.ok,
      stateCount: result.stateCount,
      beta1: result.topology.beta1,
      nodeCount: program.nodes.length,
      edgeCount: program.edges.length,
      forkCount: result.topology.forkCount,
      violations: result.violations.map(
        (v) => `[${v.kind}] ${v.name}: ${v.message}`
      ),
    };
  } catch (err) {
    return {
      name,
      path: filePath,
      ok: false,
      stateCount: 0,
      beta1: 0,
      nodeCount: 0,
      edgeCount: 0,
      forkCount: 0,
      violations: [
        `parse error: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }
}

// ── Run a .test.gg file ─────────────────────────────────────────────────────

export async function runGGTestFile(
  testFilePath: string
): Promise<GGTestSuiteResult> {
  const start = performance.now();
  const absPath = resolve(testFilePath);
  const testDir = dirname(absPath);
  const source = readFileSync(absPath, 'utf-8');

  // Read the topology: extract Verify nodes (these are the modules under test)
  const directives = extractVerifyDirectives(source);
  const modules: GGTestModuleResult[] = [];

  // FORK: verify each module independently (in parallel)
  const verifyPromises = directives.map(async (directive) => {
    const modPath = resolve(testDir, directive.modulePath);
    let modSource: string;
    try {
      modSource = readFileSync(modPath, 'utf-8');
    } catch {
      return {
        name: directive.modulePath,
        path: modPath,
        ok: false,
        stateCount: 0,
        beta1: 0,
        nodeCount: 0,
        edgeCount: 0,
        forkCount: 0,
        violations: [`file not found: ${modPath}`],
      } satisfies GGTestModuleResult;
    }

    return verifyModule(
      directive.modulePath,
      modPath,
      modSource,
      directive.beta1Max
    );
  });

  modules.push(...(await Promise.all(verifyPromises)));

  // FOLD: verify the test topology itself is well-formed
  const composition = await verifyModule(
    'test-topology',
    absPath,
    source,
    128
  );

  // RACE: all must pass
  const allOk = modules.every((m) => m.ok) && composition.ok;

  return {
    testFile: absPath,
    ok: allOk,
    modules,
    composition,
    elapsed: performance.now() - start,
  };
}

// ── Auto-discovery: find all .test.gg files ─────────────────────────────────

function walkDir(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walkDir(full, results);
      } else if (entry.endsWith('.test.gg')) {
        results.push(full);
      }
    } catch {
      // skip unreadable entries
    }
  }
  return results;
}

/**
 * Discover all .test.gg files under a directory (recursive).
 * No manual wiring — the runner finds them all.
 */
export function discoverTestFiles(rootDir: string): string[] {
  return walkDir(resolve(rootDir)).sort();
}

/**
 * Run all .test.gg files discovered under a directory.
 * Auto-discovery, no manual wiring, unmaintainable lists eliminated.
 */
export async function runGGTestSuite(
  rootDir: string,
): Promise<GGTestDiscoveryResult> {
  const start = performance.now();
  const testFiles = discoverTestFiles(rootDir);
  const suites: GGTestSuiteResult[] = [];

  // Run all test files in parallel — FORK
  const results = await Promise.all(
    testFiles.map((f) => runGGTestFile(f)),
  );
  suites.push(...results);

  let totalModules = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    for (const mod of suite.modules) {
      totalModules++;
      if (mod.ok) totalPassed++;
      else totalFailed++;
    }
    // Count the composition too
    totalModules++;
    if (suite.composition.ok) totalPassed++;
    else totalFailed++;
  }

  return {
    ok: suites.every((s) => s.ok),
    suites,
    totalModules,
    totalPassed,
    totalFailed,
    elapsed: performance.now() - start,
  };
}

/**
 * Format a full discovery result for terminal output.
 */
export function formatGGTestDiscoveryResults(result: GGTestDiscoveryResult): string {
  const lines: string[] = [];
  lines.push(`[gnosis test] discovered ${result.suites.length} test suite(s)`);
  lines.push('');

  for (const suite of result.suites) {
    lines.push(formatGGTestResults(suite));
    lines.push('');
  }

  const status = result.ok ? 'ALL PASSED' : 'FAILURES';
  lines.push(`${status}  ${result.totalPassed}/${result.totalModules} modules  ${result.elapsed.toFixed(0)}ms`);
  return lines.join('\n');
}

// ── Format results for terminal ─────────────────────────────────────────────

export function formatGGTestResults(result: GGTestSuiteResult): string {
  const lines: string[] = [];
  lines.push(`[gnosis test] ${result.testFile}`);
  lines.push('');

  for (const mod of result.modules) {
    const status = mod.ok ? 'PASS' : 'FAIL';
    const beta1Str = mod.beta1 > 0 ? ` b1=${mod.beta1}` : '';
    lines.push(
      `  ${status}  ${mod.name}  (nodes=${mod.nodeCount} edges=${mod.edgeCount} states=${mod.stateCount}${beta1Str})`
    );
    for (const v of mod.violations) {
      lines.push(`         ${v}`);
    }
  }

  lines.push('');
  lines.push(
    `  ${result.composition.ok ? 'PASS' : 'FAIL'}  test-topology  (nodes=${result.composition.nodeCount} edges=${result.composition.edgeCount} states=${result.composition.stateCount} b1=${result.composition.beta1})`
  );
  for (const v of result.composition.violations) {
    lines.push(`         ${v}`);
  }

  lines.push('');
  const total = result.modules.length + 1;
  const passed =
    result.modules.filter((m) => m.ok).length +
    (result.composition.ok ? 1 : 0);
  lines.push(
    `  ${passed}/${total} passed  ${result.elapsed.toFixed(0)}ms`
  );

  return lines.join('\n');
}
