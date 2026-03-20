import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type * as TsTypes from 'typescript';
import { type ASTEdge, type ASTNode, type GraphAST } from './betty/compiler.js';
import {
  GnosisEngine,
  type GnosisEngineExecutionResult,
  type GnosisEngineExecuteOptions,
  type GnosisEngineOptions,
} from './runtime/engine.js';
import {
  GnosisRegistry,
  type GnosisHandlerContext,
} from './runtime/registry.js';

type TypeScriptModule = typeof import('typescript');

const runtimeRequire =
  typeof __filename === 'string'
    ? createRequire(__filename)
    : createRequire(import.meta.url);
let cachedTypeScriptModule: TypeScriptModule | undefined;

function loadTypeScriptModule(): TypeScriptModule {
  if (cachedTypeScriptModule === undefined) {
    cachedTypeScriptModule = runtimeRequire('typescript') as TypeScriptModule;
  }

  return cachedTypeScriptModule;
}

const ts = new Proxy({} as TypeScriptModule, {
  get(_target, property, receiver) {
    return Reflect.get(loadTypeScriptModule(), property, receiver);
  },
}) as TypeScriptModule;

declare namespace ts {
  type ArrayBindingPattern = TsTypes.ArrayBindingPattern;
  type ArrowFunction = TsTypes.ArrowFunction;
  type BindingName = TsTypes.BindingName;
  type CallExpression = TsTypes.CallExpression;
  type Expression = TsTypes.Expression;
  type FunctionBody = TsTypes.FunctionBody;
  type FunctionDeclaration = TsTypes.FunctionDeclaration;
  type FunctionExpression = TsTypes.FunctionExpression;
  type Identifier = TsTypes.Identifier;
  type ImportDeclaration = TsTypes.ImportDeclaration;
  type JsxEmit = TsTypes.JsxEmit;
  type ModuleKind = TsTypes.ModuleKind;
  type ModuleResolutionKind = TsTypes.ModuleResolutionKind;
  type Node = TsTypes.Node;
  type ReturnStatement = TsTypes.ReturnStatement;
  type ScriptKind = TsTypes.ScriptKind;
  type ScriptTarget = TsTypes.ScriptTarget;
  type SourceFile = TsTypes.SourceFile;
  type Statement = TsTypes.Statement;
  type StringLiteralLike = TsTypes.StringLiteralLike;
  type SyntaxKind = TsTypes.SyntaxKind;
  type VariableDeclaration = TsTypes.VariableDeclaration;
}

type SupportedFunctionNode =
  | (ts.FunctionDeclaration & { body: ts.FunctionBody })
  | ts.FunctionExpression
  | ts.ArrowFunction;

type BridgeLiteral = string | number | boolean | null | undefined;

export interface GnosisTypeScriptBridgeOptions {
  readonly exportName?: string;
  readonly sourceFilePath?: string;
}

export interface GnosisTypeScriptBridgeErrorLocation {
  readonly line: number;
  readonly column: number;
}

export interface GnosisTypeScriptBridgeSourceLocation {
  readonly line: number;
  readonly column: number;
  readonly endLine?: number;
  readonly endColumn?: number;
}

export class GnosisTypeScriptBridgeError extends Error {
  public readonly location: GnosisTypeScriptBridgeErrorLocation;
  public readonly sourceFilePath: string;

  constructor(
    message: string,
    sourceFilePath: string,
    location: GnosisTypeScriptBridgeErrorLocation
  ) {
    super(`${message} (${sourceFilePath}:${location.line}:${location.column})`);
    this.name = 'GnosisTypeScriptBridgeError';
    this.sourceFilePath = sourceFilePath;
    this.location = location;
  }
}

export type GnosisTypeScriptBridgeExpression =
  | { readonly kind: 'input' }
  | { readonly kind: 'binding'; readonly name: string }
  | { readonly kind: 'literal'; readonly value: BridgeLiteral }
  | {
      readonly kind: 'member';
      readonly target: GnosisTypeScriptBridgeExpression;
      readonly property: string;
    }
  | {
      readonly kind: 'index';
      readonly target: GnosisTypeScriptBridgeExpression;
      readonly index: string | number;
    }
  | {
      readonly kind: 'array';
      readonly items: readonly GnosisTypeScriptBridgeExpression[];
    }
  | {
      readonly kind: 'object';
      readonly entries: readonly {
        readonly key: string;
        readonly value: GnosisTypeScriptBridgeExpression;
      }[];
    };

interface GnosisTypeScriptBridgeEntryPlan {
  readonly kind: 'entry';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeEntry';
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

interface GnosisTypeScriptBridgeAssignPlan {
  readonly kind: 'assign';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeAssign';
  readonly bindingName: string;
  readonly expression: GnosisTypeScriptBridgeExpression;
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

interface GnosisTypeScriptBridgeCallPlan {
  readonly kind: 'call';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeCall';
  readonly calleeName: string;
  readonly args: readonly GnosisTypeScriptBridgeExpression[];
  readonly assignTo: string | null;
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

interface GnosisTypeScriptBridgeJoinPlan {
  readonly kind: 'join';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeJoin';
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

interface GnosisTypeScriptBridgeReturnPlan {
  readonly kind: 'return';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeReturn';
  readonly expression: GnosisTypeScriptBridgeExpression;
  readonly sourceLocation?: GnosisTypeScriptBridgeSourceLocation;
}

export type GnosisTypeScriptBridgeNodePlan =
  | GnosisTypeScriptBridgeEntryPlan
  | GnosisTypeScriptBridgeAssignPlan
  | GnosisTypeScriptBridgeCallPlan
  | GnosisTypeScriptBridgeJoinPlan
  | GnosisTypeScriptBridgeReturnPlan;

type GnosisTypeScriptBridgeHandlerLabel =
  GnosisTypeScriptBridgeNodePlan['handlerLabel'];

interface GnosisTypeScriptBridgeParallelOperation {
  readonly kind: 'parallel';
  readonly branches: readonly GnosisTypeScriptBridgeCallPlan[];
  readonly joinPlan: GnosisTypeScriptBridgeJoinPlan;
}

type GnosisTypeScriptBridgeOperation =
  | { readonly kind: 'assign'; readonly plan: GnosisTypeScriptBridgeAssignPlan }
  | { readonly kind: 'call'; readonly plan: GnosisTypeScriptBridgeCallPlan }
  | { readonly kind: 'return'; readonly plan: GnosisTypeScriptBridgeReturnPlan }
  | GnosisTypeScriptBridgeParallelOperation;

export interface GnosisTypeScriptBridgeWave {
  readonly index: number;
  readonly kind: 'linear' | 'parallel' | 'collapse';
  readonly nodeIds: readonly string[];
}

export interface GnosisTypeScriptBridgeResult {
  readonly exportName: string;
  readonly entryNodeId: string;
  readonly sourceFilePath: string;
  readonly ggSource: string;
  readonly topologySource: string;
  readonly ast: GraphAST;
  readonly nodePlans: readonly GnosisTypeScriptBridgeNodePlan[];
  readonly schedule: readonly GnosisTypeScriptBridgeWave[];
  readonly runtimeBindingNames: readonly string[];
  readonly runtimeModuleSource: string | null;
}

export interface SerializedGraphAST {
  readonly nodes: readonly ASTNode[];
  readonly edges: readonly ASTEdge[];
}

export interface SerializedGnosisTypeScriptBridgeResult
  extends Omit<GnosisTypeScriptBridgeResult, 'ast'> {
  readonly ast: SerializedGraphAST;
}

export interface GnosisTypeScriptBridgeRuntimeModule {
  readonly bindingNames: readonly string[];
  readonly moduleSource: string;
}

export interface TranspiledGnosisTypeScriptBridgeRuntimeModule
  extends GnosisTypeScriptBridgeRuntimeModule {
  readonly javascriptSource: string;
}

export interface GnosisTypeScriptBridgeRuntimeModuleOptions {
  readonly specifierStyle?: 'relative' | 'absolute-url';
}

export type GnosisTypeScriptBridgeBinding = (
  ...args: readonly unknown[]
) => unknown | Promise<unknown>;

export interface GnosisTypeScriptBridgeBindings {
  readonly [name: string]: unknown;
}

export interface ExecuteTypeScriptWithGnosisOptions {
  readonly compiled?: GnosisTypeScriptBridgeResult;
  readonly sourceText?: string;
  readonly sourceFilePath?: string;
  readonly exportName?: string;
  readonly modulePath?: string;
  readonly runtimeModulePath?: string;
  readonly moduleExports?: GnosisTypeScriptBridgeBindings;
  readonly bindings?: GnosisTypeScriptBridgeBindings;
  readonly input?: unknown;
  readonly registry?: GnosisRegistry;
  readonly engineOptions?: GnosisEngineOptions;
  readonly executeOptions?: GnosisEngineExecuteOptions;
}

interface BridgeState {
  readonly input: unknown;
  readonly locals: Record<string, unknown>;
  readonly lastValue?: unknown;
}

interface FunctionRecord {
  readonly localName: string;
  readonly node: SupportedFunctionNode;
}

interface CompileState {
  readonly sourceFile: ts.SourceFile;
  readonly sourceFilePath: string;
  readonly inputParameterName: string | null;
  readonly prefix: string;
  readonly knownBindings: Set<string>;
  readonly operations: GnosisTypeScriptBridgeOperation[];
  readonly nodePlans: GnosisTypeScriptBridgeNodePlan[];
  nextId: number;
  tempId: number;
}

const DEFAULT_SOURCE_FILE_PATH = 'inline-bridge-input.ts';

function sanitizeIdentifier(rawValue: string): string {
  const normalized = rawValue
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  if (normalized.length === 0) {
    return 'ts_bridge';
  }

  if (/^[A-Za-z_]/.test(normalized)) {
    return normalized;
  }

  return `n_${normalized}`;
}

function createSourceFile(
  sourceText: string,
  sourceFilePath: string
): ts.SourceFile {
  const scriptKind = sourceFilePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : sourceFilePath.endsWith('.jsx')
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.TS;

  return ts.createSourceFile(
    sourceFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
}

const RELATIVE_MODULE_FILE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
] as const;

function isRelativeModuleSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function splitModuleSpecifierSuffix(specifier: string): {
  readonly bare: string;
  readonly suffix: string;
} {
  const suffixStart = specifier.search(/[?#]/u);
  return suffixStart === -1
    ? { bare: specifier, suffix: '' }
    : {
        bare: specifier.slice(0, suffixStart),
        suffix: specifier.slice(suffixStart),
      };
}

function hasExplicitModuleExtension(specifier: string): boolean {
  const { bare } = splitModuleSpecifierSuffix(specifier);
  return RELATIVE_MODULE_FILE_EXTENSIONS.some((extension) =>
    bare.endsWith(extension)
  );
}

function resolveExplicitRelativeModuleCandidates(
  bareSpecifier: string
): readonly string[] {
  const extension = path.extname(bareSpecifier);
  if (extension.length === 0) {
    return [bareSpecifier];
  }

  const extensionlessSpecifier = bareSpecifier.slice(0, -extension.length);
  switch (extension) {
    case '.js':
      return [
        bareSpecifier,
        `${extensionlessSpecifier}.ts`,
        `${extensionlessSpecifier}.tsx`,
        `${extensionlessSpecifier}.mts`,
        `${extensionlessSpecifier}.cts`,
        `${extensionlessSpecifier}.jsx`,
        `${extensionlessSpecifier}.mjs`,
        `${extensionlessSpecifier}.cjs`,
      ];
    case '.jsx':
      return [
        bareSpecifier,
        `${extensionlessSpecifier}.tsx`,
        `${extensionlessSpecifier}.ts`,
        `${extensionlessSpecifier}.js`,
      ];
    case '.mjs':
      return [
        bareSpecifier,
        `${extensionlessSpecifier}.mts`,
        `${extensionlessSpecifier}.ts`,
        `${extensionlessSpecifier}.js`,
      ];
    case '.cjs':
      return [
        bareSpecifier,
        `${extensionlessSpecifier}.cts`,
        `${extensionlessSpecifier}.ts`,
        `${extensionlessSpecifier}.js`,
      ];
    default:
      return [bareSpecifier];
  }
}

function tryResolveRelativeModuleSpecifier(
  specifier: string,
  sourceFilePath: string,
  specifierStyle: 'relative' | 'absolute-url' = 'relative'
): string {
  if (!isRelativeModuleSpecifier(specifier)) {
    return specifier;
  }

  const { bare, suffix } = splitModuleSpecifierSuffix(specifier);
  const sourceDirectory = path.dirname(path.resolve(sourceFilePath));
  const candidatePaths = hasExplicitModuleExtension(specifier)
    ? resolveExplicitRelativeModuleCandidates(bare).map((candidateBare) =>
        path.resolve(sourceDirectory, candidateBare)
      )
    : RELATIVE_MODULE_FILE_EXTENSIONS.flatMap((extension) => {
        const absoluteBasePath = path.resolve(sourceDirectory, bare);
        return [
          `${absoluteBasePath}${extension}`,
          path.join(absoluteBasePath, `index${extension}`),
        ];
      });

  if (specifierStyle === 'relative' && hasExplicitModuleExtension(specifier)) {
    return specifier;
  }

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    if (specifierStyle === 'absolute-url') {
      return `${pathToFileURL(candidatePath).href}${suffix}`;
    }

    const relativePath = path.relative(sourceDirectory, candidatePath);
    const normalizedRelativePath = relativePath.replace(/\\/gu, '/');
    const resolvedSpecifier = normalizedRelativePath.startsWith('.')
      ? normalizedRelativePath
      : `./${normalizedRelativePath}`;
    return `${resolvedSpecifier}${suffix}`;
  }

  return specifier;
}

function collectModuleSpecifierNodes(
  sourceFile: ts.SourceFile
): readonly ts.StringLiteralLike[] {
  const nodes: ts.StringLiteralLike[] = [];

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      nodes.push(node.moduleSpecifier);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [firstArgument] = node.arguments;
      if (firstArgument && ts.isStringLiteralLike(firstArgument)) {
        nodes.push(firstArgument);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return nodes;
}

function rewriteRelativeImportSpecifiers(
  sourceText: string,
  sourceFilePath: string,
  specifierStyle: 'relative' | 'absolute-url' = 'relative'
): string {
  const sourceFile = createSourceFile(sourceText, sourceFilePath);
  const replacements = collectModuleSpecifierNodes(sourceFile)
    .map((node) => {
      const resolvedSpecifier = tryResolveRelativeModuleSpecifier(
        node.text,
        sourceFilePath,
        specifierStyle
      );
      if (resolvedSpecifier === node.text) {
        return null;
      }

      return {
        start: node.getStart(sourceFile),
        end: node.end,
        text: JSON.stringify(resolvedSpecifier),
      };
    })
    .filter(
      (
        replacement
      ): replacement is {
        readonly start: number;
        readonly end: number;
        readonly text: string;
      } => replacement !== null
    )
    .sort((left, right) => right.start - left.start);

  let rewrittenSource = sourceText;
  for (const replacement of replacements) {
    rewrittenSource =
      rewrittenSource.slice(0, replacement.start) +
      replacement.text +
      rewrittenSource.slice(replacement.end);
  }

  return rewrittenSource;
}

function hasModifier(node: ts.Node, modifierKind: ts.SyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }

  return (
    ts.getModifiers(node)?.some((modifier) => modifier.kind === modifierKind) ??
    false
  );
}

function getNodeLocation(
  sourceFile: ts.SourceFile,
  node: ts.Node
): GnosisTypeScriptBridgeErrorLocation {
  const position = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile)
  );
  return {
    line: position.line + 1,
    column: position.character + 1,
  };
}

function getNodeSourceLocation(
  sourceFile: ts.SourceFile,
  node: ts.Node
): GnosisTypeScriptBridgeSourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile)
  );
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    line: start.line + 1,
    column: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  };
}

function throwBridgeError(
  sourceFile: ts.SourceFile,
  sourceFilePath: string,
  node: ts.Node,
  message: string
): never {
  throw new GnosisTypeScriptBridgeError(
    message,
    sourceFilePath,
    getNodeLocation(sourceFile, node)
  );
}

function unwrapAwait(expression: ts.Expression): ts.Expression {
  return ts.isAwaitExpression(expression) ? expression.expression : expression;
}

function isPromiseAllCall(
  expression: ts.Expression
): expression is ts.CallExpression {
  if (!ts.isCallExpression(expression)) {
    return false;
  }

  const callee = expression.expression;
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'Promise' &&
    callee.name.text === 'all' &&
    expression.arguments.length === 1 &&
    ts.isArrayLiteralExpression(expression.arguments[0])
  );
}

function createNodeId(state: CompileState, kind: string, hint: string): string {
  const nodeId = `${state.prefix}_${kind}_${String(state.nextId).padStart(
    2,
    '0'
  )}_${sanitizeIdentifier(hint)}`;
  state.nextId += 1;
  return nodeId;
}

function createTempBinding(state: CompileState, hint: string): string {
  const bindingName = `__bridge_tmp_${sanitizeIdentifier(hint)}_${
    state.tempId
  }`;
  state.tempId += 1;
  state.knownBindings.add(bindingName);
  return bindingName;
}

function getFunctionBodyStatements(
  node: SupportedFunctionNode
): readonly ts.Statement[] {
  if (ts.isBlock(node.body)) {
    return node.body.statements;
  }

  return [ts.factory.createReturnStatement(node.body)];
}

function collectFunctions(sourceFile: ts.SourceFile): {
  readonly functionsByLocalName: ReadonlyMap<string, FunctionRecord>;
  readonly exportsByName: ReadonlyMap<string, string>;
} {
  const functionsByLocalName = new Map<string, FunctionRecord>();
  const exportsByName = new Map<string, string>();

  let anonymousDefaultCount = 0;

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      if (!statement.body) {
        continue;
      }
      const functionDeclaration = statement as ts.FunctionDeclaration & {
        body: ts.FunctionBody;
      };
      const localName =
        functionDeclaration.name?.text ??
        `__default_export_${String(anonymousDefaultCount++)}`;
      functionsByLocalName.set(localName, {
        localName,
        node: functionDeclaration,
      });

      if (hasModifier(functionDeclaration, ts.SyntaxKind.ExportKeyword)) {
        if (
          functionDeclaration.name &&
          !hasModifier(functionDeclaration, ts.SyntaxKind.DefaultKeyword)
        ) {
          exportsByName.set(functionDeclaration.name.text, localName);
        }

        if (hasModifier(functionDeclaration, ts.SyntaxKind.DefaultKeyword)) {
          exportsByName.set('default', localName);
        }
      }
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const isExported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }

        if (
          !ts.isArrowFunction(declaration.initializer) &&
          !ts.isFunctionExpression(declaration.initializer)
        ) {
          continue;
        }

        functionsByLocalName.set(declaration.name.text, {
          localName: declaration.name.text,
          node: declaration.initializer,
        });

        if (isExported) {
          exportsByName.set(declaration.name.text, declaration.name.text);
        }
      }
      continue;
    }

    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        const exportName = element.name.text;
        const localName = element.propertyName?.text ?? exportName;
        exportsByName.set(exportName, localName);
      }
      continue;
    }

    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      if (ts.isIdentifier(statement.expression)) {
        exportsByName.set('default', statement.expression.text);
        continue;
      }

      if (
        ts.isArrowFunction(statement.expression) ||
        ts.isFunctionExpression(statement.expression)
      ) {
        const localName = `__default_export_${String(anonymousDefaultCount++)}`;
        functionsByLocalName.set(localName, {
          localName,
          node: statement.expression,
        });
        exportsByName.set('default', localName);
      }
    }
  }

  return {
    functionsByLocalName,
    exportsByName,
  };
}

function collectImportBindingNames(
  statement: ts.ImportDeclaration
): readonly string[] {
  if (!statement.importClause) {
    return [];
  }

  const names: string[] = [];
  if (statement.importClause.name) {
    names.push(statement.importClause.name.text);
  }

  const namedBindings = statement.importClause.namedBindings;
  if (!namedBindings) {
    return names;
  }

  if (ts.isNamedImports(namedBindings)) {
    for (const element of namedBindings.elements) {
      names.push(element.name.text);
    }
    return names;
  }

  names.push(namedBindings.name.text);
  return names;
}

function collectTopLevelRuntimeStatements(sourceFile: ts.SourceFile): {
  readonly functionStatementsByName: ReadonlyMap<string, ts.Statement>;
  readonly importStatementsByName: ReadonlyMap<string, ts.ImportDeclaration>;
  readonly topLevelBindingNames: ReadonlySet<string>;
} {
  const functionStatementsByName = new Map<string, ts.Statement>();
  const importStatementsByName = new Map<string, ts.ImportDeclaration>();
  const topLevelBindingNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      for (const bindingName of collectImportBindingNames(statement)) {
        topLevelBindingNames.add(bindingName);
        importStatementsByName.set(bindingName, statement);
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      topLevelBindingNames.add(statement.name.text);
      functionStatementsByName.set(statement.name.text, statement);
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) {
        continue;
      }

      topLevelBindingNames.add(declaration.name.text);

      if (
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        functionStatementsByName.set(declaration.name.text, statement);
      }
    }
  }

  return {
    functionStatementsByName,
    importStatementsByName,
    topLevelBindingNames,
  };
}

function collectDirectTopLevelReferences(
  statement: ts.Statement,
  topLevelBindingNames: ReadonlySet<string>
): readonly string[] {
  const references = new Set<string>();
  const scopeStack: Set<string>[] = [new Set<string>()];

  const declareBindingName = (name: ts.BindingName): void => {
    if (ts.isIdentifier(name)) {
      scopeStack[scopeStack.length - 1]?.add(name.text);
      return;
    }

    for (const element of name.elements) {
      if (!ts.isBindingElement(element)) {
        continue;
      }
      declareBindingName(element.name);
    }
  };

  const isScoped = (name: string): boolean =>
    scopeStack.some((scope) => scope.has(name));

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      return;
    }

    if (ts.isFunctionDeclaration(node)) {
      if (node.name) {
        scopeStack[scopeStack.length - 1]?.add(node.name.text);
      }

      if (node !== statement) {
        const scope = new Set<string>();
        if (node.name) {
          scope.add(node.name.text);
        }
        for (const parameter of node.parameters) {
          declareBindingName(parameter.name);
          if (ts.isIdentifier(parameter.name)) {
            scope.add(parameter.name.text);
          }
        }
        scopeStack.push(scope);
        if (node.body) {
          ts.forEachChild(node.body, visit);
        }
        scopeStack.pop();
        return;
      }
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const scope = new Set<string>();
      if (ts.isFunctionExpression(node) && node.name) {
        scope.add(node.name.text);
      }
      scopeStack.push(scope);
      for (const parameter of node.parameters) {
        declareBindingName(parameter.name);
        if (ts.isIdentifier(parameter.name)) {
          scope.add(parameter.name.text);
        }
      }
      ts.forEachChild(node.body, visit);
      scopeStack.pop();
      return;
    }

    if (ts.isVariableDeclaration(node)) {
      declareBindingName(node.name);
      if (node.initializer) {
        visit(node.initializer);
      }
      return;
    }

    if (ts.isParameter(node)) {
      declareBindingName(node.name);
      if (node.initializer) {
        visit(node.initializer);
      }
      return;
    }

    if (ts.isIdentifier(node)) {
      if (topLevelBindingNames.has(node.text) && !isScoped(node.text)) {
        references.add(node.text);
      }
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(statement);
  return [...references].sort((left, right) => left.localeCompare(right));
}

function collectRuntimeBindingNames(
  sourceFile: ts.SourceFile,
  operations?: readonly GnosisTypeScriptBridgeOperation[]
): readonly string[] {
  if (!operations) {
    return normalizeRuntimeBindingNames([
      ...collectTopLevelRuntimeStatements(sourceFile).topLevelBindingNames,
    ]);
  }

  const runtimeStatements = collectTopLevelRuntimeStatements(sourceFile);
  const resolved = new Set<string>();
  const queue: string[] = [];

  for (const operation of operations) {
    if (operation.kind === 'parallel') {
      for (const branch of operation.branches) {
        queue.push(branch.calleeName);
      }
      continue;
    }

    if (operation.kind === 'call') {
      queue.push(operation.plan.calleeName);
    }
  }

  while (queue.length > 0) {
    const bindingName = queue.shift();
    if (!bindingName || resolved.has(bindingName)) {
      continue;
    }

    resolved.add(bindingName);

    const statement =
      runtimeStatements.functionStatementsByName.get(bindingName);
    if (!statement) {
      continue;
    }

    for (const dependencyName of collectDirectTopLevelReferences(
      statement,
      runtimeStatements.topLevelBindingNames
    )) {
      if (!resolved.has(dependencyName)) {
        queue.push(dependencyName);
      }
    }
  }

  return normalizeRuntimeBindingNames([...resolved]);
}

function normalizeRuntimeBindingNames(
  names: readonly string[]
): readonly string[] {
  return [...new Set(names)].sort((left, right) => left.localeCompare(right));
}

function serializeGraphAst(ast: GraphAST): SerializedGraphAST {
  return {
    nodes: [...ast.nodes.values()].map((node) => ({
      id: node.id,
      labels: [...node.labels],
      properties: { ...node.properties },
    })),
    edges: ast.edges.map((edge) => ({
      sourceIds: [...edge.sourceIds],
      targetIds: [...edge.targetIds],
      type: edge.type,
      properties: { ...edge.properties },
    })),
  };
}

function deserializeGraphAst(ast: SerializedGraphAST): GraphAST {
  return {
    nodes: new Map(
      ast.nodes.map((node) => [
        node.id,
        {
          id: node.id,
          labels: [...node.labels],
          properties: { ...node.properties },
        },
      ])
    ),
    edges: ast.edges.map((edge) => ({
      sourceIds: [...edge.sourceIds],
      targetIds: [...edge.targetIds],
      type: edge.type,
      properties: { ...edge.properties },
    })),
  };
}

function jsxEmitForPath(sourceFilePath: string): ts.JsxEmit {
  if (sourceFilePath.endsWith('.tsx') || sourceFilePath.endsWith('.jsx')) {
    return ts.JsxEmit.ReactJSX;
  }

  return ts.JsxEmit.Preserve;
}

function renderTypeScriptBridgeRuntimeModuleFromSourceFile(
  sourceText: string,
  sourceFilePath: string,
  sourceFile: ts.SourceFile,
  runtimeBindingNames?: readonly string[],
  options: GnosisTypeScriptBridgeRuntimeModuleOptions = {}
): GnosisTypeScriptBridgeRuntimeModule {
  const absoluteSourcePath = path.resolve(sourceFilePath);
  const bindingNames = normalizeRuntimeBindingNames(
    runtimeBindingNames ?? collectRuntimeBindingNames(sourceFile)
  );

  if (bindingNames.length === 0) {
    return {
      bindingNames,
      moduleSource: rewriteRelativeImportSpecifiers(
        sourceText,
        absoluteSourcePath,
        options.specifierStyle ?? 'relative'
      ),
    };
  }

  const runtimeStatements = collectTopLevelRuntimeStatements(sourceFile);
  const selectedStatements = sourceFile.statements
    .filter((statement) => {
      if (ts.isImportDeclaration(statement)) {
        return collectImportBindingNames(statement).some((bindingName) =>
          bindingNames.includes(bindingName)
        );
      }

      if (ts.isFunctionDeclaration(statement) && statement.name) {
        return bindingNames.includes(statement.name.text);
      }

      if (ts.isVariableStatement(statement)) {
        return statement.declarationList.declarations.some(
          (declaration) =>
            ts.isIdentifier(declaration.name) &&
            bindingNames.includes(declaration.name.text)
        );
      }

      return false;
    })
    .map((statement) =>
      sourceText.slice(statement.getFullStart(), statement.end)
    )
    .join('\n');
  const rewrittenSelectedStatements =
    selectedStatements.trim().length === 0
      ? ''
      : rewriteRelativeImportSpecifiers(
          selectedStatements,
          absoluteSourcePath,
          options.specifierStyle ?? 'relative'
        );

  const moduleBody =
    rewrittenSelectedStatements.trim().length > 0
      ? `${rewrittenSelectedStatements}\n\n`
      : '';
  const bindingLiteral = bindingNames
    .map((bindingName) => `  ${JSON.stringify(bindingName)}: ${bindingName},`)
    .join('\n');

  return {
    bindingNames,
    moduleSource: `${moduleBody}export const __gnode_bridge_runtime_bindings = {\n${bindingLiteral}\n};\n`,
  };
}

export function renderTypeScriptBridgeRuntimeModule(
  sourceText: string,
  sourceFilePath: string,
  runtimeBindingNames?: readonly string[],
  options: GnosisTypeScriptBridgeRuntimeModuleOptions = {}
): GnosisTypeScriptBridgeRuntimeModule {
  const absoluteSourcePath = path.resolve(sourceFilePath);
  return renderTypeScriptBridgeRuntimeModuleFromSourceFile(
    sourceText,
    absoluteSourcePath,
    createSourceFile(sourceText, absoluteSourcePath),
    runtimeBindingNames,
    options
  );
}

export function transpileTypeScriptBridgeRuntimeModule(
  sourceText: string,
  sourceFilePath: string,
  runtimeBindingNames?: readonly string[],
  options: GnosisTypeScriptBridgeRuntimeModuleOptions = {}
): TranspiledGnosisTypeScriptBridgeRuntimeModule {
  const rendered = renderTypeScriptBridgeRuntimeModule(
    sourceText,
    sourceFilePath,
    runtimeBindingNames,
    options
  );

  if (rendered.bindingNames.length === 0) {
    return {
      ...rendered,
      javascriptSource: '',
    };
  }

  const transpiled = ts.transpileModule(rendered.moduleSource, {
    fileName: path.resolve(sourceFilePath),
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: jsxEmitForPath(sourceFilePath),
      esModuleInterop: true,
      verbatimModuleSyntax: true,
    },
  });

  return {
    ...rendered,
    javascriptSource: transpiled.outputText,
  };
}

export function serializeTypeScriptBridgeResult(
  compiled: GnosisTypeScriptBridgeResult
): SerializedGnosisTypeScriptBridgeResult {
  return {
    ...compiled,
    runtimeBindingNames: [...compiled.runtimeBindingNames],
    ast: serializeGraphAst(compiled.ast),
  };
}

export function deserializeTypeScriptBridgeResult(
  serialized: SerializedGnosisTypeScriptBridgeResult
): GnosisTypeScriptBridgeResult {
  return {
    ...serialized,
    runtimeBindingNames: [...serialized.runtimeBindingNames],
    runtimeModuleSource: serialized.runtimeModuleSource ?? null,
    ast: deserializeGraphAst(serialized.ast),
  };
}

function selectEntrypoint(
  functionsByLocalName: ReadonlyMap<string, FunctionRecord>,
  exportsByName: ReadonlyMap<string, string>,
  sourceFile: ts.SourceFile,
  options: GnosisTypeScriptBridgeOptions
): { readonly exportName: string; readonly record: FunctionRecord } {
  const preferredExportNames: readonly string[] = options.exportName
    ? [options.exportName]
    : exportsByName.has('default')
    ? ['default']
    : ['app', 'main', 'handler'];

  for (const exportName of preferredExportNames) {
    const localName = exportsByName.get(exportName);
    if (!localName) {
      continue;
    }
    const record = functionsByLocalName.get(localName);
    if (record) {
      return { exportName, record };
    }
  }

  for (const [exportName, localName] of exportsByName) {
    const record = functionsByLocalName.get(localName);
    if (record) {
      return { exportName, record };
    }
  }

  throwBridgeError(
    sourceFile,
    options.sourceFilePath ?? DEFAULT_SOURCE_FILE_PATH,
    sourceFile,
    options.exportName
      ? `Could not find exported function '${options.exportName}'`
      : 'Could not find an exported function to bridge'
  );
}

function resolveExpression(
  expression: ts.Expression,
  state: CompileState
): GnosisTypeScriptBridgeExpression {
  if (ts.isIdentifier(expression)) {
    if (expression.text === 'undefined') {
      return {
        kind: 'literal',
        value: undefined,
      };
    }

    if (
      state.inputParameterName &&
      expression.text === state.inputParameterName
    ) {
      return { kind: 'input' };
    }

    if (state.knownBindings.has(expression.text)) {
      return { kind: 'binding', name: expression.text };
    }

    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      expression,
      `Unsupported identifier reference '${expression.text}'`
    );
  }

  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return {
      kind: 'literal',
      value: expression.text,
    };
  }

  if (ts.isNumericLiteral(expression)) {
    return {
      kind: 'literal',
      value: Number(expression.text),
    };
  }

  if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return {
      kind: 'literal',
      value: expression.kind === ts.SyntaxKind.TrueKeyword,
    };
  }

  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return {
      kind: 'literal',
      value: null,
    };
  }

  if (expression.kind === ts.SyntaxKind.UndefinedKeyword) {
    return {
      kind: 'literal',
      value: undefined,
    };
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return {
      kind: 'member',
      target: resolveExpression(expression.expression, state),
      property: expression.name.text,
    };
  }

  if (ts.isElementAccessExpression(expression)) {
    const argumentExpression = expression.argumentExpression;
    if (
      !argumentExpression ||
      (!ts.isStringLiteral(argumentExpression) &&
        !ts.isNumericLiteral(argumentExpression))
    ) {
      throwBridgeError(
        state.sourceFile,
        state.sourceFilePath,
        expression,
        'Unsupported element access expression'
      );
    }

    return {
      kind: 'index',
      target: resolveExpression(expression.expression, state),
      index: ts.isStringLiteral(argumentExpression)
        ? argumentExpression.text
        : Number(argumentExpression.text),
    };
  }

  if (ts.isArrayLiteralExpression(expression)) {
    return {
      kind: 'array',
      items: expression.elements.map((element) => {
        if (ts.isSpreadElement(element)) {
          throwBridgeError(
            state.sourceFile,
            state.sourceFilePath,
            element,
            'Unsupported array spread in bridge expression'
          );
        }
        return resolveExpression(element, state);
      }),
    };
  }

  if (ts.isObjectLiteralExpression(expression)) {
    return {
      kind: 'object',
      entries: expression.properties.map((property) => {
        if (ts.isShorthandPropertyAssignment(property)) {
          return {
            key: property.name.text,
            value: resolveExpression(property.name, state),
          };
        }

        if (ts.isPropertyAssignment(property)) {
          const propertyName = property.name.getText(state.sourceFile);
          if (
            ts.isComputedPropertyName(property.name) ||
            propertyName.length === 0
          ) {
            throwBridgeError(
              state.sourceFile,
              state.sourceFilePath,
              property,
              'Unsupported computed object key in bridge expression'
            );
          }
          return {
            key: propertyName.replace(/^['"]|['"]$/g, ''),
            value: resolveExpression(property.initializer, state),
          };
        }

        throwBridgeError(
          state.sourceFile,
          state.sourceFilePath,
          property,
          'Unsupported object literal property in bridge expression'
        );
      }),
    };
  }

  if (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(expression.operand)
  ) {
    return {
      kind: 'literal',
      value: -Number(expression.operand.text),
    };
  }

  throwBridgeError(
    state.sourceFile,
    state.sourceFilePath,
    expression,
    `Unsupported TypeScript expression '${expression.getText(
      state.sourceFile
    )}'`
  );
}

function resolveCallPlan(
  expression: ts.Expression,
  state: CompileState,
  assignTo: string | null,
  nodeHint: string
): GnosisTypeScriptBridgeCallPlan {
  const callExpression = unwrapAwait(expression);
  if (!ts.isCallExpression(callExpression)) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      expression,
      'Expected a call expression'
    );
  }

  if (!ts.isIdentifier(callExpression.expression)) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      callExpression.expression,
      'Only identifier call targets are supported in the TS bridge'
    );
  }

  const args = callExpression.arguments.map((argument) => {
    if (ts.isSpreadElement(argument)) {
      throwBridgeError(
        state.sourceFile,
        state.sourceFilePath,
        argument,
        'Unsupported spread argument in bridge call'
      );
    }
    return resolveExpression(argument, state);
  });

  const plan: GnosisTypeScriptBridgeCallPlan = {
    kind: 'call',
    nodeId: createNodeId(state, 'call', nodeHint),
    handlerLabel: 'TsBridgeCall',
    calleeName: callExpression.expression.text,
    args,
    assignTo,
    sourceLocation: getNodeSourceLocation(state.sourceFile, callExpression),
  };
  state.nodePlans.push(plan);
  return plan;
}

function compilePromiseAllOperation(
  bindingName: ts.Identifier | ts.ArrayBindingPattern,
  promiseAllCall: ts.CallExpression,
  state: CompileState
): void {
  const branchArray = promiseAllCall.arguments[0];
  if (!branchArray || !ts.isArrayLiteralExpression(branchArray)) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      promiseAllCall,
      'Promise.all bridge expects an array literal argument'
    );
  }

  const branchExpressions = [...branchArray.elements];
  if (branchExpressions.some((element) => ts.isSpreadElement(element))) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      promiseAllCall,
      'Promise.all bridge does not support spread elements'
    );
  }

  const branchBindingNames: string[] = [];
  if (ts.isArrayBindingPattern(bindingName)) {
    for (const element of bindingName.elements) {
      if (!ts.isBindingElement(element) || !ts.isIdentifier(element.name)) {
        throwBridgeError(
          state.sourceFile,
          state.sourceFilePath,
          bindingName,
          'Promise.all bridge requires a simple identifier array destructure'
        );
      }
      branchBindingNames.push(element.name.text);
      state.knownBindings.add(element.name.text);
    }

    if (branchBindingNames.length !== branchExpressions.length) {
      throwBridgeError(
        state.sourceFile,
        state.sourceFilePath,
        bindingName,
        'Promise.all destructure length does not match the branch count'
      );
    }
  } else {
    for (let index = 0; index < branchExpressions.length; index += 1) {
      branchBindingNames.push(
        createTempBinding(state, `${bindingName.text}_${String(index)}`)
      );
    }
  }

  const branches = branchExpressions.map((branchExpression, index) =>
    resolveCallPlan(
      branchExpression,
      state,
      branchBindingNames[index] ?? null,
      `branch_${String(index)}`
    )
  );

  const joinPlan: GnosisTypeScriptBridgeJoinPlan = {
    kind: 'join',
    nodeId: createNodeId(state, 'join', 'promise_all'),
    handlerLabel: 'TsBridgeJoin',
    sourceLocation: getNodeSourceLocation(state.sourceFile, promiseAllCall),
  };
  state.nodePlans.push(joinPlan);
  state.operations.push({
    kind: 'parallel',
    branches,
    joinPlan,
  });

  if (ts.isIdentifier(bindingName)) {
    const assignPlan: GnosisTypeScriptBridgeAssignPlan = {
      kind: 'assign',
      nodeId: createNodeId(state, 'assign', bindingName.text),
      handlerLabel: 'TsBridgeAssign',
      bindingName: bindingName.text,
      expression: {
        kind: 'array',
        items: branchBindingNames.map((name) => ({
          kind: 'binding',
          name,
        })),
      },
      sourceLocation: getNodeSourceLocation(state.sourceFile, bindingName),
    };
    state.knownBindings.add(bindingName.text);
    state.nodePlans.push(assignPlan);
    state.operations.push({
      kind: 'assign',
      plan: assignPlan,
    });
  }
}

function compileVariableDeclaration(
  declaration: ts.VariableDeclaration,
  state: CompileState
): void {
  if (!declaration.initializer) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      declaration,
      'Bridge variable declarations require an initializer'
    );
  }

  const initializer = unwrapAwait(declaration.initializer);
  if (
    (ts.isIdentifier(declaration.name) ||
      ts.isArrayBindingPattern(declaration.name)) &&
    isPromiseAllCall(initializer)
  ) {
    compilePromiseAllOperation(declaration.name, initializer, state);
    return;
  }

  if (!ts.isIdentifier(declaration.name)) {
    throwBridgeError(
      state.sourceFile,
      state.sourceFilePath,
      declaration.name,
      'Only simple identifier bindings are supported by the TS bridge'
    );
  }

  if (ts.isCallExpression(initializer)) {
    const plan = resolveCallPlan(
      declaration.initializer,
      state,
      declaration.name.text,
      declaration.name.text
    );
    state.knownBindings.add(declaration.name.text);
    state.operations.push({
      kind: 'call',
      plan,
    });
    return;
  }

  const assignPlan: GnosisTypeScriptBridgeAssignPlan = {
    kind: 'assign',
    nodeId: createNodeId(state, 'assign', declaration.name.text),
    handlerLabel: 'TsBridgeAssign',
    bindingName: declaration.name.text,
    expression: resolveExpression(initializer, state),
    sourceLocation: getNodeSourceLocation(state.sourceFile, declaration),
  };
  state.knownBindings.add(declaration.name.text);
  state.nodePlans.push(assignPlan);
  state.operations.push({
    kind: 'assign',
    plan: assignPlan,
  });
}

function compileReturnStatement(
  statement: ts.ReturnStatement,
  state: CompileState
): void {
  const expression = statement.expression;
  if (!expression) {
    const returnPlan: GnosisTypeScriptBridgeReturnPlan = {
      kind: 'return',
      nodeId: createNodeId(state, 'return', 'void'),
      handlerLabel: 'TsBridgeReturn',
      expression: { kind: 'literal', value: undefined },
      sourceLocation: getNodeSourceLocation(state.sourceFile, statement),
    };
    state.nodePlans.push(returnPlan);
    state.operations.push({
      kind: 'return',
      plan: returnPlan,
    });
    return;
  }

  const unwrapped = unwrapAwait(expression);
  if (ts.isCallExpression(unwrapped)) {
    const returnBinding = createTempBinding(state, 'return');
    const callPlan = resolveCallPlan(
      expression,
      state,
      returnBinding,
      'return'
    );
    state.operations.push({
      kind: 'call',
      plan: callPlan,
    });

    const returnPlan: GnosisTypeScriptBridgeReturnPlan = {
      kind: 'return',
      nodeId: createNodeId(state, 'return', 'result'),
      handlerLabel: 'TsBridgeReturn',
      expression: {
        kind: 'binding',
        name: returnBinding,
      },
      sourceLocation: getNodeSourceLocation(state.sourceFile, statement),
    };
    state.nodePlans.push(returnPlan);
    state.operations.push({
      kind: 'return',
      plan: returnPlan,
    });
    return;
  }

  const returnPlan: GnosisTypeScriptBridgeReturnPlan = {
    kind: 'return',
    nodeId: createNodeId(state, 'return', 'result'),
    handlerLabel: 'TsBridgeReturn',
    expression: resolveExpression(unwrapped, state),
    sourceLocation: getNodeSourceLocation(state.sourceFile, statement),
  };
  state.nodePlans.push(returnPlan);
  state.operations.push({
    kind: 'return',
    plan: returnPlan,
  });
}

function compileStatement(statement: ts.Statement, state: CompileState): void {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      compileVariableDeclaration(declaration, state);
    }
    return;
  }

  if (ts.isExpressionStatement(statement)) {
    const expression = unwrapAwait(statement.expression);
    if (!ts.isCallExpression(expression)) {
      throwBridgeError(
        state.sourceFile,
        state.sourceFilePath,
        statement,
        `Unsupported TypeScript statement '${statement.getText(
          state.sourceFile
        )}'`
      );
    }

    const plan = resolveCallPlan(statement.expression, state, null, 'effect');
    state.operations.push({
      kind: 'call',
      plan,
    });
    return;
  }

  if (ts.isReturnStatement(statement)) {
    compileReturnStatement(statement, state);
    return;
  }

  throwBridgeError(
    state.sourceFile,
    state.sourceFilePath,
    statement,
    `Unsupported TypeScript statement '${statement.getText(state.sourceFile)}'`
  );
}

function renderNodeRef(nodeId: string, label: string): string {
  return `(${nodeId}:${label})`;
}

function renderNodeSpec(nodeId: string, label: string): string {
  return `${nodeId}:${label}`;
}

function renderTopologySource(
  exportName: string,
  entryPlan: GnosisTypeScriptBridgeEntryPlan,
  operations: readonly GnosisTypeScriptBridgeOperation[]
): string {
  const lines = [
    `// ts-bridge.gg — generated from exported TypeScript function '${exportName}'`,
  ];

  let currentNodeId = entryPlan.nodeId;
  let currentLabel: GnosisTypeScriptBridgeHandlerLabel = entryPlan.handlerLabel;

  for (const operation of operations) {
    if (operation.kind === 'parallel') {
      const branchRefs = operation.branches.map((plan) =>
        renderNodeSpec(plan.nodeId, plan.handlerLabel)
      );
      lines.push(
        `${renderNodeRef(
          currentNodeId,
          currentLabel
        )}-[:FORK]->(${branchRefs.join(' | ')})`
      );
      const branchIds = operation.branches
        .map((plan) => plan.nodeId)
        .join(' | ');
      lines.push(
        `(${branchIds})-[:FOLD]->${renderNodeRef(
          operation.joinPlan.nodeId,
          operation.joinPlan.handlerLabel
        )}`
      );
      currentNodeId = operation.joinPlan.nodeId;
      currentLabel = operation.joinPlan.handlerLabel;
      continue;
    }

    const targetPlan = operation.plan;
    lines.push(
      `${renderNodeRef(
        currentNodeId,
        currentLabel
      )}-[:PROCESS]->${renderNodeRef(
        targetPlan.nodeId,
        targetPlan.handlerLabel
      )}`
    );
    currentNodeId = targetPlan.nodeId;
    currentLabel = targetPlan.handlerLabel;
  }

  return `${lines.join('\n')}\n`;
}

function createBridgeAstNode(
  nodeId: string,
  label: GnosisTypeScriptBridgeHandlerLabel
): ASTNode {
  return {
    id: nodeId,
    labels: [label],
    properties: {},
  };
}

function createBridgeAstEdge(
  sourceIds: readonly string[],
  targetIds: readonly string[],
  type: string
): ASTEdge {
  return {
    sourceIds: [...sourceIds],
    targetIds: [...targetIds],
    type,
    properties: {},
  };
}

function buildBridgeAst(
  entryPlan: GnosisTypeScriptBridgeEntryPlan,
  operations: readonly GnosisTypeScriptBridgeOperation[]
): GraphAST {
  const ast: GraphAST = {
    nodes: new Map([
      [
        entryPlan.nodeId,
        createBridgeAstNode(entryPlan.nodeId, entryPlan.handlerLabel),
      ],
    ]),
    edges: [],
  };

  let currentNodeId = entryPlan.nodeId;

  for (const operation of operations) {
    if (operation.kind === 'parallel') {
      for (const branch of operation.branches) {
        ast.nodes.set(
          branch.nodeId,
          createBridgeAstNode(branch.nodeId, branch.handlerLabel)
        );
      }

      ast.nodes.set(
        operation.joinPlan.nodeId,
        createBridgeAstNode(
          operation.joinPlan.nodeId,
          operation.joinPlan.handlerLabel
        )
      );
      ast.edges.push(
        createBridgeAstEdge(
          [currentNodeId],
          operation.branches.map((branch) => branch.nodeId),
          'FORK'
        )
      );
      ast.edges.push(
        createBridgeAstEdge(
          operation.branches.map((branch) => branch.nodeId),
          [operation.joinPlan.nodeId],
          'FOLD'
        )
      );
      currentNodeId = operation.joinPlan.nodeId;
      continue;
    }

    ast.nodes.set(
      operation.plan.nodeId,
      createBridgeAstNode(operation.plan.nodeId, operation.plan.handlerLabel)
    );
    ast.edges.push(
      createBridgeAstEdge([currentNodeId], [operation.plan.nodeId], 'PROCESS')
    );
    currentNodeId = operation.plan.nodeId;
  }

  return ast;
}

function buildSchedule(
  operations: readonly GnosisTypeScriptBridgeOperation[]
): readonly GnosisTypeScriptBridgeWave[] {
  const schedule: GnosisTypeScriptBridgeWave[] = [];
  let waveIndex = 0;

  for (const operation of operations) {
    if (operation.kind === 'parallel') {
      schedule.push({
        index: waveIndex,
        kind: 'parallel',
        nodeIds: operation.branches.map((plan) => plan.nodeId),
      });
      waveIndex += 1;
      schedule.push({
        index: waveIndex,
        kind: 'collapse',
        nodeIds: [operation.joinPlan.nodeId],
      });
      waveIndex += 1;
      continue;
    }

    schedule.push({
      index: waveIndex,
      kind: 'linear',
      nodeIds: [operation.plan.nodeId],
    });
    waveIndex += 1;
  }

  return schedule;
}

export function compileTypeScriptToGnosis(
  sourceText: string,
  options: GnosisTypeScriptBridgeOptions = {}
): GnosisTypeScriptBridgeResult {
  const sourceFilePath = options.sourceFilePath ?? DEFAULT_SOURCE_FILE_PATH;
  const sourceFile = createSourceFile(sourceText, sourceFilePath);
  const { functionsByLocalName, exportsByName } = collectFunctions(sourceFile);
  const entrypoint = selectEntrypoint(
    functionsByLocalName,
    exportsByName,
    sourceFile,
    {
      ...options,
      sourceFilePath,
    }
  );

  const parameters = entrypoint.record.node.parameters;
  if (parameters.length > 1) {
    throwBridgeError(
      sourceFile,
      sourceFilePath,
      entrypoint.record.node,
      'TS bridge entrypoints may accept at most one parameter'
    );
  }

  const inputParameter = parameters[0];
  if (inputParameter && !ts.isIdentifier(inputParameter.name)) {
    throwBridgeError(
      sourceFile,
      sourceFilePath,
      inputParameter.name,
      'TS bridge entrypoint parameters must use a simple identifier'
    );
  }

  const inputParameterIdentifier =
    inputParameter && ts.isIdentifier(inputParameter.name)
      ? inputParameter.name
      : null;

  const prefix = sanitizeIdentifier(
    path.basename(sourceFilePath, path.extname(sourceFilePath)) +
      '_' +
      entrypoint.exportName
  );

  const state: CompileState = {
    sourceFile,
    sourceFilePath,
    inputParameterName: inputParameterIdentifier?.text ?? null,
    prefix,
    knownBindings: new Set<string>(),
    operations: [],
    nodePlans: [],
    nextId: 0,
    tempId: 0,
  };

  const entryPlan: GnosisTypeScriptBridgeEntryPlan = {
    kind: 'entry',
    nodeId: createNodeId(state, 'entry', entrypoint.exportName),
    handlerLabel: 'TsBridgeEntry',
    sourceLocation: getNodeSourceLocation(sourceFile, entrypoint.record.node),
  };
  state.nodePlans.push(entryPlan);

  const statements = getFunctionBodyStatements(entrypoint.record.node);
  let sawReturn = false;

  for (const statement of statements) {
    if (sawReturn) {
      throwBridgeError(
        sourceFile,
        sourceFilePath,
        statement,
        'Statements after the first return are not supported by the TS bridge'
      );
    }

    compileStatement(statement, state);
    if (ts.isReturnStatement(statement)) {
      sawReturn = true;
    }
  }

  if (!sawReturn) {
    throwBridgeError(
      sourceFile,
      sourceFilePath,
      entrypoint.record.node,
      'TS bridge entrypoints require an explicit return statement'
    );
  }

  const ggSource = renderTopologySource(
    entrypoint.exportName,
    entryPlan,
    state.operations
  );
  const runtimeBindingNames = collectRuntimeBindingNames(
    sourceFile,
    state.operations
  );

  return {
    exportName: entrypoint.exportName,
    entryNodeId: entryPlan.nodeId,
    sourceFilePath,
    ggSource,
    topologySource: ggSource,
    ast: buildBridgeAst(entryPlan, state.operations),
    nodePlans: state.nodePlans,
    schedule: buildSchedule(state.operations),
    runtimeBindingNames,
    runtimeModuleSource:
      runtimeBindingNames.length === 0
        ? null
        : renderTypeScriptBridgeRuntimeModuleFromSourceFile(
            sourceText,
            sourceFilePath,
            sourceFile,
            runtimeBindingNames,
            { specifierStyle: 'absolute-url' }
          ).moduleSource,
  };
}

function isBridgeState(value: unknown): value is BridgeState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    Object.prototype.hasOwnProperty.call(candidate, 'input') &&
    typeof candidate.locals === 'object' &&
    candidate.locals !== null &&
    !Array.isArray(candidate.locals)
  );
}

function ensureBridgeState(value: unknown, nodeId: string): BridgeState {
  if (isBridgeState(value)) {
    return value;
  }

  throw new Error(`Bridge node '${nodeId}' expected a bridge state payload.`);
}

function evaluateBridgeExpression(
  expression: GnosisTypeScriptBridgeExpression,
  state: BridgeState
): unknown {
  if (expression.kind === 'input') {
    return state.input;
  }

  if (expression.kind === 'binding') {
    if (!Object.prototype.hasOwnProperty.call(state.locals, expression.name)) {
      throw new Error(`Bridge binding '${expression.name}' is not available.`);
    }
    return state.locals[expression.name];
  }

  if (expression.kind === 'literal') {
    return expression.value;
  }

  if (expression.kind === 'member') {
    const target = evaluateBridgeExpression(expression.target, state);
    if (target === null || target === undefined) {
      throw new Error(
        `Cannot read property '${expression.property}' from ${String(target)}.`
      );
    }

    return (target as Record<string, unknown>)[expression.property];
  }

  if (expression.kind === 'index') {
    const target = evaluateBridgeExpression(expression.target, state);
    if (target === null || target === undefined) {
      throw new Error(
        `Cannot index into ${String(target)} with ${String(expression.index)}.`
      );
    }

    return (target as Record<string | number, unknown>)[expression.index];
  }

  if (expression.kind === 'array') {
    return expression.items.map((item) =>
      evaluateBridgeExpression(item, state)
    );
  }

  return Object.fromEntries(
    expression.entries.map((entry) => [
      entry.key,
      evaluateBridgeExpression(entry.value, state),
    ])
  );
}

function mergeBridgeStates(payload: unknown, nodeId: string): BridgeState {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new Error(
      `Bridge join node '${nodeId}' expected a folded record of branch states.`
    );
  }

  const states = Object.values(payload).map((candidate) =>
    ensureBridgeState(candidate, nodeId)
  );

  if (states.length === 0) {
    return {
      input: undefined,
      locals: {},
    };
  }

  const mergedLocals: Record<string, unknown> = {};
  for (const state of states) {
    Object.assign(mergedLocals, state.locals);
  }

  return {
    input: states[0]?.input,
    locals: mergedLocals,
    lastValue: states.map((state) => state.lastValue),
  };
}

function resolveBinding(
  bindings: GnosisTypeScriptBridgeBindings,
  calleeName: string
): GnosisTypeScriptBridgeBinding {
  const candidate = bindings[calleeName];
  if (typeof candidate === 'function') {
    return candidate as GnosisTypeScriptBridgeBinding;
  }

  throw new Error(
    `Bridge runtime binding '${calleeName}' is missing or is not callable.`
  );
}

export function registerTypeScriptBridgeHandlers(
  registry: GnosisRegistry,
  compiled: GnosisTypeScriptBridgeResult,
  bindings: GnosisTypeScriptBridgeBindings = {}
): void {
  const plansByNodeId = new Map(
    compiled.nodePlans.map((plan) => [plan.nodeId, plan] as const)
  );

  registry.register('TsBridgeEntry', async (payload) => ({
    input: payload,
    locals: {},
  }));

  registry.register('TsBridgeAssign', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('TsBridgeAssign requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    if (!plan || plan.kind !== 'assign') {
      throw new Error(`No assign bridge plan exists for node '${nodeId}'.`);
    }

    const state = ensureBridgeState(payload, nodeId);
    const value = evaluateBridgeExpression(plan.expression, state);
    return {
      input: state.input,
      locals: {
        ...state.locals,
        [plan.bindingName]: value,
      },
      lastValue: value,
    };
  });

  registry.register('TsBridgeCall', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('TsBridgeCall requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    if (!plan || plan.kind !== 'call') {
      throw new Error(`No call bridge plan exists for node '${nodeId}'.`);
    }

    const state = ensureBridgeState(payload, nodeId);
    const callable = resolveBinding(bindings, plan.calleeName);
    const args = plan.args.map((argument) =>
      evaluateBridgeExpression(argument, state)
    );
    const value = await callable(...args);

    if (!plan.assignTo) {
      return {
        input: state.input,
        locals: { ...state.locals },
        lastValue: value,
      };
    }

    return {
      input: state.input,
      locals: {
        ...state.locals,
        [plan.assignTo]: value,
      },
      lastValue: value,
    };
  });

  registry.register('TsBridgeJoin', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('TsBridgeJoin requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    if (!plan || plan.kind !== 'join') {
      throw new Error(`No join bridge plan exists for node '${nodeId}'.`);
    }

    return mergeBridgeStates(payload, nodeId);
  });

  registry.register('TsBridgeReturn', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('TsBridgeReturn requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    if (!plan || plan.kind !== 'return') {
      throw new Error(`No return bridge plan exists for node '${nodeId}'.`);
    }

    const state = ensureBridgeState(payload, nodeId);
    return evaluateBridgeExpression(plan.expression, state);
  });
}

async function loadRuntimeBindings(
  options: ExecuteTypeScriptWithGnosisOptions
): Promise<GnosisTypeScriptBridgeBindings> {
  const importedRuntimeModule =
    options.runtimeModulePath !== undefined
      ? ((await import(
          pathToFileURL(path.resolve(options.runtimeModulePath)).href
        )) as {
          readonly __gnode_bridge_runtime_bindings?: GnosisTypeScriptBridgeBindings;
        })
      : null;
  const sourceFilePath =
    options.sourceFilePath ??
    options.modulePath ??
    options.compiled?.sourceFilePath;
  const sourceText =
    options.sourceText ??
    (sourceFilePath && fs.existsSync(sourceFilePath)
      ? fs.readFileSync(sourceFilePath, 'utf8')
      : undefined);

  const importedModule =
    importedRuntimeModule !== null
      ? importedRuntimeModule.__gnode_bridge_runtime_bindings ?? {}
      : sourceText && sourceFilePath
      ? await loadRuntimeBridgeModuleBindings(sourceText, sourceFilePath)
      : options.modulePath !== undefined
      ? ((await import(
          pathToFileURL(path.resolve(options.modulePath)).href
        )) as GnosisTypeScriptBridgeBindings)
      : {};

  return {
    ...importedModule,
    ...(options.moduleExports ?? {}),
    ...(options.bindings ?? {}),
  };
}

async function loadRuntimeBridgeModuleBindings(
  sourceText: string,
  sourceFilePath: string
): Promise<GnosisTypeScriptBridgeBindings> {
  const absoluteSourcePath = path.resolve(sourceFilePath);
  const renderedModule = renderTypeScriptBridgeRuntimeModule(
    sourceText,
    absoluteSourcePath
  );

  if (renderedModule.bindingNames.length === 0) {
    return {};
  }

  const tempModulePath = path.join(
    path.dirname(absoluteSourcePath),
    `.${path.basename(
      absoluteSourcePath,
      path.extname(absoluteSourcePath)
    )}.gnode.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.ts`
  );

  fs.writeFileSync(tempModulePath, renderedModule.moduleSource, 'utf8');

  try {
    const moduleNamespace = (await import(
      `${pathToFileURL(tempModulePath).href}?t=${Date.now()}`
    )) as {
      readonly __gnode_bridge_runtime_bindings?: GnosisTypeScriptBridgeBindings;
    };

    return moduleNamespace.__gnode_bridge_runtime_bindings ?? {};
  } finally {
    fs.rmSync(tempModulePath, { force: true });
  }
}

function resolveCompilation(
  options: ExecuteTypeScriptWithGnosisOptions
): GnosisTypeScriptBridgeResult {
  if (options.compiled) {
    return options.compiled;
  }

  if (options.sourceText) {
    return compileTypeScriptToGnosis(options.sourceText, {
      exportName: options.exportName,
      sourceFilePath: options.sourceFilePath ?? options.modulePath,
    });
  }

  if (options.sourceFilePath) {
    return compileTypeScriptToGnosis(
      fs.readFileSync(options.sourceFilePath, 'utf8'),
      {
        exportName: options.exportName,
        sourceFilePath: options.sourceFilePath,
      }
    );
  }

  if (options.modulePath) {
    return compileTypeScriptToGnosis(
      fs.readFileSync(options.modulePath, 'utf8'),
      {
        exportName: options.exportName,
        sourceFilePath: options.modulePath,
      }
    );
  }

  throw new Error(
    'executeTypeScriptWithGnosis requires compiled output, source text, a source file path, or a module path.'
  );
}

export async function executeTypeScriptWithGnosis(
  options: ExecuteTypeScriptWithGnosisOptions
): Promise<GnosisEngineExecutionResult> {
  const compiled = resolveCompilation(options);
  const bindings = await loadRuntimeBindings(options);
  const registry = options.registry ?? new GnosisRegistry();
  registerTypeScriptBridgeHandlers(registry, compiled, bindings);
  const engine = new GnosisEngine(registry, options.engineOptions ?? {});
  return engine.executeWithResult(
    compiled.ast,
    options.input,
    options.executeOptions ?? {}
  );
}

export type { GnosisHandlerContext };
