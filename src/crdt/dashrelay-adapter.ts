'use aeon';

/**
 * DashRelay Adapter — connects QDoc to DashRelay for sync.
 *
 * Native gnosis sync path for dashrelay-client.
 * Uses topology deltas over FlowFrames.
 *
 * Migration path:
 *   Before: relay.connect(yDoc)
 *   After:  relay.connect(qdoc)  // same API, topology underneath
 */

import type { QDoc } from './qdoc.js';

export interface QDocRelayConfig {
  /** Relay WebSocket URL */
  url: string;
  /** Room name */
  roomName: string;
  /** API key */
  apiKey?: string;
  /** Client ID */
  clientId?: string;
}

export interface QDocRelayStatus {
  connected: boolean;
  peerId: string;
  roomName: string;
  serverSeq: number;
}

/**
 * QDocRelay — connects a QDoc to a DashRelay room.
 *
 * Wire protocol: topology deltas encoded as JSON over WebSocket.
 * Format is intentionally compatible with dashrelay-v1 envelope structure
 * so the same RelayRoomDO can serve qdoc-authoritative clients.
 */
export class QDocRelay {
  private readonly _doc: QDoc;
  private readonly _config: QDocRelayConfig;
  private _ws: WebSocket | null = null;
  private _peerId: string;
  private _serverSeq = 0;
  private _connected = false;
  private _updateHandler: ((delta: Uint8Array, origin: string) => void) | null = null;

  constructor(doc: QDoc, config: QDocRelayConfig) {
    this._doc = doc;
    this._config = config;
    this._peerId = config.clientId ?? `peer-${crypto.randomUUID().slice(0, 8)}`;
  }

  get status(): QDocRelayStatus {
    return {
      connected: this._connected,
      peerId: this._peerId,
      roomName: this._config.roomName,
      serverSeq: this._serverSeq,
    };
  }

  /**
   * Connect to the relay. Returns when initial sync is complete.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this._config.url);
      this._ws = ws;

      ws.onopen = () => {
        // Send join message (dashrelay-v1 compatible)
        ws.send(JSON.stringify({
          type: 'join',
          protocol: 'dashrelay-v1',
          room: this._config.roomName,
          auth: this._config.apiKey,
          mode: 'qdoc-authoritative',
          clientId: this._peerId,
        }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          // Binary message — topology delta from remote
          const update = new Uint8Array(event.data as ArrayBuffer);
          this._doc.applyUpdate(update, 'remote');
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
            this._connected = true;
            this._serverSeq = (envelope.serverSeq as number) ?? 0;
            break;

          case 'snapshot': {
            // Initial state from server — apply as topology delta
            const updateStr = envelope.update as string;
            if (updateStr) {
              const bytes = base64ToBytes(updateStr);
              if (bytes) {
                this._doc.applyUpdate(bytes, 'snapshot');
              }
            }
            resolve(); // Initial sync complete
            break;
          }

          case 'update': {
            // Remote update — apply as topology delta
            const updateStr = envelope.update as string;
            if (updateStr) {
              const bytes = base64ToBytes(updateStr);
              if (bytes) {
                this._doc.applyUpdate(bytes, 'remote');
              }
            }
            this._serverSeq = (envelope.serverSeq as number) ?? this._serverSeq;
            break;
          }

          case 'error':
            reject(new Error(envelope.error as string));
            break;
        }
      };

      ws.onerror = (err) => {
        reject(new Error('WebSocket error'));
      };

      ws.onclose = () => {
        this._connected = false;
        this._detachUpdateHandler();
      };

      // Listen for local changes and send to relay
      this._attachUpdateHandler();
    });
  }

  disconnect(): void {
    this._detachUpdateHandler();
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  }

  private _attachUpdateHandler(): void {
    this._updateHandler = (delta: Uint8Array, origin: string) => {
      if (origin === 'remote' || origin === 'snapshot') {
        return; // Don't echo remote changes back
      }
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        return;
      }
      // Send as binary (topology delta)
      this._ws.send(delta);
    };
    this._doc.on('update', this._updateHandler);
  }

  private _detachUpdateHandler(): void {
    if (this._updateHandler) {
      this._doc.off('update', this._updateHandler);
      this._updateHandler = null;
    }
  }
}

function base64ToBytes(value: string): Uint8Array | null {
  try {
    if (typeof atob === 'function') {
      const binary = atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(value, 'base64'));
    }
  } catch {
    // Invalid payload
  }
  return null;
}
