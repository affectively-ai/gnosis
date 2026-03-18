'use aeon';

import { QDoc, QMap, QArray } from './qdoc.js';
import { QDocRelay, type QDocRelayConfig, type QDocRelayStatus } from './aeon-relay.js';

export type QCorridorMode = 'readwrite' | 'readonly' | 'bypass';
export type QCorridorReuseScope = 'exact' | 'corridor';
export type QCorridorObservationRole = 'winner' | 'vent' | 'repair';
export type QCorridorObservationStatus =
  | 'success'
  | 'vented'
  | 'error'
  | 'timeout'
  | 'cancelled';

export interface QCorridorOptions {
  namespace?: string;
  relay?: QDocRelayConfig | null;
}

export interface QCorridorExecutionOptions {
  mode?: QCorridorMode;
  corridorKey?: string;
  suffixKey?: unknown;
  reuseScope?: QCorridorReuseScope;
}

export interface QCorridorSession {
  mode: QCorridorMode;
  reuseScope: QCorridorReuseScope;
  topologyKey: string;
  corridorKey: string;
  requestKey: string;
}

export interface QCorridorMetrics {
  collapseCount: number;
  firstSufficientCount: number;
  ventCount: number;
  repairDebt: number;
  lastWinnerPath: string | null;
}

export interface QCorridorEntry {
  requestKey: string;
  corridorKey: string;
  topologyKey: string;
  reuseScope: QCorridorReuseScope;
  status: 'inflight' | 'cached' | 'error';
  hasPayload: boolean;
  payloadJson?: string;
  winnerPath?: string | null;
  collapseCount: number;
  firstSufficientCount: number;
  ventCount: number;
  repairDebt: number;
  cachedAt?: number;
  updatedAt: number;
  error?: string;
}

export interface QCorridorRecord {
  corridorKey: string;
  topologyKey: string;
  reuseScope: QCorridorReuseScope;
  status: 'empty' | 'inflight' | 'cached' | 'error';
  requestCount: number;
  cacheHits: number;
  tunnelHits: number;
  sharedMiddleCoverage: number;
  collapseCount: number;
  firstSufficientCount: number;
  ventCount: number;
  repairDebt: number;
  signalScore: number;
  garbleRisk: number;
  correctionBurden: number;
  ventDebt: number;
  corridorStrength: number;
  pathScores: Record<string, number>;
  lastWinnerPath?: string | null;
  lastAcceptedRequestKey?: string;
  updatedAt: number;
}

export interface QCorridorEvent {
  type: 'submit' | 'hit' | 'tunnel' | 'settle' | 'error';
  corridorKey: string;
  requestKey: string;
  topologyKey: string;
  reuseScope: QCorridorReuseScope;
  timestamp: number;
  winnerPath?: string | null;
  error?: string;
}

export interface QCorridorEvidence {
  id: string;
  corridorKey: string;
  requestKey: string;
  topologyKey: string;
  reuseScope: QCorridorReuseScope;
  path: string;
  role: QCorridorObservationRole;
  status: QCorridorObservationStatus;
  timestamp: number;
  detail?: string;
}

export interface QCorridorObservation {
  path: string;
  role: QCorridorObservationRole;
  status: QCorridorObservationStatus;
  detail?: string;
}

export type QCorridorLookup<T> =
  | {
      kind: 'hit';
      session: QCorridorSession;
      entry: QCorridorEntry;
    }
  | {
      kind: 'tunnel';
      session: QCorridorSession;
      promise: Promise<T>;
    }
  | {
      kind: 'miss';
      session: QCorridorSession;
    };

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'bigint') {
    return JSON.stringify(value.toString(10));
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record)
      .filter(([, entryValue]) => {
        const entryType = typeof entryValue;
        return (
          entryType !== 'undefined' &&
          entryType !== 'function' &&
          entryType !== 'symbol'
        );
      })
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

    return `{${entries
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableStringify(entryValue)}`
      )
      .join(',')}}`;
  }

  return 'null';
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function safePayloadJson(payload: unknown): string | undefined {
  if (payload === undefined) {
    return undefined;
  }

  try {
    return stableStringify(payload);
  } catch {
    try {
      return JSON.stringify(String(payload));
    } catch {
      return undefined;
    }
  }
}

function corridorStrength(record: Pick<QCorridorRecord,
  'signalScore' | 'sharedMiddleCoverage' | 'tunnelHits' | 'garbleRisk' | 'correctionBurden' | 'ventDebt'
>): number {
  return (
    record.signalScore +
    record.sharedMiddleCoverage +
    record.tunnelHits -
    record.garbleRisk -
    record.correctionBurden -
    record.ventDebt
  );
}

function pathDelta(observation: QCorridorObservation): number {
  if (observation.role === 'winner') {
    return observation.status === 'success' ? 3 : 1;
  }

  if (observation.role === 'repair') {
    return observation.status === 'success' ? 1 : -2;
  }

  return observation.status === 'success' ? -1 : -2;
}

export class QCorridor {
  private readonly _doc: QDoc;
  private readonly namespace: string;
  private readonly corridors: QMap<QCorridorRecord>;
  private readonly entries: QMap<QCorridorEntry>;
  private readonly events: QArray<QCorridorEvent>;
  private readonly evidence: QArray<QCorridorEvidence>;
  private readonly inflight = new Map<string, Promise<unknown>>();
  private readonly payloads = new Map<string, unknown>();
  private readonly relay: QDocRelay | null;

  constructor(
    doc: QDoc = new QDoc({ guid: 'qcorridor' }),
    options: QCorridorOptions = {}
  ) {
    this._doc = doc;
    this.namespace = options.namespace?.trim() || 'qcorridor';
    this.corridors = this._doc.getMap<QCorridorRecord>(
      `${this.namespace}_corridors`
    );
    this.entries = this._doc.getMap<QCorridorEntry>(
      `${this.namespace}_entries`
    );
    this.events = this._doc.getArray<QCorridorEvent>(
      `${this.namespace}_events`
    );
    this.evidence = this._doc.getArray<QCorridorEvidence>(
      `${this.namespace}_evidence`
    );
    this.relay = options.relay ? new QDocRelay(this._doc, options.relay) : null;
  }

  get document(): QDoc {
    return this._doc;
  }

  get relayStatus(): QDocRelayStatus | null {
    return this.relay ? this.relay.status : null;
  }

  async connectRelay(): Promise<void> {
    if (!this.relay) {
      return;
    }

    await this.relay.connect();
  }

  disconnectRelay(): void {
    this.relay?.disconnect();
  }

  getCorridor(corridorKey: string): QCorridorRecord | undefined {
    return this.corridors.get(corridorKey);
  }

  getEntry(requestKey: string): QCorridorEntry | undefined {
    return this.entries.get(requestKey);
  }

  getEvents(): QCorridorEvent[] {
    return this.events.toArray();
  }

  getEvidence(): QCorridorEvidence[] {
    return this.evidence.toArray();
  }

  clearInflight(): void {
    this.inflight.clear();
  }

  async createSession(
    topologyKeySource: string,
    payload: unknown,
    options: QCorridorExecutionOptions = {}
  ): Promise<QCorridorSession> {
    const mode = options.mode ?? 'readwrite';
    const reuseScope = options.reuseScope ?? 'exact';
    const topologyKey = (await sha256Hex(topologyKeySource)).slice(0, 24);
    const corridorKey =
      options.corridorKey?.trim() || `topology:${topologyKey}`;

    if (reuseScope === 'corridor') {
      return {
        mode,
        reuseScope,
        topologyKey,
        corridorKey,
        requestKey: corridorKey,
      };
    }

    const suffixSource =
      options.suffixKey === undefined ? payload : options.suffixKey;
    const suffixKey = (await sha256Hex(stableStringify(suffixSource))).slice(
      0,
      24
    );

    return {
      mode,
      reuseScope,
      topologyKey,
      corridorKey,
      requestKey: `${corridorKey}:${suffixKey}`,
    };
  }

  lookup<T>(session: QCorridorSession): QCorridorLookup<T> {
    if (session.mode === 'bypass') {
      return { kind: 'miss', session };
    }

    if (session.mode === 'readonly') {
      const cachedEntry = this.entries.get(session.requestKey);
      if (cachedEntry?.status === 'cached') {
        return { kind: 'hit', session, entry: cachedEntry };
      }

      const inflight = this.inflight.get(session.requestKey);
      if (inflight) {
        return {
          kind: 'tunnel',
          session,
          promise: inflight as Promise<T>,
        };
      }

      return { kind: 'miss', session };
    }

    const now = Date.now();
    const corridor = this.bumpCorridorArrival(session, now);
    const cachedEntry = this.entries.get(session.requestKey);

    if (cachedEntry?.status === 'cached') {
      this.corridors.set(
        session.corridorKey,
        this.rebalanceCorridor({
          ...corridor,
          status: 'cached',
          cacheHits: corridor.cacheHits + 1,
          sharedMiddleCoverage: corridor.sharedMiddleCoverage + 1,
          signalScore: corridor.signalScore + 1,
          updatedAt: now,
        })
      );
      this.pushEvent({
        type: 'hit',
        corridorKey: session.corridorKey,
        requestKey: session.requestKey,
        topologyKey: session.topologyKey,
        reuseScope: session.reuseScope,
        timestamp: now,
        winnerPath: cachedEntry.winnerPath ?? null,
      });

      return { kind: 'hit', session, entry: cachedEntry };
    }

    const inflight = this.inflight.get(session.requestKey);
    if (inflight) {
      this.corridors.set(
        session.corridorKey,
        this.rebalanceCorridor({
          ...corridor,
          status: 'inflight',
          tunnelHits: corridor.tunnelHits + 1,
          sharedMiddleCoverage: corridor.sharedMiddleCoverage + 1,
          signalScore: corridor.signalScore + 1,
          updatedAt: now,
        })
      );
      this.pushEvent({
        type: 'tunnel',
        corridorKey: session.corridorKey,
        requestKey: session.requestKey,
        topologyKey: session.topologyKey,
        reuseScope: session.reuseScope,
        timestamp: now,
      });

      return {
        kind: 'tunnel',
        session,
        promise: inflight as Promise<T>,
      };
    }

    this.entries.set(session.requestKey, {
      requestKey: session.requestKey,
      corridorKey: session.corridorKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      status: 'inflight',
      hasPayload: false,
      collapseCount: cachedEntry?.collapseCount ?? 0,
      firstSufficientCount: cachedEntry?.firstSufficientCount ?? 0,
      ventCount: cachedEntry?.ventCount ?? 0,
      repairDebt: cachedEntry?.repairDebt ?? 0,
      updatedAt: now,
    });
    this.corridors.set(
      session.corridorKey,
      this.rebalanceCorridor({
        ...corridor,
        status: 'inflight',
        updatedAt: now,
      })
    );
    this.pushEvent({
      type: 'submit',
      corridorKey: session.corridorKey,
      requestKey: session.requestKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      timestamp: now,
    });

    return { kind: 'miss', session };
  }

  registerInflight<T>(session: QCorridorSession, promise: Promise<T>): void {
    if (session.mode !== 'readwrite') {
      return;
    }

    this.inflight.set(session.requestKey, promise);
  }

  release(session: QCorridorSession): void {
    this.inflight.delete(session.requestKey);
  }

  settle(
    session: QCorridorSession,
    payload: unknown,
    metrics: QCorridorMetrics
  ): QCorridorEntry {
    if (session.mode !== 'readwrite') {
      const now = Date.now();
      return {
        requestKey: session.requestKey,
        corridorKey: session.corridorKey,
        topologyKey: session.topologyKey,
        reuseScope: session.reuseScope,
        status: 'cached',
        hasPayload: payload !== undefined,
        payloadJson: safePayloadJson(payload),
        winnerPath: metrics.lastWinnerPath,
        collapseCount: metrics.collapseCount,
        firstSufficientCount: metrics.firstSufficientCount,
        ventCount: metrics.ventCount,
        repairDebt: metrics.repairDebt,
        cachedAt: now,
        updatedAt: now,
      };
    }

    const now = Date.now();
    const entry: QCorridorEntry = {
      requestKey: session.requestKey,
      corridorKey: session.corridorKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      status: 'cached',
      hasPayload: true,
      payloadJson: safePayloadJson(payload),
      winnerPath: metrics.lastWinnerPath,
      collapseCount: metrics.collapseCount,
      firstSufficientCount: metrics.firstSufficientCount,
      ventCount: metrics.ventCount,
      repairDebt: metrics.repairDebt,
      cachedAt: now,
      updatedAt: now,
    };

    this.entries.set(session.requestKey, entry);
    this.payloads.set(session.requestKey, payload);

    const currentCorridor =
      this.corridors.get(session.corridorKey) ??
      this.createEmptyCorridor(session, now);
    this.corridors.set(
      session.corridorKey,
      this.rebalanceCorridor({
        ...currentCorridor,
        status: 'cached',
        collapseCount: currentCorridor.collapseCount + metrics.collapseCount,
        firstSufficientCount:
          currentCorridor.firstSufficientCount + metrics.firstSufficientCount,
        ventCount: currentCorridor.ventCount + metrics.ventCount,
        repairDebt: currentCorridor.repairDebt + metrics.repairDebt,
        signalScore:
          currentCorridor.signalScore +
          metrics.firstSufficientCount +
          (metrics.lastWinnerPath ? 1 : 0),
        garbleRisk: currentCorridor.garbleRisk + metrics.repairDebt,
        correctionBurden:
          currentCorridor.correctionBurden + metrics.repairDebt,
        ventDebt: currentCorridor.ventDebt + metrics.ventCount,
        lastWinnerPath: metrics.lastWinnerPath ?? currentCorridor.lastWinnerPath,
        lastAcceptedRequestKey: session.requestKey,
        updatedAt: now,
      })
    );
    this.pushEvent({
      type: 'settle',
      corridorKey: session.corridorKey,
      requestKey: session.requestKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      timestamp: now,
      winnerPath: metrics.lastWinnerPath,
    });

    return entry;
  }

  fail(session: QCorridorSession, error: unknown): void {
    if (session.mode !== 'readwrite') {
      return;
    }

    const now = Date.now();
    const message =
      error instanceof Error ? error.message : String(error ?? 'unknown error');
    this.entries.set(session.requestKey, {
      requestKey: session.requestKey,
      corridorKey: session.corridorKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      status: 'error',
      hasPayload: false,
      collapseCount: 0,
      firstSufficientCount: 0,
      ventCount: 0,
      repairDebt: 0,
      updatedAt: now,
      error: message,
    });

    const corridor =
      this.corridors.get(session.corridorKey) ??
      this.createEmptyCorridor(session, now);
    this.corridors.set(
      session.corridorKey,
      this.rebalanceCorridor({
        ...corridor,
        status: 'error',
        garbleRisk: corridor.garbleRisk + 1,
        correctionBurden: corridor.correctionBurden + 1,
        updatedAt: now,
      })
    );
    this.pushEvent({
      type: 'error',
      corridorKey: session.corridorKey,
      requestKey: session.requestKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      timestamp: now,
      error: message,
    });
  }

  recordEvidence(
    session: QCorridorSession,
    observations: readonly QCorridorObservation[]
  ): QCorridorEvidence[] {
    if (session.mode !== 'readwrite' || observations.length === 0) {
      return [];
    }

    const now = Date.now();
    const corridor =
      this.corridors.get(session.corridorKey) ??
      this.createEmptyCorridor(session, now);
    const pathScores = { ...corridor.pathScores };
    let signalScore = corridor.signalScore;
    let garbleRisk = corridor.garbleRisk;
    let correctionBurden = corridor.correctionBurden;
    let ventDebt = corridor.ventDebt;
    const written: QCorridorEvidence[] = [];

    for (let index = 0; index < observations.length; index++) {
      const observation = observations[index];
      pathScores[observation.path] =
        (pathScores[observation.path] ?? 0) + pathDelta(observation);

      if (observation.role === 'winner') {
        signalScore += 1;
      } else if (observation.role === 'repair') {
        garbleRisk += observation.status === 'success' ? 0 : 1;
        correctionBurden += 1;
      } else {
        ventDebt += 1;
      }

      const evidence: QCorridorEvidence = {
        id: `${now}:${index}:${observation.path}:${observation.role}`,
        corridorKey: session.corridorKey,
        requestKey: session.requestKey,
        topologyKey: session.topologyKey,
        reuseScope: session.reuseScope,
        path: observation.path,
        role: observation.role,
        status: observation.status,
        timestamp: now + index,
        ...(observation.detail ? { detail: observation.detail } : {}),
      };
      this.evidence.push([evidence]);
      written.push(evidence);
    }

    this.corridors.set(
      session.corridorKey,
      this.rebalanceCorridor({
        ...corridor,
        pathScores,
        signalScore,
        garbleRisk,
        correctionBurden,
        ventDebt,
        updatedAt: now,
      })
    );

    return written;
  }

  readPayload(entry: QCorridorEntry): {
    found: boolean;
    payload: unknown;
  } {
    if (this.payloads.has(entry.requestKey)) {
      return {
        found: true,
        payload: this.payloads.get(entry.requestKey),
      };
    }

    if (!entry.hasPayload) {
      return { found: false, payload: undefined };
    }

    if (entry.payloadJson === undefined) {
      this.payloads.set(entry.requestKey, undefined);
      return { found: true, payload: undefined };
    }

    try {
      const parsed = JSON.parse(entry.payloadJson);
      this.payloads.set(entry.requestKey, parsed);
      return { found: true, payload: parsed };
    } catch {
      return { found: false, payload: undefined };
    }
  }

  getCorridorStrength(corridorKey: string): number {
    return this.corridors.get(corridorKey)?.corridorStrength ?? 0;
  }

  rankPaths(corridorKey: string, paths: readonly string[]): string[] {
    const pathScores = this.corridors.get(corridorKey)?.pathScores ?? {};
    return [...paths]
      .map((path, index) => ({ path, index }))
      .sort((left, right) => {
        const scoreDelta =
          (pathScores[right.path] ?? 0) - (pathScores[left.path] ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
        return left.index - right.index;
      })
      .map(({ path }) => path);
  }

  private bumpCorridorArrival(
    session: QCorridorSession,
    timestamp: number
  ): QCorridorRecord {
    const current =
      this.corridors.get(session.corridorKey) ??
      this.createEmptyCorridor(session, timestamp);
    const next = this.rebalanceCorridor({
      ...current,
      requestCount: current.requestCount + 1,
      updatedAt: timestamp,
    });
    this.corridors.set(session.corridorKey, next);
    return next;
  }

  private createEmptyCorridor(
    session: QCorridorSession,
    timestamp: number
  ): QCorridorRecord {
    return {
      corridorKey: session.corridorKey,
      topologyKey: session.topologyKey,
      reuseScope: session.reuseScope,
      status: 'empty',
      requestCount: 0,
      cacheHits: 0,
      tunnelHits: 0,
      sharedMiddleCoverage: 0,
      collapseCount: 0,
      firstSufficientCount: 0,
      ventCount: 0,
      repairDebt: 0,
      signalScore: 0,
      garbleRisk: 0,
      correctionBurden: 0,
      ventDebt: 0,
      corridorStrength: 0,
      pathScores: {},
      updatedAt: timestamp,
    };
  }

  private rebalanceCorridor(record: QCorridorRecord): QCorridorRecord {
    return {
      ...record,
      corridorStrength: corridorStrength(record),
    };
  }

  private pushEvent(event: QCorridorEvent): void {
    this.events.push([event]);
  }
}
