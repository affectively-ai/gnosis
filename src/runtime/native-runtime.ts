import type { ASTEdge } from '../betty/compiler.js';
import type { StabilityMetadata } from '../betty/stability.js';

const FLOW_FLAG_FORK = 0b00000001;
const FLOW_FLAG_RACE = 0b00000010;
const FLOW_FLAG_FOLD = 0b00000100;
const FLOW_FLAG_VENT = 0b00001000;
const FLOW_FLAG_INTERFERE = 0b00100000;

const FLOW_HEADER_SIZE = 10;
const FLOW_STREAM_ID = 1;

interface NativeWasmRuntime {
  process_frame: (encodedBytes: Uint8Array) => Uint8Array;
  metrics: () => string;
  get_trace?: () => string;
}

interface NativeWasmModule {
  default?: () => Promise<unknown>;
  QuantumRuntime?: new () => NativeWasmRuntime;
}

export interface GnosisNativeRuntimeSnapshot {
  wasmEnabled: boolean;
  edgesProcessed: number;
  metrics: string;
  trace: string;
  stabilityMetadata: StabilityMetadata | null;
}

export interface GnosisNativeRuntimeProcessOptions {
  stabilityMetadata?: StabilityMetadata | null;
}

export class GnosisNativeRuntime {
  private wasmRuntime: NativeWasmRuntime | null = null;
  private initAttempted = false;
  private initPromise: Promise<void> | null = null;
  private sequence = 1;
  private edgesProcessed = 0;
  private stabilityMetadata: StabilityMetadata | null = null;

  private fallbackPaths = 1;
  private fallbackBeta1 = 0;
  private fallbackTrace: string[] = [];

  public setStabilityMetadata(stabilityMetadata: StabilityMetadata | null): void {
    this.stabilityMetadata = stabilityMetadata;
  }

  public async onEdge(edge: ASTEdge): Promise<void> {
    const flags = this.edgeTypeToFlags(edge.type);
    if (flags === null) {
      return;
    }

    await this.ensureInitialized();

    const payload = new TextEncoder().encode(
      JSON.stringify({
        edge: edge.type,
        sourceCount: edge.sourceIds.length,
        targetCount: edge.targetIds.length,
        stability: this.stabilityMetadata
          ? {
              redline: this.stabilityMetadata.redline,
              geometricCeiling: this.stabilityMetadata.geometricCeiling,
              spectralRadius: this.stabilityMetadata.spectralRadius,
              supremumBound: this.stabilityMetadata.supremumBound,
              proofKind: this.stabilityMetadata.proofKind,
              theoremName: this.stabilityMetadata.theoremName,
              countableQueueCertified:
                this.stabilityMetadata.countableQueueCertified,
              laminarGeometricTheoremName:
                this.stabilityMetadata.laminarGeometricTheoremName,
              measurableHarrisTheoremName:
                this.stabilityMetadata.measurableHarrisTheoremName,
              measurableLaminarTheoremName:
                this.stabilityMetadata.measurableLaminarTheoremName,
              measurableQuantitativeLaminarTheoremName:
                this.stabilityMetadata.measurableQuantitativeLaminarTheoremName,
              measurableQuantitativeHarrisTheoremName:
                this.stabilityMetadata.measurableQuantitativeHarrisTheoremName,
              measurableFiniteTimeHarrisTheoremName:
                this.stabilityMetadata.measurableFiniteTimeHarrisTheoremName,
              measurableHarrisRecurrentTheoremName:
                this.stabilityMetadata.measurableHarrisRecurrentTheoremName,
              measurableFiniteTimeGeometricErgodicTheoremName:
                this.stabilityMetadata.measurableFiniteTimeGeometricErgodicTheoremName,
              measurableLevyProkhorovGeometricErgodicTheoremName:
                this.stabilityMetadata
                  .measurableLevyProkhorovGeometricErgodicTheoremName,
              measurableLevyProkhorovGeometricDecayTheoremName:
                this.stabilityMetadata
                  .measurableLevyProkhorovGeometricDecayTheoremName,
              measurableLevyProkhorovAbstractGeometricErgodicTheoremName:
                this.stabilityMetadata
                  .measurableLevyProkhorovAbstractGeometricErgodicTheoremName,
              measurableWitnessQuantitativeHarrisTheoremName:
                this.stabilityMetadata
                  .measurableWitnessQuantitativeHarrisTheoremName,
              queueBoundary: this.stabilityMetadata.queueBoundary,
              laminarAtom: this.stabilityMetadata.laminarAtom,
              queuePotential: this.stabilityMetadata.queuePotential,
            }
          : undefined,
      })
    );
    const sequence = this.sequence;
    const frame = this.encodeFlowFrame(sequence, flags, payload);
    this.sequence += 1;

    if (this.wasmRuntime) {
      try {
        this.wasmRuntime.process_frame(frame);
      } catch (error) {
        this.fallbackTrace.push(
          `[native] process_frame failed: ${this.errorMessage(error)}`
        );
        this.wasmRuntime = null;
        this.applyFallback(sequence, flags, edge.type);
      }
    } else {
      this.applyFallback(sequence, flags, edge.type);
    }

    this.edgesProcessed += 1;
  }

  public async processEdges(
    edges: ASTEdge[],
    options: GnosisNativeRuntimeProcessOptions = {}
  ): Promise<GnosisNativeRuntimeSnapshot> {
    if (options.stabilityMetadata !== undefined) {
      this.stabilityMetadata = options.stabilityMetadata;
    }
    for (const edge of edges) {
      await this.onEdge(edge);
    }
    return this.snapshot();
  }

  public snapshot(): GnosisNativeRuntimeSnapshot {
    const wasmEnabled = this.wasmRuntime !== null;

    const metrics = wasmEnabled
      ? this.safeWasmMetrics()
      : `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;

    const trace = wasmEnabled
      ? this.safeWasmTrace()
      : this.fallbackTrace.join('\n');

    return {
      wasmEnabled,
      edgesProcessed: this.edgesProcessed,
      metrics,
      trace,
      stabilityMetadata: this.stabilityMetadata,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.wasmRuntime || this.initAttempted) {
      return;
    }
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeWasmRuntime();
    await this.initPromise;
    this.initPromise = null;
  }

  private async initializeWasmRuntime(): Promise<void> {
    this.initAttempted = true;

    try {
      const module = (await import('gnosis_runtime')) as NativeWasmModule;
      if (typeof module.default === 'function') {
        await module.default();
      }

      if (typeof module.QuantumRuntime === 'function') {
        const runtime = new module.QuantumRuntime();
        if (typeof runtime.process_frame === 'function') {
          this.wasmRuntime = runtime;
          return;
        }
      }

      this.fallbackTrace.push(
        '[native] gnosis_runtime loaded but QuantumRuntime is unavailable'
      );
    } catch (error) {
      this.fallbackTrace.push(
        `[native] gnosis_runtime unavailable: ${this.errorMessage(error)}`
      );
    }
  }

  private edgeTypeToFlags(edgeTypeRaw: string): number | null {
    const edgeType = edgeTypeRaw.trim().toUpperCase();
    switch (edgeType) {
      case 'FORK':
      case 'EVOLVE':
      case 'SUPERPOSE':
      case 'ENTANGLE':
        return FLOW_FLAG_FORK;
      case 'RACE':
        return FLOW_FLAG_RACE;
      case 'FOLD':
      case 'COLLAPSE':
      case 'OBSERVE':
        return FLOW_FLAG_FOLD;
      case 'VENT':
      case 'TUNNEL':
        return FLOW_FLAG_VENT;
      case 'INTERFERE':
        return FLOW_FLAG_INTERFERE;
      default:
        return null;
    }
  }

  private encodeFlowFrame(
    sequence: number,
    flags: number,
    payload: Uint8Array
  ): Uint8Array {
    const buffer = new Uint8Array(FLOW_HEADER_SIZE + payload.length);
    const view = new DataView(buffer.buffer);

    view.setUint16(0, FLOW_STREAM_ID, false);
    view.setUint32(2, sequence >>> 0, false);
    view.setUint8(6, flags);

    buffer[7] = (payload.length >> 16) & 0xff;
    buffer[8] = (payload.length >> 8) & 0xff;
    buffer[9] = payload.length & 0xff;
    buffer.set(payload, FLOW_HEADER_SIZE);

    return buffer;
  }

  private applyFallback(
    sequence: number,
    flags: number,
    edgeType: string
  ): void {
    this.fallbackTrace.push(
      `Seq:${sequence} Edge:${edgeType} Flags:0x${flags
        .toString(16)
        .padStart(2, '0')}`
    );

    if ((flags & FLOW_FLAG_FORK) !== 0) {
      this.fallbackBeta1 += 1;
      this.fallbackPaths += 1;
    }
    if ((flags & FLOW_FLAG_RACE) !== 0) {
      this.fallbackPaths = 1;
    }
    if ((flags & FLOW_FLAG_FOLD) !== 0) {
      this.fallbackBeta1 = Math.max(0, this.fallbackBeta1 - 1);
      this.fallbackPaths = 1;
    }
    if ((flags & FLOW_FLAG_VENT) !== 0) {
      this.fallbackBeta1 = Math.max(0, this.fallbackBeta1 - 1);
      this.fallbackPaths = Math.max(0, this.fallbackPaths - 1);
    }
  }

  private safeWasmMetrics(): string {
    if (!this.wasmRuntime) {
      return `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;
    }
    try {
      return this.wasmRuntime.metrics();
    } catch (error) {
      this.fallbackTrace.push(
        `[native] metrics() failed: ${this.errorMessage(error)}`
      );
      return `Paths: ${this.fallbackPaths}, Beta1: ${this.fallbackBeta1}`;
    }
  }

  private safeWasmTrace(): string {
    if (!this.wasmRuntime || typeof this.wasmRuntime.get_trace !== 'function') {
      return this.fallbackTrace.join('\n');
    }
    try {
      return this.wasmRuntime.get_trace();
    } catch (error) {
      this.fallbackTrace.push(
        `[native] get_trace() failed: ${this.errorMessage(error)}`
      );
      return this.fallbackTrace.join('\n');
    }
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
