import { parseGgProgram } from '@a0n/aeon-logic';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BettyCompiler,
  type ASTEdge,
  type ASTNode,
  type GraphAST,
} from '../betty/compiler.js';
import {
  GnosisEngine,
  type GnosisEngineExecutionResult,
} from '../runtime/engine.js';
import { GnosisRegistry } from '../runtime/registry.js';
import {
  inferCapabilitiesFromGgSource,
  summarizeCapabilityRequirements,
  type CapabilityContractSummary,
} from '../capabilities/index.js';
import { ModManager, type ModDependency } from './manager.js';
import { lowerUfcsSource } from '../ufcs.js';

export interface GnosisModuleImport {
  names: string[];
  source: string;
}

export interface GnosisModuleExport {
  names: string[];
}

export interface ParsedGnosisModule {
  imports: GnosisModuleImport[];
  topologySource: string;
  exports: GnosisModuleExport[];
}

export interface LoadedGnosisModule {
  id: string;
  format: 'gg' | 'mgg';
  source: string;
  topologySource: string;
  mergedSource: string;
  ast: GraphAST;
  b1: number;
  effects: CapabilityContractSummary;
  exports: string[];
  imports: GnosisResolvedImport[];
}

export interface GnosisResolvedImport {
  declaration: GnosisModuleImport;
  module: LoadedGnosisModule;
}

export type ResolveResult =
  | { resolved: true; path: string; source: string }
  | { resolved: false; error: string };

export type GnosisModuleResolver = (
  specifier: string,
  fromModule: string
) => Promise<ResolveResult>;

const IMPORT_RE = /^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/;
const EXPORT_RE = /^\s*export\s+\{([^}]+)\}\s*;?\s*$/;

interface CompiledTopology {
  ast: GraphAST;
  b1: number;
}

interface WorkspaceDependencyResolution {
  workspaceRoot: string;
  dependency: ModDependency;
  subpath: string;
}

interface ModuleLoaderState {
  modulePath: string;
  source: string;
  format?: 'gg' | 'mgg';
  parsed?: ParsedGnosisModule;
  importResolutions?: PendingImportResolution[];
  resolvedImports?: GnosisResolvedImport[];
  localTopology?: CompiledTopology;
  mergedTopology?: CompiledTopology;
  explicitExports?: string[];
  exportNames?: string[];
}

interface PendingImportResolution {
  declaration: GnosisModuleImport;
  resolvedPath: string;
  resolvedSource: string;
}

interface ModuleResolverState {
  rootDir: string;
  specifier: string;
  fromModule: string;
  candidateBase?: string;
}

function resolveBundledTopologyUrl(relativePath: string): URL | null {
  const moduleUrl = import.meta.url;
  if (typeof moduleUrl !== 'string' || moduleUrl.length === 0) {
    return null;
  }

  try {
    return new URL(relativePath, moduleUrl);
  } catch {
    return null;
  }
}

const MODULE_LOADER_TOPOLOGY_URL_CANDIDATES = [
  resolveBundledTopologyUrl('./loader.gg'),
  resolveBundledTopologyUrl('../../src/mod/loader.gg'),
].filter((candidate): candidate is URL => candidate !== null);

const MODULE_RESOLVER_TOPOLOGY_URL_CANDIDATES = [
  resolveBundledTopologyUrl('./resolver.gg'),
  resolveBundledTopologyUrl('../../src/mod/resolver.gg'),
].filter((candidate): candidate is URL => candidate !== null);

let moduleLoaderTopologyAst: GraphAST | null = null;
let moduleResolverTopologyAst: GraphAST | null = null;

function materializeImplicitNodes(ast: GraphAST): GraphAST {
  const nodes = new Map(ast.nodes);

  for (const edge of ast.edges) {
    for (const nodeId of [...edge.sourceIds, ...edge.targetIds]) {
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          id: nodeId,
          labels: [],
          properties: {},
        });
      }
    }
  }

  return {
    nodes,
    edges: ast.edges,
  };
}

function splitNames(rawNames: string): string[] {
  return rawNames
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

function sortStrings(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function fileExists(filePath: string): boolean {
  return fsSync.existsSync(filePath);
}

function readBundledTopologySource(urlCandidates: readonly URL[]): string {
  for (const candidate of urlCandidates) {
    const filePath = fileURLToPath(candidate.href);
    if (fileExists(filePath)) {
      return fsSync.readFileSync(filePath, 'utf-8');
    }
  }

  throw new Error('Unable to locate bundled .gg topology asset.');
}

function getModuleLoaderTopologyAst(): GraphAST {
  if (moduleLoaderTopologyAst) {
    return moduleLoaderTopologyAst;
  }

  const topologySource = readBundledTopologySource(
    MODULE_LOADER_TOPOLOGY_URL_CANDIDATES
  );
  const compiler = new BettyCompiler();
  const { ast, diagnostics } = compiler.parse(lowerUfcsSource(topologySource));
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => diagnostic.message);

  if (errors.length > 0 || !ast) {
    throw new Error(
      errors.length > 0
        ? errors.join('; ')
        : 'Failed to compile bundled module loader topology.'
    );
  }

  moduleLoaderTopologyAst = materializeImplicitNodes(ast);
  return moduleLoaderTopologyAst;
}

function getModuleResolverTopologyAst(): GraphAST {
  if (moduleResolverTopologyAst) {
    return moduleResolverTopologyAst;
  }

  const topologySource = readBundledTopologySource(
    MODULE_RESOLVER_TOPOLOGY_URL_CANDIDATES
  );
  const compiler = new BettyCompiler();
  const { ast, diagnostics } = compiler.parse(lowerUfcsSource(topologySource));
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => diagnostic.message);

  if (errors.length > 0 || !ast) {
    throw new Error(
      errors.length > 0
        ? errors.join('; ')
        : 'Failed to compile bundled module resolver topology.'
    );
  }

  moduleResolverTopologyAst = materializeImplicitNodes(ast);
  return moduleResolverTopologyAst;
}

function requireModuleLoaderState(payload: unknown): ModuleLoaderState {
  const candidate =
    payload &&
    typeof payload === 'object' &&
    'value' in payload &&
    typeof (payload as { value?: unknown }).value === 'object'
      ? (payload as { value: unknown }).value
      : payload;

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    typeof (candidate as { modulePath?: unknown }).modulePath !== 'string' ||
    typeof (candidate as { source?: unknown }).source !== 'string'
  ) {
    throw new Error(
      'Module loader pipeline received an invalid state payload.'
    );
  }

  return candidate as ModuleLoaderState;
}

function requireLoadedModule(payload: unknown): LoadedGnosisModule {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as { id?: unknown }).id !== 'string' ||
    typeof (payload as { format?: unknown }).format !== 'string' ||
    !('ast' in payload)
  ) {
    throw new Error(
      'Module loader pipeline did not return a valid loaded module.'
    );
  }

  return payload as LoadedGnosisModule;
}

function requireModuleResolverState(payload: unknown): ModuleResolverState {
  const candidate =
    payload &&
    typeof payload === 'object' &&
    'value' in payload &&
    typeof (payload as { value?: unknown }).value === 'object'
      ? (payload as { value: unknown }).value
      : payload;

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    typeof (candidate as { rootDir?: unknown }).rootDir !== 'string' ||
    typeof (candidate as { specifier?: unknown }).specifier !== 'string' ||
    typeof (candidate as { fromModule?: unknown }).fromModule !== 'string'
  ) {
    throw new Error(
      'Module resolver pipeline received an invalid state payload.'
    );
  }

  return candidate as ModuleResolverState;
}

function requireResolveResult(payload: unknown): ResolveResult {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as { resolved?: unknown }).resolved !== 'boolean'
  ) {
    throw new Error(
      'Module resolver pipeline did not return a valid resolution result.'
    );
  }

  if ((payload as ResolveResult).resolved) {
    if (
      typeof (payload as { path?: unknown }).path !== 'string' ||
      typeof (payload as { source?: unknown }).source !== 'string'
    ) {
      throw new Error(
        'Module resolver pipeline returned an invalid successful result.'
      );
    }
  } else if (typeof (payload as { error?: unknown }).error !== 'string') {
    throw new Error(
      'Module resolver pipeline returned an invalid failed result.'
    );
  }

  return payload as ResolveResult;
}

function findWorkspaceRoot(
  startPath: string,
  fallbackRoot: string
): string | null {
  let current = path.resolve(startPath);
  const floor = path.resolve(fallbackRoot);

  while (true) {
    if (
      fileExists(path.join(current, 'gnosis.lock')) ||
      fileExists(path.join(current, 'gnosis.mod'))
    ) {
      return current;
    }

    if (current === floor || current === path.dirname(current)) {
      break;
    }

    current = path.dirname(current);
  }

  if (
    fileExists(path.join(floor, 'gnosis.lock')) ||
    fileExists(path.join(floor, 'gnosis.mod'))
  ) {
    return floor;
  }

  return null;
}

function readWorkspaceDependencies(workspaceRoot: string): ModDependency[] {
  const manager = new ModManager(workspaceRoot);
  const lockFile = manager.readLockFile();
  if (lockFile) {
    return lockFile.dependencies.map((dependency) => ({
      path: dependency.path,
      version: dependency.version,
    }));
  }

  return manager.parse().requires;
}

function resolveDependencySpecifier(
  specifier: string,
  workspaceRoot: string
): WorkspaceDependencyResolution | null {
  const dependencies = readWorkspaceDependencies(workspaceRoot)
    .filter(
      (dependency) =>
        specifier === dependency.path ||
        specifier.startsWith(`${dependency.path}/`)
    )
    .sort((left, right) => right.path.length - left.path.length);
  const dependency = dependencies[0];
  if (!dependency) {
    return null;
  }

  const subpath =
    specifier === dependency.path
      ? ''
      : specifier.slice(dependency.path.length + 1);

  return {
    workspaceRoot,
    dependency,
    subpath,
  };
}

function buildDependencyRootPath(
  workspaceRoot: string,
  dependency: ModDependency
): string {
  return path.join(
    workspaceRoot,
    '.gnosis',
    'deps',
    ...dependency.path.split('/').filter((segment) => segment.length > 0),
    dependency.version
  );
}

function buildDependencyCandidates(
  dependencyRoot: string,
  subpath: string
): string[] {
  if (subpath.length === 0) {
    return [
      path.join(dependencyRoot, 'index.mgg'),
      path.join(dependencyRoot, 'index.gg'),
    ];
  }

  const normalizedSubpath = path.normalize(subpath);
  if (
    normalizedSubpath.startsWith('..') ||
    path.isAbsolute(normalizedSubpath) ||
    normalizedSubpath.includes(`${path.sep}..${path.sep}`) ||
    normalizedSubpath === '..'
  ) {
    return [];
  }

  const candidateBase = path.join(dependencyRoot, normalizedSubpath);
  const hasExtension = path.extname(candidateBase).length > 0;
  if (hasExtension) {
    return [candidateBase];
  }

  return [
    `${candidateBase}.mgg`,
    `${candidateBase}.gg`,
    path.join(candidateBase, 'index.mgg'),
    path.join(candidateBase, 'index.gg'),
  ];
}

function formatImportCycle(chain: readonly string[]): string {
  return `cyclic module import: ${chain.join(' -> ')}`;
}

async function resolveBareModuleSpecifier(
  specifier: string,
  fromModule: string,
  fallbackRoot: string
): Promise<ResolveResult> {
  const searchStart =
    fromModule.length > 0
      ? path.dirname(fromModule)
      : path.resolve(fallbackRoot);
  const workspaceRoot = findWorkspaceRoot(searchStart, fallbackRoot);
  if (!workspaceRoot) {
    return {
      resolved: false,
      error: `Bare module specifier '${specifier}' requires a gnosis.mod or gnosis.lock workspace root.`,
    };
  }

  let resolution: WorkspaceDependencyResolution | null;
  try {
    resolution = resolveDependencySpecifier(specifier, workspaceRoot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      resolved: false,
      error: `Unable to read dependency metadata for '${specifier}': ${message}`,
    };
  }

  if (!resolution) {
    return {
      resolved: false,
      error: `Bare module specifier '${specifier}' is not declared in gnosis.mod or gnosis.lock.`,
    };
  }

  const dependencyRoot = buildDependencyRootPath(
    resolution.workspaceRoot,
    resolution.dependency
  );
  const candidates = buildDependencyCandidates(
    dependencyRoot,
    resolution.subpath
  );

  for (const candidate of candidates) {
    try {
      const source = await fs.readFile(candidate, 'utf-8');
      return {
        resolved: true,
        path: candidate,
        source,
      };
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        error.code !== 'ENOENT'
      ) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          resolved: false,
          error: `Unable to read '${candidate}': ${message}`,
        };
      }
    }
  }

  return {
    resolved: false,
    error: `Dependency '${
      resolution.dependency.path
    }' is declared at '${path.relative(
      resolution.workspaceRoot,
      dependencyRoot
    )}' but no module entry was found for '${specifier}'.`,
  };
}

async function resolveFilesystemCandidates(
  candidates: readonly string[],
  specifier: string
): Promise<ResolveResult> {
  for (const candidate of candidates) {
    try {
      const source = await fs.readFile(candidate, 'utf-8');
      return {
        resolved: true,
        path: candidate,
        source,
      };
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        error.code !== 'ENOENT'
      ) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          resolved: false,
          error: `Unable to read '${candidate}': ${message}`,
        };
      }
    }
  }

  return {
    resolved: false,
    error: `File not found for '${specifier}'.`,
  };
}

function graphAstFromProgram(source: string): GraphAST {
  const program = parseGgProgram(source);
  return {
    nodes: new Map(
      program.nodes.map((node) => [
        node.id,
        {
          id: node.id,
          labels: [...node.labels],
          properties: { ...node.properties },
        },
      ])
    ),
    edges: program.edges.map((edge) => ({
      sourceIds: [...edge.sourceIds],
      targetIds: [...edge.targetIds],
      type: edge.type,
      properties: { ...edge.properties },
    })),
  };
}

function compileTopology(source: string): CompiledTopology {
  if (source.trim().length === 0) {
    return {
      ast: {
        nodes: new Map(),
        edges: [],
      },
      b1: 0,
    };
  }

  const normalizedSource = lowerUfcsSource(source);
  const compiler = new BettyCompiler();
  const { ast, b1, diagnostics } = compiler.parse(normalizedSource);
  const errors = diagnostics
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => diagnostic.message);

  if (errors.length > 0) {
    const message =
      errors.length > 0
        ? errors.join('; ')
        : 'Failed to parse topology source into an AST.';
    throw new Error(message);
  }

  let normalizedAst: GraphAST;
  try {
    normalizedAst = materializeImplicitNodes(
      graphAstFromProgram(normalizedSource)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('No .gg topology edges were parsed.') && ast) {
      normalizedAst = materializeImplicitNodes(ast);
    } else {
      throw error;
    }
  }

  return { ast: normalizedAst, b1 };
}

function summarizeModuleEffects(source: string): CapabilityContractSummary {
  return summarizeCapabilityRequirements(inferCapabilitiesFromGgSource(source));
}

function formatProperties(properties: Record<string, string>): string {
  const entries = Object.entries(properties).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  if (entries.length === 0) {
    return '';
  }

  const body = entries
    .map(([key, value]) => `${key}: '${value.replace(/'/g, "\\'")}'`)
    .join(', ');
  return ` { ${body} }`;
}

function renderNode(node: ASTNode): string {
  const labels = node.labels.length > 0 ? `:${node.labels.join(':')}` : '';
  return `(${node.id}${labels}${formatProperties(node.properties)})`;
}

function renderEdge(edge: ASTEdge): string {
  return `(${edge.sourceIds.join('|')})-[:${edge.type}${formatProperties(
    edge.properties
  )}]->(${edge.targetIds.join('|')})`;
}

function prefixForModuleId(moduleId: string): string {
  const normalized = moduleId
    .replace(/\.[mg]*g[x]?$/i, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized.length > 0 ? normalized : 'module';
}

function mergeTopologies(
  local: CompiledTopology,
  imports: readonly GnosisResolvedImport[]
): CompiledTopology {
  const mergedNodes = new Map(local.ast.nodes);
  const mergedEdges = [...local.ast.edges];
  let mergedB1 = local.b1;

  for (const resolvedImport of imports) {
    const importedModule = resolvedImport.module;
    const importedNames = new Set(resolvedImport.declaration.names);
    const prefix = prefixForModuleId(importedModule.id);

    for (const node of importedModule.ast.nodes.values()) {
      const remappedId = importedNames.has(node.id)
        ? node.id
        : `${prefix}:${node.id}`;
      const existing = mergedNodes.get(remappedId);
      if (!existing) {
        mergedNodes.set(remappedId, {
          ...node,
          id: remappedId,
        });
        continue;
      }

      mergedNodes.set(remappedId, {
        id: remappedId,
        labels: sortStrings([...existing.labels, ...node.labels]),
        properties: {
          ...node.properties,
          ...existing.properties,
        },
      });
    }

    for (const edge of importedModule.ast.edges) {
      const remapId = (nodeId: string): string =>
        importedNames.has(nodeId) ? nodeId : `${prefix}:${nodeId}`;

      mergedEdges.push({
        ...edge,
        sourceIds: edge.sourceIds.map(remapId),
        targetIds: edge.targetIds.map(remapId),
      });
    }

    mergedB1 += importedModule.b1;
  }

  return {
    ast: {
      nodes: mergedNodes,
      edges: mergedEdges,
    },
    b1: mergedB1,
  };
}

export function parseMGG(source: string): ParsedGnosisModule {
  const imports: GnosisModuleImport[] = [];
  const exports: GnosisModuleExport[] = [];
  const topologyLines: string[] = [];

  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//')) {
      topologyLines.push(line);
      continue;
    }

    const importMatch = trimmed.match(IMPORT_RE);
    if (importMatch) {
      imports.push({
        names: splitNames(importMatch[1]),
        source: importMatch[2].trim(),
      });
      continue;
    }

    const exportMatch = trimmed.match(EXPORT_RE);
    if (exportMatch) {
      exports.push({
        names: splitNames(exportMatch[1]),
      });
      continue;
    }

    topologyLines.push(line);
  }

  return {
    imports,
    topologySource: topologyLines.join('\n'),
    exports,
  };
}

export function renderMGG(parsed: ParsedGnosisModule): string {
  const sections: string[] = [];
  if (parsed.imports.length > 0) {
    sections.push(
      parsed.imports
        .map(
          (declaration) =>
            `import { ${declaration.names.join(', ')} } from '${
              declaration.source
            }'`
        )
        .join('\n')
    );
  }

  const trimmedTopology = parsed.topologySource.trim();
  if (trimmedTopology.length > 0) {
    sections.push(trimmedTopology);
  }

  if (parsed.exports.length > 0) {
    sections.push(
      parsed.exports
        .map((declaration) => `export { ${declaration.names.join(', ')} }`)
        .join('\n')
    );
  }

  return sections.join('\n\n');
}

export function looksLikeModule(source: string): boolean {
  return source.split('\n').some((line) => {
    const trimmed = line.trim();
    return IMPORT_RE.test(trimmed) || EXPORT_RE.test(trimmed);
  });
}

export function detectModuleFormat(
  moduleId: string,
  source?: string
): 'gg' | 'mgg' {
  if (moduleId.toLowerCase().endsWith('.mgg')) {
    return 'mgg';
  }

  return source && looksLikeModule(source) ? 'mgg' : 'gg';
}

export function renderGraphAst(ast: GraphAST): string {
  const nodeLines = [...ast.nodes.values()]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(renderNode);
  const edgeLines = ast.edges.map(renderEdge);
  return [...nodeLines, ...edgeLines].join('\n');
}

export function createFilesystemModuleResolver(
  rootDir: string = process.cwd()
): GnosisModuleResolver {
  const registry = new GnosisRegistry();

  registry.register('ModuleResolveSpecifierKind', async (payload) => {
    const state = requireModuleResolverState(payload);
    const isFilesystemSpecifier =
      state.specifier.startsWith('.') ||
      state.specifier.startsWith('/') ||
      state.specifier.startsWith('file:');

    return {
      adt: 'ModuleSpecifier',
      kind: isFilesystemSpecifier ? 'filesystem' : 'bare',
      case: isFilesystemSpecifier ? 'filesystem' : 'bare',
      value: state,
    };
  });

  registry.register('ModuleResolveBareSpecifier', async (payload) => {
    const state = requireModuleResolverState(payload);
    return resolveBareModuleSpecifier(
      state.specifier,
      state.fromModule,
      state.rootDir
    );
  });

  registry.register('ModulePrepareFilesystemPath', async (payload) => {
    const state = requireModuleResolverState(payload);
    const baseDir =
      state.fromModule.length > 0
        ? path.dirname(state.fromModule)
        : path.resolve(state.rootDir);

    return {
      ...state,
      candidateBase: state.specifier.startsWith('file:')
        ? new URL(state.specifier).pathname
        : path.isAbsolute(state.specifier)
        ? state.specifier
        : path.resolve(baseDir, state.specifier),
    } satisfies ModuleResolverState;
  });

  registry.register('ModuleFilesystemCandidateState', async (payload) => {
    const state = requireModuleResolverState(payload);
    const candidateBase = state.candidateBase ?? state.specifier;
    const hasExtension = path.extname(candidateBase).length > 0;

    return {
      adt: 'ModuleFilesystemCandidates',
      kind: hasExtension ? 'exact' : 'search',
      case: hasExtension ? 'exact' : 'search',
      value: {
        ...state,
        candidateBase,
      } satisfies ModuleResolverState,
    };
  });

  registry.register(
    'ModuleResolveExactFilesystemCandidate',
    async (payload) => {
      const state = requireModuleResolverState(payload);
      const candidateBase = state.candidateBase ?? state.specifier;
      return resolveFilesystemCandidates([candidateBase], state.specifier);
    }
  );

  registry.register('ModuleResolveFilesystemCandidates', async (payload) => {
    const state = requireModuleResolverState(payload);
    const candidateBase = state.candidateBase ?? state.specifier;
    return resolveFilesystemCandidates(
      [`${candidateBase}.mgg`, `${candidateBase}.gg`, candidateBase],
      state.specifier
    );
  });

  const engine = new GnosisEngine(registry);

  return async (
    specifier: string,
    fromModule: string
  ): Promise<ResolveResult> => {
    const result = await engine.executeWithResult(
      getModuleResolverTopologyAst(),
      {
        rootDir,
        specifier,
        fromModule,
      } satisfies ModuleResolverState
    );
    return requireResolveResult(result.payload);
  };
}

export async function loadGnosisModuleFromFile(
  modulePath: string,
  rootDir: string = process.cwd()
): Promise<LoadedGnosisModule> {
  const loader = new GnosisModuleLoader(
    createFilesystemModuleResolver(rootDir)
  );
  return loader.load(modulePath);
}

export class GnosisModuleLoader {
  private readonly cache = new Map<string, LoadedGnosisModule>();
  private readonly loading = new Map<string, Promise<LoadedGnosisModule>>();

  constructor(private readonly resolver: GnosisModuleResolver) {}

  async load(modulePath: string, source?: string): Promise<LoadedGnosisModule> {
    const resolvedTopLevel =
      source === undefined
        ? await this.resolver(modulePath, '')
        : {
            resolved: true as const,
            path: path.isAbsolute(modulePath)
              ? modulePath
              : path.resolve(process.cwd(), modulePath),
            source,
          };

    if (!resolvedTopLevel.resolved) {
      throw new Error(
        `Failed to resolve module '${modulePath}': ${
          (resolvedTopLevel as { resolved: false; error: string }).error
        }`
      );
    }

    return this.loadResolved(
      resolvedTopLevel.path,
      resolvedTopLevel.source,
      []
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async loadResolved(
    modulePath: string,
    source: string,
    importChain: readonly string[]
  ): Promise<LoadedGnosisModule> {
    if (importChain.includes(modulePath)) {
      throw new Error(formatImportCycle([...importChain, modulePath]));
    }

    const cached = this.cache.get(modulePath);
    if (cached) {
      return cached;
    }

    const inFlight = this.loading.get(modulePath);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.loadThroughTopology(modulePath, source, importChain);
    this.loading.set(modulePath, promise);

    try {
      const loadedModule = await promise;
      this.cache.set(modulePath, loadedModule);
      return loadedModule;
    } finally {
      this.loading.delete(modulePath);
    }
  }

  private async loadThroughTopology(
    modulePath: string,
    source: string,
    importChain: readonly string[]
  ): Promise<LoadedGnosisModule> {
    return this.runModuleLoaderTopology(
      {
        modulePath,
        source,
      },
      importChain
    );
  }

  private async runModuleLoaderTopology(
    initialState: ModuleLoaderState,
    importChain: readonly string[]
  ): Promise<LoadedGnosisModule> {
    const registry = new GnosisRegistry();
    this.registerModuleLoaderHandlers(registry, importChain);

    const engine = new GnosisEngine(registry);
    const result: GnosisEngineExecutionResult = await engine.executeWithResult(
      getModuleLoaderTopologyAst(),
      initialState
    );

    return requireLoadedModule(result.payload);
  }

  private registerModuleLoaderHandlers(
    registry: GnosisRegistry,
    importChain: readonly string[]
  ): void {
    registry.register('ModuleParse', async (payload) => {
      const state = requireModuleLoaderState(payload);
      return {
        ...state,
        parsed: parseMGG(state.source),
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleDetectFormat', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const format =
        state.format ?? detectModuleFormat(state.modulePath, state.source);

      return {
        adt: 'ModuleFormat',
        kind: format,
        case: format,
        value: {
          ...state,
          format,
        } satisfies ModuleLoaderState,
      };
    });

    registry.register('ModuleImportState', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const parsed = state.parsed ?? parseMGG(state.source);

      return {
        adt: 'ModuleImports',
        kind: parsed.imports.length > 0 ? 'imports' : 'none',
        case: parsed.imports.length > 0 ? 'imports' : 'none',
        value: {
          ...state,
          parsed,
        } satisfies ModuleLoaderState,
      };
    });

    registry.register('ModuleResolveImportSpecifiers', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const parsed = state.parsed ?? parseMGG(state.source);
      const importResolutions: PendingImportResolution[] = [];

      for (const declaration of parsed.imports) {
        const resolved = await this.resolver(
          declaration.source,
          state.modulePath
        );
        if (!resolved.resolved) {
          throw new Error(
            `Cannot resolve import '${declaration.source}' from '${
              state.modulePath
            }': ${(resolved as { resolved: false; error: string }).error}`
          );
        }

        importResolutions.push({
          declaration,
          resolvedPath: resolved.path,
          resolvedSource: resolved.source,
        });
      }

      return {
        ...state,
        parsed,
        importResolutions,
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleLoadImports', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const resolvedImports: GnosisResolvedImport[] = [];

      for (const resolution of state.importResolutions ?? []) {
        const importedModule = await this.loadResolved(
          resolution.resolvedPath,
          resolution.resolvedSource,
          [...importChain, state.modulePath]
        );
        resolvedImports.push({
          declaration: resolution.declaration,
          module: importedModule,
        });
      }

      return {
        ...state,
        resolvedImports,
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleValidateImports', async (payload) => {
      const state = requireModuleLoaderState(payload);

      for (const resolvedImport of state.resolvedImports ?? []) {
        for (const name of resolvedImport.declaration.names) {
          if (!resolvedImport.module.exports.includes(name)) {
            throw new Error(
              `'${name}' is not exported from '${
                resolvedImport.declaration.source
              }'. Available exports: ${resolvedImport.module.exports.join(
                ', '
              )}`
            );
          }
        }
      }

      return {
        ...state,
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleCompileTopology', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const parsed = state.parsed ?? parseMGG(state.source);

      return {
        ...state,
        parsed,
        localTopology: compileTopology(parsed.topologySource),
        explicitExports: parsed.exports.flatMap(
          (declaration) => declaration.names
        ),
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleExportState', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const localTopology =
        state.localTopology ??
        compileTopology(
          (state.parsed ?? parseMGG(state.source)).topologySource
        );

      return {
        adt: 'ModuleExports',
        kind:
          state.explicitExports && state.explicitExports.length > 0
            ? 'explicit'
            : 'implicit',
        case:
          state.explicitExports && state.explicitExports.length > 0
            ? 'explicit'
            : 'implicit',
        value: {
          ...state,
          localTopology,
        } satisfies ModuleLoaderState,
      };
    });

    registry.register('ModuleUseExplicitExports', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const localTopology =
        state.localTopology ??
        compileTopology(
          (state.parsed ?? parseMGG(state.source)).topologySource
        );

      return {
        ...state,
        localTopology,
        exportNames: sortStrings(state.explicitExports ?? []),
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleUseImplicitExports', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const localTopology =
        state.localTopology ??
        compileTopology(
          (state.parsed ?? parseMGG(state.source)).topologySource
        );

      return {
        ...state,
        localTopology,
        exportNames: sortStrings(localTopology.ast.nodes.keys()),
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleMergeTopology', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const localTopology =
        state.localTopology ??
        compileTopology(
          (state.parsed ?? parseMGG(state.source)).topologySource
        );

      return {
        ...state,
        localTopology,
        mergedTopology: mergeTopologies(
          localTopology,
          state.resolvedImports ?? []
        ),
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleValidateExports', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const parsed = state.parsed ?? parseMGG(state.source);
      const localTopology =
        state.localTopology ?? compileTopology(parsed.topologySource);
      const mergedTopology =
        state.mergedTopology ??
        mergeTopologies(localTopology, state.resolvedImports ?? []);
      const exports =
        state.exportNames && state.exportNames.length > 0
          ? state.exportNames
          : sortStrings(localTopology.ast.nodes.keys());

      for (const exportedName of exports) {
        if (!mergedTopology.ast.nodes.has(exportedName)) {
          throw new Error(
            `Cannot export '${exportedName}' from '${state.modulePath}' because no such topology node exists after import resolution.`
          );
        }
      }

      return {
        ...state,
        parsed,
        localTopology,
        mergedTopology,
        exportNames: exports,
      } satisfies ModuleLoaderState;
    });

    registry.register('ModuleAssembleModule', async (payload) => {
      const state = requireModuleLoaderState(payload);
      const format =
        state.format ?? detectModuleFormat(state.modulePath, state.source);
      const parsed = state.parsed ?? parseMGG(state.source);
      const localTopology =
        state.localTopology ?? compileTopology(parsed.topologySource);
      const mergedTopology =
        state.mergedTopology ??
        mergeTopologies(localTopology, state.resolvedImports ?? []);
      const mergedSource = renderGraphAst(mergedTopology.ast);

      return {
        id: state.modulePath,
        format,
        source: state.source,
        topologySource: parsed.topologySource,
        mergedSource,
        ast: mergedTopology.ast,
        b1: mergedTopology.b1,
        effects: summarizeModuleEffects(mergedSource),
        exports:
          state.exportNames && state.exportNames.length > 0
            ? state.exportNames
            : sortStrings(localTopology.ast.nodes.keys()),
        imports: state.resolvedImports ?? [],
      } satisfies LoadedGnosisModule;
    });
  }
}
