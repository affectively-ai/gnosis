import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';

/**
 * Request to invoke a function in a target language via a subprocess harness.
 */
export interface InvokeRequest {
  action: 'execute' | 'ping';
  language: string;
  filePath: string;
  functionName: string;
  args: unknown[];
  sourceRange?: { startByte: number; endByte: number };
}

/**
 * Response from a subprocess harness execution.
 */
export interface InvokeResponse {
  status: 'ok' | 'error';
  value: unknown;
  stdout: string;
  stderr: string;
  /** Mapped error with language-aware context (populated on error). */
  mappedError?: MappedError;
}

/**
 * Language-aware error mapping -- traces errors back to source locations.
 */
export interface MappedError {
  language: string;
  filePath: string;
  functionName: string;
  message: string;
  /** Extracted line number from traceback/backtrace if available. */
  line?: number;
  /** Extracted column from traceback if available. */
  column?: number;
  /** Original traceback/backtrace text. */
  traceback: string;
  /** Source range that was being executed. */
  sourceRange?: { startByte: number; endByte: number };
}

/**
 * Default language-to-command mapping.
 * Each entry is [command, ...prefixArgs].
 */
const DEFAULT_LANGUAGE_COMMANDS: Record<string, string[]> = {
  // Phase 1: Hand-written extractors
  python: ['python3'],
  javascript: ['node'],
  typescript: ['node', '--import', 'tsx'],
  go: ['go', 'run'],
  ruby: ['ruby'],
  java: ['java'],
  rust: ['sh'],
  // Phase 2: Declarative extractors
  c: ['sh'],
  cpp: ['sh'],
  c_sharp: ['sh'],
  kotlin: ['sh'],
  scala: ['sh'],
  swift: ['sh'],
  haskell: ['sh'],
  ocaml: ['sh'],
  lua: ['lua'],
  php: ['php'],
  elixir: ['elixir'],
  zig: ['sh'],
  bash: ['sh'],
  shell: ['sh'],
};

/**
 * Resolve the harness script path for a given language.
 */
function resolveHarnessPath(language: string): string {
  const harnessDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '..',
    '..',
    'harnesses'
  );

  const harnessMap: Record<string, string> = {
    // Phase 1: Dedicated harnesses
    python: 'python_harness.py',
    javascript: 'node_harness.mjs',
    typescript: 'node_harness.mjs',
    go: 'go_harness.go',
    ruby: 'ruby_harness.rb',
    lua: 'lua_harness.lua',
    php: 'php_harness.php',
    elixir: 'elixir_harness.exs',
    // Phase 2: Language-specific shell harnesses
    kotlin: 'kotlin_harness.sh',
    scala: 'scala_harness.sh',
    swift: 'swift_harness.sh',
    haskell: 'haskell_harness.sh',
    ocaml: 'ocaml_harness.sh',
    zig: 'zig_harness.sh',
    c_sharp: 'csharp_harness.sh',
    bash: 'bash_harness.sh',
    // Fallback to generic
    c: 'generic_harness.sh',
    cpp: 'generic_harness.sh',
    rust: 'generic_harness.sh',
    java: 'generic_harness.sh',
    shell: 'generic_harness.sh',
  };

  const harnessFile = harnessMap[language] ?? 'generic_harness.sh';
  return path.join(harnessDir, harnessFile);
}

/**
 * Get the command to launch for a given language, respecting env overrides.
 * Override pattern: GNODE_PYTHON_CMD, GNODE_GO_CMD, etc.
 */
function getLanguageCommand(language: string): string[] {
  const envKey = `GNODE_${language.toUpperCase()}_CMD`;
  const envCmd = process.env[envKey];
  if (envCmd) {
    return envCmd.split(/\s+/);
  }
  return DEFAULT_LANGUAGE_COMMANDS[language] ?? ['sh'];
}

// ─── Warm Process Pool ───────────────────────────────────────────────────────
// Keeps one subprocess per language alive for repeated calls.
// Interpreted languages (Python, Ruby, Lua, Node) benefit most from pooling
// since interpreter startup is the dominant cost.

interface WarmPoolEntry {
  process: ChildProcess;
  busy: boolean;
  language: string;
  lastUsed: number;
}

const warmPool = new Map<string, WarmPoolEntry>();

/** Languages that benefit from process pooling (interpreted runtimes). */
const POOLABLE_LANGUAGES = new Set([
  'python', 'javascript', 'typescript', 'ruby', 'lua', 'php',
]);

/** Maximum idle time before a pooled process is killed (ms). */
const POOL_IDLE_TIMEOUT_MS = 60_000;

/** Pool cleanup interval. */
let poolCleanupTimer: ReturnType<typeof setInterval> | null = null;

function startPoolCleanup(): void {
  if (poolCleanupTimer) return;
  poolCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of warmPool) {
      if (!entry.busy && now - entry.lastUsed > POOL_IDLE_TIMEOUT_MS) {
        entry.process.kill('SIGTERM');
        warmPool.delete(key);
      }
    }
    if (warmPool.size === 0 && poolCleanupTimer) {
      clearInterval(poolCleanupTimer);
      poolCleanupTimer = null;
    }
  }, 15_000);
  // Don't prevent process exit -- use globalThis.clearInterval on exit.
}

function killWarmPool(): void {
  for (const [, entry] of warmPool) {
    entry.process.kill('SIGTERM');
  }
  warmPool.clear();
  if (poolCleanupTimer) {
    clearInterval(poolCleanupTimer);
    poolCleanupTimer = null;
  }
}

// Clean up on exit.
process.on('exit', killWarmPool);

/**
 * Get the subprocess timeout in milliseconds.
 */
function getTimeoutMs(): number {
  const envVal = process.env.GNODE_SUBPROCESS_TIMEOUT_MS;
  if (envVal) {
    const parsed = Number.parseInt(envVal, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 30_000; // 30s default
}

// ─── Language-Aware Error Mapping ────────────────────────────────────────────

/**
 * Extract line/column from a language-specific error traceback.
 */
function mapErrorToSource(
  language: string,
  filePath: string,
  functionName: string,
  errorValue: unknown,
  stderr: string,
  sourceRange?: { startByte: number; endByte: number }
): MappedError {
  const errorStr = typeof errorValue === 'string' ? errorValue : String(errorValue);
  const fullText = `${errorStr}\n${stderr}`;

  let line: number | undefined;
  let column: number | undefined;

  // Python: File "path.py", line 42, in func_name
  const pyMatch = fullText.match(/File "([^"]+)", line (\d+)/);
  if (pyMatch) {
    line = Number.parseInt(pyMatch[2], 10);
  }

  // Go: path.go:42:5: error message
  const goMatch = fullText.match(/\.go:(\d+):(\d+)/);
  if (goMatch) {
    line = Number.parseInt(goMatch[1], 10);
    column = Number.parseInt(goMatch[2], 10);
  }

  // Rust: --> src/main.rs:42:5
  const rsMatch = fullText.match(/--> [^:]+:(\d+):(\d+)/);
  if (rsMatch) {
    line = Number.parseInt(rsMatch[1], 10);
    column = Number.parseInt(rsMatch[2], 10);
  }

  // Ruby: path.rb:42:in `method': message (ErrorClass)
  const rbMatch = fullText.match(/\.rb:(\d+):in/);
  if (rbMatch) {
    line = Number.parseInt(rbMatch[1], 10);
  }

  // Java: at Class.method(File.java:42)
  const javaMatch = fullText.match(/\.java:(\d+)\)/);
  if (javaMatch) {
    line = Number.parseInt(javaMatch[1], 10);
  }

  // JavaScript/TypeScript: at function (path.js:42:5)
  const jsMatch = fullText.match(/\.(js|ts|mjs|cjs):(\d+):(\d+)/);
  if (jsMatch) {
    line = Number.parseInt(jsMatch[2], 10);
    column = Number.parseInt(jsMatch[3], 10);
  }

  // C/C++: path.c:42: error
  const cMatch = fullText.match(/\.(c|cpp|cc|h):(\d+)/);
  if (cMatch && !line) {
    line = Number.parseInt(cMatch[2], 10);
  }

  // Swift: path.swift:42:5: error
  const swiftMatch = fullText.match(/\.swift:(\d+):(\d+)/);
  if (swiftMatch && !line) {
    line = Number.parseInt(swiftMatch[1], 10);
    column = Number.parseInt(swiftMatch[2], 10);
  }

  // Extract first meaningful error message line.
  const message = errorStr.split('\n').find((l) => l.trim().length > 0) ?? errorStr;

  return {
    language,
    filePath,
    functionName,
    message,
    line,
    column,
    traceback: errorStr,
    sourceRange,
  };
}

// ─── Core Invocation ─────────────────────────────────────────────────────────

/**
 * Invoke a function in a target language via its subprocess harness.
 *
 * Protocol: send JSON request on stdin, read JSON response from stdout.
 * stderr is captured separately for debugging.
 */
export async function invokeSubprocess(
  request: InvokeRequest
): Promise<InvokeResponse> {
  const timeoutMs = getTimeoutMs();
  const harnessPath = resolveHarnessPath(request.language);
  const cmdParts = getLanguageCommand(request.language);

  const cmd = cmdParts[0];
  const args = [...cmdParts.slice(1), harnessPath];

  const requestJson = JSON.stringify(request);

  return new Promise<InvokeResponse>((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
      env: {
        ...process.env,
        GNODE_POLYGLOT: '1',
      },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill('SIGKILL');
        resolve({
          status: 'error',
          value: `subprocess timed out after ${timeoutMs}ms`,
          stdout,
          stderr,
          mappedError: mapErrorToSource(
            request.language,
            request.filePath,
            request.functionName,
            `subprocess timed out after ${timeoutMs}ms`,
            stderr,
            request.sourceRange
          ),
        });
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          status: 'error',
          value: error.message,
          stdout,
          stderr,
          mappedError: mapErrorToSource(
            request.language,
            request.filePath,
            request.functionName,
            error.message,
            stderr,
            request.sourceRange
          ),
        });
      }
    });

    child.on('close', (code: number | null) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);

        if (code !== 0) {
          const errorValue = `process exited with code ${code}`;
          resolve({
            status: 'error',
            value: errorValue,
            stdout,
            stderr,
            mappedError: mapErrorToSource(
              request.language,
              request.filePath,
              request.functionName,
              `${errorValue}\n${stdout}`,
              stderr,
              request.sourceRange
            ),
          });
          return;
        }

        try {
          const response = JSON.parse(stdout) as InvokeResponse;
          // Add error mapping if the harness reported an error.
          if (response.status === 'error') {
            response.mappedError = mapErrorToSource(
              request.language,
              request.filePath,
              request.functionName,
              response.value,
              response.stderr,
              request.sourceRange
            );
          }
          resolve(response);
        } catch {
          // If harness didn't produce JSON, wrap raw output.
          resolve({
            status: 'ok',
            value: stdout.trim(),
            stdout,
            stderr,
          });
        }
      }
    });

    // Send the request.
    child.stdin.write(requestJson);
    child.stdin.end();
  });
}

/**
 * Invoke with a simple function call -- convenience wrapper.
 */
export async function invokeFunction(
  language: string,
  filePath: string,
  functionName: string,
  args: unknown[] = [],
  sourceRange?: { startByte: number; endByte: number }
): Promise<InvokeResponse> {
  return invokeSubprocess({
    action: 'execute',
    language,
    filePath,
    functionName,
    args,
    sourceRange,
  });
}

// ─── Streaming Invocation ────────────────────────────────────────────────────

/**
 * Callback for streaming subprocess output.
 */
export type StreamCallback = (chunk: string, stream: 'stdout' | 'stderr') => void;

/**
 * Invoke a subprocess with streaming output.
 * Instead of buffering all output, calls onChunk as data arrives.
 * Useful for long-running polyglot functions.
 */
export async function invokeSubprocessStreaming(
  request: InvokeRequest,
  onChunk: StreamCallback
): Promise<InvokeResponse> {
  const timeoutMs = getTimeoutMs();
  const harnessPath = resolveHarnessPath(request.language);
  const cmdParts = getLanguageCommand(request.language);

  const cmd = cmdParts[0];
  const args = [...cmdParts.slice(1), harnessPath];

  const requestJson = JSON.stringify(request);

  return new Promise<InvokeResponse>((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
      env: {
        ...process.env,
        GNODE_POLYGLOT: '1',
        GNODE_STREAMING: '1',
      },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill('SIGKILL');
        resolve({
          status: 'error',
          value: `subprocess timed out after ${timeoutMs}ms`,
          stdout,
          stderr,
        });
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      onChunk(text, 'stdout');
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      onChunk(text, 'stderr');
    });

    child.on('error', (error: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          status: 'error',
          value: error.message,
          stdout,
          stderr,
        });
      }
    });

    child.on('close', (code: number | null) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);

        if (code !== 0) {
          resolve({
            status: 'error',
            value: `process exited with code ${code}`,
            stdout,
            stderr,
          });
          return;
        }

        try {
          const response = JSON.parse(stdout) as InvokeResponse;
          resolve(response);
        } catch {
          resolve({
            status: 'ok',
            value: stdout.trim(),
            stdout,
            stderr,
          });
        }
      }
    });

    child.stdin.write(requestJson);
    child.stdin.end();
  });
}

// ─── Scanner Service (Persistent Mode) ──────────────────────────────────────

/**
 * Persistent polyglot scanner service.
 * Keeps the Rust gnosis-polyglot binary alive and sends requests over stdin,
 * avoiding the ~50ms startup cost per parse.
 */
export class PolyglotScannerService {
  private process: ChildProcess | null = null;
  private pending: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    buffer: string;
  }> = [];
  private buffer = '';

  constructor(private readonly binaryPath?: string) {}

  /**
   * Get or start the persistent scanner process.
   */
  private ensureProcess(): ChildProcess {
    if (this.process && !this.process.killed) {
      return this.process;
    }

    const binary = this.binaryPath ?? this.resolveBinaryPath();
    this.process = spawn(binary, ['--format', 'json', '--stdin'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.drainBuffer();
    });

    this.process.on('error', (error: Error) => {
      for (const p of this.pending) {
        p.reject(error);
      }
      this.pending = [];
    });

    this.process.on('close', () => {
      this.process = null;
      for (const p of this.pending) {
        p.reject(new Error('scanner process exited'));
      }
      this.pending = [];
    });

    return this.process;
  }

  /**
   * Drain the buffer, resolving pending requests when complete JSON is found.
   */
  private drainBuffer(): void {
    // Look for complete JSON objects (delimited by newlines in NDJSON mode).
    const lines = this.buffer.split('\n');
    // Keep the last incomplete line in the buffer.
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const pending = this.pending.shift();
      if (pending) {
        pending.resolve(line);
      }
    }
  }

  /**
   * Send a file to the scanner and get the result.
   */
  async scan(filePath: string): Promise<string> {
    const proc = this.ensureProcess();

    return new Promise<string>((resolve, reject) => {
      this.pending.push({ resolve, reject, buffer: '' });
      proc.stdin?.write(`${filePath}\n`);
    });
  }

  /**
   * Stop the scanner service.
   */
  stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.pending = [];
  }

  private resolveBinaryPath(): string {
    return path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
      '..',
      'polyglot',
      'target',
      'release',
      'gnosis-polyglot'
    );
  }
}
