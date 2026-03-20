import { createHash } from 'node:crypto';
import fs from 'node:fs';
import {
  createRequire,
  enableCompileCache,
  constants as moduleConstants,
} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { QDoc } from '../src/crdt/qdoc.js';
import {
  QDocAeonRelay,
  type QDocAeonRelayConfig,
} from '../src/crdt/aeon-relay.js';
import {
  compileTypeScriptToGnosis,
  deserializeTypeScriptBridgeResult,
  executeTypeScriptWithGnosis,
  serializeTypeScriptBridgeResult,
  type GnosisTypeScriptBridgeResult,
  type SerializedGnosisTypeScriptBridgeResult,
} from '../src/ts-bridge.js';
import { analyzePolyglotSourceForExecution } from '../src/polyglot-bridge.js';
import { executePolyglotWithGnosis } from '../src/polyglot-execution-bridge.js';
import { buildExecutionTrace, formatExecutionTrace } from '../src/polyglot-trace.js';
import { scaffoldTopology, type ScaffoldAssignment } from '../src/polyglot-scaffold.js';
import {
  compose,
  translate,
  findBestLanguage,
  computeBetaCost,
  extractFunctions,
  generateTopoRaceTopology,
} from '../src/polyglot-compose.js';

type Strategy = 'cannon' | 'linear';
type CommandName = 'compile' | 'schedule' | 'run' | 'polyglot-run' | 'scaffold' | 'compose' | 'translate' | 'best-language' | 'topo-race';
type CacheStatus = 'hit' | 'miss';

const CACHE_SCHEMA_VERSION = 1;
const CACHE_RETENTION_DAYS = 3;
const CACHE_RECORD_MAP_NAME = 'record';
const CACHE_RECORD_VALUE_KEY = 'value';
const DEFAULT_CACHE_RELAY_ROOM_PREFIX = 'gnode-cache';
const DEFAULT_CACHE_RELAY_TIMEOUT_MS = 250;
const DRIVER_DIRECTORY =
  typeof __dirname === 'string'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

function resolvePackageRoot(startDirectory: string): string {
  let currentDirectory = path.resolve(startDirectory);

  for (;;) {
    if (fs.existsSync(path.join(currentDirectory, 'package.json'))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      throw new Error(
        `Unable to locate gnosis package root from '${startDirectory}'.`
      );
    }

    currentDirectory = parentDirectory;
  }
}

const PACKAGE_ROOT = resolvePackageRoot(DRIVER_DIRECTORY);
const runtimeRequire =
  typeof __filename === 'string'
    ? createRequire(__filename)
    : createRequire(import.meta.url);
const COMPILE_CACHE_DIRECTORY =
  process.env.GNODE_COMPILE_CACHE_DIR ??
  process.env.NODE_COMPILE_CACHE ??
  (process.env.GNODE_CACHE_DIR
    ? path.resolve(process.env.GNODE_CACHE_DIR, 'node-compile-cache')
    : path.join(os.tmpdir(), 'gnode-node-compile-cache'));
const COMPILE_CACHE_RESULT =
  process.env.GNODE_DISABLE_COMPILE_CACHE === '1'
    ? null
    : enableCompileCache({
        directory: COMPILE_CACHE_DIRECTORY,
      });
const COMPILER_SIGNATURE_INPUTS = [
  path.resolve(PACKAGE_ROOT, 'gnode/bridge-driver.ts'),
  path.resolve(PACKAGE_ROOT, 'src/ts-bridge.ts'),
  path.resolve(PACKAGE_ROOT, 'src/runtime/engine.ts'),
  path.resolve(PACKAGE_ROOT, 'src/betty/compiler.ts'),
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

interface CacheRelayConfig {
  readonly url: string;
  readonly roomPrefix: string;
  readonly timeoutMs: number;
  readonly apiKey?: string;
  readonly clientId?: string;
  readonly protocol?: string;
  readonly joinMode?: string;
  readonly relayProduct?: string;
}

interface SerializedCrdtEnvelope {
  readonly __qdocType: 'string' | 'json' | 'undefined';
  readonly value?: unknown;
}

interface QDocRecordDeltaNode {
  readonly id: string;
  readonly labels: readonly string[];
  readonly properties: Readonly<Record<string, string>>;
}

interface QDocRecordDeltaEdge {
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly type: string;
  readonly properties: Readonly<Record<string, string>>;
}

interface QDocRecordDelta {
  readonly nodes: readonly QDocRecordDeltaNode[];
  readonly edges: readonly QDocRecordDeltaEdge[];
  readonly clock: number;
  readonly replicaId: string;
}

interface TraceTimings {
  readonly cacheStatus: CacheStatus;
  readonly fingerprint: string;
  readonly artifact: ArtifactTimings;
  readonly executeMs?: number;
  readonly compileCache?: {
    readonly enabled: boolean;
    readonly directory?: string;
    readonly message?: string;
  };
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
    '  gnode run <file.ts|.py|.go|...> [--export name] [--input-json JSON] [--print-gg]',
    '  gnode compose <file1.py> <file2.go> [<file3.rs> ...]',
    '  gnode translate <file.py> --to rust',
    '  gnode best-language <file.py|.go|.rs|...> [--export name]',
    '  gnode topo-race <file.py> --languages python,go,rust',
    '  gnode scaffold <file.gg> [--assign node=lang ...] [--output-dir dir]',
    '  gnode <command> ... [--trace-timings]',
  ].join('\n');
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  const filePath = argv[1];

  const validCommands = ['compile', 'schedule', 'run', 'polyglot-run', 'scaffold', 'compose', 'translate', 'best-language', 'topo-race'];
  if (!validCommands.includes(command ?? '') || !filePath) {
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

function writeBytesFileAtomic(targetPath: string, value: Uint8Array): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, Buffer.from(value));
  fs.renameSync(tempPath, targetPath);
}

function parsePositiveIntegerEnv(
  value: string | undefined
): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function resolveCacheRelayConfig(): CacheRelayConfig | null {
  const url =
    process.env.GNODE_CACHE_AEON_RELAY_URL ??
    process.env.GNODE_CACHE_RELAY_URL ??
    process.env.DASH_RELAY_WS_URL ??
    null;
  if (!url) {
    return null;
  }

  return {
    url,
    roomPrefix:
      process.env.GNODE_CACHE_AEON_RELAY_ROOM_PREFIX ??
      process.env.GNODE_CACHE_RELAY_ROOM_PREFIX ??
      DEFAULT_CACHE_RELAY_ROOM_PREFIX,
    timeoutMs:
      parsePositiveIntegerEnv(
        process.env.GNODE_CACHE_AEON_RELAY_TIMEOUT_MS ??
          process.env.GNODE_CACHE_RELAY_TIMEOUT_MS
      ) ?? DEFAULT_CACHE_RELAY_TIMEOUT_MS,
    apiKey:
      process.env.GNODE_CACHE_AEON_RELAY_API_KEY ??
      process.env.GNODE_CACHE_RELAY_API_KEY,
    clientId:
      process.env.GNODE_CACHE_AEON_RELAY_CLIENT_ID ??
      process.env.GNODE_CACHE_RELAY_CLIENT_ID,
    protocol:
      process.env.GNODE_CACHE_AEON_RELAY_PROTOCOL ??
      process.env.GNODE_CACHE_RELAY_PROTOCOL,
    joinMode:
      process.env.GNODE_CACHE_AEON_RELAY_MODE ??
      process.env.GNODE_CACHE_RELAY_MODE,
    relayProduct:
      process.env.GNODE_CACHE_AEON_RELAY_PRODUCT ??
      process.env.GNODE_CACHE_RELAY_PRODUCT ??
      'dashrelay',
  };
}

function buildCacheRelayRoomName(
  scope: 'artifact' | 'head',
  key: string
): string | null {
  const relayConfig = resolveCacheRelayConfig();
  if (!relayConfig) {
    return null;
  }

  return `${relayConfig.roomPrefix}/${scope}/${key}`;
}

function isSerializedCrdtEnvelope(
  value: unknown
): value is SerializedCrdtEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__qdocType' in value &&
    (((value as SerializedCrdtEnvelope).__qdocType === 'string' &&
      'value' in value) ||
      ((value as SerializedCrdtEnvelope).__qdocType === 'json' &&
        'value' in value) ||
      (value as SerializedCrdtEnvelope).__qdocType === 'undefined')
  );
}

function serializeQDocRecordValue(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify({
      __qdocType: 'string',
      value,
    } satisfies SerializedCrdtEnvelope);
  }

  if (typeof value === 'undefined') {
    return JSON.stringify({
      __qdocType: 'undefined',
    } satisfies SerializedCrdtEnvelope);
  }

  return JSON.stringify({
    __qdocType: 'json',
    value,
  } satisfies SerializedCrdtEnvelope);
}

function deserializeQDocRecordValue(serialized: string | undefined): unknown {
  if (typeof serialized !== 'string') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (isSerializedCrdtEnvelope(parsed)) {
      return parsed.__qdocType === 'undefined' ? undefined : parsed.value;
    }
    if (
      parsed === null ||
      Array.isArray(parsed) ||
      (typeof parsed === 'object' && parsed !== null)
    ) {
      return parsed;
    }
  } catch {
    return serialized;
  }

  return serialized;
}

function encodeQDocRecordUpdate(value: unknown, guid: string): Uint8Array {
  const serializedValue = serializeQDocRecordValue(value);
  const delta: QDocRecordDelta = {
    nodes: [
      {
        id: 'root',
        labels: ['QDoc'],
        properties: { guid },
      },
      {
        id: `map_${CACHE_RECORD_MAP_NAME}`,
        labels: ['QMap'],
        properties: { name: CACHE_RECORD_MAP_NAME, strategy: 'lww' },
      },
      {
        id: `map_${CACHE_RECORD_MAP_NAME}_${CACHE_RECORD_VALUE_KEY}_0`,
        labels: ['Write'],
        properties: {
          key: CACHE_RECORD_VALUE_KEY,
          value: serializedValue,
          ts: '1',
        },
      },
      {
        id: `map_${CACHE_RECORD_MAP_NAME}_${CACHE_RECORD_VALUE_KEY}_obs_1`,
        labels: ['Observed'],
        properties: {
          key: CACHE_RECORD_VALUE_KEY,
          value: serializedValue,
        },
      },
    ],
    edges: [
      {
        sourceIds: ['root'],
        targetIds: [`map_${CACHE_RECORD_MAP_NAME}`],
        type: 'PROCESS',
        properties: { path: CACHE_RECORD_MAP_NAME },
      },
      {
        sourceIds: [`map_${CACHE_RECORD_MAP_NAME}`],
        targetIds: [`map_${CACHE_RECORD_MAP_NAME}_${CACHE_RECORD_VALUE_KEY}_0`],
        type: 'FORK',
        properties: {
          path: CACHE_RECORD_MAP_NAME,
          key: CACHE_RECORD_VALUE_KEY,
          op: 'set',
        },
      },
      {
        sourceIds: [`map_${CACHE_RECORD_MAP_NAME}_${CACHE_RECORD_VALUE_KEY}_0`],
        targetIds: [
          `map_${CACHE_RECORD_MAP_NAME}_${CACHE_RECORD_VALUE_KEY}_obs_1`,
        ],
        type: 'OBSERVE',
        properties: {
          strategy: 'lww',
          path: CACHE_RECORD_MAP_NAME,
          key: CACHE_RECORD_VALUE_KEY,
          value: serializedValue,
        },
      },
    ],
    clock: 3,
    replicaId: `replica-${createHash('sha256')
      .update(guid)
      .digest('hex')
      .slice(0, 8)}`,
  };

  return new TextEncoder().encode(JSON.stringify(delta));
}

function readQDocRecordFromBytes<T>(bytes: Uint8Array): T | null {
  try {
    const delta = JSON.parse(
      new TextDecoder().decode(bytes)
    ) as QDocRecordDelta;

    for (let index = delta.edges.length - 1; index >= 0; index -= 1) {
      const edge = delta.edges[index];
      if (
        edge?.type === 'OBSERVE' &&
        edge.properties.path === CACHE_RECORD_MAP_NAME &&
        edge.properties.key === CACHE_RECORD_VALUE_KEY
      ) {
        return (deserializeQDocRecordValue(edge.properties.value) as T) ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function readQDocRecordSync<T>(targetPath: string): T | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }

  try {
    return readQDocRecordFromBytes<T>(
      new Uint8Array(fs.readFileSync(targetPath))
    );
  } catch {
    return null;
  }
}

async function connectCacheRelay(
  doc: QDoc,
  roomName: string
): Promise<QDocAeonRelay | null> {
  const relayConfig = resolveCacheRelayConfig();
  if (!relayConfig) {
    return null;
  }

  const relay = new QDocAeonRelay(doc, {
    url: relayConfig.url,
    roomName,
    apiKey: relayConfig.apiKey,
    clientId: relayConfig.clientId,
    protocol: relayConfig.protocol,
    joinMode: relayConfig.joinMode,
    relayProduct: relayConfig.relayProduct,
  } satisfies QDocAeonRelayConfig);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      relay.connect(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(`Timed out connecting to cache relay room '${roomName}'.`)
          );
        }, relayConfig.timeoutMs);
      }),
    ]);
    return relay;
  } catch {
    relay.disconnect();
    return null;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function readQDocRecord<T>(
  targetPath: string,
  relayRoomName?: string | null
): Promise<T | null> {
  const localRecord = readQDocRecordSync<T>(targetPath);
  if (localRecord !== null || !relayRoomName) {
    return localRecord;
  }

  const doc = new QDoc({ guid: `relay:${relayRoomName}` });
  const relay = await connectCacheRelay(doc, relayRoomName);
  try {
    if (!relay) {
      return null;
    }

    const record =
      doc.getMap<T>(CACHE_RECORD_MAP_NAME).get(CACHE_RECORD_VALUE_KEY) ?? null;
    if (record !== null) {
      writeBytesFileAtomic(targetPath, doc.encodeStateAsUpdate());
    }
    return record;
  } finally {
    relay?.disconnect();
  }
}

async function writeQDocRecord<T>(
  targetPath: string,
  value: T,
  relayRoomName?: string | null
): Promise<void> {
  if (!relayRoomName || resolveCacheRelayConfig() === null) {
    writeBytesFileAtomic(
      targetPath,
      encodeQDocRecordUpdate(value, `file:${targetPath}`)
    );
    return;
  }

  const doc = new QDoc({ guid: relayRoomName ?? `file:${targetPath}` });
  const relay = relayRoomName
    ? await connectCacheRelay(doc, relayRoomName)
    : null;

  try {
    doc.getMap<T>(CACHE_RECORD_MAP_NAME).set(CACHE_RECORD_VALUE_KEY, value);
    writeBytesFileAtomic(targetPath, doc.encodeStateAsUpdate());
  } finally {
    relay?.disconnect();
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

const COMPILER_SIGNATURE = computeCompilerSignature();

function computeArtifactFingerprint(
  sourceText: string,
  filePath: string,
  exportName?: string
): string {
  return createHash('sha256')
    .update(COMPILER_SIGNATURE)
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

async function loadArtifact(
  filePath: string,
  exportName?: string
): Promise<LoadedArtifact> {
  const overallStarted = performance.now();

  const sourceReadStarted = performance.now();
  // polyglot:ignore RESOURCE_LEAK — readFileSync returns a string, no handle to release
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceReadMs = performance.now() - sourceReadStarted;

  const cacheLookupStarted = performance.now();
  const cacheRoot = resolveCacheRoot();
  const cacheDate = getCacheDateSegment();
  const fingerprint = computeArtifactFingerprint(
    sourceText,
    filePath,
    exportName
  );
  const artifactDirectory = path.join(cacheRoot, cacheDate, fingerprint);
  const artifactRecordPath = path.join(artifactDirectory, 'artifact.qdoc');
  const artifactRelayRoomName = buildCacheRelayRoomName(
    'artifact',
    fingerprint
  );
  const cachedArtifact = await readQDocRecord<CachedArtifactRecord>(
    artifactRecordPath,
    artifactRelayRoomName
  );

  if (
    cachedArtifact &&
    cachedArtifact.version === CACHE_SCHEMA_VERSION &&
    cachedArtifact.fingerprint === fingerprint &&
    cachedArtifact.compilerSignature === COMPILER_SIGNATURE
  ) {
    const runtimeModulePath =
      cachedArtifact.runtimeModuleRelativePath === null
        ? undefined
        : path.join(
            artifactDirectory,
            cachedArtifact.runtimeModuleRelativePath
          );

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
  if (
    compiled.runtimeBindingNames.length > 0 &&
    compiled.runtimeModuleSource !== null
  ) {
    runtimeModuleRelativePath = 'runtime-bridge.mjs';
    runtimeModulePath = path.join(artifactDirectory, runtimeModuleRelativePath);
    writeTextFileAtomic(
      runtimeModulePath,
      transpileRuntimeModuleWithEsbuild(compiled.runtimeModuleSource, filePath)
    );
  }

  const runtimeModuleMs = performance.now() - runtimeModuleStarted;

  const writeStarted = performance.now();
  const headKey = computeHeadKey(filePath, exportName);
  const headPath = path.join(cacheRoot, cacheDate, 'heads', `${headKey}.qdoc`);
  const headRelayRoomName = buildCacheRelayRoomName('head', headKey);
  const previousFingerprint =
    (await readQDocRecord<DaisyChainHeadRecord>(headPath, headRelayRoomName))
      ?.fingerprint ?? null;
  const createdAt = new Date().toISOString();

  await Promise.all([
    writeQDocRecord(
      artifactRecordPath,
      {
        version: CACHE_SCHEMA_VERSION,
        fingerprint,
        compilerSignature: COMPILER_SIGNATURE,
        sourceFilePath: filePath,
        exportName,
        cacheDate,
        createdAt,
        previousFingerprint,
        runtimeModuleRelativePath,
        compiled: serializeTypeScriptBridgeResult(compiled),
      } satisfies CachedArtifactRecord,
      artifactRelayRoomName
    ),
    writeQDocRecord(
      headPath,
      {
        fingerprint,
        updatedAt: createdAt,
      } satisfies DaisyChainHeadRecord,
      headRelayRoomName
    ),
  ]);
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

function getCompileCacheTrace():
  | {
      readonly enabled: boolean;
      readonly directory?: string;
      readonly message?: string;
    }
  | undefined {
  if (
    COMPILE_CACHE_RESULT === null ||
    typeof COMPILE_CACHE_RESULT !== 'object'
  ) {
    return {
      enabled: false,
    };
  }

  if (
    COMPILE_CACHE_RESULT.status ===
      moduleConstants.compileCacheStatus.ENABLED ||
    COMPILE_CACHE_RESULT.status ===
      moduleConstants.compileCacheStatus.ALREADY_ENABLED
  ) {
    return {
      enabled: true,
      directory: COMPILE_CACHE_RESULT.directory,
    };
  }

  return {
    enabled: false,
    directory: COMPILE_CACHE_RESULT.directory,
    message: COMPILE_CACHE_RESULT.message,
  };
}

export async function runCli(argv: readonly string[]): Promise<number> {
  const started = performance.now();
  const parsed = parseArgs(argv);

  // Polyglot execution path: parse any language → topology → execute.
  if (parsed.command === 'polyglot-run') {
    return runPolyglotExecution(parsed);
  }

  // Scaffold path: generate skeleton implementations from a .gg topology.
  if (parsed.command === 'scaffold') {
    return runScaffold(parsed);
  }

  // Compose path: auto-compose multiple source files into one topology.
  if (parsed.command === 'compose') {
    return runCompose(parsed);
  }

  // Translate path: translate source to another language via topology IR.
  if (parsed.command === 'translate') {
    return runTranslate(parsed);
  }

  // Best-language path: find the optimal language for each function.
  if (parsed.command === 'best-language') {
    return runBestLanguage(parsed);
  }

  // Topo-race path: race function across languages, fastest wins.
  if (parsed.command === 'topo-race') {
    return runTopoRace(parsed);
  }

  const artifact = await loadArtifact(parsed.filePath, parsed.exportName);

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
            compileCache: getCompileCacheTrace(),
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
            compileCache: getCompileCacheTrace(),
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
          compileCache: getCompileCacheTrace(),
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

/**
 * Compute a cache fingerprint for a polyglot artifact.
 * Hash = SHA256(language + filePath + exportName + sourceText).
 */
function computePolyglotFingerprint(
  sourceText: string,
  filePath: string,
  language: string,
  exportName?: string
): string {
  return createHash('sha256')
    .update('polyglot-v1')
    .update('\u0000')
    .update(language)
    .update('\u0000')
    .update(path.resolve(filePath))
    .update('\u0000')
    .update(exportName ?? '')
    .update('\u0000')
    .update(sourceText)
    .digest('hex')
    .slice(0, 24);
}

/**
 * Cached polyglot analysis result -- stored in the daisy chain cache
 * to avoid re-parsing and re-compiling on every invocation.
 */
interface CachedPolyglotRecord {
  readonly version: number;
  readonly fingerprint: string;
  readonly language: string;
  readonly sourceFilePath: string;
  readonly exportName?: string;
  readonly cacheDate: string;
  readonly createdAt: string;
  readonly functions: ReadonlyArray<{
    readonly functionName: string;
    readonly ggSource: string;
  }>;
  readonly manifestJson: string;
}

async function runPolyglotExecution(parsed: ParsedArgs): Promise<number> {
  const started = performance.now();

  // Read source for fingerprinting.
  const sourceText = fs.readFileSync(parsed.filePath, 'utf8');
  const cacheRoot = resolveCacheRoot();
  const cacheDate = getCacheDateSegment();

  // Step 1: Check cache first.
  // We compute a preliminary fingerprint with language='unknown' then refine.
  const prelimFingerprint = computePolyglotFingerprint(
    sourceText,
    parsed.filePath,
    'polyglot',
    parsed.exportName
  );
  const artifactDir = path.join(cacheRoot, cacheDate, `polyglot-${prelimFingerprint}`);
  const artifactRecordPath = path.join(artifactDir, 'artifact.qdoc');
  const artifactRelayRoom = buildCacheRelayRoomName('artifact', `polyglot-${prelimFingerprint}`);

  const cachedRecord = await readQDocRecord<CachedPolyglotRecord>(
    artifactRecordPath,
    artifactRelayRoom
  );

  let analysis: Awaited<ReturnType<typeof analyzePolyglotSourceForExecution>>;
  let cacheStatus: CacheStatus = 'miss';

  if (
    cachedRecord &&
    cachedRecord.version === CACHE_SCHEMA_VERSION &&
    cachedRecord.fingerprint === prelimFingerprint
  ) {
    // Cache hit: reconstruct analysis from cached record.
    const manifest = JSON.parse(cachedRecord.manifestJson);
    const { topologyToGraphAst } = await import('../src/polyglot-bridge.js');

    // Re-run polyglot binary to get ASTs (we cache manifests + ggSource, not full ASTs).
    // For a true cache hit, we still need the ASTs from orchestration mode.
    // TODO: serialize GraphASTs to cache for zero-recompile hits.
    analysis = await analyzePolyglotSourceForExecution(parsed.filePath);
    cacheStatus = 'hit';
  } else {
    // Cache miss: full analysis.
    analysis = await analyzePolyglotSourceForExecution(parsed.filePath);
    cacheStatus = 'miss';

    // Write to cache.
    if (analysis.functions.length > 0) {
      const record: CachedPolyglotRecord = {
        version: CACHE_SCHEMA_VERSION,
        fingerprint: prelimFingerprint,
        language: analysis.language,
        sourceFilePath: parsed.filePath,
        exportName: parsed.exportName,
        cacheDate,
        createdAt: new Date().toISOString(),
        functions: analysis.functions.map((f) => ({
          functionName: f.functionName,
          ggSource: f.ggSource,
        })),
        manifestJson: JSON.stringify(analysis.manifest),
      };
      await writeQDocRecord(artifactRecordPath, record, artifactRelayRoom);
    }
  }

  if (analysis.errors.length > 0) {
    for (const error of analysis.errors) {
      process.stderr.write(`polyglot error: ${error}\n`);
    }
  }

  if (analysis.functions.length === 0) {
    process.stderr.write(
      `no functions found in ${parsed.filePath} (language: ${analysis.language})\n`
    );
    return 1;
  }

  // Use the first function's AST (or match by export name).
  const targetFunc = parsed.exportName
    ? analysis.functions.find((f) => f.functionName === parsed.exportName)
    : analysis.functions[0];

  if (!targetFunc) {
    process.stderr.write(
      `function '${parsed.exportName}' not found. Available: ${analysis.functions.map((f) => f.functionName).join(', ')}\n`
    );
    return 1;
  }

  if (parsed.printGg) {
    writeSection('gg', targetFunc.ggSource);
  }

  // Step 2: Execute through GnosisEngine with polyglot bridge handlers.
  const input =
    parsed.inputJson !== undefined ? JSON.parse(parsed.inputJson) : undefined;

  const result = await executePolyglotWithGnosis({
    ast: targetFunc.ast,
    manifest: analysis.manifest,
    input,
  });

  const totalMs = performance.now() - started;

  if (shouldTraceTimings(parsed)) {
    writeSection(
      'timings',
      JSON.stringify(
        {
          cacheStatus,
          language: analysis.language,
          function: targetFunc.functionName,
          totalMs: Number(totalMs.toFixed(2)),
        },
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

async function runCompose(parsed: ParsedArgs): Promise<number> {
  // Collect all file paths from argv (compose takes multiple files).
  const files: string[] = [parsed.filePath];
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--') break;
    const arg = argv[i];
    if (
      arg &&
      !arg.startsWith('-') &&
      arg !== parsed.filePath &&
      arg !== 'compose' &&
      /\.(py|go|rs|rb|js|ts|java|c|cpp|lua|php|swift|kt|scala|hs|ml|zig|sh|exs|cs)$/i.test(arg)
    ) {
      files.push(path.resolve(arg));
    }
  }

  // Analyze each file.
  const results: Array<Awaited<ReturnType<typeof analyzePolyglotSourceForExecution>>> = [];
  for (const filePath of files) {
    const analysis = await analyzePolyglotSourceForExecution(filePath);
    results.push(analysis);
  }

  // Compose.
  const composed = compose(results, files);

  // Output the composed topology.
  process.stdout.write(composed.ggSource);

  // Summary.
  process.stderr.write(`\nComposed ${composed.functions.length} functions across ${composed.languages.join(', ')}\n`);
  process.stderr.write(`Connections:\n`);
  for (const conn of composed.connections) {
    process.stderr.write(
      `  ${conn.from.function} (${conn.from.language}) →[${conn.edgeType}]→ ${conn.to.function} (${conn.to.language}) [${conn.inference}]\n`
    );
  }

  return 0;
}

async function runTranslate(parsed: ParsedArgs): Promise<number> {
  // Find --to flag.
  const argv = process.argv;
  let targetLanguage = 'python';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--to' && argv[i + 1]) {
      targetLanguage = argv[i + 1];
      break;
    }
  }

  const analysis = await analyzePolyglotSourceForExecution(parsed.filePath);
  const result = translate(analysis, parsed.filePath, targetLanguage);

  if (result.files.length === 0) {
    process.stderr.write(`No functions found to translate in ${parsed.filePath}\n`);
    return 1;
  }

  for (const file of result.files) {
    process.stderr.write(`--- ${file.fileName} ---\n`);
    process.stdout.write(file.source);
    process.stdout.write('\n');
  }

  process.stderr.write(`\nTranslated ${result.files.length} function(s) from ${analysis.language} to ${targetLanguage}\n`);
  return 0;
}

async function runBestLanguage(parsed: ParsedArgs): Promise<number> {
  const analysis = await analyzePolyglotSourceForExecution(parsed.filePath);
  const functions = extractFunctions(analysis, parsed.filePath);

  if (functions.length === 0) {
    process.stderr.write(`No functions found in ${parsed.filePath}\n`);
    return 1;
  }

  for (const func of functions) {
    const fitness = findBestLanguage(func);
    const beta = computeBetaCost(func);

    process.stdout.write(`\n${func.name} (${func.language}, ${func.nodeCount} nodes, beta=${beta.totalBeta})\n`);
    process.stdout.write(`  Least bule score: ${beta.leastBuleScore.toFixed(3)}\n`);
    process.stdout.write(`  Best languages:\n`);

    for (const entry of fitness.slice(0, 5)) {
      const current = entry.language === func.language ? ' ← current' : '';
      process.stdout.write(
        `    ${entry.language}: ${(entry.score * 100).toFixed(1)}% — ${entry.rationale}${current}\n`
      );
    }
  }

  return 0;
}

async function runTopoRace(parsed: ParsedArgs): Promise<number> {
  // Parse --languages flag.
  const argv = process.argv;
  let languages = ['python', 'go', 'rust'];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--languages' && argv[i + 1]) {
      languages = argv[i + 1].split(',').map((l) => l.trim());
      break;
    }
  }

  const analysis = await analyzePolyglotSourceForExecution(parsed.filePath);
  const functions = extractFunctions(analysis, parsed.filePath);

  if (functions.length === 0) {
    process.stderr.write(`No functions found in ${parsed.filePath}\n`);
    return 1;
  }

  for (const func of functions) {
    process.stderr.write(`\nTopo-race: ${func.name} across ${languages.join(', ')}\n`);

    // Generate the race topology.
    const raceTopology = generateTopoRaceTopology(func.name, parsed.filePath, languages);
    process.stdout.write(raceTopology);

    // Show fitness comparison.
    const fitness = findBestLanguage(func, languages);
    process.stderr.write(`  Predicted winner: ${fitness[0]?.language} (${(fitness[0]?.score ?? 0 * 100).toFixed(1)}%)\n`);
    for (const entry of fitness) {
      process.stderr.write(`    ${entry.language}: ${(entry.score * 100).toFixed(1)}%\n`);
    }
  }

  return 0;
}

async function runScaffold(parsed: ParsedArgs): Promise<number> {
  // Read the .gg source.
  const ggSource = fs.readFileSync(parsed.filePath, 'utf8');

  // Parse the topology.
  const { BettyCompiler } = await import('../src/betty/compiler.js');
  const compiler = new BettyCompiler();
  const result = compiler.parse(ggSource);

  if (!result.ast) {
    process.stderr.write('Failed to parse .gg topology.\n');
    for (const d of result.diagnostics) {
      process.stderr.write(`  ${d.line}:${d.column} ${d.message}\n`);
    }
    return 1;
  }

  // Parse --assign flags from argv (passed through as extra args).
  // Format: node_id=language
  const assignments: ScaffoldAssignment[] = [];
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--assign' && argv[i + 1]) {
      const parts = argv[i + 1].split('=');
      if (parts.length === 2) {
        assignments.push({
          nodeId: parts[0],
          language: parts[1],
        });
      }
      i += 1;
    }
  }

  if (assignments.length === 0) {
    // Auto-assign: list all PolyglotBridge nodes and their current language properties.
    process.stderr.write('No --assign flags provided. Available nodes:\n');
    for (const [nodeId, node] of result.ast.nodes) {
      const labels = node.labels.join(', ');
      const lang = node.properties.language ?? '(unassigned)';
      process.stderr.write(`  ${nodeId}: [${labels}] language=${lang}\n`);
    }
    return 0;
  }

  const scaffolded = scaffoldTopology(result.ast, assignments, ggSource);

  // Determine output directory.
  let outputDir = '.';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output-dir' && argv[i + 1]) {
      outputDir = argv[i + 1];
      break;
    }
  }

  // Write generated files.
  fs.mkdirSync(outputDir, { recursive: true });
  for (const file of scaffolded.files) {
    const filePath = path.join(outputDir, file.fileName);
    fs.writeFileSync(filePath, file.source, 'utf8');
    process.stderr.write(`  generated ${filePath} (${file.language}:${file.functionName})\n`);
  }

  // Write annotated topology.
  if (scaffolded.annotatedTopology) {
    const annotatedPath = path.join(
      outputDir,
      `${path.basename(parsed.filePath, '.gg')}.annotated.gg`
    );
    fs.writeFileSync(annotatedPath, scaffolded.annotatedTopology, 'utf8');
    process.stderr.write(`  generated ${annotatedPath} (annotated topology)\n`);
  }

  process.stderr.write(`\n${scaffolded.files.length} file(s) scaffolded.\n`);
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
