import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { BettyCompiler, type GraphAST } from './betty/compiler.js';
import {
  GnosisEngine,
  type GnosisEngineExecutionResult,
  type GnosisEngineExecuteOptions,
  type GnosisEngineOptions,
} from './runtime/engine.js';
import { GnosisRegistry, type GnosisHandlerContext } from './runtime/registry.js';

type SupportedFunctionNode =
  | ts.FunctionDeclaration
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
}

interface GnosisTypeScriptBridgeAssignPlan {
  readonly kind: 'assign';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeAssign';
  readonly bindingName: string;
  readonly expression: GnosisTypeScriptBridgeExpression;
}

interface GnosisTypeScriptBridgeCallPlan {
  readonly kind: 'call';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeCall';
  readonly calleeName: string;
  readonly args: readonly GnosisTypeScriptBridgeExpression[];
  readonly assignTo: string | null;
}

interface GnosisTypeScriptBridgeJoinPlan {
  readonly kind: 'join';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeJoin';
}

interface GnosisTypeScriptBridgeReturnPlan {
  readonly kind: 'return';
  readonly nodeId: string;
  readonly handlerLabel: 'TsBridgeReturn';
  readonly expression: GnosisTypeScriptBridgeExpression;
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

function hasModifier(
  node: ts.Node,
  modifierKind: ts.SyntaxKind
): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }

  return ts.getModifiers(node)?.some((modifier) => modifier.kind === modifierKind) ?? false;
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

function createNodeId(
  state: CompileState,
  kind: string,
  hint: string
): string {
  const nodeId = `${state.prefix}_${kind}_${String(state.nextId).padStart(
    2,
    '0'
  )}_${sanitizeIdentifier(hint)}`;
  state.nextId += 1;
  return nodeId;
}

function createTempBinding(state: CompileState, hint: string): string {
  const bindingName = `__bridge_tmp_${sanitizeIdentifier(hint)}_${state.tempId}`;
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

function collectFunctions(
  sourceFile: ts.SourceFile
): {
  readonly functionsByLocalName: ReadonlyMap<string, FunctionRecord>;
  readonly exportsByName: ReadonlyMap<string, string>;
} {
  const functionsByLocalName = new Map<string, FunctionRecord>();
  const exportsByName = new Map<string, string>();

  let anonymousDefaultCount = 0;

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      const localName =
        statement.name?.text ??
        `__default_export_${String(anonymousDefaultCount++)}`;
      functionsByLocalName.set(localName, {
        localName,
        node: statement,
      });

      if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        if (
          statement.name &&
          !hasModifier(statement, ts.SyntaxKind.DefaultKeyword)
        ) {
          exportsByName.set(statement.name.text, localName);
        }

        if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
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

function collectRuntimeBindingNames(sourceFile: ts.SourceFile): readonly string[] {
  const names = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      names.add(statement.name.text);
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        names.add(declaration.name.text);
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
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
  };
  state.nodePlans.push(plan);
  return plan;
}

function compilePromiseAllOperation(
  bindingName:
    | ts.Identifier
    | ts.ArrayBindingPattern,
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
        `${renderNodeRef(currentNodeId, currentLabel)}-[:FORK]->(${branchRefs.join(
          ' | '
        )})`
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
      `${renderNodeRef(currentNodeId, currentLabel)}-[:PROCESS]->${renderNodeRef(
        targetPlan.nodeId,
        targetPlan.handlerLabel
      )}`
    );
    currentNodeId = targetPlan.nodeId;
    currentLabel = targetPlan.handlerLabel;
  }

  return `${lines.join('\n')}\n`;
}

function compileToAst(ggSource: string): GraphAST {
  const compiler = new BettyCompiler();
  const parsed = compiler.parse(ggSource);
  const errors = parsed.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error'
  );

  if (!parsed.ast || errors.length > 0) {
    const details = errors
      .map(
        (diagnostic) =>
          `${diagnostic.line}:${diagnostic.column} ${diagnostic.message}`
      )
      .join('\n');
    throw new Error(
      details.length > 0
        ? `Failed to compile generated GG bridge topology:\n${details}`
        : 'Failed to compile generated GG bridge topology.'
    );
  }

  return parsed.ast;
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

  return {
    exportName: entrypoint.exportName,
    entryNodeId: entryPlan.nodeId,
    sourceFilePath,
    ggSource,
    topologySource: ggSource,
    ast: compileToAst(ggSource),
    nodePlans: state.nodePlans,
    schedule: buildSchedule(state.operations),
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
    return expression.items.map((item) => evaluateBridgeExpression(item, state));
  }

  return Object.fromEntries(
    expression.entries.map((entry) => [
      entry.key,
      evaluateBridgeExpression(entry.value, state),
    ])
  );
}

function mergeBridgeStates(payload: unknown, nodeId: string): BridgeState {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
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
  const sourceFilePath =
    options.sourceFilePath ?? options.modulePath ?? options.compiled?.sourceFilePath;
  const sourceText =
    options.sourceText ??
    (sourceFilePath && fs.existsSync(sourceFilePath)
      ? fs.readFileSync(sourceFilePath, 'utf8')
      : undefined);

  const importedModule =
    sourceText && sourceFilePath
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
  const sourceFile = createSourceFile(sourceText, absoluteSourcePath);
  const runtimeBindingNames = collectRuntimeBindingNames(sourceFile);

  if (runtimeBindingNames.length === 0) {
    return {};
  }

  const tempModulePath = path.join(
    path.dirname(absoluteSourcePath),
    `.${path.basename(
      absoluteSourcePath,
      path.extname(absoluteSourcePath)
    )}.gnode.${Date.now()}.${Math.random()
      .toString(36)
      .slice(2, 8)}.ts`
  );

  const bindingLiteral = runtimeBindingNames
    .map((bindingName) => `  ${JSON.stringify(bindingName)}: ${bindingName},`)
    .join('\n');
  const tempModuleSource = `${sourceText}\n\nexport const __gnode_bridge_runtime_bindings = {\n${bindingLiteral}\n};\n`;

  fs.writeFileSync(tempModulePath, tempModuleSource, 'utf8');

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
