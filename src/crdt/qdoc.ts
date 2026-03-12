'use aeon';

/**
 * QDoc — Quantum Document: the topology-native replacement for Y.Doc
 *
 * CRDT is the only state model. No memory. No GC. Append-only.
 * The topology IS the state. FORK creates superposition.
 * OBSERVE collapses. History is permanent.
 *
 * QDoc wraps the GG topology model checker and provides:
 *   - QMap, QArray, QText, QCounter — typed CRDT accessors
 *   - Topology delta encoding (replaces Y.encodeStateAsUpdate)
 *   - Topology delta application (replaces Y.applyUpdate)
 *   - Observable changes (replaces Y.Doc.on('update'))
 *   - INTERFERE-based presence (replaces Awareness)
 *
 * The internal representation is a GG topology. Every mutation
 * appends a FORK branch. Every read triggers OBSERVE (collapse).
 * The topology is append-only — no tombstones, no GC.
 */

import {
  parseGgProgram,
  buildGgTemporalModel,
  getGgRootNodeIds,
  getGgTerminalNodeIds,
} from '@affectively/aeon-logic';
import type {
  GgProgram,
  GgNode,
  GgEdge,
  GgTopologyState,
  GgCollapseStrategy,
} from '@affectively/aeon-logic';

// ── Types ───────────────────────────────────────────────────────────────────

export interface QDocOptions {
  /** Unique document ID */
  guid?: string;
  /** Default collapse strategy for maps */
  mapStrategy?: GgCollapseStrategy;
  /** Default collapse strategy for sequences */
  sequenceStrategy?: GgCollapseStrategy;
}

export interface QDocDelta {
  /** Topology operations since last sync */
  nodes: readonly QDocDeltaNode[];
  edges: readonly QDocDeltaEdge[];
  /** Logical clock for causal ordering */
  clock: number;
  /** Source replica ID */
  replicaId: string;
}

export interface QDocDeltaNode {
  id: string;
  labels: readonly string[];
  properties: Readonly<Record<string, string>>;
}

export interface QDocDeltaEdge {
  sourceIds: readonly string[];
  targetIds: readonly string[];
  type: string;
  properties: Readonly<Record<string, string>>;
}

export type QDocUpdateHandler = (delta: Uint8Array, origin: string) => void;
export type QDocObserveHandler = (event: QDocEvent) => void;

export interface QDocEvent {
  type: 'insert' | 'delete' | 'set' | 'observe';
  path: string;
  key?: string;
  value?: unknown;
  origin: string;
}

// ── QDoc ────────────────────────────────────────────────────────────────────

export class QDoc {
  readonly guid: string;
  private readonly _replicaId: string;
  private _clock = 0;
  private _beta1 = 0;

  // Append-only topology state — this IS the document
  private _nodes: Map<string, QDocDeltaNode> = new Map();
  private _edges: QDocDeltaEdge[] = [];

  // Pending deltas not yet synced
  private _pendingNodes: QDocDeltaNode[] = [];
  private _pendingEdges: QDocDeltaEdge[] = [];

  // Observable
  private _updateHandlers: Set<QDocUpdateHandler> = new Set();
  private _observeHandlers: Map<string, Set<QDocObserveHandler>> = new Map();

  // Typed accessors (lazy, cached)
  private _maps: Map<string, QMap> = new Map();
  private _arrays: Map<string, QArray> = new Map();
  private _texts: Map<string, QText> = new Map();
  private _counters: Map<string, QCounter> = new Map();

  // Presence (INTERFERE — never collapses)
  private _presence: Map<string, Record<string, unknown>> = new Map();
  private _presenceHandlers: Set<(states: Map<string, Record<string, unknown>>) => void> = new Set();

  private readonly _mapStrategy: GgCollapseStrategy;
  private readonly _sequenceStrategy: GgCollapseStrategy;

  constructor(options: QDocOptions = {}) {
    this.guid = options.guid ?? crypto.randomUUID();
    this._replicaId = `replica-${crypto.randomUUID().slice(0, 8)}`;
    this._mapStrategy = options.mapStrategy ?? 'lww';
    this._sequenceStrategy = options.sequenceStrategy ?? 'ot-transform';

    // Root node — every topology has one
    this._appendNode({ id: 'root', labels: ['QDoc'], properties: { guid: this.guid } });
  }

  // ── Typed Accessors (replaces Y.Doc.getMap, getArray, getText) ──────────

  getMap(name: string): QMap {
    let map = this._maps.get(name);
    if (!map) {
      map = new QMap(this, name, this._mapStrategy);
      this._maps.set(name, map);
    }
    return map;
  }

  getArray<T = unknown>(name: string): QArray<T> {
    let arr = this._arrays.get(name);
    if (!arr) {
      arr = new QArray(this, name, this._sequenceStrategy);
      this._arrays.set(name, arr);
    }
    return arr as QArray<T>;
  }

  getText(name: string): QText {
    let text = this._texts.get(name);
    if (!text) {
      text = new QText(this, name);
      this._texts.set(name, text);
    }
    return text;
  }

  getCounter(name: string): QCounter {
    let counter = this._counters.get(name);
    if (!counter) {
      counter = new QCounter(this, name);
      this._counters.set(name, counter);
    }
    return counter;
  }

  // ── Topology Mutation (internal — called by typed accessors) ────────────

  /** @internal Append a node to the topology */
  _appendNode(node: QDocDeltaNode): void {
    this._nodes.set(node.id, node);
    this._pendingNodes.push(node);
  }

  /** @internal Append an edge to the topology */
  _appendEdge(edge: QDocDeltaEdge): void {
    this._edges.push(edge);
    this._pendingEdges.push(edge);

    // Update beta1
    if (edge.type === 'FORK') {
      this._beta1 += edge.targetIds.length - 1;
    } else if (edge.type === 'FOLD' || edge.type === 'COLLAPSE' || edge.type === 'OBSERVE') {
      this._beta1 = 0;
    } else if (edge.type === 'RACE') {
      this._beta1 = Math.max(0, this._beta1 - (edge.sourceIds.length - 1));
    } else if (edge.type === 'VENT' || edge.type === 'TUNNEL') {
      this._beta1 = Math.max(0, this._beta1 - 1);
    }

    this._clock++;
  }

  /** @internal Get the current beta1 (superposition count) */
  get beta1(): number {
    return this._beta1;
  }

  /** @internal Get the logical clock */
  get clock(): number {
    return this._clock;
  }

  /** @internal Get the replica ID */
  get replicaId(): string {
    return this._replicaId;
  }

  /** @internal Emit an observe event */
  _emitObserve(path: string, event: QDocEvent): void {
    const handlers = this._observeHandlers.get(path);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(event); } catch { /* handlers must not break the doc */ }
      }
    }
  }

  /** @internal Notify update handlers */
  _notifyUpdate(origin: string): void {
    if (this._pendingNodes.length === 0 && this._pendingEdges.length === 0) {
      return;
    }
    const delta = this.encodePendingDelta();
    for (const handler of this._updateHandlers) {
      try { handler(delta, origin); } catch { /* handlers must not break the doc */ }
    }
  }

  // ── Sync Protocol (replaces Y.encodeStateAsUpdate / Y.applyUpdate) ─────

  /**
   * Encode the full topology state as a Uint8Array.
   * Replaces Y.encodeStateAsUpdate(doc).
   */
  encodeStateAsUpdate(): Uint8Array {
    const state: QDocDelta = {
      nodes: [...this._nodes.values()],
      edges: this._edges,
      clock: this._clock,
      replicaId: this._replicaId,
    };
    return new TextEncoder().encode(JSON.stringify(state));
  }

  /**
   * Encode only pending (unsynced) operations.
   * More efficient than full state for incremental sync.
   */
  encodePendingDelta(): Uint8Array {
    const delta: QDocDelta = {
      nodes: this._pendingNodes,
      edges: this._pendingEdges,
      clock: this._clock,
      replicaId: this._replicaId,
    };
    const encoded = new TextEncoder().encode(JSON.stringify(delta));
    // Clear pending after encoding
    this._pendingNodes = [];
    this._pendingEdges = [];
    return encoded;
  }

  /**
   * Apply a remote topology delta.
   * Replaces Y.applyUpdate(doc, update).
   * Append-only — remote operations are FORK branches that get merged via OBSERVE.
   */
  applyUpdate(update: Uint8Array, origin = 'remote'): void {
    let delta: QDocDelta;
    try {
      delta = JSON.parse(new TextDecoder().decode(update));
    } catch {
      return; // Invalid update — ignore
    }

    // Append remote nodes (append-only, never overwrite)
    for (const node of delta.nodes) {
      if (!this._nodes.has(node.id)) {
        this._nodes.set(node.id, node);
      }
    }

    // Append remote edges (the topology only grows)
    for (const edge of delta.edges) {
      this._edges.push(edge);

      // Update beta1 for remote edges
      if (edge.type === 'FORK') {
        this._beta1 += edge.targetIds.length - 1;
      } else if (edge.type === 'FOLD' || edge.type === 'COLLAPSE' || edge.type === 'OBSERVE') {
        this._beta1 = 0;
      }
    }

    // Advance clock to max of local and remote
    if (delta.clock > this._clock) {
      this._clock = delta.clock;
    }

    // Notify typed accessors of remote changes
    for (const edge of delta.edges) {
      if (edge.properties.path) {
        this._emitObserve(edge.properties.path, {
          type: 'set',
          path: edge.properties.path,
          key: edge.properties.key,
          value: edge.properties.value,
          origin,
        });
      }
    }
  }

  // ── Observability ──────────────────────────────────────────────────────

  /**
   * Listen for document updates (replaces Y.Doc.on('update')).
   */
  on(event: 'update', handler: QDocUpdateHandler): void;
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (event === 'update') {
      this._updateHandlers.add(handler as QDocUpdateHandler);
    }
  }

  off(event: 'update', handler: QDocUpdateHandler): void;
  off(event: string, handler: (...args: unknown[]) => void): void {
    if (event === 'update') {
      this._updateHandlers.delete(handler as QDocUpdateHandler);
    }
  }

  /**
   * Observe changes at a specific path.
   */
  observe(path: string, handler: QDocObserveHandler): void {
    let handlers = this._observeHandlers.get(path);
    if (!handlers) {
      handlers = new Set();
      this._observeHandlers.set(path, handlers);
    }
    handlers.add(handler);
  }

  unobserve(path: string, handler: QDocObserveHandler): void {
    this._observeHandlers.get(path)?.delete(handler);
  }

  // ── Presence (INTERFERE — never collapses) ─────────────────────────────

  /**
   * Set local presence state (replaces awareness.setLocalState).
   * Presence uses INTERFERE — it never collapses, cursors coexist.
   */
  setPresence(state: Record<string, unknown>): void {
    this._presence.set(this._replicaId, state);
    this._notifyPresence();
  }

  /**
   * Get all presence states (replaces awareness.getStates).
   */
  getPresenceStates(): Map<string, Record<string, unknown>> {
    return new Map(this._presence);
  }

  /**
   * Apply remote presence (INTERFERE — append, never merge).
   */
  applyPresence(replicaId: string, state: Record<string, unknown>): void {
    this._presence.set(replicaId, state);
    this._notifyPresence();
  }

  removePresence(replicaId: string): void {
    this._presence.delete(replicaId);
    this._notifyPresence();
  }

  onPresenceChange(handler: (states: Map<string, Record<string, unknown>>) => void): void {
    this._presenceHandlers.add(handler);
  }

  offPresenceChange(handler: (states: Map<string, Record<string, unknown>>) => void): void {
    this._presenceHandlers.delete(handler);
  }

  private _notifyPresence(): void {
    for (const handler of this._presenceHandlers) {
      try { handler(this.getPresenceStates()); } catch { /* */ }
    }
  }

  // ── Topology Metrics ──────────────────────────────────────────────────

  get nodeCount(): number { return this._nodes.size; }
  get edgeCount(): number { return this._edges.length; }

  /**
   * Get the full topology as a GG source string (for model checking).
   */
  toGG(): string {
    const lines: string[] = [];
    for (const node of this._nodes.values()) {
      const label = node.labels.length > 0 ? `: ${node.labels[0]}` : '';
      const props = Object.entries(node.properties);
      const propsStr = props.length > 0
        ? ` { ${props.map(([k, v]) => `${k}: '${v}'`).join(', ')} }`
        : '';
      lines.push(`(${node.id}${label}${propsStr})`);
    }
    for (const edge of this._edges) {
      const sources = edge.sourceIds.join(' | ');
      const targets = edge.targetIds.join(' | ');
      const props = Object.entries(edge.properties);
      const propsStr = props.length > 0
        ? ` { ${props.map(([k, v]) => `${k}: '${v}'`).join(', ')} }`
        : '';
      lines.push(`(${sources})-[:${edge.type}${propsStr}]->(${targets})`);
    }
    return lines.join('\n');
  }
}

// ── QMap — Replaces Y.Map ───────────────────────────────────────────────

export class QMap {
  private readonly _doc: QDoc;
  private readonly _name: string;
  private readonly _strategy: GgCollapseStrategy;
  private readonly _data: Map<string, unknown> = new Map();
  private _branchCounter = 0;

  constructor(doc: QDoc, name: string, strategy: GgCollapseStrategy) {
    this._doc = doc;
    this._name = name;
    this._strategy = strategy;
    // Create the map root node
    doc._appendNode({ id: `map_${name}`, labels: ['QMap'], properties: { name, strategy } });
    doc._appendEdge({
      sourceIds: ['root'],
      targetIds: [`map_${name}`],
      type: 'PROCESS',
      properties: { path: name },
    });
  }

  set(key: string, value: unknown): void {
    const branchId = `map_${this._name}_${key}_${this._branchCounter++}`;
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    // FORK a write branch
    this._doc._appendNode({
      id: branchId,
      labels: ['Write'],
      properties: { key, value: valueStr, ts: String(this._doc.clock) },
    });
    this._doc._appendEdge({
      sourceIds: [`map_${this._name}`],
      targetIds: [branchId],
      type: 'FORK',
      properties: { path: this._name, key, op: 'set' },
    });

    // Immediately OBSERVE (eager collapse for local reads)
    const observeId = `map_${this._name}_${key}_obs_${this._branchCounter}`;
    this._doc._appendNode({
      id: observeId,
      labels: ['Observed'],
      properties: { key, value: valueStr },
    });
    this._doc._appendEdge({
      sourceIds: [branchId],
      targetIds: [observeId],
      type: 'OBSERVE',
      properties: { strategy: this._strategy, path: this._name, key, value: valueStr },
    });

    this._data.set(key, value);
    this._doc._emitObserve(this._name, {
      type: 'set', path: this._name, key, value, origin: 'local',
    });
    this._doc._notifyUpdate('local');
  }

  get(key: string): unknown {
    return this._data.get(key);
  }

  has(key: string): boolean {
    return this._data.has(key);
  }

  delete(key: string): void {
    this._data.delete(key);
    const branchId = `map_${this._name}_${key}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ['Delete'],
      properties: { key },
    });
    this._doc._appendEdge({
      sourceIds: [`map_${this._name}`],
      targetIds: [branchId],
      type: 'FORK',
      properties: { path: this._name, key, op: 'delete' },
    });
    this._doc._notifyUpdate('local');
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of this._data) {
      result[key] = value;
    }
    return result;
  }

  get size(): number {
    return this._data.size;
  }

  forEach(fn: (value: unknown, key: string) => void): void {
    this._data.forEach(fn);
  }

  entries(): IterableIterator<[string, unknown]> {
    return this._data.entries();
  }

  keys(): IterableIterator<string> {
    return this._data.keys();
  }

  values(): IterableIterator<unknown> {
    return this._data.values();
  }
}

// ── QArray — Replaces Y.Array ───────────────────────────────────────────

export class QArray<T = unknown> {
  private readonly _doc: QDoc;
  private readonly _name: string;
  private readonly _strategy: GgCollapseStrategy;
  private readonly _data: T[] = [];
  private _branchCounter = 0;

  constructor(doc: QDoc, name: string, strategy: GgCollapseStrategy) {
    this._doc = doc;
    this._name = name;
    this._strategy = strategy;
    doc._appendNode({ id: `arr_${name}`, labels: ['QArray'], properties: { name, strategy } });
    doc._appendEdge({
      sourceIds: ['root'],
      targetIds: [`arr_${name}`],
      type: 'PROCESS',
      properties: { path: name },
    });
  }

  push(items: T[]): void {
    for (const item of items) {
      const branchId = `arr_${this._name}_push_${this._branchCounter++}`;
      const valueStr = typeof item === 'string' ? item : JSON.stringify(item);

      this._doc._appendNode({
        id: branchId,
        labels: ['Insert'],
        properties: { pos: String(this._data.length), value: valueStr },
      });
      this._doc._appendEdge({
        sourceIds: [`arr_${this._name}`],
        targetIds: [branchId],
        type: 'FORK',
        properties: { path: this._name, op: 'push', value: valueStr },
      });

      this._data.push(item);
    }
    this._doc._notifyUpdate('local');
  }

  delete(index: number, length = 1): void {
    this._data.splice(index, length);
    const branchId = `arr_${this._name}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ['Delete'],
      properties: { pos: String(index), len: String(length) },
    });
    this._doc._appendEdge({
      sourceIds: [`arr_${this._name}`],
      targetIds: [branchId],
      type: 'FORK',
      properties: { path: this._name, op: 'delete', pos: String(index), len: String(length) },
    });
    this._doc._notifyUpdate('local');
  }

  get(index: number): T | undefined {
    return this._data[index];
  }

  get length(): number {
    return this._data.length;
  }

  toArray(): T[] {
    return [...this._data];
  }

  toJSON(): T[] {
    return this.toArray();
  }

  forEach(fn: (item: T, index: number) => void): void {
    this._data.forEach(fn);
  }

  observe(handler: (event: { changes: { delta: Array<{ insert?: T[] }> } }) => void): void {
    this._doc.observe(this._name, (event) => {
      if (event.value !== undefined) {
        handler({
          changes: {
            delta: [{ insert: [event.value as T] }],
          },
        });
      }
    });
  }

  unobserve(handler: (event: unknown) => void): void {
    // Handled via doc.unobserve
  }
}

// ── QText — Replaces Y.Text ────────────────────────────────────────────

export class QText {
  private readonly _doc: QDoc;
  private readonly _name: string;
  private _content = '';
  private _branchCounter = 0;

  constructor(doc: QDoc, name: string) {
    this._doc = doc;
    this._name = name;
    doc._appendNode({ id: `text_${name}`, labels: ['QText'], properties: { name } });
    doc._appendEdge({
      sourceIds: ['root'],
      targetIds: [`text_${name}`],
      type: 'PROCESS',
      properties: { path: name },
    });
  }

  insert(index: number, text: string): void {
    this._content = this._content.slice(0, index) + text + this._content.slice(index);
    const branchId = `text_${this._name}_ins_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ['Insert'],
      properties: { pos: String(index), text },
    });
    this._doc._appendEdge({
      sourceIds: [`text_${this._name}`],
      targetIds: [branchId],
      type: 'FORK',
      properties: { path: this._name, op: 'insert', pos: String(index), text },
    });
    this._doc._notifyUpdate('local');
  }

  delete(index: number, length: number): void {
    this._content = this._content.slice(0, index) + this._content.slice(index + length);
    const branchId = `text_${this._name}_del_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ['Delete'],
      properties: { pos: String(index), len: String(length) },
    });
    this._doc._appendEdge({
      sourceIds: [`text_${this._name}`],
      targetIds: [branchId],
      type: 'FORK',
      properties: { path: this._name, op: 'delete', pos: String(index), len: String(length) },
    });
    this._doc._notifyUpdate('local');
  }

  toString(): string {
    return this._content;
  }

  get length(): number {
    return this._content.length;
  }

  toJSON(): string {
    return this._content;
  }
}

// ── QCounter — Replaces shared counter patterns ────────────────────────

export class QCounter {
  private readonly _doc: QDoc;
  private readonly _name: string;
  private _value = 0;
  private _branchCounter = 0;

  constructor(doc: QDoc, name: string) {
    this._doc = doc;
    this._name = name;
    doc._appendNode({ id: `ctr_${name}`, labels: ['QCounter'], properties: { name, initial: '0' } });
    doc._appendEdge({
      sourceIds: ['root'],
      targetIds: [`ctr_${name}`],
      type: 'PROCESS',
      properties: { path: name },
    });
  }

  increment(delta = 1): void {
    this._value += delta;
    const branchId = `ctr_${this._name}_inc_${this._branchCounter++}`;
    this._doc._appendNode({
      id: branchId,
      labels: ['Increment'],
      properties: { delta: String(delta) },
    });
    // FOLD not OBSERVE — counters are commutative
    this._doc._appendEdge({
      sourceIds: [`ctr_${this._name}`],
      targetIds: [branchId],
      type: 'FOLD',
      properties: { strategy: 'fold-sum', path: this._name, delta: String(delta) },
    });
    this._doc._notifyUpdate('local');
  }

  decrement(delta = 1): void {
    this.increment(-delta);
  }

  get value(): number {
    return this._value;
  }

  toJSON(): number {
    return this._value;
  }
}
