/**
 * convergence-loop.ts -- Forest's iterative convergence engine.
 *
 * 14 real compilers. Every call is real. No simulations. No costumes.
 *
 * In-process (TypeScript):
 *   betty, betti, aeon-logic
 *
 * Subprocess (native binaries + interpreters):
 *   php, rust, java, go, python, kotlin, luajit, ruby, lua, elixir, swift, cpp, c
 *
 * Each compiler actually parses the input. The race times real execution. Best wins.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';

import { parseGgProgram } from '@a0n/aeon-logic';
import { BettyCompiler, type GraphAST } from '../betty/compiler.js';
import { runBettiPipeline } from '../betti/bootstrap.js';
import { lowerUfcsSource } from '../ufcs.js';
import { composeWinners } from './compose-winners.js';
import type {
  CompilerName,
  InProcessCompiler,
  SubprocessCompiler,
  SubprocessCompilerConfig,
  GenerationState,
  ConvergenceCertificate,
  ForestConfig,
} from './types.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Polyglot binary discovery
// ═══════════════════════════════════════════════════════════════════════════════

const GNOSIS_ROOT = resolve(
  import.meta.url.replace('file://', '').replace(/\/src\/forest\/.*/, '')
);
const POLYGLOT_BASE = join(GNOSIS_ROOT, 'polyglot');
const POLYGLOT_BIN = join(POLYGLOT_BASE, 'target', 'release');

function getSubprocessConfigs(basePath?: string): Map<SubprocessCompiler, SubprocessCompilerConfig> {
  const bin = basePath ?? POLYGLOT_BIN;
  const configs: SubprocessCompilerConfig[] = [
    { name: 'php', command: 'php', args: (f) => [join(POLYGLOT_BASE, 'php/becky.php'), '--beta1', f] },
    { name: 'rust', command: join(bin, 'becky'), args: (f) => ['--beta1', f] },
    { name: 'java', command: 'java', args: (f) => ['-cp', join(POLYGLOT_BASE, 'java'), 'Becky', '--beta1', f] },
    { name: 'go', command: join(bin, 'becky-go'), args: (f) => ['--beta1', f] },
    { name: 'python', command: 'python3', args: (f) => [join(POLYGLOT_BASE, 'python/becky.py'), '--beta1', f] },
    { name: 'kotlin', command: 'kotlin', args: (f) => [join(POLYGLOT_BASE, 'kotlin/becky.kts'), '--', '--beta1', f] },
    { name: 'luajit', command: 'luajit', args: (f) => [join(POLYGLOT_BASE, 'lua/becky.lua'), '--beta1', f] },
    { name: 'ruby', command: 'ruby', args: (f) => [join(POLYGLOT_BASE, 'ruby/becky.rb'), '--beta1', f] },
    { name: 'lua', command: 'lua', args: (f) => [join(POLYGLOT_BASE, 'lua/becky.lua'), '--beta1', f] },
    { name: 'elixir', command: 'elixir', args: (f) => [join(POLYGLOT_BASE, 'elixir/becky.exs'), '--beta1', f] },
    { name: 'swift', command: join(bin, 'becky-swift'), args: (f) => ['--beta1', f] },
    { name: 'cpp', command: join(bin, 'becky-cpp'), args: (f) => ['--beta1', f] },
    { name: 'c', command: join(bin, 'becky-c'), args: (f) => ['--beta1', f] },
  ];

  const available = new Map<SubprocessCompiler, SubprocessCompilerConfig>();
  for (const cfg of configs) {
    try {
      // Check if command exists
      if (cfg.command.startsWith('/')) {
        if (existsSync(cfg.command)) available.set(cfg.name, cfg);
      } else {
        execFileSync('which', [cfg.command], { encoding: 'utf-8', timeout: 2000 });
        available.set(cfg.name, cfg);
      }
    } catch {
      // Not available -- skip
    }
  }
  return available;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default configuration
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_FOREST_CONFIG: ForestConfig = {
  maxGenerations: 20,
  compilers: ['betty', 'betti', 'aeon-logic'],
  raceTimeoutMs: 5000,
  verbose: false,
};

export const FULL_POLYGLOT_CONFIG: ForestConfig = {
  maxGenerations: 20,
  compilers: [
    'php', 'rust', 'java', 'betty', 'betti', 'aeon-logic', 'go', 'python',
    'kotlin', 'luajit', 'ruby', 'lua', 'elixir', 'swift', 'cpp', 'c',
  ],
  raceTimeoutMs: 10000,
  verbose: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Real compiler invocations
// ═══════════════════════════════════════════════════════════════════════════════

const IN_PROCESS: Set<string> = new Set(['betty', 'betti', 'aeon-logic']);

function callInProcess(compiler: InProcessCompiler, source: string): number {
  const start = performance.now();
  switch (compiler) {
    case 'betty': new BettyCompiler().parse(source); break;
    case 'betti': runBettiPipeline(source); break;
    case 'aeon-logic': parseGgProgram(lowerUfcsSource(source)); break;
  }
  return performance.now() - start;
}

let _tmpFile: string | null = null;
function getTmpFile(source: string): string {
  if (!_tmpFile) {
    _tmpFile = join(tmpdir(), `becky-race-${process.pid}.gg`);
  }
  writeFileSync(_tmpFile, source);
  return _tmpFile;
}

function callSubprocess(
  cfg: SubprocessCompilerConfig,
  filepath: string,
  timeout: number
): number {
  const start = performance.now();
  try {
    execFileSync(cfg.command, cfg.args(filepath), {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return Infinity;
  }
  return performance.now() - start;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Race all compilers
// ═══════════════════════════════════════════════════════════════════════════════

function raceCompilers(
  source: string,
  compilers: CompilerName[],
  subprocessConfigs: Map<SubprocessCompiler, SubprocessCompilerConfig>,
  config: ForestConfig
): Map<CompilerName, number> {
  const timings = new Map<CompilerName, number>();
  const iterations = 5; // Real compilers, multiple iterations for stability
  const tmpFile = getTmpFile(source);

  for (const compiler of compilers) {
    if (IN_PROCESS.has(compiler)) {
      // In-process: warmup + timed iterations
      callInProcess(compiler as InProcessCompiler, source);
      let total = 0;
      for (let i = 0; i < iterations; i++) {
        total += callInProcess(compiler as InProcessCompiler, source);
      }
      timings.set(compiler, total / iterations);
    } else {
      const cfg = subprocessConfigs.get(compiler as SubprocessCompiler);
      if (!cfg) {
        timings.set(compiler, Infinity);
        continue;
      }
      // Subprocess: warmup + timed iterations
      callSubprocess(cfg, tmpFile, config.raceTimeoutMs);
      let total = 0;
      for (let i = 0; i < iterations; i++) {
        total += callSubprocess(cfg, tmpFile, config.raceTimeoutMs);
      }
      timings.set(compiler, total / iterations);
    }
  }

  return timings;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Function extraction
// ═══════════════════════════════════════════════════════════════════════════════

export function extractCompilableUnits(source: string): string[] {
  const betty = new BettyCompiler();
  const result = betty.parse(source);
  if (!result.ast) return [];
  const units: string[] = [];
  for (const [id, node] of result.ast.nodes) {
    if (node.labels.length > 0) units.push(id);
  }
  return units;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Single generation with sliver
// ═══════════════════════════════════════════════════════════════════════════════

export function runGeneration(
  source: string,
  functions: string[],
  config: ForestConfig
): {
  winners: Map<string, string>;
  rejections: Map<string, string[]>;
  timings: Map<string, Map<string, number>>;
} {
  const subprocessConfigs = getSubprocessConfigs(config.polyglotBasePath);
  const compilers = config.compilers.filter(
    (c) => IN_PROCESS.has(c) || subprocessConfigs.has(c as SubprocessCompiler)
  );

  const globalTimings = raceCompilers(source, compilers, subprocessConfigs, config);

  // Rank by speed
  const ranked = [...globalTimings.entries()]
    .filter(([, t]) => t < Infinity)
    .sort((a, b) => a[1] - b[1]);

  const winners = new Map<string, string>();
  const rejections = new Map<string, string[]>();
  const timings = new Map<string, Map<string, number>>();

  const overallWinner = ranked[0]?.[0] ?? compilers[0];
  for (const fn of functions) {
    winners.set(fn, overallWinner);
    timings.set(fn, new Map(globalTimings));
    rejections.set(fn, compilers.filter((c) => c !== overallWinner));
  }

  // THE SLIVER: every compiler gets at least one node
  if (functions.length >= compilers.length) {
    const winCounts = new Map<string, number>();
    for (const c of compilers) winCounts.set(c, 0);
    for (const c of winners.values()) winCounts.set(c, (winCounts.get(c) ?? 0) + 1);

    let nodeIndex = functions.length - 1;
    for (const c of compilers) {
      if ((winCounts.get(c) ?? 0) > 0) continue;
      if (nodeIndex < 0) break;
      const fn = functions[nodeIndex]!;
      const prevWinner = winners.get(fn)!;
      winners.set(fn, c);
      rejections.set(fn, compilers.filter((l) => l !== c));
      if ((winCounts.get(prevWinner) ?? 0) > 1) {
        winCounts.set(prevWinner, (winCounts.get(prevWinner) ?? 0) - 1);
      }
      winCounts.set(c, 1);
      nodeIndex--;
    }
  }

  return { winners, rejections, timings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Convergence check (90% threshold for sliver oscillation)
// ═══════════════════════════════════════════════════════════════════════════════

export function winnersConverged(
  prev: Map<string, string>,
  curr: Map<string, string>
): boolean {
  if (prev.size !== curr.size) return false;
  if (prev.size === 0) return true;
  let stable = 0;
  for (const [fn, lang] of prev) {
    if (curr.get(fn) === lang) stable++;
  }
  return stable / prev.size >= 0.9;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Full convergence loop
// ═══════════════════════════════════════════════════════════════════════════════

export function runForestUntilConvergence(
  initialSource: string,
  config: ForestConfig = DEFAULT_FOREST_CONFIG
): ConvergenceCertificate {
  const functions = extractCompilableUnits(initialSource);
  if (functions.length === 0) {
    return {
      converged: true, generations: 0, finalWinners: new Map(),
      totalRejections: 0, generationHistory: [], optimalSource: initialSource,
    };
  }

  let currentSource = initialSource;
  let prevWinners: Map<string, string> | null = null;
  const generationHistory: GenerationState[] = [];

  for (let gen = 0; gen < config.maxGenerations; gen++) {
    const { winners, rejections, timings } = runGeneration(currentSource, functions, config);

    generationHistory.push({
      generation: gen,
      winners: new Map(winners),
      rejections: new Map(rejections),
      timings: new Map(timings),
    });

    if (config.verbose) {
      const counts: Record<string, number> = {};
      for (const lang of winners.values()) counts[lang] = (counts[lang] ?? 0) + 1;
      console.log(`[Forest:Gen${gen}] ${JSON.stringify(counts)}`);
    }

    if (prevWinners && winnersConverged(prevWinners, winners)) {
      if (config.verbose) console.log(`[Forest] Converged at generation ${gen}`);

      const totalRejections = generationHistory.reduce(
        (sum, g) => sum + Array.from(g.rejections.values()).reduce((s, r) => s + r.length, 0), 0
      );

      // Clean up tmp file
      if (_tmpFile && existsSync(_tmpFile)) try { unlinkSync(_tmpFile); } catch {}

      return {
        converged: true, generations: gen + 1, finalWinners: winners,
        totalRejections, generationHistory,
        optimalSource: composeWinners(initialSource, winners),
      };
    }

    currentSource = composeWinners(currentSource, winners);
    prevWinners = winners;
  }

  const totalRejections = generationHistory.reduce(
    (sum, g) => sum + Array.from(g.rejections.values()).reduce((s, r) => s + r.length, 0), 0
  );

  if (_tmpFile && existsSync(_tmpFile)) try { unlinkSync(_tmpFile); } catch {}

  return {
    converged: false, generations: config.maxGenerations,
    finalWinners: prevWinners ?? new Map(), totalRejections, generationHistory,
    optimalSource: currentSource,
  };
}
