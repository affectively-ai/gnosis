// Void primitives — the foundation everything reduces to
export {
  // Boundary
  type VoidBoundary,
  createVoidBoundary,
  updateVoidBoundary,
  decayVoidBoundary,
  boundaryDimensions,
  // Complement distribution
  complementDistribution,
  sampleComplement,
  // Measurement
  type Measurement,
  measure,
  shannonEntropy,
  excessKurtosis,
  giniCoefficient,
  inverseBule,
  // Gait
  type Gait,
  GAIT_DEPTH,
  selectGait,
  // Timescale
  type Timescale,
  TIMESCALE_DECAY,
  type TimescaleBoundary,
  createTimescaleBoundary,
  tickTimescaleBoundary,
  // Boundary stack
  type BoundaryStack,
  createBoundaryStack,
  upwardConstraint,
  downwardContext,
  tickBoundaryStack,
  flattenStack,
  measureStack,
  // Resonance
  type Resonance,
  createResonance,
  // Projection
  projectBoundary,
  // Walker
  type Walker,
  createWalker,
  c0Choose,
  c0Update,
  c1Measure,
  c2c3Adapt,
  // Stack walker
  type StackWalker,
  createStackWalker,
  stepStackWalker,
  measureStackWalker,
} from './void.js';

// Void topology — any GraphAST as a walkable void boundary
export {
  type VoidTopology,
  type ExecutionStep,
  type BranchSelection,
  createVoidTopology,
  rankForkTargets,
  selectActiveBranches,
  sampleSuperposition,
  recordExecution,
  recordEdgeTraversal,
  chooseNext,
  topologyToBoundaryStack,
  measureTopology,
  EDGE_VOID_SEMANTICS,
} from './void-topology.js';

// Void handlers — make void-walking.gg executable
export {
  type VoidWalkingPayload,
  registerVoidWalkingHandlers,
  createVoidWalkingPayload,
} from './void-handlers.js';

// Void agent — METACOG: the agent primitive
export {
  type VoidAgent,
  type VoidAgentConfig,
  type PersonalityLayerConfig,
  type AgentTick,
  createVoidAgent,
  bond,
  perceive,
  perceiveOther,
  decide,
  observe,
  reflect,
  adapt,
  tick,
  completeTick,
  step,
  personalityVector,
  actionPreferences,
  rejectionProfile,
  metacogState,
} from './void-agent.js';

export { GnosisNeo4jBridge } from './neo4j-bridge.js';
export { GnosisRegistry } from './runtime/registry.js';
export { GnosisEngine } from './runtime/engine.js';
export { GnosisCoreCache } from './runtime/core-cache.js';
export {
  compileTopology,
  executeCompiled,
  executeCompiledSync,
  compileSyncTopology,
  codegenSyncExecutor,
  CannonLauncher,
} from './runtime/compiled-topology.js';
export type {
  CompiledTopology,
  CompiledSyncTopology,
  CompiledStep,
  CompiledSyncStep,
  CompiledFork,
  CompiledExecutionResult,
  SyncHandler,
} from './runtime/compiled-topology.js';
export { BettyCompiler } from './betty/compiler.js';
export { generateLeanFromGnosisAst } from './betty/lean.js';
export {
  compileLilith,
  compileLilithAsync,
  loadLilith,
  detectBackend,
  detectBackendAsync,
  type LilithResult,
  type LilithInstance,
  type LilithBackend,
} from './lilith.js';
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
  analyzeGnosisSource,
  classifySteeringBias,
  createEmptySteeringTelemetry,
  deriveBoundaryWalkBias,
  formatGnosisViolations,
  DEFAULT_GNOSIS_STEERING_MODE,
  finishSteeringTelemetry,
  startSteeringTelemetry,
  VALID_GNOSIS_STEERING_MODES,
  classifySteeringRegime,
  recommendSteeringAction,
  surfaceSteeringMetrics,
  surfaceSteeringRecommendations,
  withSteeringTelemetry,
} from './analysis.js';
export {
  buildBehavioralLoopExecutionTopology,
  buildBehavioralTaxonomyTopology,
  executeBehavioralLoop,
  formatBehavioralTaxonomyMeasurement,
  loadBehavioralLoopsDataset,
  measureBehavioralTaxonomy,
  measureBehavioralTaxonomySelection,
  selectBehavioralTaxonomy,
  writeBehavioralLoopExecutionArtifacts,
} from './behavioral-taxonomy.js';
export {
  authorizeBoundaryWalkRun,
  DEFAULT_GNOSIS_STEERING_TRACE_GUID,
  createSteeringTraceRecord,
  fingerprintSteeringTopology,
  formatSteeringTraceAlert,
  defaultSteeringTraceRoomName,
  formatSteeringTraceStoreStatus,
  formatSteeringTraceSummary,
  GnosisSteeringTraceStore,
  summarizeSteeringTraceRecords,
} from './steering-trace.js';

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
  GnosisAnalyzeOptions,
  GnosisCapabilityReport,
  GnosisCollapseCostAction,
  GnosisComplexityReport,
  GnosisFailureTrilemmaMetrics,
  GnosisLineMetrics,
  GnosisQuantumMetrics,
  GnosisSteeringAction,
  GnosisSteeringBias,
  GnosisSteeringEda,
  GnosisSteeringMetrics,
  GnosisSteeringMode,
  GnosisSteeringRegime,
  GnosisSteeringStopwatch,
  GnosisSteeringTelemetry,
  GnosisTopologyMetrics,
} from './analysis.js';
export type {
  BehavioralExecutionContext,
  BehavioralExecutionInterventionKind,
  BehavioralExecutionMode,
  BehavioralExecutionPayload,
  BehavioralExecutionStatus,
  BehavioralLoopArtifactManifest,
  BehavioralLoopArtifactManifestEntry,
  BehavioralLoopArtifactWriteOptions,
  BehavioralLoopCategoryRecord,
  BehavioralLoopExecution,
  BehavioralLoopIntervention,
  BehavioralLoopLogic,
  BehavioralLoopMeta,
  BehavioralLoopOperator,
  BehavioralLoopRecord,
  BehavioralLoopTaxonomy,
  BehavioralLoopsDataset,
  BehavioralTaxonomyMeasureOptions,
  BehavioralTaxonomyMeasurement,
  BehavioralTaxonomySelection,
  BehavioralTaxonomySelectionOptions,
} from './behavioral-taxonomy.js';
export type {
  CreateGnosisSteeringTraceRecordOptions,
  GnosisSteeringTraceCommand,
  GnosisSteeringTraceDataset,
  GnosisSteeringTraceEnvironment,
  GnosisSteeringTraceOutcome,
  GnosisSteeringTraceRecord,
  GnosisSteeringTraceStoreConfig,
  GnosisSteeringTraceStoreStatus,
  GnosisSteeringTraceSummary,
} from './steering-trace.js';

export { generateTlaFromGnosisSource } from './tla-bridge.js';
export type {
  GnosisTlaBridgeResult,
  GnosisTlaBridgeOptions,
} from './tla-bridge.js';

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
  Map as YMap,
  Array as YArray,
  Text as YText,
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
  QMapKeyChange,
  QMapEvent,
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

// `.gg`-native neural runtime (used by @affectively/neural bridge)
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
  init as initNeuralEngine,
  init as init,
} from './neural-compat.js';

export type {
  Neuron,
  Synapse,
  AdapterTrainingConfig,
  NeuralGraphData,
  LoadTopologyOptions,
  NeuralHeteroFabricOptions,
} from './neural-compat.js';
export * from './runtime/hetero-fabric.js';

export {
  LanguageAdapterRegistry,
  buildCodeToNaturalArtifact,
  createPreservationProfile,
  createSourceArtifactFromFile,
  crossCompile,
  defaultLanguageAdapterRegistry,
  inferCodeLanguageFromFilePath,
  inferLanguageDomainFromFilePath,
  installBuiltInLanguageAdapters,
} from './cross-domain.js';
export type {
  CrossCompileContext,
  CrossCompileRequest,
  CrossCompileResult,
  CrossDomainAnalysis,
  LanguageAdapter,
  LanguageDomain,
  PreservationProfile,
  SourceArtifact,
  TargetArtifact,
  TargetArtifactDescriptor,
} from './cross-domain.js';
export type {
  SemanticFacet,
  SemanticObligation,
} from './betty/semantic-compatibility.js';
export type {
  JsonSchema,
  SemanticContract,
  SemanticPredicate,
  TopologyType,
} from './betty/semantic-compatibility.js';

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
  GnosisTypeScriptBridgeSourceLocation,
  GnosisTypeScriptBridgeWave,
} from './ts-bridge.js';

export { checkTypeScriptWithGnosis } from './ts-check.js';

export type {
  GnosisTypeScriptCheckDiagnostic,
  GnosisTypeScriptCheckDiagnosticLevel,
  GnosisTypeScriptCheckMetrics,
  GnosisTypeScriptCheckOptions,
  GnosisTypeScriptCheckResult,
  GnosisTypeScriptCheckTopologyEdge,
  GnosisTypeScriptCheckTopologyGraph,
  GnosisTypeScriptCheckTopologyNode,
} from './ts-check.js';

// Incremental check with caching
export { GnosisIncrementalChecker } from './ts-check-incremental.js';
export type {
  IncrementalCacheEntry,
  IncrementalCheckStats,
} from './ts-check-incremental.js';

// Autofix engine
export {
  detectDeadBranches,
  generateAutofixSuggestions,
} from './ts-check-autofix.js';
export type {
  AutofixKind,
  AutofixReplacement,
  AutofixSuggestion,
  DeadBranchInfo,
} from './ts-check-autofix.js';

// Cross-function call graph
export { buildCallGraph } from './ts-call-graph.js';
export type {
  CallGraph,
  CallGraphEdge,
  CallGraphExternalImport,
  CallGraphModule,
  CallGraphNode,
  CallGraphOptions,
} from './ts-call-graph.js';

// Topology diff for PR reviews
export { computeTopologyDiff, formatPrComment } from './ts-check-diff.js';
export type {
  FunctionDiff,
  TopologyDiffOptions,
  TopologyDiffResult,
  TopologyMetricsDelta,
  TopologyRegimeTransition,
} from './ts-check-diff.js';

// File watcher for live feedback
export { GnosisFileWatcher } from './ts-check-watcher.js';
export type {
  WatcherEvent,
  WatcherListener,
  WatcherOptions,
} from './ts-check-watcher.js';

// Lean certificate generation
export {
  generateLeanCertificate,
  generateCertificatesForDirectory,
  verifyCertificate,
} from './ts-lean-certificate.js';
export type {
  LeanCertificate,
  LeanCertificateOptions,
} from './ts-lean-certificate.js';

// Topology SLOs
export {
  checkDirectorySlo,
  checkTopologySlo,
  loadSloConfig,
} from './ts-topology-slo.js';
export type {
  SloCheckResult,
  SloViolation,
  TopologySloConfig,
} from './ts-topology-slo.js';

// Runtime topology probes
export {
  GnosisProbeCollector,
  createProbeWrapper,
  buildOtelAttributes,
} from './ts-runtime-probe.js';
export type {
  BranchFrequency,
  NodeHotspot,
  OtelSpanAttributes,
  ProbeEvent,
  ProbeSession,
  RuntimeTopologyMetrics,
  WallaceDivergence,
} from './ts-runtime-probe.js';
