'use aeon';

import type { QDoc } from './qdoc.js';

export type QDocAeonRelayAttributeValue = string | number | boolean;
export type QDocAeonRelayAttributes = Record<
  string,
  QDocAeonRelayAttributeValue
>;

export type QDocAeonRelayReadyStrategy = 'snapshot' | 'joined';

export type QDocAeonRelayTelemetryStage =
  | 'connect.start'
  | 'socket.open'
  | 'join.sent'
  | 'join.accepted'
  | 'snapshot.applied'
  | 'update.received'
  | 'update.sent'
  | 'update.skipped'
  | 'disconnect'
  | 'error';

export interface QDocAeonRelayTelemetryEvent {
  stage: QDocAeonRelayTelemetryStage;
  atMs: number;
  attributes: QDocAeonRelayAttributes;
  errorMessage?: string;
}

export interface QDocAeonRelaySpan {
  addEvent?: (name: string, attributes?: QDocAeonRelayAttributes) => void;
  setAttributes?: (attributes: QDocAeonRelayAttributes) => void;
  recordException?: (error: unknown) => void;
  end?: (status?: 'ok' | 'error') => void;
}

export interface QDocAeonRelayTelemetry {
  onEvent?: (event: QDocAeonRelayTelemetryEvent) => void;
  startSpan?: (
    name: string,
    attributes: QDocAeonRelayAttributes
  ) => QDocAeonRelaySpan | null;
}

export interface QDocAeonRelayConfig {
  /** Relay WebSocket URL */
  url: string;
  /** Room name */
  roomName: string;
  /** API key */
  apiKey?: string;
  /** Client ID */
  clientId?: string;
  /**
   * Wire protocol label used in the join envelope.
   * Defaults to `dashrelay-v1` for backwards compatibility.
   */
  protocol?: string;
  /**
   * Join mode label for the relay.
   * Defaults to `qdoc-authoritative`.
   */
  joinMode?: string;
  /**
   * Human-readable relay product label surfaced in status/alerts.
   * Example: `dashrelay`, `aeon-forge-relay`.
   */
  relayProduct?: string;
  /**
   * Which server message marks the relay ready.
   * DashRelay-style relays should keep the default `snapshot`.
   */
  readyStrategy?: QDocAeonRelayReadyStrategy;
  /**
   * Optional metadata attached to the join envelope.
   */
  metadata?: Record<string, string>;
  /**
   * Additional join envelope fields for Aeon-compatible relays that
   * need extra routing or tenancy hints.
   */
  additionalJoinFields?: Record<string, unknown>;
  /**
   * Optional observability hooks. Aeon Forge or any OTEL bridge can
   * adapt this without taking a hard dependency here.
   */
  telemetry?: QDocAeonRelayTelemetry | null;
}

export interface QDocAeonRelayStatus {
  connected: boolean;
  peerId: string;
  roomName: string;
  serverSeq: number;
  protocol: string;
  joinMode: string;
  relayProduct: string;
  readyStrategy: QDocAeonRelayReadyStrategy;
}

export interface QDocAeonRelayJoinEnvelope {
  type: 'join';
  protocol: string;
  room: string;
  auth?: string;
  mode: string;
  clientId: string;
  relayProduct: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

const DEFAULT_QDOC_AEON_RELAY_PROTOCOL = 'dashrelay-v1';
const DEFAULT_QDOC_AEON_RELAY_MODE = 'qdoc-authoritative';
const DEFAULT_QDOC_AEON_RELAY_PRODUCT = 'aeon-relay';
const DEFAULT_QDOC_AEON_RELAY_READY_STRATEGY: QDocAeonRelayReadyStrategy =
  'snapshot';

interface BufferLike extends Uint8Array {}

interface BufferLikeConstructor {
  from(input: Uint8Array | string, encoding?: string): BufferLike;
}

function getBufferConstructor(): BufferLikeConstructor | null {
  const candidate = (globalThis as { Buffer?: BufferLikeConstructor }).Buffer;
  return candidate && typeof candidate.from === 'function' ? candidate : null;
}

function currentTimestamp(): number {
  return Date.now();
}

function normalizeRelayConfig(
  config: QDocAeonRelayConfig
): Required<
  Pick<
    QDocAeonRelayConfig,
    | 'url'
    | 'roomName'
    | 'protocol'
    | 'joinMode'
    | 'relayProduct'
    | 'readyStrategy'
  >
> &
  Pick<
    QDocAeonRelayConfig,
    'apiKey' | 'clientId' | 'metadata' | 'additionalJoinFields' | 'telemetry'
  > {
  return {
    url: config.url,
    roomName: config.roomName,
    apiKey: config.apiKey,
    clientId: config.clientId,
    protocol: config.protocol ?? DEFAULT_QDOC_AEON_RELAY_PROTOCOL,
    joinMode: config.joinMode ?? DEFAULT_QDOC_AEON_RELAY_MODE,
    relayProduct: config.relayProduct ?? DEFAULT_QDOC_AEON_RELAY_PRODUCT,
    readyStrategy:
      config.readyStrategy ?? DEFAULT_QDOC_AEON_RELAY_READY_STRATEGY,
    metadata: config.metadata,
    additionalJoinFields: config.additionalJoinFields,
    telemetry: config.telemetry ?? null,
  };
}

export function createQDocAeonRelayJoinEnvelope(
  config: QDocAeonRelayConfig,
  peerId: string
): QDocAeonRelayJoinEnvelope {
  const normalizedConfig = normalizeRelayConfig(config);
  const baseEnvelope: QDocAeonRelayJoinEnvelope = {
    type: 'join',
    protocol: normalizedConfig.protocol,
    room: normalizedConfig.roomName,
    auth: normalizedConfig.apiKey,
    mode: normalizedConfig.joinMode,
    clientId: peerId,
    relayProduct: normalizedConfig.relayProduct,
  };

  if (normalizedConfig.metadata) {
    baseEnvelope.metadata = normalizedConfig.metadata;
  }

  return {
    ...baseEnvelope,
    ...normalizedConfig.additionalJoinFields,
  };
}

export class QDocAeonRelay {
  private readonly doc: QDoc;
  private readonly config: ReturnType<typeof normalizeRelayConfig>;
  private ws: WebSocket | null = null;
  private peerId: string;
  private serverSeq = 0;
  private connected = false;
  private updateHandler: ((delta: Uint8Array, origin: string) => void) | null =
    null;

  constructor(doc: QDoc, config: QDocAeonRelayConfig) {
    this.doc = doc;
    this.config = normalizeRelayConfig(config);
    this.peerId = config.clientId ?? `peer-${crypto.randomUUID().slice(0, 8)}`;
  }

  get status(): QDocAeonRelayStatus {
    return {
      connected: this.connected,
      peerId: this.peerId,
      roomName: this.config.roomName,
      serverSeq: this.serverSeq,
      protocol: this.config.protocol,
      joinMode: this.config.joinMode,
      relayProduct: this.config.relayProduct,
      readyStrategy: this.config.readyStrategy,
    };
  }

  async connect(): Promise<void> {
    const baseAttributes = this.telemetryAttributes();
    const connectSpan = this.startSpan('aeon.relay.connect', baseAttributes);
    this.emitTelemetry('connect.start', baseAttributes);

    return new Promise((resolve, reject) => {
      let settled = false;

      const resolveConnection = (stage: 'joined' | 'snapshot'): void => {
        if (settled) {
          return;
        }

        settled = true;
        connectSpan?.addEvent?.(`relay.${stage}`, this.telemetryAttributes());
        connectSpan?.end?.('ok');
        resolve();
      };

      const rejectConnection = (error: Error): void => {
        if (settled) {
          return;
        }

        settled = true;
        connectSpan?.recordException?.(error);
        connectSpan?.end?.('error');
        this.emitTelemetry('error', baseAttributes, error);
        reject(error);
      };

      const ws = new WebSocket(this.config.url);
      this.ws = ws;

      (ws as any).onopen = () => {
        this.emitTelemetry('socket.open', this.telemetryAttributes());
        const joinEnvelope = createQDocAeonRelayJoinEnvelope(
          this.config,
          this.peerId
        );
        ws.send(JSON.stringify(joinEnvelope));
        this.emitTelemetry('join.sent', this.telemetryAttributes());
      };

      (ws as any).onmessage = (event: any) => {
        if (typeof event.data !== 'string') {
          const update = new Uint8Array(event.data as ArrayBuffer);
          this.doc.applyUpdate(update, 'remote');
          this.emitTelemetry('update.received', {
            ...this.telemetryAttributes(),
            'aeon.relay.bytes': update.byteLength,
          });
          return;
        }

        let envelope: Record<string, unknown>;
        try {
          envelope = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (envelope.type) {
          case 'joined':
            this.connected = true;
            this.serverSeq = (envelope.serverSeq as number) ?? 0;
            this.emitTelemetry('join.accepted', this.telemetryAttributes());
            if (this.config.readyStrategy === 'joined') {
              resolveConnection('joined');
            }
            break;

          case 'snapshot': {
            const updateStr = envelope.update as string | undefined;
            const bytes = updateStr ? base64ToBytes(updateStr) : null;
            this.connected = true;
            this.serverSeq = (envelope.serverSeq as number) ?? this.serverSeq;
            if (bytes) {
              this.doc.applyUpdate(bytes, 'snapshot');
            }
            this.emitTelemetry('snapshot.applied', {
              ...this.telemetryAttributes(),
              'aeon.relay.bytes': bytes?.byteLength ?? 0,
            });
            if (this.config.readyStrategy === 'snapshot') {
              resolveConnection('snapshot');
            }
            break;
          }

          case 'update': {
            const updateStr = envelope.update as string | undefined;
            const bytes = updateStr ? base64ToBytes(updateStr) : null;
            if (bytes) {
              this.doc.applyUpdate(bytes, 'remote');
            }
            this.serverSeq = (envelope.serverSeq as number) ?? this.serverSeq;
            this.emitTelemetry('update.received', {
              ...this.telemetryAttributes(),
              'aeon.relay.bytes': bytes?.byteLength ?? 0,
            });
            break;
          }

          case 'error':
            rejectConnection(
              new Error(String(envelope.error ?? 'Relay error'))
            );
            break;
        }
      };

      (ws as any).onerror = () => {
        rejectConnection(new Error('WebSocket error'));
      };

      (ws as any).onclose = () => {
        this.connected = false;
        this.emitTelemetry('disconnect', this.telemetryAttributes());
        this.detachUpdateHandler();
      };

      this.attachUpdateHandler();
    });
  }

  disconnect(): void {
    this.detachUpdateHandler();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emitTelemetry('disconnect', this.telemetryAttributes());
  }

  private attachUpdateHandler(): void {
    this.updateHandler = (delta: Uint8Array, origin: string) => {
      if (origin === 'remote' || origin === 'snapshot') {
        return;
      }

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.emitTelemetry('update.skipped', {
          ...this.telemetryAttributes(),
          'aeon.relay.bytes': delta.byteLength,
        });
        return;
      }

      this.ws.send(delta);
      this.emitTelemetry('update.sent', {
        ...this.telemetryAttributes(),
        'aeon.relay.bytes': delta.byteLength,
      });
    };
    this.doc.on('update', this.updateHandler);
  }

  private detachUpdateHandler(): void {
    if (this.updateHandler) {
      this.doc.off('update', this.updateHandler);
      this.updateHandler = null;
    }
  }

  private telemetryAttributes(
    overrides: QDocAeonRelayAttributes = {}
  ): QDocAeonRelayAttributes {
    return {
      'aeon.relay.url': this.config.url,
      'aeon.relay.room': this.config.roomName,
      'aeon.relay.peer_id': this.peerId,
      'aeon.relay.protocol': this.config.protocol,
      'aeon.relay.mode': this.config.joinMode,
      'aeon.relay.product': this.config.relayProduct,
      'aeon.relay.ready_strategy': this.config.readyStrategy,
      'aeon.relay.server_seq': this.serverSeq,
      ...overrides,
    };
  }

  private emitTelemetry(
    stage: QDocAeonRelayTelemetryStage,
    attributes: QDocAeonRelayAttributes,
    error?: Error
  ): void {
    this.config.telemetry?.onEvent?.({
      stage,
      atMs: currentTimestamp(),
      attributes,
      errorMessage: error?.message,
    });
  }

  private startSpan(
    name: string,
    attributes: QDocAeonRelayAttributes
  ): QDocAeonRelaySpan | null {
    return this.config.telemetry?.startSpan?.(name, attributes) ?? null;
  }
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    if (typeof atob === 'function') {
      const binary = atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return bytes;
    }

    const BufferCtor = getBufferConstructor();
    if (BufferCtor) {
      return new Uint8Array(BufferCtor.from(value, 'base64'));
    }
  } catch {
    return null;
  }

  return null;
}

export { QDocAeonRelay as QDocRelay };
export type QDocRelayConfig = QDocAeonRelayConfig;
export type QDocRelayStatus = QDocAeonRelayStatus;
export type QDocRelayAttributes = QDocAeonRelayAttributes;
export type QDocRelayAttributeValue = QDocAeonRelayAttributeValue;
export type QDocRelayReadyStrategy = QDocAeonRelayReadyStrategy;
export type QDocRelayTelemetry = QDocAeonRelayTelemetry;
export type QDocRelayTelemetryEvent = QDocAeonRelayTelemetryEvent;
export type QDocRelayTelemetryStage = QDocAeonRelayTelemetryStage;
export type QDocRelaySpan = QDocAeonRelaySpan;
