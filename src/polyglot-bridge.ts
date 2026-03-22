import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ASTEdge, ASTNode, GraphAST, Diagnostic, DiagnosticCode, BettyParseResult } from './betty/compiler.js';
import { BettyCompiler } from './betty/compiler.js';

const execFileAsync = promisify(execFile);

/**
 * Serialized topology from the Rust polyglot binary.
 * Matches the JSON output of gnosis-polyglot.
 */
interface PolyglotScanResult {
  file_path: string;
  language: string;
  topologies: PolyglotFunctionResult[];
  errors: PolyglotError[];
}

interface PolyglotFunctionResult {
  function_name: string;
  topology: PolyglotGgTopology;
  gg_source: string;
  /** Function signature with type annotations. */
  signature?: {
    params: Array<{
      name: string;
      type_annotation: string | null;
      default_value: string | null;
      is_variadic: boolean;
      semantic_type?: unknown;
    }>;
    return_type: string | null;
    is_async: boolean;
    is_generator: boolean;
    callees: string[];
    receiver_type: string | null;
    semantic_contract?: {
      param_types: unknown[];
      return_type: unknown;
      predicates: unknown[];
      facets?: unknown[];
      obligations?: unknown[];
    };
  };
  /** Semantic contract for cross-language type compatibility. */
  semantic_contract?: {
    param_types: unknown[];
    return_type: unknown;
    predicates: unknown[];
    facets?: unknown[];
    obligations?: unknown[];
  };
}

interface PolyglotGgTopology {
  nodes: PolyglotGgNode[];
  edges: PolyglotGgEdge[];
  source_map: PolyglotSourceMap;
  metadata: {
    language: string;
    file_path: string;
    function_name: string;
    extractor_version: string;
  };
}

interface PolyglotGgNode {
  id: string;
  labels: string[];
  properties: Record<string, string>;
  source_span: PolyglotSourceSpan | null;
}

interface PolyglotGgEdge {
  source_ids: string[];
  target_ids: string[];
  type: string;
  properties: Record<string, string>;
}

interface PolyglotSourceSpan {
  file: string;
  start_line: number;
  start_column: number;
  end_line: number;
  end_column: number;
  start_byte: number;
  end_byte: number;
}

interface PolyglotSourceMap {
  entries: Array<{
    gg_node_id: string;
    span: PolyglotSourceSpan;
    snippet: string | null;
  }>;
}

interface PolyglotError {
  message: string;
  line: number | null;
  column: number | null;
}

/**
 * Result of analyzing a source file through the polyglot pipeline.
 */
export interface PolyglotAnalysisResult {
  filePath: string;
  language: string;
  functions: PolyglotFunctionAnalysis[];
  errors: string[];
}

export interface PolyglotFunctionAnalysis {
  functionName: string;
  ggSource: string;
  ast: GraphAST;
  bettyResult: BettyParseResult;
  sourceMap: Map<string, PolyglotSourceSpan>;
  /** Function signature with type annotations and semantic contract. */
  signature?: PolyglotFunctionResult['signature'];
}

/**
 * Resolve the path to the gnosis-polyglot binary.
 * First checks for a pre-built binary, then falls back to cargo run.
 */
function resolvePolyglotDirectory(): string {
  const currentDirectory =
    typeof __dirname === 'string'
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url));

  if (currentDirectory.includes(`${path.sep}dist${path.sep}gnode`)) {
    return path.resolve(currentDirectory, '..', '..', 'polyglot');
  }

  return path.resolve(currentDirectory, '..', 'polyglot');
}

function resolvePolyglotBinary(): string {
  const polyglotDir = resolvePolyglotDirectory();
  return path.join(polyglotDir, 'target', 'release', 'gnosis-polyglot');
}

/**
 * Run the Rust polyglot binary on a source file and parse the JSON output.
 */
async function runPolyglotBinary(filePath: string): Promise<PolyglotScanResult> {
  const binary = resolvePolyglotBinary();

  try {
    const { stdout } = await execFileAsync(binary, [filePath, '--format', 'json'], {
      maxBuffer: 50 * 1024 * 1024, // 50MB for large codebases
      timeout: 60_000,
    });

    return JSON.parse(stdout) as PolyglotScanResult;
  } catch (error: unknown) {
    // Fallback: try cargo run.
    const polyglotDir = resolvePolyglotDirectory();

    try {
      const { stdout } = await execFileAsync(
        'cargo',
        ['run', '--release', '--', filePath, '--format', 'json'],
        {
          cwd: polyglotDir,
          maxBuffer: 50 * 1024 * 1024,
          timeout: 120_000,
        }
      );

      return JSON.parse(stdout) as PolyglotScanResult;
    } catch (cargoError: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`failed to run gnosis-polyglot: ${msg}`);
    }
  }
}

/**
 * Convert a Rust polyglot topology to a Betty GraphAST.
 */
function topologyToGraphAst(topology: PolyglotGgTopology): GraphAST {
  const nodes = new Map<string, ASTNode>();
  for (const node of topology.nodes) {
    nodes.set(node.id, {
      id: node.id,
      labels: node.labels,
      properties: node.properties,
    });
  }

  const edges: ASTEdge[] = topology.edges.map((edge) => ({
    sourceIds: edge.source_ids,
    targetIds: edge.target_ids,
    type: edge.type,
    properties: edge.properties,
  }));

  return { nodes, edges };
}

/**
 * Build a source map from the polyglot output.
 */
function buildSourceMap(
  sourceMap: PolyglotSourceMap
): Map<string, PolyglotSourceSpan> {
  const map = new Map<string, PolyglotSourceSpan>();
  for (const entry of sourceMap.entries) {
    map.set(entry.gg_node_id, entry.span);
  }
  return map;
}

/**
 * Analyze a source file through the full polyglot pipeline:
 * 1. Run Rust polyglot binary (tree-sitter -> CFG -> GG)
 * 2. Feed GG source to Betty compiler
 * 3. Return combined analysis with source-mapped diagnostics
 */
export async function analyzePolyglotSource(
  filePath: string
): Promise<PolyglotAnalysisResult> {
  const scanResult = await runPolyglotBinary(filePath);

  const functions: PolyglotFunctionAnalysis[] = [];
  const errors: string[] = [];

  for (const polyglotError of scanResult.errors) {
    errors.push(polyglotError.message);
  }

  for (const funcResult of scanResult.topologies) {
    try {
      const ast = topologyToGraphAst(funcResult.topology);
      const sourceMap = buildSourceMap(funcResult.topology.source_map);

      // Run Betty compiler on the generated .gg source.
      const betty = new BettyCompiler();
      const bettyResult = betty.parse(funcResult.gg_source);

      functions.push({
        functionName: funcResult.function_name,
        ggSource: funcResult.gg_source,
        ast,
        bettyResult,
        sourceMap,
        signature: funcResult.signature,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`analysis error in ${funcResult.function_name}: ${msg}`);
    }
  }

  return {
    filePath: scanResult.file_path,
    language: scanResult.language,
    functions,
    errors,
  };
}

/**
 * Analyze source code directly (without writing to a file).
 * Useful for editor integrations and testing.
 */
export async function analyzePolyglotSourceString(
  source: string,
  filePath: string
): Promise<PolyglotAnalysisResult> {
  // Write to temp file and analyze.
  const tempDir = await import('node:os').then((os) => os.tmpdir());
  const tempPath = path.join(tempDir, `gnosis-polyglot-${Date.now()}${path.extname(filePath)}`);
  const { writeFile, unlink } = await import('node:fs/promises');

  try {
    await writeFile(tempPath, source, 'utf-8');
    const result = await analyzePolyglotSource(tempPath);
    // Fix the file path in the result to match the original.
    result.filePath = filePath;
    return result;
  } finally {
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors.
    }
  }
}

/**
 * Map a Betty diagnostic back to the original source location.
 */
/**
 * Run the polyglot binary in orchestration mode for execution.
 */
async function runPolyglotBinaryOrchestration(filePath: string): Promise<PolyglotOrchestrationResult> {
  const binary = resolvePolyglotBinary();

  try {
    const { stdout } = await execFileAsync(binary, [filePath, '--format', 'json', '--mode', 'orchestration'], {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60_000,
    });

    return JSON.parse(stdout) as PolyglotOrchestrationResult;
  } catch (error: unknown) {
    const polyglotDir = resolvePolyglotDirectory();

    try {
      const { stdout } = await execFileAsync(
        'cargo',
        ['run', '--release', '--', filePath, '--format', 'json', '--mode', 'orchestration'],
        {
          cwd: polyglotDir,
          maxBuffer: 50 * 1024 * 1024,
          timeout: 120_000,
        }
      );

      return JSON.parse(stdout) as PolyglotOrchestrationResult;
    } catch {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`failed to run gnosis-polyglot in orchestration mode: ${msg}`);
    }
  }
}

/**
 * Orchestration result from polyglot binary (scan result + execution manifest).
 */
interface PolyglotOrchestrationResult {
  scan_result: PolyglotScanResult;
  manifest: PolyglotExecutionManifest;
}

/**
 * Execution manifest from polyglot orchestration mode.
 */
export interface PolyglotExecutionManifest {
  language: string;
  file_path: string;
  entry_function: string;
  node_execution_plans: Array<{
    node_id: string;
    source_range: { start_byte: number; end_byte: number };
    kind: 'entry' | 'call' | 'statement' | 'return';
    callee?: string;
  }>;
}

/**
 * Analyze a source file for polyglot execution (orchestration mode).
 * Returns the GraphAST + execution manifest ready for GnosisEngine.
 */
export async function analyzePolyglotSourceForExecution(
  filePath: string
): Promise<{
  functions: Array<{
    functionName: string;
    ast: GraphAST;
    ggSource: string;
  }>;
  manifest: PolyglotExecutionManifest;
  language: string;
  errors: string[];
}> {
  const result = await runPolyglotBinaryOrchestration(filePath);

  const functions: Array<{
    functionName: string;
    ast: GraphAST;
    ggSource: string;
  }> = [];
  const errors: string[] = [];

  for (const err of result.scan_result.errors) {
    errors.push(err.message);
  }

  for (const funcResult of result.scan_result.topologies) {
    try {
      const ast = topologyToGraphAst(funcResult.topology);
      functions.push({
        functionName: funcResult.function_name,
        ast,
        ggSource: funcResult.gg_source,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`orchestration error in ${funcResult.function_name}: ${msg}`);
    }
  }

  return {
    functions,
    manifest: result.manifest,
    language: result.scan_result.language,
    errors,
  };
}

// ─── Ditto: Framework Detection ──────────────────────────────────────────────
// The Ditto layer assumes whatever framework interface the developer already
// knows. Express, Flask, Gin, Hono, Sinatra, Spring -- all compile to the
// same fork/race/fold server topology.

/**
 * Framework topology extracted by the Rust recognizer.
 */
export interface FrameworkTopology {
  framework: string;
  language: string;
  file_path: string;
  routes: Array<{
    method: string;
    path: string;
    handler_name: string;
    handler_cfg_index: number | null;
    source_start: number;
    source_end: number;
  }>;
  middleware: Array<{
    name: string;
    path_prefix: string | null;
    handler_cfg_index: number | null;
    order: number;
  }>;
  listen_port: number | null;
  config: Record<string, string>;
}

/**
 * Result of framework detection on a source file.
 */
export interface FrameworkDetectionResult {
  topology: FrameworkTopology | null;
  scan_result: PolyglotScanResult;
}

/**
 * Run the polyglot binary in framework mode (Ditto).
 * Detects server frameworks and extracts route topologies.
 */
async function runPolyglotBinaryFramework(filePath: string): Promise<FrameworkDetectionResult> {
  const binary = resolvePolyglotBinary();

  try {
    const { stdout } = await execFileAsync(binary, [filePath, '--format', 'json', '--mode', 'framework'], {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60_000,
    });

    return JSON.parse(stdout) as FrameworkDetectionResult;
  } catch (error: unknown) {
    const polyglotDir = resolvePolyglotDirectory();

    try {
      const { stdout } = await execFileAsync(
        'cargo',
        ['run', '--release', '--', filePath, '--format', 'json', '--mode', 'framework'],
        {
          cwd: polyglotDir,
          maxBuffer: 50 * 1024 * 1024,
          timeout: 120_000,
        }
      );

      return JSON.parse(stdout) as FrameworkDetectionResult;
    } catch {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`failed to run gnosis-polyglot in framework mode: ${msg}`);
    }
  }
}

/**
 * Analyze a source file for framework detection (Ditto mode).
 * Returns the framework topology (if detected) and compiled server GG.
 */
export async function analyzeFrameworkSource(
  filePath: string
): Promise<{
  framework: FrameworkTopology | null;
  serverGg: string | null;
  functions: PolyglotFunctionAnalysis[];
  language: string;
  errors: string[];
}> {
  const result = await runPolyglotBinaryFramework(filePath);

  const functions: PolyglotFunctionAnalysis[] = [];
  const errors: string[] = [];

  for (const err of result.scan_result.errors) {
    errors.push(err.message);
  }

  for (const funcResult of result.scan_result.topologies) {
    try {
      const ast = topologyToGraphAst(funcResult.topology);
      const sourceMap = buildSourceMap(funcResult.topology.source_map);
      const betty = new BettyCompiler();
      const bettyResult = betty.parse(funcResult.gg_source);

      functions.push({
        functionName: funcResult.function_name,
        ggSource: funcResult.gg_source,
        ast,
        bettyResult,
        sourceMap,
        signature: funcResult.signature,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`framework analysis error in ${funcResult.function_name}: ${msg}`);
    }
  }

  // If a framework was detected, the server GG was already compiled
  // by the Rust side. We could also compile it here from the topology.
  let serverGg: string | null = null;
  if (result.topology) {
    // The GG is compiled by compile_framework_to_gg on the Rust side.
    // For the TS bridge, we provide the topology for further processing.
    serverGg = `// Ditto: ${result.topology.framework} (${result.topology.language}) → fork/race/fold\n`;
    serverGg += `// ${result.topology.routes.length} routes, ${result.topology.middleware.length} middleware\n`;
    if (result.topology.listen_port) {
      serverGg += `// port: ${result.topology.listen_port}\n`;
    }
  }

  return {
    framework: result.topology,
    serverGg,
    functions,
    language: result.scan_result.language,
    errors,
  };
}

export function mapDiagnosticToSource(
  diagnostic: Diagnostic,
  sourceMap: Map<string, PolyglotSourceSpan>,
  ast: GraphAST
): Diagnostic & { originalLine?: number; originalColumn?: number; originalFile?: string } {
  // Try to find the source span for the diagnostic.
  // Betty diagnostics reference node IDs in their messages.
  for (const [nodeId, span] of sourceMap) {
    if (diagnostic.message.includes(nodeId)) {
      return {
        ...diagnostic,
        originalLine: span.start_line,
        originalColumn: span.start_column,
        originalFile: span.file,
      };
    }
  }

  return diagnostic;
}
