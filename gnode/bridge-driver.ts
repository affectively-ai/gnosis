import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  compileTypeScriptToGnosis,
  deserializeTypeScriptBridgeResult,
  executeTypeScriptWithGnosis,
  renderTypeScriptBridgeRuntimeModule,
  serializeTypeScriptBridgeResult,
  type GnosisTypeScriptBridgeResult,
  type SerializedGnosisTypeScriptBridgeResult,
} from '../src/ts-bridge.js';

type Strategy = 'cannon' | 'linear';
type CommandName = 'compile' | 'schedule' | 'run';
type CacheStatus = 'hit' | 'miss';

const CACHE_SCHEMA_VERSION = 1;
const CACHE_RETENTION_DAYS = 3;
const DRIVER_DIRECTORY =
  typeof __dirname === 'string'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const runtimeRequire =
  typeof __filename === 'string'
    ? createRequire(__filename)
    : createRequire(import.meta.url);
const COMPILER_SIGNATURE_INPUTS = [
  path.resolve(DRIVER_DIRECTORY, 'bridge-driver.ts'),
  path.resolve(DRIVER_DIRECTORY, '../src/ts-bridge.ts'),
  path.resolve(DRIVER_DIRECTORY, '../src/runtime/engine.ts'),
  path.resolve(DRIVER_DIRECTORY, '../src/betty/compiler.ts'),
] as const;

interface ArtifactTimings {
  readonly sourceReadMs: number;
  readonly cacheLookupMs: number;
  readonly compileMs: number;
  readonly runtimeModuleMs: number;
  readonly writeMs: number;
  readonly totalMs: number;
}

interface LoadedArtifact {
  readonly compiled: GnosisTypeScriptBridgeResult;
  readonly runtimeModulePath?: string;
  readonly fingerprint: string;
  readonly cacheStatus: CacheStatus;
  readonly timings: ArtifactTimings;
}

interface CachedArtifactRecord {
  readonly version: number;
  readonly fingerprint: string;
  readonly compilerSignature: string;
  readonly sourceFilePath: string;
  readonly exportName?: string;
  readonly cacheDate: string;
  readonly createdAt: string;
  readonly previousFingerprint: string | null;
  readonly runtimeModuleRelativePath: string | null;
  readonly compiled: SerializedGnosisTypeScriptBridgeResult;
}

interface DaisyChainHeadRecord {
  readonly fingerprint: string;
  readonly updatedAt: string;
}

interface TraceTimings {
  readonly cacheStatus: CacheStatus;
  readonly fingerprint: string;
  readonly artifact: ArtifactTimings;
  readonly executeMs?: number;
  readonly totalMs: number;
}

interface ParsedArgs {
  readonly command: CommandName;
  readonly filePath: string;
  readonly exportName?: string;
  readonly inputJson?: string;
  readonly printGg: boolean;
  readonly printSchedule: boolean;
  readonly lanes: number;
  readonly strategy: Strategy;
  readonly traceTimings: boolean;
}

interface RotationResult<T> {
  readonly lanes: readonly {
    readonly laneIndex: number;
    readonly items: readonly T[];
  }[];
  readonly nextCursor: number;
}

function usage(): string {
  return [
    'Usage:',
    '  gnode compile <file.ts> [--export name]',
    '  gnode schedule <file.ts> [--export name] [--lanes N] [--strategy cannon|linear]',
    '  gnode run <file.ts> [--export name] [--input-json JSON] [--print-gg] [--print-schedule] [--lanes N] [--strategy cannon|linear]',
    '  gnode <command> ... [--trace-timings]',
  ].join('\n');
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  const filePath = argv[1];

  if (
    (command !== 'compile' && command !== 'schedule' && command !== 'run') ||
    !filePath
  ) {
    throw new Error(usage());
  }

  let exportName: string | undefined;
  let inputJson: string | undefined;
  let printGg = false;
  let printSchedule = false;
  let lanes = 4;
  let strategy: Strategy = 'cannon';
  let traceTimings = false;

  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--export') {
      exportName = argv[index + 1];
      index += 1;
      continue;
    }
    if (flag === '--input-json') {
      inputJson = argv[index + 1];
      index += 1;
      continue;
    }
    if (flag === '--lanes') {
      const value = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error(`Invalid lane count '${argv[index + 1] ?? ''}'.`);
      }
      lanes = value;
      index += 1;
      continue;
    }
    if (flag === '--strategy') {
      const value = argv[index + 1];
      if (value !== 'cannon' && value !== 'linear') {
        throw new Error(`Invalid strategy '${value ?? ''}'.`);
      }
      strategy = value;
      index += 1;
      continue;
    }
    if (flag === '--print-gg') {
      printGg = true;
      continue;
    }
    if (flag === '--print-schedule') {
      printSchedule = true;
      continue;
    }
    if (flag === '--trace-timings') {
      traceTimings = true;
      continue;
    }

    throw new Error(`Unknown flag '${flag}'.\n\n${usage()}`);
  }

  return {
    command,
    filePath: path.resolve(filePath),
    exportName,
    inputJson,
    printGg,
    printSchedule,
    lanes,
    strategy,
    traceTimings,
  };
}

function resolveCacheRoot(): string {
  return path.resolve(
    process.env.GNODE_CACHE_DIR ??
      path.join(os.tmpdir(), 'gnode-daisy-chain-cache')
  );
}

function getCacheDateSegment(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function writeTextFileAtomic(targetPath: string, value: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, value, 'utf8');
  fs.renameSync(tempPath, targetPath);
}

function writeJsonFileAtomic(targetPath: string, value: unknown): void {
  writeTextFileAtomic(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJsonFile<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(targetPath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function computeCompilerSignature(): string {
  return createHash('sha256')
    .update(`schema:${String(CACHE_SCHEMA_VERSION)}`)
    .update(
      COMPILER_SIGNATURE_INPUTS.map((inputPath) => {
        const stats = fs.statSync(inputPath);
        return `${inputPath}:${String(stats.size)}:${String(stats.mtimeMs)}`;
      }).join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function computeArtifactFingerprint(
  sourceText: string,
  filePath: string,
  exportName?: string
): string {
  return createHash('sha256')
    .update(computeCompilerSignature())
    .update(path.resolve(filePath))
    .update('\u0000')
    .update(exportName ?? '')
    .update('\u0000')
    .update(sourceText)
    .digest('hex')
    .slice(0, 24);
}

function computeHeadKey(filePath: string, exportName?: string): string {
  return createHash('sha256')
    .update(path.resolve(filePath))
    .update('\u0000')
    .update(exportName ?? '')
    .digest('hex')
    .slice(0, 24);
}

function pruneExpiredCacheDays(cacheRoot: string): void {
  if (!fs.existsSync(cacheRoot)) {
    return;
  }

  const entries = fs
    .readdirSync(cacheRoot, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/u.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  for (const staleEntry of entries.slice(CACHE_RETENTION_DAYS)) {
    fs.rmSync(path.join(cacheRoot, staleEntry), {
      recursive: true,
      force: true,
    });
  }
}

function transpileRuntimeModuleWithEsbuild(
  moduleSource: string,
  sourceFilePath: string
): string {
  const { transformSync } = runtimeRequire('esbuild') as {
    readonly transformSync: (
      input: string,
      options: {
        readonly loader: 'ts';
        readonly format: 'esm';
        readonly target: string;
        readonly sourcefile: string;
      }
    ) => { readonly code: string };
  };

  return transformSync(moduleSource, {
    loader: 'ts',
    format: 'esm',
    target: 'node22',
    sourcefile: sourceFilePath,
  }).code;
}

function loadArtifact(
  filePath: string,
  exportName?: string
): LoadedArtifact {
  const overallStarted = performance.now();

  const sourceReadStarted = performance.now();
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceReadMs = performance.now() - sourceReadStarted;

  const cacheLookupStarted = performance.now();
  const cacheRoot = resolveCacheRoot();
  const cacheDate = getCacheDateSegment();
  const fingerprint = computeArtifactFingerprint(sourceText, filePath, exportName);
  const artifactDirectory = path.join(cacheRoot, cacheDate, fingerprint);
  const artifactRecordPath = path.join(artifactDirectory, 'artifact.json');
  const cachedArtifact = readJsonFile<CachedArtifactRecord>(artifactRecordPath);

  if (
    cachedArtifact &&
    cachedArtifact.version === CACHE_SCHEMA_VERSION &&
    cachedArtifact.fingerprint === fingerprint &&
    cachedArtifact.compilerSignature === computeCompilerSignature()
  ) {
    const runtimeModulePath =
      cachedArtifact.runtimeModuleRelativePath === null
        ? undefined
        : path.join(artifactDirectory, cachedArtifact.runtimeModuleRelativePath);

    if (!runtimeModulePath || fs.existsSync(runtimeModulePath)) {
      const cacheLookupMs = performance.now() - cacheLookupStarted;
      const totalMs = performance.now() - overallStarted;
      return {
        compiled: deserializeTypeScriptBridgeResult(cachedArtifact.compiled),
        runtimeModulePath,
        fingerprint,
        cacheStatus: 'hit',
        timings: {
          sourceReadMs,
          cacheLookupMs,
          compileMs: 0,
          runtimeModuleMs: 0,
          writeMs: 0,
          totalMs,
        },
      };
    }
  }

  const cacheLookupMs = performance.now() - cacheLookupStarted;
  const compileStarted = performance.now();
  const compiled = compileTypeScriptToGnosis(sourceText, {
    exportName,
    sourceFilePath: filePath,
  });
  const compileMs = performance.now() - compileStarted;

  const runtimeModuleStarted = performance.now();
  let runtimeModulePath: string | undefined;
  let runtimeModuleRelativePath: string | null = null;
  const runtimeModule = renderTypeScriptBridgeRuntimeModule(
    sourceText,
    filePath,
    compiled.runtimeBindingNames,
    { specifierStyle: 'absolute-url' }
  );

  if (runtimeModule.bindingNames.length > 0) {
    runtimeModuleRelativePath = 'runtime-bridge.mjs';
    runtimeModulePath = path.join(artifactDirectory, runtimeModuleRelativePath);
    writeTextFileAtomic(
      runtimeModulePath,
      transpileRuntimeModuleWithEsbuild(runtimeModule.moduleSource, filePath)
    );
  }

  const runtimeModuleMs = performance.now() - runtimeModuleStarted;

  const writeStarted = performance.now();
  const headPath = path.join(
    cacheRoot,
    cacheDate,
    'heads',
    `${computeHeadKey(filePath, exportName)}.json`
  );
  const previousFingerprint =
    readJsonFile<DaisyChainHeadRecord>(headPath)?.fingerprint ?? null;
  const createdAt = new Date().toISOString();

  writeJsonFileAtomic(artifactRecordPath, {
    version: CACHE_SCHEMA_VERSION,
    fingerprint,
    compilerSignature: computeCompilerSignature(),
    sourceFilePath: filePath,
    exportName,
    cacheDate,
    createdAt,
    previousFingerprint,
    runtimeModuleRelativePath,
    compiled: serializeTypeScriptBridgeResult(compiled),
  } satisfies CachedArtifactRecord);
  writeJsonFileAtomic(headPath, {
    fingerprint,
    updatedAt: createdAt,
  } satisfies DaisyChainHeadRecord);
  pruneExpiredCacheDays(cacheRoot);
  const writeMs = performance.now() - writeStarted;
  const totalMs = performance.now() - overallStarted;

  return {
    compiled,
    runtimeModulePath,
    fingerprint,
    cacheStatus: 'miss',
    timings: {
      sourceReadMs,
      cacheLookupMs,
      compileMs,
      runtimeModuleMs,
      writeMs,
      totalMs,
    },
  };
}

function rotateIntoLanes<T>(
  items: readonly T[],
  laneCount: number,
  cursor = 0
): RotationResult<T> {
  const normalizedLaneCount = Math.max(1, laneCount);
  const lanes = Array.from({ length: normalizedLaneCount }, (_, laneIndex) => ({
    laneIndex,
    items: [] as T[],
  }));

  for (let index = 0; index < items.length; index += 1) {
    const laneIndex = (cursor + index) % normalizedLaneCount;
    lanes[laneIndex]?.items.push(items[index] as T);
  }

  return {
    lanes,
    nextCursor: (cursor + items.length) % normalizedLaneCount,
  };
}

function formatSchedule(
  compiled: GnosisTypeScriptBridgeResult,
  laneCount: number,
  strategy: Strategy
): string {
  const lines = [
    `strategy=${strategy}`,
    `lanes=${Math.max(1, laneCount)}`,
    `preload=${strategy === 'cannon' ? 'armed' : 'off'}`,
    `entry=${compiled.entryNodeId}`,
  ];

  let cursor = 0;

  for (const wave of compiled.schedule) {
    lines.push(`wave ${wave.index} ${wave.kind}`);
    if (wave.kind === 'parallel') {
      const rotation = rotateIntoLanes(
        wave.nodeIds,
        laneCount,
        strategy === 'cannon' ? cursor : 0
      );
      for (const lane of rotation.lanes) {
        if (lane.items.length === 0) {
          continue;
        }
        lines.push(`  lane ${lane.laneIndex}: ${lane.items.join(', ')}`);
      }
      cursor = strategy === 'cannon' ? rotation.nextCursor : cursor;
      continue;
    }

    lines.push(`  lane 0: ${wave.nodeIds.join(', ')}`);
  }

  return lines.join('\n');
}

function writeSection(title: string, content: string): void {
  process.stderr.write(`\n[gnode ${title}]\n`);
  process.stderr.write(content.endsWith('\n') ? content : `${content}\n`);
}

function shouldPrintRuntimeLogs(): boolean {
  return process.env.GNODE_SUPPRESS_RUNTIME_LOGS !== '1';
}

function shouldTraceTimings(parsed: ParsedArgs): boolean {
  return parsed.traceTimings || process.env.GNODE_TRACE_TIMINGS === '1';
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const started = performance.now();
  const parsed = parseArgs(argv);
  const artifact = loadArtifact(parsed.filePath, parsed.exportName);

  if (parsed.command === 'compile') {
    process.stdout.write(artifact.compiled.ggSource);
    if (shouldTraceTimings(parsed)) {
      writeSection(
        'timings',
        JSON.stringify(
          {
            cacheStatus: artifact.cacheStatus,
            fingerprint: artifact.fingerprint,
            artifact: artifact.timings,
            totalMs: Number((performance.now() - started).toFixed(2)),
          } satisfies TraceTimings,
          null,
          2
        )
      );
    }
    return 0;
  }

  if (parsed.command === 'schedule') {
    process.stdout.write(
      `${formatSchedule(artifact.compiled, parsed.lanes, parsed.strategy)}\n`
    );
    if (shouldTraceTimings(parsed)) {
      writeSection(
        'timings',
        JSON.stringify(
          {
            cacheStatus: artifact.cacheStatus,
            fingerprint: artifact.fingerprint,
            artifact: artifact.timings,
            totalMs: Number((performance.now() - started).toFixed(2)),
          } satisfies TraceTimings,
          null,
          2
        )
      );
    }
    return 0;
  }

  if (parsed.printGg) {
    writeSection('gg', artifact.compiled.ggSource);
  }

  if (parsed.printSchedule) {
    writeSection(
      'schedule',
      formatSchedule(artifact.compiled, parsed.lanes, parsed.strategy)
    );
  }

  const input =
    parsed.inputJson !== undefined ? JSON.parse(parsed.inputJson) : undefined;
  const executeStarted = performance.now();
  const result = await executeTypeScriptWithGnosis({
    compiled: artifact.compiled,
    runtimeModulePath: artifact.runtimeModulePath,
    input,
  });
  const executeMs = performance.now() - executeStarted;

  if (shouldTraceTimings(parsed)) {
    writeSection(
      'timings',
      JSON.stringify(
        {
          cacheStatus: artifact.cacheStatus,
          fingerprint: artifact.fingerprint,
          artifact: artifact.timings,
          executeMs: Number(executeMs.toFixed(2)),
          totalMs: Number((performance.now() - started).toFixed(2)),
        } satisfies TraceTimings,
        null,
        2
      )
    );
  }

  if (shouldPrintRuntimeLogs() && result.logs.trim().length > 0) {
    writeSection('logs', result.logs);
  }

  if (result.payload === null || result.payload === undefined) {
    return 0;
  }

  if (typeof result.payload === 'string') {
    process.stdout.write(`${result.payload}\n`);
    return 0;
  }

  process.stdout.write(`${JSON.stringify(result.payload, null, 2)}\n`);
  return 0;
}

function isCliEntrypoint(): boolean {
  const entryPath = process.argv[1];
  if (!entryPath) {
    return false;
  }

  return pathToFileURL(path.resolve(entryPath)).href === import.meta.url;
}

if (isCliEntrypoint()) {
  runCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error: unknown) => {
      const message =
        error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    }
  );
}
