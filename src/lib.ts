export { GnosisNeo4jBridge } from './neo4j-bridge.js';
export { GnosisRegistry } from './runtime/registry.js';
export { GnosisEngine } from './runtime/engine.js';
export { BettyCompiler } from './betty/compiler.js';

export type { GnosisHandler } from './runtime/registry.js';
export type { GraphAST, ASTNode, ASTEdge } from './betty/compiler.js';

export { generateTlaFromGnosisSource } from './tla-bridge.js';
export type {
  GnosisTlaBridgeResult,
  GnosisTlaBridgeOptions,
} from './tla-bridge.js';

export * from './capabilities/index.js';
export * from './auth/index.js';

// Quantum CRDT — the only state model
export { QDoc, QMap, QArray, QText, QCounter, QDocRelay } from './crdt/index.js';
export type {
  QDocOptions,
  QDocDelta,
  QDocDeltaNode,
  QDocDeltaEdge,
  QDocUpdateHandler,
  QDocObserveHandler,
  QDocEvent,
  QDocRelayConfig,
  QDocRelayStatus,
} from './crdt/index.js';

// Test harness & runner
export { ggTest, ggQuickCheck, ggAssert, GGTestBuilder } from './gg-test-harness.js';
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
