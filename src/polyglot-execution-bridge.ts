import type { GraphAST } from './betty/compiler.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine, type GnosisEngineExecutionResult } from './runtime/engine.js';
import {
  invokeSubprocess,
  type InvokeRequest,
  type InvokeResponse,
} from './runtime/subprocess-invoker.js';

/**
 * Execution manifest emitted by the polyglot scanner in orchestration mode.
 * Describes how to execute each node in the topology.
 */
export interface PolyglotExecutionManifest {
  language: string;
  file_path: string;
  entry_function: string;
  node_execution_plans: NodeExecutionPlan[];
}

export interface NodeExecutionPlan {
  node_id: string;
  source_range: { start_byte: number; end_byte: number };
  kind: 'entry' | 'call' | 'statement' | 'return';
  callee?: string;
}

/**
 * State threaded through the polyglot bridge execution.
 */
interface PolyglotBridgeState {
  input: unknown;
  locals: Record<string, unknown>;
  language: string;
  filePath: string;
}

/**
 * Options for polyglot execution.
 */
export interface ExecutePolyglotOptions {
  ast: GraphAST;
  manifest: PolyglotExecutionManifest;
  input?: unknown;
  registry?: GnosisRegistry;
  engineOptions?: Record<string, unknown>;
}

/**
 * Register polyglot bridge handlers in a GnosisRegistry.
 *
 * These handlers mirror the TypeScript bridge (TsBridgeEntry, TsBridgeCall, etc.)
 * but dispatch execution to external language runtimes via subprocess harnesses.
 */
export function registerPolyglotBridgeHandlers(
  registry: GnosisRegistry,
  manifest: PolyglotExecutionManifest
): void {
  const plansByNodeId = new Map(
    manifest.node_execution_plans.map((plan) => [plan.node_id, plan] as const)
  );

  // PolyglotBridgeEntry: Initialize state with input, language, and file path.
  registry.register('PolyglotBridgeEntry', async (payload) => ({
    input: payload,
    locals: {},
    language: manifest.language,
    filePath: manifest.file_path,
  } satisfies PolyglotBridgeState));

  // PolyglotBridgeCall: Invoke a function via the subprocess harness.
  registry.register('PolyglotBridgeCall', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('PolyglotBridgeCall requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    const state = ensurePolyglotState(payload, nodeId);

    const functionName = plan?.callee ?? _props.callee ?? 'main';

    const sourceRange = plan?.source_range
      ? { startByte: plan.source_range.start_byte, endByte: plan.source_range.end_byte }
      : undefined;

    const request: InvokeRequest = {
      action: 'execute',
      language: state.language,
      filePath: state.filePath,
      functionName,
      args: state.input !== undefined ? [state.input] : [],
      sourceRange,
    };

    const response = await invokeSubprocess(request);

    if (response.status === 'error') {
      throw new Error(
        `PolyglotBridgeCall failed for '${functionName}': ${response.value}\n${response.stderr}`
      );
    }

    const assignTo = _props.assignTo ?? functionName;
    return {
      input: state.input,
      locals: {
        ...state.locals,
        [assignTo]: response.value,
      },
      language: state.language,
      filePath: state.filePath,
    } satisfies PolyglotBridgeState;
  });

  // PolyglotBridgeStatement: Execute an arbitrary statement.
  registry.register('PolyglotBridgeStatement', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('PolyglotBridgeStatement requires a node id.');
    }

    const plan = plansByNodeId.get(nodeId);
    const state = ensurePolyglotState(payload, nodeId);

    // For statements, we pass all locals as the first argument.
    const stmtSourceRange = plan?.source_range
      ? { startByte: plan.source_range.start_byte, endByte: plan.source_range.end_byte }
      : undefined;

    const request: InvokeRequest = {
      action: 'execute',
      language: state.language,
      filePath: state.filePath,
      functionName: plan?.callee ?? '__gnode_eval__',
      args: [state.locals],
      sourceRange: stmtSourceRange,
    };

    const response = await invokeSubprocess(request);

    if (response.status === 'error') {
      throw new Error(
        `PolyglotBridgeStatement failed at node '${nodeId}': ${response.value}\n${response.stderr}`
      );
    }

    return {
      input: state.input,
      locals: {
        ...state.locals,
        __last__: response.value,
      },
      language: state.language,
      filePath: state.filePath,
    } satisfies PolyglotBridgeState;
  });

  // PolyglotBridgeReturn: Extract the final value from state.
  registry.register('PolyglotBridgeReturn', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('PolyglotBridgeReturn requires a node id.');
    }

    const state = ensurePolyglotState(payload, nodeId);

    // Return the last computed value, or all locals if no specific value.
    const returnKey = _props.returnKey;
    if (returnKey && returnKey in state.locals) {
      return state.locals[returnKey];
    }

    // Default: return the __last__ value or all locals.
    if ('__last__' in state.locals) {
      return state.locals.__last__;
    }

    return state.locals;
  });

  // PolyglotBridgeJoin: Merge states from concurrent branches.
  registry.register('PolyglotBridgeJoin', async (payload, _props, context) => {
    const nodeId = context?.nodeId;
    if (!nodeId) {
      throw new Error('PolyglotBridgeJoin requires a node id.');
    }

    // If payload is an array (from concurrent branches), merge locals.
    if (Array.isArray(payload)) {
      const merged: PolyglotBridgeState = {
        input: payload[0]?.input,
        locals: {},
        language: payload[0]?.language ?? '',
        filePath: payload[0]?.filePath ?? '',
      };

      for (const branch of payload) {
        if (branch && typeof branch === 'object' && 'locals' in branch) {
          Object.assign(merged.locals, (branch as PolyglotBridgeState).locals);
        }
      }

      return merged;
    }

    return payload;
  });
}

/**
 * Ensure the payload is a valid PolyglotBridgeState.
 */
function ensurePolyglotState(payload: unknown, nodeId: string): PolyglotBridgeState {
  if (
    payload &&
    typeof payload === 'object' &&
    'language' in payload &&
    'filePath' in payload
  ) {
    return payload as PolyglotBridgeState;
  }

  throw new Error(
    `PolyglotBridge node '${nodeId}' received invalid state. ` +
    `Expected { input, locals, language, filePath }, got: ${typeof payload}`
  );
}

/**
 * Execute a polyglot source file through the Gnosis topology engine.
 *
 * This is the main entry point for polyglot execution:
 * 1. Takes a pre-compiled GraphAST + execution manifest
 * 2. Registers PolyglotBridge handlers
 * 3. Runs through GnosisEngine
 * 4. Returns the execution result
 */
export async function executePolyglotWithGnosis(
  options: ExecutePolyglotOptions
): Promise<GnosisEngineExecutionResult> {
  const registry = options.registry ?? new GnosisRegistry();
  registerPolyglotBridgeHandlers(registry, options.manifest);
  const engine = new GnosisEngine(registry, options.engineOptions ?? {});
  return engine.executeWithResult(options.ast, options.input);
}
