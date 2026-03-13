'use aeon';

export {
  QDoc,
  QMap,
  QArray,
  QText,
  QCounter,
} from './qdoc.js';
export type {
  QDocOptions,
  QDocDelta,
  QDocDeltaNode,
  QDocDeltaEdge,
  QDocUpdateHandler,
  QDocObserveHandler,
  QDocEvent,
} from './qdoc.js';
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
