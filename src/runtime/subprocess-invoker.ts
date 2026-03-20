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

/**
 * Warm process pool -- keeps one subprocess per language alive for repeated calls.
 */
const warmPool = new Map<string, { process: ChildProcess; busy: boolean }>();

function killWarmPool(): void {
  for (const [, entry] of warmPool) {
    entry.process.kill('SIGTERM');
  }
  warmPool.clear();
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

  // For go, the harness IS the go file, so we pass it as an arg.
  // For python/node/ruby, the harness is executed by the interpreter.
  // For generic_harness.sh, we pass the harness as the script.
  const cmd = cmdParts[0];
  const args = [...cmdParts.slice(1)];

  // Special handling per language:
  if (request.language === 'go') {
    // go run go_harness.go
    args.push(harnessPath);
  } else if (request.language === 'c' || request.language === 'cpp' || request.language === 'rust' || request.language === 'java') {
    // generic harness: sh generic_harness.sh
    args.push(harnessPath);
  } else {
    // python3 python_harness.py, node node_harness.mjs, ruby ruby_harness.rb
    args.push(harnessPath);
  }

  const requestJson = JSON.stringify(request);

  return new Promise<InvokeResponse>((resolve, reject) => {
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
