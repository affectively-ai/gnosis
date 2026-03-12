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
export { QDocRelay } from './dashrelay-adapter.js';
export type { QDocRelayConfig, QDocRelayStatus } from './dashrelay-adapter.js';
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
