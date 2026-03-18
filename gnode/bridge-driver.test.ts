import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCli } from './bridge-driver.ts';

const RELAY_ENV_KEYS = [
  'GNODE_CACHE_AEON_RELAY_URL',
  'GNODE_CACHE_RELAY_URL',
  'GNODE_CACHE_AEON_RELAY_ROOM_PREFIX',
  'GNODE_CACHE_RELAY_ROOM_PREFIX',
  'GNODE_CACHE_AEON_RELAY_API_KEY',
  'GNODE_CACHE_RELAY_API_KEY',
  'GNODE_CACHE_AEON_RELAY_CLIENT_ID',
  'GNODE_CACHE_RELAY_CLIENT_ID',
  'GNODE_CACHE_AEON_RELAY_PROTOCOL',
  'GNODE_CACHE_RELAY_PROTOCOL',
  'GNODE_CACHE_AEON_RELAY_MODE',
  'GNODE_CACHE_RELAY_MODE',
  'GNODE_CACHE_AEON_RELAY_PRODUCT',
  'GNODE_CACHE_RELAY_PRODUCT',
  'GNODE_CACHE_AEON_RELAY_TIMEOUT_MS',
  'GNODE_CACHE_RELAY_TIMEOUT_MS',
] as const;

function createTempBridgeWorkspace(): {
  readonly root: string;
  readonly appPath: string;
  readonly cacheDir: string;
} {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gnode-bridge-driver-'));
  const appPath = path.join(root, 'app.ts');
  const cacheDir = path.join(root, 'cache');

  fs.writeFileSync(
    appPath,
    [
      'function internalStep(input: number) {',
      '  return input + 2;',
      '}',
      '',
      'export function app(input: number) {',
      '  return internalStep(input);',
      '}',
      '',
    ].join('\n'),
    'utf8'
  );

  return { root, appPath, cacheDir };
}

function collectRelativeFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }
      files.push(path.relative(root, entryPath));
    }
  }

  return files.sort();
}

function captureStream<T>(
  stream: NodeJS.WriteStream,
  work: () => Promise<T>
): Promise<{ readonly result: T; readonly output: string }> {
  const originalWrite = stream.write.bind(stream);
  let output = '';

  stream.write = ((chunk: string | Uint8Array) => {
    output +=
      typeof chunk === 'string'
        ? chunk
        : Buffer.from(chunk).toString('utf8');
    return true;
  }) as typeof stream.write;

  return work().then(
    (result) => {
      stream.write = originalWrite as typeof stream.write;
      return { result, output };
    },
    (error) => {
      stream.write = originalWrite as typeof stream.write;
      throw error;
    }
  );
}

class FakeRelayWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeRelayWebSocket[] = [];

  readonly url: string;
  readyState = 0;
  readonly sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { readonly data: string | Uint8Array }) => void) | null =
    null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeRelayWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = FakeRelayWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send(payload: string | Uint8Array): void {
    this.sent.push(payload);

    if (typeof payload !== 'string') {
      return;
    }

    let envelope: { readonly type?: string } | null = null;
    try {
      envelope = JSON.parse(payload) as { readonly type?: string };
    } catch {
      envelope = null;
    }

    if (envelope?.type === 'join') {
      queueMicrotask(() => {
        this.onmessage?.({
          data: JSON.stringify({
            type: 'snapshot',
            serverSeq: 1,
          }),
        });
      });
    }
  }

  close(): void {
    this.readyState = FakeRelayWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe('gnode bridge-driver cache persistence', () => {
  let previousEnv: Map<string, string | undefined>;
  let previousWebSocket: typeof globalThis.WebSocket | undefined;

  beforeEach(() => {
    previousEnv = new Map(
      ['GNODE_CACHE_DIR', ...RELAY_ENV_KEYS].map((key) => [key, process.env[key]])
    );
    previousWebSocket = globalThis.WebSocket;
    FakeRelayWebSocket.instances = [];
  });

  afterEach(() => {
    for (const [key, value] of previousEnv) {
      if (value === undefined) {
        delete process.env[key];
        continue;
      }
      process.env[key] = value;
    }

    globalThis.WebSocket = previousWebSocket;
  });

  it(
    'stores artifact and head records as qdoc updates instead of json files',
    async () => {
      const workspace = createTempBridgeWorkspace();
      process.env.GNODE_CACHE_DIR = workspace.cacheDir;

      try {
        const firstRun = await captureStream(process.stderr, async () =>
          captureStream(process.stdout, async () =>
            runCli(['compile', workspace.appPath, '--export', 'app'])
          )
        );
        expect(firstRun.result.result).toBe(0);

        const files = collectRelativeFiles(workspace.cacheDir);
        expect(files.some((file) => file.endsWith('artifact.qdoc'))).toBe(true);
        expect(files.some((file) => file.endsWith('.json'))).toBe(false);

        const secondRun = await captureStream(process.stderr, async () =>
          captureStream(process.stdout, async () =>
            runCli([
              'compile',
              workspace.appPath,
              '--export',
              'app',
              '--trace-timings',
            ])
          )
        );
        expect(secondRun.result.result).toBe(0);
        expect(secondRun.output).toContain('"cacheStatus": "hit"');
      } finally {
        fs.rmSync(workspace.root, { recursive: true, force: true });
      }
    },
    15000
  );

  it('connects cache records to DashRelay-compatible sync only when relay env is present', async () => {
    const workspace = createTempBridgeWorkspace();
    process.env.GNODE_CACHE_DIR = workspace.cacheDir;
    process.env.GNODE_CACHE_RELAY_URL = 'wss://relay.example.invalid/cache';
    process.env.GNODE_CACHE_RELAY_ROOM_PREFIX = 'gnode-test-cache';
    globalThis.WebSocket =
      FakeRelayWebSocket as unknown as typeof globalThis.WebSocket;

    try {
      const result = await captureStream(process.stdout, async () =>
        runCli(['compile', workspace.appPath, '--export', 'app'])
      );
      expect(result.result).toBe(0);
      expect(FakeRelayWebSocket.instances.length).toBeGreaterThan(0);

      const sentFrames = FakeRelayWebSocket.instances.flatMap(
        (instance) => instance.sent
      );
      const joinFrames = sentFrames.filter(
        (payload): payload is string => typeof payload === 'string'
      );

      expect(
        joinFrames.some((payload) =>
          payload.includes('"room":"gnode-test-cache/artifact/')
        )
      ).toBe(true);
      expect(
        sentFrames.some((payload) => payload instanceof Uint8Array)
      ).toBe(true);
    } finally {
      fs.rmSync(workspace.root, { recursive: true, force: true });
    }
  });
});
