import { QuantumRuntime, FlowFrame } from 'gnosis_runtime';

export class QuantumWasmBridge {
    private runtime: QuantumRuntime;

    constructor() {
        this.runtime = new QuantumRuntime();
    }

    public processAstEdge(edgeType: string, sourceCount: number, targetCount: number): string {
        let flags = 0;
        
        switch (edgeType) {
            case 'FORK':
                flags = 0b00000001; // FORK
                break;
            case 'RACE':
                flags = 0b00000010; // RACE
                break;
            case 'FOLD':
            case 'COLLAPSE':
                flags = 0b00000100; // FOLD / COLLAPSE
                break;
            case 'VENT':
            case 'TUNNEL':
                flags = 0b00001000; // VENT
                break;
            case 'INTERFERE':
                flags = 0b00100000; // INTERFERE
                break;
            default:
                return `[WASM] Ignored edge type: ${edgeType}`;
        }

        // Create a dummy payload just to pass through the WASM engine
        const dummyPayload = new TextEncoder().encode(JSON.stringify({ 
            s: sourceCount, 
            t: targetCount 
        }));

        try {
            // Encode the 10-byte FlowFrame format EXACTLY like aeon-pipelines
            const frame = FlowFrame.new(1, 1, flags, dummyPayload);
            const encodedBytes = frame.encode();

            // Pass it directly through the Rust/WASM vectorized engine
            this.runtime.process_frame(encodedBytes);

            return `[WASM] Processed ${edgeType}. Metrics: ${this.runtime.metrics()}`;
        } catch (e: any) {
            return `[WASM Error] ${e}`;
        }
    }

    public getMetrics(): string {
        return this.runtime.metrics();
    }
}
