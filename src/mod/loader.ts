import { parseGgProgram } from '@affectively/aeon-logic';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BettyCompiler,
  type ASTEdge,
  type ASTNode,
  type GraphAST,
} from '../betty/compiler.js';
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
  return async (
    specifier: string,
    fromModule: string
  ): Promise<ResolveResult> => {
    if (
      !specifier.startsWith('.') &&
      !specifier.startsWith('/') &&
      !specifier.startsWith('file:')
    ) {
      return {
        resolved: false,
        error: `Bare module specifier '${specifier}' is not supported yet.`,
      };
    }

    const baseDir =
      fromModule.length > 0 ? path.dirname(fromModule) : path.resolve(rootDir);
    const candidateBase = specifier.startsWith('file:')
      ? new URL(specifier).pathname
      : path.isAbsolute(specifier)
      ? specifier
      : path.resolve(baseDir, specifier);

    const hasExtension = path.extname(candidateBase).length > 0;
    const candidates = hasExtension
      ? [candidateBase]
      : [`${candidateBase}.mgg`, `${candidateBase}.gg`, candidateBase];

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
          const message =
            error instanceof Error ? error.message : String(error);
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
        `Failed to resolve module '${modulePath}': ${resolvedTopLevel.error}`
      );
    }

    return this.loadResolved(resolvedTopLevel.path, resolvedTopLevel.source);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async loadResolved(
    modulePath: string,
    source: string
  ): Promise<LoadedGnosisModule> {
    const cached = this.cache.get(modulePath);
    if (cached) {
      return cached;
    }

    const inFlight = this.loading.get(modulePath);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.loadByFormat(modulePath, source);
    this.loading.set(modulePath, promise);

    try {
      const loadedModule = await promise;
      this.cache.set(modulePath, loadedModule);
      return loadedModule;
    } finally {
      this.loading.delete(modulePath);
    }
  }

  private async loadByFormat(
    modulePath: string,
    source: string
  ): Promise<LoadedGnosisModule> {
    const format = detectModuleFormat(modulePath, source);
    if (format === 'mgg') {
      return this.loadMGG(modulePath, source);
    }

    const compiled = compileTopology(source);
    const exports = sortStrings(compiled.ast.nodes.keys());

    return {
      id: modulePath,
      format: 'gg',
      source,
      topologySource: source,
      mergedSource: source,
      ast: compiled.ast,
      b1: compiled.b1,
      exports,
      imports: [],
    };
  }

  private async loadMGG(
    modulePath: string,
    source: string
  ): Promise<LoadedGnosisModule> {
    const parsed = parseMGG(source);
    const resolvedImports: GnosisResolvedImport[] = [];

    for (const declaration of parsed.imports) {
      const resolved = await this.resolver(declaration.source, modulePath);
      if (!resolved.resolved) {
        throw new Error(
          `Cannot resolve import '${declaration.source}' from '${modulePath}': ${resolved.error}`
        );
      }

      const importedModule = await this.loadResolved(
        resolved.path,
        resolved.source
      );
      for (const name of declaration.names) {
        if (!importedModule.exports.includes(name)) {
          throw new Error(
            `'${name}' is not exported from '${
              declaration.source
            }'. Available exports: ${importedModule.exports.join(', ')}`
          );
        }
      }

      resolvedImports.push({
        declaration,
        module: importedModule,
      });
    }

    const localTopology = compileTopology(parsed.topologySource);
    const mergedTopology = mergeTopologies(localTopology, resolvedImports);
    const explicitExports = parsed.exports.flatMap(
      (declaration) => declaration.names
    );
    const exports =
      explicitExports.length > 0
        ? sortStrings(explicitExports)
        : sortStrings(localTopology.ast.nodes.keys());

    for (const exportedName of exports) {
      if (!mergedTopology.ast.nodes.has(exportedName)) {
        throw new Error(
          `Cannot export '${exportedName}' from '${modulePath}' because no such topology node exists after import resolution.`
        );
      }
    }

    return {
      id: modulePath,
      format: 'mgg',
      source,
      topologySource: parsed.topologySource,
      mergedSource: renderGraphAst(mergedTopology.ast),
      ast: mergedTopology.ast,
      b1: mergedTopology.b1,
      exports,
      imports: resolvedImports,
    };
  }
}
