import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'url';
import { Pipeline } from '@a0n/aeon-pipelines';
import * as twokeys from 'twokeys';
import {
  BettyCompiler,
  type Diagnostic,
  type GraphAST,
} from './betty/compiler.js';
import { generateLeanFromGnosisAst } from './betty/lean.js';
import { GnosisRegistry } from './runtime/registry.js';
import { GnosisEngine } from './runtime/engine.js';
import { GnosisCoreCache } from './runtime/core-cache.js';
import { GnosisNativeRuntime } from './runtime/native-runtime.js';
import { ModManager } from './mod/manager.js';
import {
  detectModuleFormat,
  loadGnosisModuleFromFile,
  parseMGG,
  renderMGG,
} from './mod/loader.js';
import {
  analyzeGnosisSource,
  finishSteeringTelemetry,
  DEFAULT_GNOSIS_STEERING_MODE,
  formatGnosisViolations,
  startSteeringTelemetry,
  surfaceSteeringMetrics,
  VALID_GNOSIS_STEERING_MODES,
  withSteeringTelemetry,
} from './analysis.js';
import {
  authorizeBoundaryWalkRun,
  createSteeringTraceRecord,
  DEFAULT_GNOSIS_STEERING_TRACE_WINDOW,
  defaultSteeringTraceRoomName,
  fingerprintSteeringTopology,
  formatSteeringTraceAlert,
  formatSteeringTraceStoreStatus,
  formatSteeringTraceSummary,
  GnosisSteeringTraceStore,
} from './steering-trace.js';
import type { GnosisSteeringMetrics, GnosisSteeringMode } from './analysis.js';
import type { RuntimeTarget } from './capabilities/index.js';
import {
  analyzeTypeScriptTargets,
  parseTsSonarThresholds,
} from './ts-sonar.js';
import { ggReportToSarif, tsReportToSarif } from './sarif.js';
import { generateTlaFromGnosisSource } from './tla-bridge.js';

import { GnosisNeo4jBridge } from './neo4j-bridge.js';
import { GnosisFormatter } from './formatter.js';
import { registerBettiHandlers } from './betti/handlers.js';
import { renderWithTopologyCompat } from './runtime/renderer-compat.js';
import {
  authorizeSteeringApply,
  bootstrapExecutionAuthFromTopology,
  normalizeExecutionAuthContext,
  registerCoreAuthHandlers,
} from './auth/index.js';
import type { GnosisExecutionAuthContext } from './auth/index.js';
import {
  NeuralEngine,
  GPUEngine,
  WebGPUEngine,
  WebNNEngine,
  Translator,
  NeuronRepository,
  SynapseRepository,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY_FILE,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY,
  TRANSFORMER_HELLO_WORLD_TOPOLOGY,
  getTopicDomainTransformerTopologySource,
  init as initNeuralEngine,
} from './neural-compat.js';
import type {
  Neuron,
  Synapse,
  AdapterTrainingConfig,
  NeuralGraphData,
  LoadTopologyOptions,
  NeuralHeteroFabricOptions,
} from './neural-compat.js';

export {
  GnosisNeo4jBridge,
  GnosisRegistry,
  GnosisEngine,
  GnosisCoreCache,
  GnosisNativeRuntime,
  BettyCompiler,
  generateLeanFromGnosisAst,
};
export { registerBettiHandlers } from './betti/handlers.js';
export { runBootstrap, runBettiPipeline, proveGeneralization, crossCompileBetty } from './betti/bootstrap.js';
export { areStructurallyEquivalent, diffASTs, serializeCanonical } from './betti/ast-equivalence.js';
export { godelEncodeAST, verifyBootstrapFixedPoint } from './betti/fixed-point.js';
export { buildBetti, extractBettiFunctions, scaffoldBettiHandlers } from './betti/build-config.js';
export { parseNodeDeclarations, parseEdgeDeclarations, parseProperties, stripComments } from './betty/parse-utils.js';
export { runAllVerificationPasses } from './betty/verify.js';
export {
  GnosisModuleLoader,
  createFilesystemModuleResolver,
  detectModuleFormat,
  loadGnosisModuleFromFile,
  looksLikeModule,
  parseMGG,
  renderGraphAst,
  renderMGG,
} from './mod/loader.js';
export {
  NeuralEngine,
  GPUEngine,
  WebGPUEngine,
  WebNNEngine,
  Translator,
  NeuronRepository,
  SynapseRepository,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY_FILE,
  TOPIC_DOMAIN_TRANSFORMER_TOPOLOGY,
  TRANSFORMER_HELLO_WORLD_TOPOLOGY,
  getTopicDomainTransformerTopologySource,
  initNeuralEngine as init,
  initNeuralEngine,
};
export type {
  Neuron,
  Synapse,
  AdapterTrainingConfig,
  NeuralGraphData,
  LoadTopologyOptions,
  NeuralHeteroFabricOptions,
};
export * from './runtime/hetero-fabric.js';
export type {
  GnosisModuleImport,
  GnosisModuleExport,
  ParsedGnosisModule,
  LoadedGnosisModule,
  GnosisResolvedImport,
  ResolveResult,
  GnosisModuleResolver,
} from './mod/loader.js';
export type {
  GnosisHandler,
  GnosisHandlerContext,
} from './runtime/registry.js';
export type {
  GnosisEngineExecutionCacheState,
  GnosisEngineExecutionResult,
  GnosisEngineExecuteOptions,
  GnosisEngineOptions,
} from './runtime/engine.js';
export type {
  GnosisCoreCacheMode,
  GnosisCoreCacheReuseScope,
  GnosisCoreCacheExecutionOptions,
  GnosisCoreCacheSession,
  GnosisCoreCacheMetrics,
  GnosisCoreCacheEntry,
  GnosisCoreCacheCorridorRecord,
  GnosisCoreCacheEvent,
  GnosisCoreCacheLookup,
} from './runtime/core-cache.js';
export type {
  GraphAST,
  ASTNode,
  ASTEdge,
  BettyParseResult,
  Diagnostic,
  DiagnosticCode,
} from './betty/compiler.js';
export type {
  StabilityContinuousHarrisWitness,
  StabilityContinuousObservableKind,
  StabilityHeteroMoAFabricLayerKind,
  StabilityHeteroMoAFabricLayerWitness,
  StabilityHeteroMoAFabricWitness,
  StabilityKernelEdge,
  StabilityMetadata,
  StabilityProofAssumption,
  StabilityProofKind,
  StabilityProofObligation,
  StabilityRecurrenceStep,
  StabilityRecurrenceWitness,
  StabilityReport,
  StabilityStateAssessment,
} from './betty/stability.js';
export { generateTlaFromGnosisSource };
export type {
  GnosisTlaBridgeResult,
  GnosisTlaBridgeOptions,
} from './tla-bridge.js';
export {
  GnosisTypeScriptBridgeError,
  compileTypeScriptToGnosis,
  executeTypeScriptWithGnosis,
  registerTypeScriptBridgeHandlers,
  renderTypeScriptBridgeRuntimeModule,
} from './ts-bridge.js';
export type {
  ExecuteTypeScriptWithGnosisOptions,
  GnosisTypeScriptBridgeBinding,
  GnosisTypeScriptBridgeBindings,
  GnosisTypeScriptBridgeErrorLocation,
  GnosisTypeScriptBridgeExpression,
  GnosisTypeScriptBridgeNodePlan,
  GnosisTypeScriptBridgeOptions,
  GnosisTypeScriptBridgeResult,
  GnosisTypeScriptBridgeWave,
} from './ts-bridge.js';
export * from './capabilities/index.js';
export * from './auth/index.js';

// Quantum CRDT — the only state model
export {
  QCorridor,
  QDoc,
  QMap,
  QArray,
  QText,
  QCounter,
  QDocAeonRelay,
  QDocRelay,
  createQDocAeonRelayJoinEnvelope,
} from './crdt/index.js';
export {
  Doc,
  Map,
  Array,
  Text,
  XmlFragment,
  XmlElement,
  UndoManager,
  applyUpdate,
  encodeStateAsUpdate,
  transact,
  encodeStateVector,
  diffUpdate,
  mergeUpdates,
} from './crdt/index.js';
export type {
  QCorridorOptions,
  QCorridorExecutionOptions,
  QCorridorMode,
  QCorridorReuseScope,
  QCorridorSession,
  QCorridorMetrics,
  QCorridorEntry,
  QCorridorRecord,
  QCorridorEvent,
  QCorridorEvidence,
  QCorridorObservation,
  QCorridorObservationRole,
  QCorridorObservationStatus,
  QCorridorLookup,
  QDocOptions,
  QDocDelta,
  QDocDeltaNode,
  QDocDeltaEdge,
  QDocUpdateHandler,
  QDocObserveHandler,
  QDocEvent,
  QDocAeonRelayAttributes,
  QDocAeonRelayAttributeValue,
  QDocAeonRelayConfig,
  QDocAeonRelayJoinEnvelope,
  QDocAeonRelayReadyStrategy,
  QDocAeonRelaySpan,
  QDocAeonRelayStatus,
  QDocAeonRelayTelemetry,
  QDocAeonRelayTelemetryEvent,
  QDocAeonRelayTelemetryStage,
  QDocRelayAttributes,
  QDocRelayAttributeValue,
  QDocRelayConfig,
  QDocRelayReadyStrategy,
  QDocRelaySpan,
  QDocRelayStatus,
  QDocRelayTelemetry,
  QDocRelayTelemetryEvent,
  QDocRelayTelemetryStage,
} from './crdt/index.js';

// Test harness & runner
export {
  ggTest,
  ggQuickCheck,
  ggAssert,
  GGTestBuilder,
} from './gg-test-harness.js';
export {
  runGGTestFile,
  runGGTestSuite,
  discoverTestFiles,
  formatGGTestResults,
  formatGGTestDiscoveryResults,
} from './gg-test-runner.js';
export {
  type VoidBoundary,
  createVoidBoundary,
  updateVoidBoundary,
  decayVoidBoundary,
  complementDistribution,
  shannonEntropy,
  excessKurtosis,
  inverseBule,
  giniCoefficient,
  type Gait,
  type MetaCogState,
  GAIT_DEPTH,
  createMetaCogState,
  c0Choose,
  c0Update,
  c1Measure,
  c2SelectGait,
  c3Adapt,
} from './runtime/void-walker.js';

// Effect System — explicit effects in topology signatures
export {
  type EffectKind,
  type EffectRequirement,
  type EffectSignature,
  type EffectDiagnostic,
  type EffectValidationResult,
  type EffectContract,
  type NodeDescriptor,
  ALL_EFFECT_KINDS,
  isEffectKind,
  inferNodeEffects,
  parseDeclaredEffects,
  validateEffects,
  createEffectSignature,
  buildEffectContract,
  contractsCompatible,
} from './effects.js';
export {
  registerEffectHandlers,
  EFFECT_SYSTEM_FEATURES,
} from './effects-handlers.js';

// Algebraic Data Types — closed state modeling
export {
  type Variant,
  type SumTypeDefinition,
  type ProductTypeDefinition,
  type FieldDefinition,
  type MatchArm,
  type MatchResult,
  variant,
  defineSumType,
  defineProductType,
  createRecord,
  matchExhaustive,
  matchPartial,
  checkExhaustiveness,
  validateNodeExhaustiveness,
  ExhaustivenessError,
  TypeRegistry,
  BUILTIN_SUM_TYPES,
} from './adt.js';
export { registerAdtHandlers, ADT_BUILTIN_TYPES } from './adt-handlers.js';

// Option and Result — first-class error values
export {
  type GnosisOption,
  type GnosisResult,
  some,
  none,
  ok,
  err,
  isSome,
  isNone,
  isOk,
  isErr,
  unwrapOption,
  unwrapOptionOr,
  unwrapResult,
  unwrapResultOr,
  unwrapErr,
  mapOption,
  flatMapOption,
  filterOption,
  mapResult,
  mapErr,
  flatMapResult,
  tryCatch,
  tryCatchAsync,
  collectResults,
  partitionResults,
  optionToResult,
  resultToOption,
  transposeOptionResult,
  routeResult,
  resultHandler,
} from './option-result.js';
export {
  registerOptionResultHandlers,
  OPTION_RESULT_HANDLERS,
} from './option-result-handlers.js';

// Quantum — graph-native quantum values and transitions
export {
  type Complex,
  type Qubit,
  type QuantumRegister,
  type Gate2x2,
  type MeasurementOutcome,
  type CircuitOp,
  type QuantumCircuit,
  complex,
  complexMul,
  complexAdd,
  complexNorm,
  complexConj,
  qubit,
  ket0,
  ket1,
  ketPlus,
  ketMinus,
  isNormalized,
  prob0,
  prob1,
  applyGate,
  hadamard,
  pauliX,
  pauliZ,
  phaseGate,
  H_GATE,
  X_GATE,
  Y_GATE,
  Z_GATE,
  S_GATE,
  T_GATE,
  createRegister,
  registerFromQubit,
  registerNormalized,
  applyCNOT,
  applyCZ,
  applyGateToRegister,
  measure as quantumMeasure,
  measureRegister,
  bellState,
  isEntangled,
  createCircuit,
  addGate,
  addCNOT,
  addCZ,
  addMeasure,
  addBarrier,
  executeCircuit,
} from './quantum.js';
export {
  registerQuantumHandlers,
  QUANTUM_GATE_NAMES,
} from './quantum-handlers.js';

// Differentiable Programming — gradients as topology expressions
export {
  type DiffValue,
  type OptimizerConfig,
  type OptimizerState,
  type GradientFlowReport,
  GradientTape,
  parameter as diffParameter,
  constant as diffConstant,
  diffValue,
  add as diffAdd,
  mul as diffMul,
  sub as diffSub,
  neg as diffNeg,
  relu as diffRelu,
  sigmoid as diffSigmoid,
  tanh as diffTanh,
  exp as diffExp,
  log as diffLog,
  pow as diffPow,
  mseLoss,
  bceLoss,
  createOptimizer,
  optimizerStep,
  analyzeGradientFlow,
} from './differentiable.js';
export {
  registerDifferentiableHandlers,
  DIFFERENTIABLE_OPS,
} from './differentiable-handlers.js';

// Destructuring — clean value unpacking
export {
  type DestructurePattern,
  type RecordPattern,
  type TuplePattern,
  type VariantPattern,
  type WildcardPattern,
  type LiteralPattern,
  type NestedPattern,
  type BindingResult,
  type PatternValidation,
  type MatchArmWithPattern,
  recordPattern,
  tuplePattern,
  variantPattern,
  wildcardPattern,
  literalPattern,
  extractBindings,
  matchPatterns,
  validateVariantPattern,
  validateRecordPattern,
  checkPatternExhaustiveness,
} from './destructuring.js';
export {
  registerDestructuringHandlers,
  DESTRUCTURING_PATTERNS,
} from './destructuring-handlers.js';

// Module System — reproducible build units
export {
  type SemVer,
  type VersionConstraint,
  type ModuleDependency,
  type ModuleManifest,
  type LockfileEntry,
  type Lockfile,
  type ResolutionResult,
  type CompatibilityReport,
  parseSemVer,
  formatSemVer,
  compareSemVer,
  parseConstraint,
  satisfiesConstraint,
  createManifest,
  createLockfile,
  addLockfileEntry,
  lockfileHas,
  lockfileGet,
  resolveDependencies,
  checkModuleCompatibility,
} from './module-system.js';
export {
  registerModuleSystemHandlers,
  MODULE_SYSTEM_FEATURES,
} from './module-system-handlers.js';

// Continuous Harris — compiler-driven measurable Harris packages
export {
  type SmallSetKind,
  type SmallSet,
  type ObservableKind,
  type Observable,
  type LyapunovKind,
  type LyapunovFunction,
  type MinorizationKind,
  type MinorizationData,
  type HarrisCertificate,
  type KernelFamily,
  type MeasurableKernel,
  synthesizeSmallSet,
  inferObservable,
  synthesizeLyapunov,
  synthesizeMinorization,
  synthesizeHarrisCertificate,
  inferKernelFamily,
  generateHarrisLean,
} from './continuous-harris.js';
export {
  registerContinuousHarrisHandlers,
  HARRIS_KERNEL_FAMILIES,
} from './continuous-harris-handlers.js';

// Thermodynamics — Landauer erasure + Boltzmann as void walking
export {
  K_BOLTZMANN,
  landauerLimit,
  type ThermodynamicState,
  type ErasureEvent,
  type ForkEvent,
  type FoldEvent,
  type SecondLawCheck,
  type HeatEngineMetrics,
  createThermodynamicState,
  refreshPotentials,
  boltzmannDistribution,
  gibbsEntropy,
  verifyFreeEnergyIdentity,
  recordErasure,
  recordFork as thermodynamicFork,
  recordFold as thermodynamicFold,
  checkSecondLaw,
  analyzeHeatEngine,
  crooksRatio,
  jarzynskiAverage,
} from './thermodynamic.js';
export {
  registerThermodynamicHandlers,
  THERMODYNAMIC_IDENTIFICATIONS,
} from './thermodynamic-handlers.js';

// Traced Monoidal Category — fork/race/fold as string diagrams
export {
  type CatObject,
  type Morphism,
  type MorphismKind,
  type CoherenceCheck,
  type StringDiagram,
  catObject,
  UNIT,
  identity as catIdentity,
  process as catProcess,
  fork as catFork,
  fold as catFold,
  race as catRace,
  vent as catVent,
  symmetry as catSymmetry,
  compose as catCompose,
  tensor as catTensor,
  trace as catTrace,
  checkAssociativity,
  checkLeftUnit,
  checkRightUnit,
  checkSymmetryInvolution,
  checkVanishing,
  checkYanking,
  verifyCoherence,
  buildStringDiagram,
  diagramBeta1,
  isDiagramClosed,
  edgeToMorphism,
} from './traced-monoidal.js';
export {
  registerTracedMonoidalHandlers,
  COHERENCE_CONDITIONS,
} from './traced-monoidal-handlers.js';

// Chaitin-Omega — computability-theoretic void boundary
export {
  type HaltingClassifier,
  type ProgramSpace,
  type ComplexityAssignment,
  type SolomonoffSpace,
  type OmegaApproximation,
  type OmegaConvergenceTrace,
  type SolomonoffAxiomResult,
  createProgramSpace,
  approximateOmega,
  trackOmegaConvergence,
  programSpaceToVoidBoundary,
  solomonoffToVoidBoundary,
  solomonoffWeight,
  verifySolomonoffAxioms,
  trivialClassifier,
  stepBoundedClassifier,
  estimateComplexity,
  buildComplexityAssignment,
  buildSolomonoffSpace,
} from './chaitin-omega.js';
export {
  registerChaitinOmegaHandlers,
  CHAITIN_OMEGA_THEOREMS,
} from './chaitin-omega-handlers.js';

const args = process.argv.slice(2);
const verboseMode = args.includes('--verbose');

function resolveCurrentGnosisFilePath(): string | null {
  const moduleUrl = import.meta.url;
  if (typeof moduleUrl !== 'string' || moduleUrl.length === 0) {
    return null;
  }

  try {
    return fileURLToPath(moduleUrl);
  } catch {
    return null;
  }
}

const GNOSIS_PACKAGE_ROOT = path.resolve(
  path.dirname(resolveCurrentGnosisFilePath() ?? process.cwd()),
  '..'
);

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function resolveTopologyPath(rawPath: string): string {
  return path.resolve(process.cwd(), rawPath);
}

function isGgTarget(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  return extension === '.gg' || extension === '.ggx' || extension === '.mgg';
}

interface LoadedCliTopologySource {
  source: string;
  format: 'gg' | 'mgg';
  exports: string[];
  imports: string[];
}

async function loadCliTopologySource(
  filePath: string
): Promise<LoadedCliTopologySource> {
  // polyglot:ignore RESOURCE_LEAK — readFileSync returns a string, no handle to release
  const rawSource = fs.readFileSync(filePath, 'utf-8');
  if (detectModuleFormat(filePath, rawSource) === 'mgg') {
    const loadedModule = await loadGnosisModuleFromFile(
      filePath,
      process.cwd()
    );
    return {
      source: loadedModule.mergedSource,
      format: 'mgg',
      exports: loadedModule.exports,
      imports: loadedModule.imports.map(
        (resolvedImport) =>
          `{ ${resolvedImport.declaration.names.join(', ')} } from '${
            resolvedImport.declaration.source
          }'`
      ),
    };
  }

  return {
    source: rawSource,
    format: 'gg',
    exports: [],
    imports: [],
  };
}

function formatTopologySource(filePath: string, source: string): string {
  const formatter = new GnosisFormatter();
  if (detectModuleFormat(filePath, source) === 'mgg') {
    const parsed = parseMGG(source);
    return renderMGG({
      ...parsed,
      topologySource: formatter.format(parsed.topologySource),
    });
  }

  return formatter.format(source);
}

function parseMaxBuley(rawArgs: string[]): number | null {
  const flagIndex = rawArgs.indexOf('--max-buley');
  if (flagIndex < 0) return null;
  const rawValue = rawArgs[flagIndex + 1];
  if (!rawValue) return null;
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFlagValue(rawArgs: string[], flagName: string): string | null {
  const flagIndex = rawArgs.indexOf(flagName);
  if (flagIndex < 0) return null;
  const rawValue = rawArgs[flagIndex + 1];
  if (!rawValue || rawValue.startsWith('--')) return null;
  return rawValue;
}

function parseExecutionAuthPayload(
  rawValue: string
): GnosisExecutionAuthContext {
  const parsed = JSON.parse(rawValue) as unknown;
  const candidate =
    parsed && typeof parsed === 'object' && 'executionAuth' in parsed
      ? (parsed as { executionAuth?: unknown }).executionAuth
      : parsed;
  const executionAuth = normalizeExecutionAuthContext(candidate);
  if (!executionAuth) {
    throw new Error(
      'Execution auth must be a JSON object or { executionAuth } envelope.'
    );
  }
  return executionAuth;
}

function parseExecutionAuth(
  rawArgs: string[]
): GnosisExecutionAuthContext | null {
  const inlineJson =
    parseFlagValue(rawArgs, '--execution-auth-json') ??
    process.env.GNOSIS_EXECUTION_AUTH_JSON ??
    null;
  if (inlineJson) {
    return parseExecutionAuthPayload(inlineJson);
  }

  const filePath =
    parseFlagValue(rawArgs, '--execution-auth-file') ??
    process.env.GNOSIS_EXECUTION_AUTH_FILE ??
    null;
  if (!filePath) {
    return null;
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  return parseExecutionAuthPayload(fs.readFileSync(resolvedPath, 'utf-8'));
}

function assertBoundaryWalkAuthorized(options: {
  source: string;
  steeringMode: GnosisSteeringMode;
  executionAuth: GnosisExecutionAuthContext | null;
}): void {
  const { source, steeringMode, executionAuth } = options;
  if (!executionAuth || executionAuth.enforce !== true) {
    return;
  }

  const runAuthorization = authorizeBoundaryWalkRun({
    source,
    executionAuth,
  });
  if (!runAuthorization.allowed) {
    throw new Error(
      `Boundary walk denied: ${
        runAuthorization.reason ?? 'missing gnosis/steering.run capability'
      }`
    );
  }

  if (steeringMode !== 'apply') {
    return;
  }

  const applyAuthorization = authorizeSteeringApply({
    topologyFingerprint: fingerprintSteeringTopology(source),
    auth: executionAuth,
  });
  if (!applyAuthorization.allowed) {
    throw new Error(
      `Boundary walk apply denied: ${
        applyAuthorization.reason ?? 'missing gnosis/steering.apply capability'
      }`
    );
  }
}

async function resolveBoundaryWalkExecutionAuth(options: {
  ast: GraphAST;
  initialPayload: unknown;
  explicitExecutionAuth: GnosisExecutionAuthContext | null;
}): Promise<GnosisExecutionAuthContext | null> {
  if (options.explicitExecutionAuth) {
    return options.explicitExecutionAuth;
  }

  const bootstrap = await bootstrapExecutionAuthFromTopology(options.ast, {
    initialPayload: options.initialPayload,
  });
  return bootstrap.executionAuth;
}

interface TlaWritePaths {
  tlaFilePath: string;
  cfgFilePath: string;
}

interface LeanWritePaths {
  leanFilePath: string;
}

interface LeanCheckResult {
  attempted: boolean;
  ok: boolean;
  message: string;
}

const VALID_RUNTIME_TARGETS: RuntimeTarget[] = [
  'agnostic',
  'workers',
  'node',
  'gnode',
];

function parseRuntimeTarget(rawArgs: string[]): RuntimeTarget | null {
  const targetRaw = parseFlagValue(rawArgs, '--target');
  if (!targetRaw) {
    return 'agnostic';
  }

  const normalized = targetRaw.trim().toLowerCase() as RuntimeTarget;
  if (!VALID_RUNTIME_TARGETS.includes(normalized)) {
    return null;
  }
  return normalized;
}

function parseSteeringMode(rawArgs: string[]): GnosisSteeringMode | null {
  const steeringModeRaw = parseFlagValue(rawArgs, '--steering-mode');
  if (!steeringModeRaw) {
    return DEFAULT_GNOSIS_STEERING_MODE;
  }

  const normalized = steeringModeRaw.trim().toLowerCase() as GnosisSteeringMode;
  if (!VALID_GNOSIS_STEERING_MODES.includes(normalized)) {
    return null;
  }

  return normalized;
}

function formatCompilerDiagnostic(diagnostic: Diagnostic): string {
  const prefix = diagnostic.code ? `[${diagnostic.code}] ` : '';
  return `${prefix}${diagnostic.message}`;
}

function runLeanProofCheck(leanFilePath: string): LeanCheckResult {
  const hasLakeWorkspace =
    fs.existsSync(path.join(GNOSIS_PACKAGE_ROOT, 'lakefile.lean')) ||
    fs.existsSync(path.join(GNOSIS_PACKAGE_ROOT, 'lakefile.toml'));
  const command = hasLakeWorkspace ? 'lake' : 'lean';
  const versionArgs = hasLakeWorkspace ? ['--version'] : ['--version'];
  const versionCheck = spawnSync(command, versionArgs, {
    cwd: hasLakeWorkspace ? GNOSIS_PACKAGE_ROOT : undefined,
    encoding: 'utf-8',
  });
  if (versionCheck.error) {
    const missingMessage =
      versionCheck.error instanceof Error
        ? versionCheck.error.message
        : String(versionCheck.error);
    return {
      attempted: false,
      ok: false,
      message: `skipped (${missingMessage})`,
    };
  }

  const result = spawnSync(
    command,
    hasLakeWorkspace ? ['env', 'lean', leanFilePath] : [leanFilePath],
    {
      cwd: hasLakeWorkspace ? GNOSIS_PACKAGE_ROOT : undefined,
      encoding: 'utf-8',
    }
  );
  if (result.error) {
    const errorMessage =
      result.error instanceof Error
        ? result.error.message
        : String(result.error);
    return {
      attempted: true,
      ok: false,
      message: errorMessage,
    };
  }

  const stderr = result.stderr.trim();
  const stdout = result.stdout.trim();
  const combinedOutput = `${stderr}\n${stdout}`;
  const missingMathlib =
    combinedOutput.includes("unknown module prefix 'Mathlib'") ||
    combinedOutput.includes("No directory 'Mathlib'") ||
    combinedOutput.includes("file 'Mathlib.olean'") ||
    combinedOutput.includes("unknown package 'Mathlib'");
  if (missingMathlib) {
    return {
      attempted: false,
      ok: false,
      message: hasLakeWorkspace
        ? 'skipped (Lean workspace found, but Mathlib is unavailable in the local Lake environment)'
        : 'skipped (Lean found, but Mathlib is unavailable in the current environment)',
    };
  }
  return {
    attempted: true,
    ok: result.status === 0,
    message:
      stderr.length > 0
        ? stderr
        : stdout.length > 0
        ? stdout
        : result.status === 0
        ? 'ok'
        : `exit ${result.status ?? 1}`,
  };
}

function steeringTraceEnabled(rawArgs: string[]): boolean {
  return !rawArgs.includes('--no-steering-trace');
}

function parsePositiveIntegerFlag(
  rawArgs: string[],
  flagName: string
): number | null {
  const rawValue = parseFlagValue(rawArgs, flagName);
  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseSteeringTraceWindow(rawArgs: string[]): number {
  return (
    parsePositiveIntegerFlag(rawArgs, '--steering-trace-window') ??
    DEFAULT_GNOSIS_STEERING_TRACE_WINDOW
  );
}

function parseSteeringRelayConfig(rawArgs: string[]) {
  const url =
    parseFlagValue(rawArgs, '--steering-aeon-relay-url') ??
    parseFlagValue(rawArgs, '--steering-relay-url') ??
    process.env.GNOSIS_STEERING_AEON_RELAY_URL ??
    process.env.GNOSIS_STEERING_RELAY_URL ??
    process.env.DASH_RELAY_WS_URL ??
    null;
  if (!url) {
    return null;
  }

  return {
    url,
    roomName:
      parseFlagValue(rawArgs, '--steering-aeon-relay-room') ??
      parseFlagValue(rawArgs, '--steering-relay-room') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_ROOM ??
      process.env.GNOSIS_STEERING_RELAY_ROOM ??
      defaultSteeringTraceRoomName(),
    apiKey:
      parseFlagValue(rawArgs, '--steering-aeon-relay-key') ??
      parseFlagValue(rawArgs, '--steering-relay-key') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_API_KEY ??
      process.env.GNOSIS_STEERING_RELAY_API_KEY ??
      undefined,
    clientId:
      parseFlagValue(rawArgs, '--steering-aeon-relay-client-id') ??
      parseFlagValue(rawArgs, '--steering-relay-client-id') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_CLIENT_ID ??
      process.env.GNOSIS_STEERING_RELAY_CLIENT_ID ??
      undefined,
    protocol:
      parseFlagValue(rawArgs, '--steering-aeon-relay-protocol') ??
      parseFlagValue(rawArgs, '--steering-relay-protocol') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_PROTOCOL ??
      process.env.GNOSIS_STEERING_RELAY_PROTOCOL ??
      undefined,
    joinMode:
      parseFlagValue(rawArgs, '--steering-aeon-relay-mode') ??
      parseFlagValue(rawArgs, '--steering-relay-mode') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_MODE ??
      process.env.GNOSIS_STEERING_RELAY_MODE ??
      undefined,
    relayProduct:
      parseFlagValue(rawArgs, '--steering-aeon-relay-product') ??
      parseFlagValue(rawArgs, '--steering-relay-product') ??
      process.env.GNOSIS_STEERING_AEON_RELAY_PRODUCT ??
      process.env.GNOSIS_STEERING_RELAY_PRODUCT ??
      undefined,
  };
}

function formatSteeringSummary(steering: GnosisSteeringMetrics): string {
  const parts = [
    `mode=${steering.mode}`,
    `apply-enabled=${steering.autoApplyEnabled}`,
    `apply-supported=${steering.applySupported}`,
  ];

  if (!surfaceSteeringMetrics(steering.mode)) {
    return parts.join(' ');
  }

  parts.push(
    `topology-deficit=${steering.topologyDeficit}`,
    `frontier-fill=${steering.frontierFill}`,
    `wallace=${steering.wallaceNumber}`,
    `unit=${steering.wallaceUnit}`,
    `regime=${steering.regime}`,
    `bias=${steering.leanInBias}`,
    `boundary-bias=${steering.boundaryWalkBias}`
  );

  if (steering.recommendedAction) {
    parts.push(`action=${steering.recommendedAction}`);
  }

  if (steering.failureBoundary.deterministicCollapseCandidate) {
    parts.push(`collapse=${steering.failureBoundary.collapseCostAction}`);
    parts.push(`paid-cost=${steering.failureBoundary.totalPaidCost}`);
    parts.push(`paid-stages=${steering.failureBoundary.paidStageCount}`);
    parts.push(`cost-floor=${steering.failureBoundary.collapseCostFloor}`);
  }

  if (steering.failureBoundary.zeroWasteCollapseRisk) {
    parts.push('free-collapse-risk=true');
  }

  if (steering.failureBoundary.freeCollapsePrefixRisk) {
    parts.push('prefix-risk=true');
  }

  if (steering.failureBoundary.contagiousRepairPressure) {
    parts.push('zero-vent-repair=true');
  }

  if (steering.telemetry.wallMicroCharleys !== null) {
    parts.push(`wall-uCharleys=${steering.telemetry.wallMicroCharleys}`);
  }

  if (steering.telemetry.cpuMicroCharleys !== null) {
    parts.push(`cpu-uCharleys=${steering.telemetry.cpuMicroCharleys}`);
  }

  if (steering.telemetry.wallToCpuRatio !== null) {
    parts.push(`wall/cpu=${steering.telemetry.wallToCpuRatio}`);
  }

  return parts.join(' ');
}

function formatSteeringEdaSummary(steering: GnosisSteeringMetrics): string {
  return [
    `frontier-median=${steering.eda.frontierWidths.summary.median.datum}`,
    `frontier-iqr=${steering.eda.frontierWidths.summary.iqr}`,
    `occupancy-median=${steering.eda.layerOccupancy.summary.median.datum}`,
    `graph-density=${steering.eda.graph.density}`,
    `graph-diameter=${steering.eda.graph.diameter}`,
    `outlier-nodes=${steering.eda.graphOutliers.length}`,
  ].join(' ');
}

function formatWallaceMetric(value: number): string {
  return `${value} wally${value === 1 ? '' : 's'}`;
}

function formatBuleyMetric(value: number): string {
  return `${value} bule${value === 1 ? '' : 's'}`;
}

function formatFailureBoundaryNarrative(
  steering: GnosisSteeringMetrics
): string | null {
  const { failureBoundary } = steering;
  if (
    !failureBoundary.deterministicCollapseCandidate &&
    !failureBoundary.contagiousRepairPressure
  ) {
    return null;
  }

  const parts = [`collapse cost: ${failureBoundary.collapseCostAction}`];

  if (failureBoundary.collapseCostFloor > 0) {
    parts.push(`floor=${failureBoundary.collapseCostFloor}`);
    parts.push(`paid=${failureBoundary.totalPaidCost}`);
  }

  if (failureBoundary.paidStageCount > 0) {
    parts.push(`paid-stages=${failureBoundary.paidStageCount}`);
  }

  if (failureBoundary.zeroWasteCollapseRisk) {
    parts.push('free collapse blocked');
  }

  if (failureBoundary.freeCollapsePrefixRisk) {
    parts.push(`prefix deficit=${failureBoundary.prefixCostDeficit}`);
  }

  if (failureBoundary.contagiousRepairPressure) {
    parts.push('zero-vent repair pressure');
  }

  return parts.join(' | ');
}

function emitSteeringTraceAlert(
  summary: Parameters<typeof formatSteeringTraceAlert>[0],
  status: Parameters<typeof formatSteeringTraceAlert>[1]
): void {
  const alert = formatSteeringTraceAlert(summary, status);
  if (alert) {
    console.error(`[Gnosis] ${alert}`);
  }
}

async function main() {
  // --fix flag: Global auto-format
  if (args.includes('--fix')) {
    const fileArg = args.find((a) => isGgTarget(a));
    if (fileArg) {
      const filePath = resolveTopologyPath(fileArg);
      if (fs.existsSync(filePath)) {
        console.log(`[Gnosis] Fixing topology: ${filePath}`);
        // polyglot:ignore RESOURCE_LEAK — readFileSync returns a string, no handle to release
        const source = fs.readFileSync(filePath, 'utf-8');
        const fixed = formatTopologySource(filePath, source);
        fs.writeFileSync(filePath, fixed, 'utf-8');
        console.log(
          `[Gnosis] Successfully formatted and fixed topological structure.`
        );
        process.exit(0);
      }
    }
  }

  const steeringMode = parseSteeringMode(args);
  if (!steeringMode) {
    console.error(
      `[Gnosis Error] Invalid --steering-mode value. Use one of: ${VALID_GNOSIS_STEERING_MODES.join(
        ', '
      )}`
    );
    process.exit(1);
  }

  if (args[0] === 'neo4j' && args[1]) {
    const filePath = resolveTopologyPath(args[1]);
    if (!fs.existsSync(filePath)) {
      console.error(`[Gnosis Error] File not found: ${filePath}`);
      process.exit(1);
    }
    const loadedTopology = await loadCliTopologySource(filePath);
    const nodeLabelFlag = args.indexOf('--node-label');
    const nodeLabel = nodeLabelFlag >= 0 ? args[nodeLabelFlag + 1] : undefined;
    const idPrefixFlag = args.indexOf('--id-prefix');
    const idPrefix = idPrefixFlag >= 0 ? args[idPrefixFlag + 1] : undefined;

    const bridge = new GnosisNeo4jBridge();
    const cypher = bridge.gglToCypher(loadedTopology.source, {
      nodeLabel,
      idPrefix,
    });
    console.log(cypher);
    process.exit(0);
  }

  if (args[0] === 'mod') {
    const modManager = new ModManager();
    try {
      if (args[1] === 'init' && args[2]) {
        modManager.init(args[2]);
      } else if (args[1] === 'tidy') {
        modManager.tidy();
      } else {
        console.error(
          `[Gnosis] Usage: gnosis mod init <module-name> | gnosis mod tidy`
        );
      }
    } catch (e: any) {
      console.error(`[Gnosis Error] ${e.message}`);
    }
    process.exit(0);
  } else if (args[0] === 'test' && args[1]) {
    const testPath = resolveTopologyPath(args[1]);
    if (!fs.existsSync(testPath)) {
      console.error(`[Gnosis Error] File not found: ${testPath}`);
      process.exit(1);
    }
    const { runGGTestFile, formatGGTestResults } = await import(
      './gg-test-runner.js'
    );
    const result = await runGGTestFile(testPath);
    const jsonOutput = args.includes('--json');
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatGGTestResults(result));
    }
    process.exit(result.ok ? 0 : 1);
  } else if (
    (args[0] === 'lint' ||
      args[0] === 'verify' ||
      args[0] === 'build' ||
      args[0] === 'analyze' ||
      args[0] === 'crank' ||
      args[0] === 'stank') &&
    args[1]
  ) {
    const filePath = resolveTopologyPath(args[1]);
    if (!fs.existsSync(filePath)) {
      console.error(`[Gnosis Error] File not found: ${filePath}`);
      process.exit(1);
    }
    const runtimeTarget = parseRuntimeTarget(args);
    if (!runtimeTarget) {
      console.error(
        `[Gnosis Error] Invalid --target value. Use one of: ${VALID_RUNTIME_TARGETS.join(
          ', '
        )}`
      );
      process.exit(1);
    }

    const sarifOutput = args.includes('--sarif');
    const jsonOutput = !sarifOutput && args.includes('--json');
    const wallaceOnly = args[0] === 'crank';
    const buleyOnly = args[0] === 'stank';
    if (isGgTarget(filePath)) {
      const maxBuley = parseMaxBuley(args);
      const loadedTopology = await loadCliTopologySource(filePath);
      const source = loadedTopology.source;
      const betty = new BettyCompiler();
      const compilerResult = betty.parse(source);
      const compilerErrors = compilerResult.diagnostics.filter(
        (diagnostic) => diagnostic.severity === 'error'
      );
      const report = await analyzeGnosisSource(source, {
        target: runtimeTarget,
        steeringMode,
      });
      const violations = formatGnosisViolations(report.correctness);
      const buleyExceeded = maxBuley !== null && report.buleyNumber > maxBuley;
      const capabilityErrors = report.capabilities.issues.filter(
        (issue) => issue.severity === 'error'
      );
      const ok =
        report.correctness.ok &&
        !buleyExceeded &&
        capabilityErrors.length === 0 &&
        compilerErrors.length === 0;
      const shouldGenerateTla = args[0] === 'verify' || args[0] === 'build';
      const shouldPrintTla = shouldGenerateTla && args.includes('--tla');
      const tlaOutputDir = shouldGenerateTla
        ? parseFlagValue(args, '--tla-out') ??
          (args[0] === 'build' ? path.join('tla', 'generated') : null)
        : null;
      const tlaModuleOverride = shouldGenerateTla
        ? parseFlagValue(args, '--tla-module')
        : null;
      const tlaBridge = shouldGenerateTla
        ? generateTlaFromGnosisSource(source, {
            moduleName: tlaModuleOverride ?? undefined,
            sourceFilePath: filePath,
          })
        : null;
      const shouldGenerateLean =
        shouldGenerateTla &&
        compilerErrors.length === 0 &&
        compilerResult.ast !== null &&
        compilerResult.stability !== null;
      const shouldPrintLean = shouldGenerateLean && args.includes('--lean');
      const leanOutputDir = shouldGenerateLean
        ? parseFlagValue(args, '--lean-out') ??
          (args[0] === 'build' ? path.join('lean', 'generated') : null)
        : null;
      const leanModuleOverride = shouldGenerateLean
        ? parseFlagValue(args, '--lean-module')
        : null;
      const leanArtifact = shouldGenerateLean
        ? generateLeanFromGnosisAst(
            compilerResult.ast,
            compilerResult.stability,
            {
              moduleName: leanModuleOverride ?? undefined,
              sourceFilePath: filePath,
            }
          )
        : null;
      let tlaWritePaths: TlaWritePaths | null = null;
      let leanWritePaths: LeanWritePaths | null = null;
      let leanCheck: LeanCheckResult | null = null;

      if (tlaBridge && tlaOutputDir) {
        const resolvedOutputDir = path.resolve(process.cwd(), tlaOutputDir);
        fs.mkdirSync(resolvedOutputDir, { recursive: true });

        const tlaFilePath = path.join(
          resolvedOutputDir,
          `${tlaBridge.moduleName}.tla`
        );
        const cfgFilePath = path.join(
          resolvedOutputDir,
          `${tlaBridge.moduleName}.cfg`
        );
        fs.writeFileSync(tlaFilePath, tlaBridge.tla, 'utf-8');
        fs.writeFileSync(cfgFilePath, tlaBridge.cfg, 'utf-8');

        tlaWritePaths = { tlaFilePath, cfgFilePath };
      }

      if (leanArtifact && leanOutputDir) {
        const resolvedOutputDir = path.resolve(process.cwd(), leanOutputDir);
        fs.mkdirSync(resolvedOutputDir, { recursive: true });

        const leanFilePath = path.join(
          resolvedOutputDir,
          `${leanArtifact.moduleName}.lean`
        );
        fs.writeFileSync(leanFilePath, leanArtifact.lean, 'utf-8');
        leanWritePaths = { leanFilePath };

        if (args[0] === 'build') {
          leanCheck = runLeanProofCheck(leanFilePath);
        }
      }

      const finalOk =
        ok && (!leanCheck || !leanCheck.attempted || leanCheck.ok);

      if (sarifOutput) {
        const sarif = ggReportToSarif(filePath, report, violations, maxBuley);
        console.log(JSON.stringify(sarif, null, 2));
      } else if (jsonOutput) {
        const basePayload: Record<string, unknown> = {
          filePath,
          mode: wallaceOnly
            ? 'wallace-check'
            : buleyOnly
            ? 'buley-check'
            : args[0] === 'build'
            ? 'build'
            : 'gg',
          ok: finalOk,
          buleyNumber: report.buleyNumber,
          wallaceNumber: report.steering.wallaceNumber,
          wallaceUnit: report.steering.wallaceUnit,
          buleyUnit: 'bule',
          maxBuley,
          compiler: {
            output: compilerResult.output,
            diagnostics: compilerResult.diagnostics,
            stability: compilerResult.stability,
          },
          line: report.line,
          topology: report.topology,
          quantum: report.quantum,
          steering: report.steering,
          capabilities: report.capabilities,
          correctness: {
            ok: report.correctness.ok,
            stateCount: report.correctness.stateCount,
            topology: report.correctness.topology,
            violationCount: report.correctness.violations.length,
            violations,
          },
        };

        if (loadedTopology.format === 'mgg') {
          basePayload.module = {
            format: loadedTopology.format,
            exports: loadedTopology.exports,
            imports: loadedTopology.imports,
          };
        }

        if (tlaBridge) {
          basePayload.tla = {
            moduleName: tlaBridge.moduleName,
            stats: tlaBridge.stats,
            outputPaths: tlaWritePaths,
            tla: shouldPrintTla ? tlaBridge.tla : undefined,
            cfg: shouldPrintTla ? tlaBridge.cfg : undefined,
          };
        }

        if (leanArtifact) {
          basePayload.lean = {
            moduleName: leanArtifact.moduleName,
            theoremName: leanArtifact.theoremName,
            outputPaths: leanWritePaths,
            check: leanCheck,
            source: shouldPrintLean ? leanArtifact.lean : undefined,
          };
        }

        console.log(JSON.stringify(basePayload, null, 2));
      } else {
        if (wallaceOnly) {
          console.log(`[Gnosis crank] ${filePath}`);
          console.log(
            `  Wallace metric: ${formatWallaceMetric(
              report.steering.wallaceNumber
            )}`
          );
          const failureBoundary = formatFailureBoundaryNarrative(
            report.steering
          );
          if (failureBoundary) {
            console.log(`  failure boundary: ${failureBoundary}`);
          }
          console.log(`  steering: ${formatSteeringSummary(report.steering)}`);
          console.log(
            `  steering-eda: ${formatSteeringEdaSummary(report.steering)}`
          );
          console.log(
            `  correctness: ${
              report.correctness.ok ? 'PASS' : 'FAIL'
            } (states=${report.correctness.stateCount}, beta1=${
              report.correctness.topology.beta1
            })`
          );
          console.log(
            `  compiler: ${
              compilerErrors.length === 0 ? 'PASS' : 'FAIL'
            } (diagnostics=${compilerResult.diagnostics.length})`
          );
        } else if (buleyOnly) {
          console.log(`[Gnosis stank] ${filePath}`);
          console.log(
            `  Buley metric: ${formatBuleyMetric(report.buleyNumber)}${
              maxBuley !== null ? ` (max=${maxBuley})` : ''
            }`
          );
          console.log(`  quantum-index: ${report.quantum.quantumIndex}`);
          console.log(`  beta-pressure: ${report.quantum.betaPressure}`);
          console.log(`  beta-headroom: ${report.quantum.betaHeadroom}`);
          console.log(
            `  correctness: ${
              report.correctness.ok ? 'PASS' : 'FAIL'
            } (states=${report.correctness.stateCount}, beta1=${
              report.correctness.topology.beta1
            })`
          );
          console.log(
            `  compiler: ${
              compilerErrors.length === 0 ? 'PASS' : 'FAIL'
            } (diagnostics=${compilerResult.diagnostics.length})`
          );
        } else {
          console.log(`[Gnosis ${args[0]}] ${filePath}`);
          console.log(
            `  correctness: ${
              report.correctness.ok ? 'PASS' : 'FAIL'
            } (states=${report.correctness.stateCount}, beta1=${
              report.correctness.topology.beta1
            })`
          );
          console.log(
            `  compiler: ${
              compilerErrors.length === 0 ? 'PASS' : 'FAIL'
            } (diagnostics=${compilerResult.diagnostics.length})`
          );
          if (loadedTopology.format === 'mgg') {
            console.log(`  module-format: ${loadedTopology.format}`);
            if (loadedTopology.exports.length > 0) {
              console.log(
                `  module-exports: ${loadedTopology.exports.join(', ')}`
              );
            }
            if (loadedTopology.imports.length > 0) {
              console.log(
                `  module-imports: ${loadedTopology.imports.join('; ')}`
              );
            }
          }
          console.log(
            `  Buley metric: ${formatBuleyMetric(report.buleyNumber)}${
              maxBuley !== null ? ` (max=${maxBuley})` : ''
            }`
          );
          console.log(`  runtime-target: ${report.capabilities.target}`);
          console.log(
            `  lines: total=${report.line.totalLines} non-empty=${report.line.nonEmptyLines} comments=${report.line.commentLines} topology=${report.line.topologyLines}`
          );
          console.log(
            `  topology: nodes=${report.topology.nodeCount} functions=${report.topology.functionNodeCount} edges=${report.topology.edgeCount} forks=${report.topology.forkEdgeCount} races=${report.topology.raceEdgeCount} folds=${report.topology.foldEdgeCount} vents=${report.topology.ventEdgeCount} interfere=${report.topology.interfereEdgeCount}`
          );
          console.log(
            `  complexity: max-branch=${report.topology.maxBranchFactor} avg-branch=${report.topology.avgBranchFactor} cyclomatic≈${report.topology.cyclomaticApprox}`
          );
          console.log(
            `  quantum: superposition=${report.quantum.superpositionEdgeCount} collapse=${report.quantum.collapseEdgeCount} coverage=${report.quantum.collapseCoverage} deficit=${report.quantum.collapseDeficit} interference-density=${report.quantum.interferenceDensity}`
          );
          console.log(
            `  quantum-index: ${report.quantum.quantumIndex} beta-pressure=${report.quantum.betaPressure} beta-headroom=${report.quantum.betaHeadroom}`
          );
          if (compilerResult.stability) {
            console.log(
              `  thermodynamics: spectral-radius=${
                compilerResult.stability.spectralRadius ?? 'n/a'
              } redline=${compilerResult.stability.redline ?? 'n/a'} ceiling=${
                compilerResult.stability.geometricCeiling ?? 'n/a'
              } proof=${compilerResult.stability.proof.kind}`
            );
            if (compilerResult.stability.metadata.countableQueueCertified) {
              console.log(
                `  laminar-proof: queue-boundary=${
                  compilerResult.stability.metadata.queueBoundary ?? 'n/a'
                } atom=${
                  compilerResult.stability.metadata.laminarAtom ?? 'n/a'
                } potential=${
                  compilerResult.stability.metadata.queuePotential ?? 'n/a'
                } theorem=${
                  compilerResult.stability.metadata
                    .laminarGeometricTheoremName ?? 'n/a'
                } measurable-theorem=${
                  compilerResult.stability.metadata
                    .measurableHarrisTheoremName ?? 'n/a'
                } measurable-laminar=${
                  compilerResult.stability.metadata
                    .measurableLaminarTheoremName ?? 'n/a'
                } measurable-quantitative=${
                  compilerResult.stability.metadata
                    .measurableQuantitativeLaminarTheoremName ?? 'n/a'
                } measurable-q-harris=${
                  compilerResult.stability.metadata
                    .measurableQuantitativeHarrisTheoremName ?? 'n/a'
                } measurable-finite-harris=${
                  compilerResult.stability.metadata
                    .measurableFiniteTimeHarrisTheoremName ?? 'n/a'
                } measurable-harris-recurrent=${
                  compilerResult.stability.metadata
                    .measurableHarrisRecurrentTheoremName ?? 'n/a'
                } measurable-finite-geometric=${
                  compilerResult.stability.metadata
                    .measurableFiniteTimeGeometricErgodicTheoremName ?? 'n/a'
                } measurable-lp-geometric=${
                  compilerResult.stability.metadata
                    .measurableLevyProkhorovGeometricErgodicTheoremName ?? 'n/a'
                } measurable-lp-decay=${
                  compilerResult.stability.metadata
                    .measurableLevyProkhorovGeometricDecayTheoremName ?? 'n/a'
                } measurable-lp-abstract=${
                  compilerResult.stability.metadata
                    .measurableLevyProkhorovAbstractGeometricErgodicTheoremName ??
                  'n/a'
                } measurable-witness-q-harris=${
                  compilerResult.stability.metadata
                    .measurableWitnessQuantitativeHarrisTheoremName ?? 'n/a'
                }`
              );
              if (compilerResult.stability.metadata.continuousHarris) {
                console.log(
                  `  continuous-proof: kind=${compilerResult.stability.metadata.continuousHarris.observableKind} observable=${compilerResult.stability.metadata.continuousHarris.observableExpression} lyapunov=${compilerResult.stability.metadata.continuousHarris.lyapunovExpression} drift=${compilerResult.stability.metadata.continuousHarris.observableDriftTheoremName} theorem=${compilerResult.stability.metadata.continuousHarris.continuousHarrisTheoremName}`
                );
              }
            }
            for (const fabric of compilerResult.stability.metadata
              .heteroMoAFabrics ?? []) {
              console.log(
                `  hetero-fabric: id=${fabric.fabricNodeId} layers=${fabric.activeLayerCount} lanes=${fabric.totalLaneCount} pairs=${fabric.pairCount} mirrored=${fabric.mirroredKernelCount} schedule=${fabric.scheduleStrategy} gate=${fabric.launchGate} hedge=${fabric.hedgeDelayTicks} protocol=${fabric.frameProtocol} lowering=${fabric.loweringTheoremName} cannon=${fabric.cannonTheoremName} pair=${fabric.pairTheoremName} waste=${fabric.wasteTheoremName} coupled=${fabric.coupledTheoremName}`
              );
            }
          }
          if (surfaceSteeringMetrics(report.steering.mode)) {
            const failureBoundary = formatFailureBoundaryNarrative(
              report.steering
            );
            console.log(
              `  Wallace metric: ${formatWallaceMetric(
                report.steering.wallaceNumber
              )}`
            );
            console.log(
              `  steering: ${formatSteeringSummary(report.steering)}`
            );
            if (failureBoundary) {
              console.log(`  failure boundary: ${failureBoundary}`);
            }
            console.log(
              `  steering-eda: ${formatSteeringEdaSummary(report.steering)}`
            );
          }
        }
        if (report.capabilities.requiredUnique.length > 0) {
          console.log(
            `  required-capabilities: ${report.capabilities.requiredUnique.join(
              ', '
            )}`
          );
        }
        if (tlaBridge) {
          console.log(
            `  tla-module: ${tlaBridge.moduleName} (nodes=${tlaBridge.stats.nodeCount}, edges=${tlaBridge.stats.edgeCount}, roots=${tlaBridge.stats.rootCount}, terminals=${tlaBridge.stats.terminalCount})`
          );
          if (tlaWritePaths) {
            console.log(
              `  tla-files: ${tlaWritePaths.tlaFilePath}, ${tlaWritePaths.cfgFilePath}`
            );
          } else {
            console.log(
              `  tla-hint: pass --tla to print spec/cfg or --tla-out <dir> to write files`
            );
          }
          if (shouldPrintTla) {
            console.log('\n[TLA+ Spec]');
            console.log(tlaBridge.tla);
            console.log('[TLC Config]');
            console.log(tlaBridge.cfg);
          }
        }
        if (leanArtifact) {
          console.log(
            `  lean-theorem: ${leanArtifact.theoremName} (module=${leanArtifact.moduleName})`
          );
          if (leanWritePaths) {
            console.log(`  lean-file: ${leanWritePaths.leanFilePath}`);
          }
          if (leanCheck) {
            const leanStatus = leanCheck.attempted
              ? leanCheck.ok
                ? 'PASS'
                : 'FAIL'
              : 'SKIP';
            console.log(`  lean-check: ${leanStatus} ${leanCheck.message}`);
          } else {
            console.log(
              `  lean-hint: pass --lean to print the generated proof or --lean-out <dir> to write it`
            );
          }
          if (shouldPrintLean) {
            console.log('\n[Lean Proof]');
            console.log(leanArtifact.lean);
          }
        }
        if (compilerResult.diagnostics.length > 0) {
          for (const diagnostic of compilerResult.diagnostics) {
            const prefix = diagnostic.severity === 'error' ? 'error' : 'warn';
            console.error(
              `  ${prefix}: ${formatCompilerDiagnostic(diagnostic)}`
            );
          }
        }
        if (violations.length > 0) {
          violations.forEach((line) => console.error(`  ${line}`));
        }
        if (buleyExceeded) {
          console.error(
            `  buley-threshold-failed: ${report.buleyNumber} > ${maxBuley}`
          );
        }
        if (report.capabilities.issues.length > 0) {
          for (const issue of report.capabilities.issues) {
            const prefix = issue.severity === 'error' ? 'error' : 'warn';
            console.error(
              `  ${prefix}: [${issue.capability}] ${issue.message}`
            );
          }
        }
      }

      process.exit(finalOk ? 0 : 1);
    }

    const tsReport = analyzeTypeScriptTargets(
      [filePath],
      parseTsSonarThresholds(args)
    );
    if (sarifOutput) {
      const sarif = tsReportToSarif(filePath, tsReport);
      console.log(JSON.stringify(sarif, null, 2));
    } else if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            mode: 'typescript',
            target: filePath,
            ...tsReport,
          },
          null,
          2
        )
      );
    } else {
      console.log(`[Gnosis ${args[0]}:ts] ${filePath}`);
      console.log(`  status: ${tsReport.ok ? 'PASS' : 'FAIL'}`);
      console.log(
        `  files=${tsReport.fileCount} lines=${tsReport.totals.totalLines} code=${tsReport.totals.codeLines} comments=${tsReport.totals.commentLines}`
      );
      console.log(
        `  structures: functions=${tsReport.totals.functionCount} classes=${tsReport.totals.classCount} interfaces=${tsReport.totals.interfaceCount} types=${tsReport.totals.typeAliasCount}`
      );
      console.log(
        `  complexity: max-cyclomatic=${tsReport.totals.maxCyclomatic} max-cognitive=${tsReport.totals.maxCognitive} max-nesting=${tsReport.totals.maxNesting} max-function-lines=${tsReport.totals.maxFunctionLines}`
      );
      console.log(
        `  totals: cyclomatic=${tsReport.totals.totalCyclomatic} cognitive=${tsReport.totals.totalCognitive} branches=${tsReport.totals.branchCount} loops=${tsReport.totals.loopCount}`
      );
      if (tsReport.hotspots.byCognitive.length > 0) {
        const hotspot = tsReport.hotspots.byCognitive[0];
        console.log(
          `  hotspot(cognitive): ${hotspot.filePath}:${hotspot.startLine} ${hotspot.name}=${hotspot.cognitive}`
        );
      }
      if (tsReport.violations.length > 0) {
        tsReport.violations.forEach((line) => console.error(`  ${line}`));
      }
    }

    process.exit(tsReport.ok ? 0 : 1);
  } else if (
    args[0] === 'lint' ||
    args[0] === 'verify' ||
    args[0] === 'build' ||
    args[0] === 'analyze' ||
    args[0] === 'crank' ||
    args[0] === 'stank'
  ) {
    console.error(
      `[Gnosis] Usage: gnosis ${args[0]} <target> [--target <agnostic|workers|node|bun>] [--steering-mode <off|report|suggest|apply>] [--max-buley <number>] [--max-file-lines <number>] [--max-function-lines <number>] [--max-cyclomatic <number>] [--max-cognitive <number>] [--max-nesting <number>] [--json] [--sarif] [--tla] [--tla-out <dir>] [--tla-module <name>] [--lean] [--lean-out <dir>] [--lean-module <name>]`
    );
    process.exit(1);
  } else if ((args[0] === 'run' || args[0] === 'native') && args[1]) {
    const filePath = resolveTopologyPath(args[1]);
    if (!fs.existsSync(filePath)) {
      console.error(`[Gnosis Error] File not found: ${filePath}`);
      process.exit(1);
    }
    const useNativeRuntime = args[0] === 'native' || args.includes('--native');
    const shouldPersistSteeringTrace = steeringTraceEnabled(args);
    const steeringTraceWindow = parseSteeringTraceWindow(args);
    const steeringRelayConfig = parseSteeringRelayConfig(args);
    const explicitExecutionAuth = parseExecutionAuth(args);
    const initialPayload =
      args[1] === 'betti.gg' ? 'transformer.gg' : 'GPT_INIT';
    const steeringTraceStore = shouldPersistSteeringTrace
      ? new GnosisSteeringTraceStore({
          recentWindow: steeringTraceWindow,
          relay: steeringRelayConfig,
          executionAuth: explicitExecutionAuth,
        })
      : null;

    console.log(`[Gnosis] Reading topology from ${filePath}...`);
    const loadedTopology = await loadCliTopologySource(filePath);
    const content = loadedTopology.source;
    const betty = new BettyCompiler();
    const { ast, output, diagnostics, stability } = betty.parse(content);
    if (!ast) {
      console.error(`[Gnosis Error] Failed to parse AST.`);
      process.exit(1);
    }
    const compilerErrors = diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'error'
    );
    if (compilerErrors.length > 0) {
      console.error(`[Gnosis] Compiler validation failed before execution.`);
      for (const diagnostic of diagnostics) {
        console.error(`  ${formatCompilerDiagnostic(diagnostic)}`);
      }
      process.exit(1);
    }
    const boundaryWalkExecutionAuth = await resolveBoundaryWalkExecutionAuth({
      ast,
      initialPayload,
      explicitExecutionAuth,
    });
    assertBoundaryWalkAuthorized({
      source: content,
      steeringMode,
      executionAuth: boundaryWalkExecutionAuth,
    });

    const runtimeReport = await analyzeGnosisSource(content, { steeringMode });
    if (!runtimeReport.correctness.ok) {
      console.error(`[Gnosis] Formal verification failed before execution.`);
      formatGnosisViolations(runtimeReport.correctness).forEach((line) => {
        console.error(`  ${line}`);
      });
      process.exit(1);
    }
    console.log(
      `[Gnosis] Formal check passed. Buley Number: ${runtimeReport.buleyNumber}, Quantum Index: ${runtimeReport.quantum.quantumIndex}`
    );
    if (surfaceSteeringMetrics(runtimeReport.steering.mode)) {
      console.log(
        `[Gnosis] Steering: ${formatSteeringSummary(runtimeReport.steering)}`
      );
      console.log(
        `[Gnosis] Steering EDA: ${formatSteeringEdaSummary(
          runtimeReport.steering
        )}`
      );
    }

    console.log(output);

    console.log(`\n[Gnosis] Executing topology...`);
    try {
      const persistSteeringTrace = async (
        steering: GnosisSteeringMetrics,
        outcome: 'ok' | 'error',
        errorMessage: string | null,
        activeExecutionAuth: GnosisExecutionAuthContext | null
      ): Promise<void> => {
        if (!steeringTraceStore) {
          return;
        }

        steeringTraceStore.setExecutionAuth(activeExecutionAuth);
        await steeringTraceStore.connect();

        const traceRecord = createSteeringTraceRecord({
          command: useNativeRuntime ? 'native' : 'run',
          filePath,
          source: content,
          report: runtimeReport,
          steering,
          payload: initialPayload,
          outcome,
          errorMessage,
        });
        steeringTraceStore.append(traceRecord);
        const steeringTraceSummary = steeringTraceStore.summarize({
          cohortKey: traceRecord.cohortKey,
        });
        const traceStatus = steeringTraceStore.status;
        const prefix =
          outcome === 'error' ? 'STEERING FAILURES' : 'Steering Trace';
        const printer = outcome === 'error' ? console.error : console.log;
        printer(
          `[Gnosis] ${prefix}: ${formatSteeringTraceStoreStatus(
            traceStatus
          )} ${formatSteeringTraceSummary(steeringTraceSummary)}${
            errorMessage ? ` latest="${errorMessage}"` : ''
          }`
        );
        emitSteeringTraceAlert(steeringTraceSummary, traceStatus);
      };

      const registry = new GnosisRegistry();
      registerCoreAuthHandlers(registry);

      const loadWeights = (tomlPath: string, section: string) => {
        const fullPath = path.resolve(process.cwd(), tomlPath);
        if (!fs.existsSync(fullPath))
          throw new Error(`Weights file not found: ${fullPath}`);
        // polyglot:ignore RESOURCE_LEAK — readFileSync returns a string, no handle to release
        const content = fs.readFileSync(fullPath, 'utf-8');
        try {
          const parsed = (Bun as any).TOML.parse(content);
          return parsed[section];
        } catch (e: any) {
          throw new Error(`TOML Parse Error in ${tomlPath}: ${e.message}`);
        }
      };

      // Source: Reads initial data
      registry.register('Source', async (payload, props) => {
        const dataRaw = props['data'] || '[1.0, 2.0]';
        try {
          return JSON.parse(dataRaw);
        } catch (e) {
          const matches = dataRaw.match(/-?\d+\.?\d*/g);
          if (matches) return matches.map(Number);
          return [1.0, 2.0];
        }
      });

      // Linear: Matrix Multiplication using Aeon Pipelines
      registry.register('Linear', async (payload, props) => {
        const section = props['section'] || 'l1';
        const weightsData = loadWeights(
          props['weights'] || 'weights.toml',
          section
        );
        const w = weightsData.weights as number[][];
        const b = weightsData.bias as number[];
        const x = payload as number[];

        const rowWork = w.map((row, i) => async () => {
          const dotProduct = row.reduce(
            (acc, val, j) => acc + val * (x[j] || 0),
            0
          );
          return dotProduct + (b[i] || 0);
        });

        return await Pipeline.from(rowWork).fold({
          type: 'merge-all',
          merge: (results: Map<number, any>) =>
            Array.from(results.values()).map((r) => r),
        });
      });

      // Activation: Parallel ReLU
      registry.register('Activation', async (payload, props) => {
        const x = payload as number[];
        const work = x.map((v) => async () => Math.max(0, v));

        return await Pipeline.from(work).fold({
          type: 'merge-all',
          merge: (results: Map<number, any>) =>
            Array.from(results.values()).map((r) => r),
        });
      });

      // Attention: Weighted parallel evolution
      registry.register('Attention', async (payload, props) => {
        const x = payload as number[];
        console.log(
          `[WASM:Attention] Pipelining ${x.length}-dim wave function...`
        );

        const work = x.map((v) => async () => {
          await new Promise((r) => setTimeout(r, 10));
          return v * 1.5;
        });

        return await Pipeline.from(work).fold({
          type: 'merge-all',
          merge: (results: Map<number, any>) =>
            Array.from(results.values()).map((r) => r),
        });
      });

      // Softmax: Pipelined normalization with topological Venting
      registry.register('Softmax', async (payload, props) => {
        const x = payload as number[];
        const threshold = parseFloat(props['threshold'] || '0.001');
        const expWork = x.map((v) => async () => Math.exp(v));

        const exps = await Pipeline.from(expWork)
          .vent((val: number) => val < threshold)
          .fold({
            type: 'merge-all',
            merge: (results: Map<number, any>) =>
              Array.from(results.values()).map((r) => r),
          });

        const sum = (exps as number[]).reduce(
          (a: number, b: number) => a + b,
          0
        );
        return (exps as number[]).map((v: number) => v / sum);
      });

      // Compiler Handlers for Betti self-hosting
      registerBettiHandlers(registry);

      // Twokeys Statistical Handlers
      registry.register('Statistics', async (payload, props) => {
        const op = props['op'] || 'describe';
        console.log(`[Twokeys:Statistics] Running ${op}...`);

        if (Array.isArray(payload) && typeof payload[0] === 'number') {
          const series = new (twokeys as any).Series({ data: payload });
          if (op === 'mean') return series.mean();
          if (op === 'median') return series.median().datum;
          if (op === 'outliers') return series.outliers();
          if (op === 'describe') return series.describe();
        }

        if (Array.isArray(payload) && Array.isArray(payload[0])) {
          const points = new (twokeys as any).Points({ data: payload });
          if (op === 'centroid') return points.centroid();
          if (op === 'describe') return points.describe();
        }

        return payload;
      });

      registry.register('Graph', async (payload, props) => {
        const op = props['op'] || 'pageRank';
        console.log(`[Twokeys:Graph] Running ${op}...`);

        const nodes = payload.nodes || [];
        const edges = payload.edges || [];

        if (op === 'pageRank') return (twokeys as any).pageRank(nodes, edges);
        if (op === 'louvain')
          return (twokeys as any).louvainCommunities(nodes, edges);
        if (op === 'eda') return (twokeys as any).graphEda(nodes, edges);

        return payload;
      });

      // Aeon-Flux Core Handlers
      registry.register('Router', async (payload, props) => {
        const path = payload.path || '/';
        console.log(`[Aeon-Flux:Router] Matching route for: ${path}`);
        return {
          route: 'ManuscriptPage',
          componentId: 'Ch17',
          sessionId: 'aeon-001',
        };
      });

      registry.register('UserContext', async (payload, props) => {
        console.log(`[Aeon-Flux:UserContext] Extracting context...`);
        return {
          userId: 'buley',
          device: 'darwin',
          preferences: { theme: 'dark' },
        };
      });

      registry.register('TreeBuilder', async (payload, props) => {
        console.log(`[Aeon-Flux:TreeBuilder] Building component tree...`);
        return { rootId: 'shell', nodes: [{ id: 'Ch17', type: 'page' }] };
      });

      registry.register('Decision', async (payload, props) => {
        const { context, tree } = payload;
        console.log(
          `[Aeon-Flux:Decision] Personalizing for ${context?.userId}...`
        );
        return {
          prefetch: ['/next-chapter'],
          theme: context?.preferences?.theme || 'light',
        };
      });

      registry.register('Renderer', async (payload, props) => {
        const type = props['type'] || 'html';
        console.log(`[Aeon-Flux:Renderer] Rendering ${type}...`);
        return renderWithTopologyCompat(payload, props);
      });

      const nativeRuntime = useNativeRuntime ? new GnosisNativeRuntime() : null;
      nativeRuntime?.setStabilityMetadata(stability?.metadata ?? null);
      const engine = new GnosisEngine(registry, {
        onEdgeEvaluated: nativeRuntime
          ? async (edge) => {
              await nativeRuntime.onEdge(edge);
            }
          : undefined,
      });

      const steeringStopwatch = startSteeringTelemetry();
      try {
        const execOutput = await engine.execute(ast, initialPayload, {
          executionAuth: explicitExecutionAuth,
        });
        const executedSteering = withSteeringTelemetry(
          runtimeReport.steering,
          finishSteeringTelemetry(steeringStopwatch)
        );
        const activeExecutionAuth =
          engine.executionAuth ??
          explicitExecutionAuth ??
          boundaryWalkExecutionAuth;
        console.log(execOutput);
        if (surfaceSteeringMetrics(executedSteering.mode)) {
          console.log(
            `[Gnosis] Runtime Steering: ${formatSteeringSummary(
              executedSteering
            )}`
          );
          await persistSteeringTrace(
            executedSteering,
            'ok',
            null,
            activeExecutionAuth
          );
        }
        if (nativeRuntime) {
          const runtimeSnapshot = nativeRuntime.snapshot();
          console.log(
            `[Gnosis Native Runtime] wasm=${runtimeSnapshot.wasmEnabled} edges=${runtimeSnapshot.edgesProcessed}`
          );
          console.log(`[Gnosis Native Runtime] ${runtimeSnapshot.metrics}`);
          if (runtimeSnapshot.trace.trim().length > 0) {
            console.log('[Gnosis Native Runtime] Trace:');
            console.log(runtimeSnapshot.trace);
          }
        }
        process.exit(0);
      } catch (executionError) {
        const failedSteering = withSteeringTelemetry(
          runtimeReport.steering,
          finishSteeringTelemetry(steeringStopwatch)
        );
        const activeExecutionAuth =
          engine.executionAuth ??
          explicitExecutionAuth ??
          boundaryWalkExecutionAuth;
        const message =
          executionError instanceof Error
            ? executionError.message
            : String(executionError);

        if (surfaceSteeringMetrics(failedSteering.mode)) {
          console.error(
            `[Gnosis] STEERING FAILURE: ${formatSteeringSummary(
              failedSteering
            )}`
          );
          if (steeringTraceStore) {
            try {
              await persistSteeringTrace(
                failedSteering,
                'error',
                message,
                activeExecutionAuth
              );
            } catch (traceError) {
              console.error(
                `[Gnosis] STEERING TRACE FAILURE: ${formatError(traceError)}`
              );
            }
          }
        }
        throw executionError;
      }
    } catch (err: any) {
      console.error(`[Execution Error] ${err.message}`);
      process.exit(1);
    }
  } else if (args[0] === 'run' || args[0] === 'native') {
    console.error(
      '[Gnosis] Usage: gnosis run <topology.gg|topology.mgg> [--native] [--steering-mode <off|report|suggest|apply>] [--steering-trace-window <n>] [--steering-relay-url <wss://...>] [--steering-relay-room <room>] [--steering-relay-key <key>] [--steering-relay-client-id <id>] [--steering-relay-protocol <protocol>] [--steering-relay-mode <mode>] [--steering-relay-product <label>] [--execution-auth-json <json> | --execution-auth-file <path>] [--no-steering-trace]'
    );
    console.error(
      '[Gnosis] Usage: gnosis native <topology.gg|topology.mgg> [--steering-mode <off|report|suggest|apply>] [--steering-trace-window <n>] [--steering-relay-url <wss://...>] [--steering-relay-room <room>] [--steering-relay-key <key>] [--steering-relay-client-id <id>] [--steering-relay-protocol <protocol>] [--steering-relay-mode <mode>] [--steering-relay-product <label>] [--execution-auth-json <json> | --execution-auth-file <path>] [--no-steering-trace]'
    );
    process.exit(1);
  } else {
    const { startRepl } = await import('./repl.js');
    startRepl({
      verbose: verboseMode,
      steeringMode,
      steeringTraceWindow: parseSteeringTraceWindow(args),
      steeringRelayConfig: parseSteeringRelayConfig(args),
      executionAuth: parseExecutionAuth(args),
    });
  }
}

export async function runCli(): Promise<void> {
  await main();
}

function isCliEntrypoint(): boolean {
  const argvPath = process.argv[1];
  if (!argvPath) {
    return false;
  }

  try {
    const entryPath = path.resolve(argvPath);
    const currentPath = resolveCurrentGnosisFilePath();
    if (!currentPath) {
      return false;
    }
    return entryPath === currentPath;
  } catch {
    return false;
  }
}

if (isCliEntrypoint()) {
  void runCli();
}
