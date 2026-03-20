'use aeon';

export { QDoc, QMap, QArray, QText, QCounter } from './qdoc.js';
export { QCorridor } from './qcorridor.js';
export type {
  QDocOptions,
  QDocDelta,
  QDocDeltaNode,
  QDocDeltaEdge,
  QDocUpdateHandler,
  QDocObserveHandler,
  QDocEvent,
  QMapKeyChange,
  QMapEvent,
} from './qdoc.js';
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
} from './qcorridor.js';
export {
  QDocAeonRelay,
  QDocRelay,
  createQDocAeonRelayJoinEnvelope,
} from './aeon-relay.js';
export type {
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
} from './aeon-relay.js';
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
} from './yjs-compat.js';
