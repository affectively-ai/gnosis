import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let GnosisRuntime: any;
try {
    GnosisRuntime = require('gnosis_runtime');
} catch (e) {
    try {
        GnosisRuntime = require('../../../node_modules/gnosis_runtime');
    } catch (e2) {
        // Ignored
    }
}

export class QuantumWasmBridge {
    private runtime: any;
    private initialized: boolean = false;

    constructor() {
        try {
            if (GnosisRuntime && GnosisRuntime.QuantumRuntime) {
                this.runtime = new GnosisRuntime.QuantumRuntime();
                this.initialized = typeof this.runtime.process_frame === 'function' || typeof this.runtime.processFrame === 'function';
            }
        } catch (e) {
            // Ignored
        }
    }

    public processAstEdge(edgeType: string, sourceCount: number, targetCount: number): string {
        if (!this.initialized) return `[WASM] Not initialized or process_frame missing.`;

        let flags = 0;
        switch (edgeType) {
            case 'FORK': flags = 0b00000001; break;
            case 'RACE': flags = 0b00000010; break;
            case 'FOLD':
            case 'COLLAPSE': flags = 0b00000100; break;
            case 'VENT':
            case 'TUNNEL': flags = 0b00001000; break;
            case 'INTERFERE': flags = 0b00100000; break;
            default: return `[WASM] Ignored edge type: ${edgeType}`;
        }

        const payload = new TextEncoder().encode(JSON.stringify({ s: sourceCount, t: targetCount }));
        const len = payload.length;

        // Manual 10-byte Aeon Flow Frame Encoding (Big Endian)
        const buffer = new Uint8Array(10 + len);
        const view = new DataView(buffer.buffer);
        
        view.setUint16(0, 1, false); // Stream ID: 1
        view.setUint32(2, 1, false); // Sequence: 1
        view.setUint8(6, flags);     // Flags
        
        // 24-bit length (big endian)
        buffer[7] = (len >> 16) & 0xff;
        buffer[8] = (len >> 8) & 0xff;
        buffer[9] = len & 0xff;
        
        buffer.set(payload, 10);

        try {
            if (typeof this.runtime.process_frame === 'function') {
                this.runtime.process_frame(buffer);
            } else {
                this.runtime.processFrame(buffer);
            }
            return `[WASM] Processed ${edgeType}. Metrics: ${this.runtime.metrics()}`;
        } catch (e: any) {
            return `[WASM Error] ${e}`;
        }
    }

    public getMetrics(): string {
        return this.initialized ? this.runtime.metrics() : 'Not initialized';
    }
}
