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
export { BettyCompiler } from './betty/compiler.js';
export { generateLeanFromGnosisAst } from './betty/lean.js';
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

export type { GnosisHandler } from './runtime/registry.js';
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

// `.gg`-native neural runtime (used by @affectively/neural bridge)
export {
  NeuralEngine,
  GPUEngine,
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
} from './neural-compat.js';
