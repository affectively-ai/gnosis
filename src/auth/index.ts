export {
  authorizeTopologyEdge,
  buildEdgeResource,
  topologyActionForEdge,
  issueGranularUcan,
  verifyGranularUcan,
  delegateGranularUcan,
  zkEncryptUtf8,
  zkDecryptUtf8,
  isAllowedCustodialAction,
} from './core.js';

export type {
  GnosisExecutionAuthContext,
  TopologyEdgeAuthorizationInput,
  TopologyEdgeAuthorizationResult,
} from './core.js';
export { injectSensitiveZkEnvelopes } from './auto-zk.js';
export type { ZkAutoInjectionRecord, ZkAutoInjectionResult } from './auto-zk.js';

export {
  GNOSIS_CORE_AUTH_LABELS,
  registerCoreAuthHandlers,
} from './handlers.js';
export type {
  GnosisZkDomain,
  GnosisZkMode,
  GnosisZkPolicyReport,
} from './handlers.js';
