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

export { GNOSIS_CORE_AUTH_LABELS, registerCoreAuthHandlers } from './handlers.js';
