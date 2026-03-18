/* global console, process */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gnosisDir = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(gnosisDir, '../..');
const workspaceBinDir = path.resolve(repoRoot, 'node_modules/.bin');
const gnodeBinPath = path.resolve(gnosisDir, 'bin/gnode.js');
const invokeAppPath = path.resolve(__dirname, 'invoke-app.mjs');

const examples = [
  {
    name: 'echo',
    sourcePath: path.resolve(__dirname, 'echo.ts'),
    compiledName: 'echo.js',
    inputJson: JSON.stringify({ name: 'gnode' }),
    expectedStdout: 'hello:gnode',
  },
  {
    name: 'fib',
    sourcePath: path.resolve(__dirname, 'fib.ts'),
    compiledName: 'fib.js',
    inputJson: JSON.stringify({ n: 20 }),
    expectedStdout: '6765',
  },
  {
    name: 'fanout',
    sourcePath: path.resolve(__dirname, 'fanout.ts'),
    compiledName: 'fanout.js',
    inputJson: JSON.stringify({ userId: 'ada' }),
    expectedStdout: 'ada:user|ada:profile',
  },
];

function readNumberSetting(flagName, envName, fallback) {
  const rawFlag = process.argv
    .slice(2)
    .find((value) => value.startsWith(`--${flagName}=`));
  const rawValue =
    rawFlag?.slice(flagName.length + 3) ??
    process.env[envName] ??
    `${fallback}`;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const warmupRuns = readNumberSetting(
  'warmup',
  'GNODE_RUNTIME_SHOOTOUT_WARMUP',
  1
);
const measuredRuns = readNumberSetting(
  'iterations',
  'GNODE_RUNTIME_SHOOTOUT_ITERATIONS',
  3
);

function percentile(sorted, ratio) {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(sorted.length * ratio))
  );
  return sorted[index] ?? 0;
}

function summarize(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    meanMs: total / Math.max(1, samples.length),
    p50Ms: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    maxMs: sorted[sorted.length - 1] ?? 0,
  };
}

async function runCommand(command, args, cwd, extraEnv = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => {
      resolve({
        exitCode: code ?? -1,
        stdout,
        stderr,
      });
    });
  });
}

async function commandExists(command) {
  const result = await runCommand(
    'sh',
    ['-lc', `command -v ${command}`],
    repoRoot
  );
  return result.exitCode === 0;
}

async function compileNodeFixtures(outputDir) {
  const result = await runCommand(
    path.resolve(workspaceBinDir, 'tsc'),
    [
      '--target',
      'es2022',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      '--types',
      'node',
      '--skipLibCheck',
      '--outDir',
      outputDir,
      ...examples.map((example) => example.sourcePath),
    ],
    repoRoot
  );

  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to compile Node fixtures:\n${result.stderr || result.stdout}`
    );
  }
}

async function measureRuntime(runtime, example) {
  for (let run = 0; run < warmupRuns; run += 1) {
    const warmup = await runtime.execute(example);
    if (warmup.exitCode !== 0) {
      throw new Error(
        `${runtime.name} failed warmup for ${example.name}:\n${warmup.stderr}`
      );
    }
    if (warmup.stdout.trim() !== example.expectedStdout) {
      throw new Error(
        `${runtime.name} produced unexpected output for ${
          example.name
        }: '${warmup.stdout.trim()}'`
      );
    }
  }

  const samples = [];
  for (let run = 0; run < measuredRuns; run += 1) {
    const started = performance.now();
    const result = await runtime.execute(example);
    const elapsedMs = performance.now() - started;
    if (result.exitCode !== 0) {
      throw new Error(
        `${runtime.name} failed for ${example.name}:\n${result.stderr}`
      );
    }
    if (result.stdout.trim() !== example.expectedStdout) {
      throw new Error(
        `${runtime.name} produced unexpected output for ${
          example.name
        }: '${result.stdout.trim()}'`
      );
    }
    samples.push(elapsedMs);
  }

  return summarize(samples);
}

function printSummary(exampleName, rows) {
  console.log(`\n${exampleName}`);
  for (const row of rows) {
    console.log(
      [
        row.name.padEnd(18),
        `mean=${row.summary.meanMs.toFixed(2)}ms`,
        `p50=${row.summary.p50Ms.toFixed(2)}ms`,
        `p95=${row.summary.p95Ms.toFixed(2)}ms`,
        `max=${row.summary.maxMs.toFixed(2)}ms`,
      ].join(' | ')
    );
  }
}

async function main() {
  const compiledOutputDir = mkdtempSync(
    path.join(tmpdir(), 'gnode-runtime-shootout-')
  );

  try {
    await compileNodeFixtures(compiledOutputDir);

    const runtimes = [
      {
        name: 'gnode',
        available: await commandExists('node'),
        execute: async (example) =>
          await runCommand(
            'node',
            [
              gnodeBinPath,
              'run',
              example.sourcePath,
              '--input-json',
              example.inputJson,
            ],
            repoRoot
          ),
      },
      {
        name: 'bun',
        available: await commandExists('bun'),
        execute: async (example) =>
          await runCommand(
            'bun',
            [invokeAppPath, example.sourcePath, example.inputJson],
            repoRoot
          ),
      },
      {
        name: 'tsx',
        available: true,
        execute: async (example) =>
          await runCommand(
            path.resolve(workspaceBinDir, 'tsx'),
            [invokeAppPath, example.sourcePath, example.inputJson],
            repoRoot
          ),
      },
      {
        name: 'ts-node',
        available: true,
        execute: async (example) =>
          await runCommand(
            path.resolve(workspaceBinDir, 'ts-node-esm'),
            [invokeAppPath, example.sourcePath, example.inputJson],
            repoRoot
          ),
      },
      {
        name: 'node',
        available: await commandExists('node'),
        execute: async (example) =>
          await runCommand(
            'node',
            [
              invokeAppPath,
              path.join(compiledOutputDir, example.compiledName),
              example.inputJson,
            ],
            repoRoot
          ),
      },
      {
        name: 'deno',
        available: await commandExists('deno'),
        execute: async (example) =>
          await runCommand(
            'deno',
            [
              'run',
              '--quiet',
              '--allow-read',
              invokeAppPath,
              example.sourcePath,
              example.inputJson,
            ],
            repoRoot
          ),
      },
    ];

    console.log('gnode toy runtime shootout');
    console.log(`warmup=${warmupRuns} measured=${measuredRuns}`);

    const skipped = runtimes
      .filter((runtime) => !runtime.available)
      .map((runtime) => runtime.name);
    if (skipped.length > 0) {
      console.log(`skipped: ${skipped.join(', ')}`);
    }

    for (const example of examples) {
      const rows = [];
      for (const runtime of runtimes) {
        if (!runtime.available) {
          continue;
        }
        const summary = await measureRuntime(runtime, example);
        rows.push({
          name: runtime.name,
          summary,
        });
      }
      rows.sort((left, right) => left.summary.meanMs - right.summary.meanMs);
      printSummary(example.name, rows);
    }
  } finally {
    rmSync(compiledOutputDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
