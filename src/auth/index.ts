export {
  authorizeSteeringApply,
  authorizeSteeringCapability,
  authorizeSteeringRelayConnect,
  authorizeSteeringRun,
  authorizeSteeringTraceAppend,
  authorizeTopologyEdge,
  buildEdgeResource,
  buildSteeringRelayResource,
  buildSteeringTopologyResource,
  buildSteeringTraceResource,
  mergeExecutionAuthContexts,
  normalizeExecutionAuthContext,
  topologyActionForEdge,
  generateUcanIdentity,
  issueGranularUcan,
  verifyGranularUcan,
  delegateGranularUcan,
  zkEncryptUtf8,
  zkDecryptUtf8,
  isAllowedCustodialAction,
} from './core.js';

export type {
  GnosisExecutionAuthContext,
  GnosisSteeringAuthorizationInput,
  GnosisSteeringAuthorizationResult,
  GnosisSteeringCapabilityAction,
  TopologyEdgeAuthorizationInput,
  TopologyEdgeAuthorizationResult,
} from './core.js';
export { injectSensitiveZkEnvelopes } from './auto-zk.js';
export type {
  ZkAutoInjectionRecord,
  ZkAutoInjectionResult,
} from './auto-zk.js';

export {
  GNOSIS_CORE_AUTH_LABELS,
  registerCoreAuthHandlers,
} from './handlers.js';
export type {
  GnosisZkDomain,
  GnosisZkMode,
  GnosisZkPolicyReport,
} from './handlers.js';

export {
  InMemoryNonceReplayStore,
  asHaltAttestationEnvelope,
  asHaltExecutionEnvelope,
  createHaltAttestation,
  hashPublicSignals,
  verifyHaltAttestation,
  verifyZkExecutionEnvelope,
} from './tee-attestation.js';
export type {
  HaltAttestationClaims,
  HaltAttestationEnvelope,
  HaltAttestationVerificationOptions,
  HaltAttestationVerificationResult,
  HaltExecutionEnvelope,
  NonceReplayStore,
  ZkExecutionVerificationOptions,
  ZkExecutionVerificationResult,
  ZkProofVerifier,
  ZkProofVerifierInput,
} from './tee-attestation.js';
export { bootstrapExecutionAuthFromTopology } from './bootstrap.js';
export type {
  GnosisExecutionAuthBootstrapOptions,
  GnosisExecutionAuthBootstrapResult,
} from './bootstrap.js';

export {
  buildVerifyExecutionCalldata,
  createEvmProofVerifier,
  verifyProofViaEvmRpc,
} from './zk-onchain-verifier.js';
export type {
  EvmProofVerifierConfig,
  ZkProofEncoding,
} from './zk-onchain-verifier.js';
