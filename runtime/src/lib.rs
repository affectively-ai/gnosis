use wasm_bindgen::prelude::*;

// -----------------------------------------------------------------------------
// Aeon Flow Frame Defs
// 10-byte wire format exactly as defined in flow-bridge.ts
// -----------------------------------------------------------------------------

pub const HEADER_SIZE: usize = 10;
pub const MAX_PAYLOAD_LENGTH: usize = 0xffffff;

// Flags mirror types.ts (assumed bitmasks based on the typescript tests)
pub const FORK: u8  = 0b00000001;
pub const RACE: u8  = 0b00000010;
pub const FOLD: u8  = 0b00000100;
pub const VENT: u8  = 0b00001000;
pub const FIN: u8   = 0b00010000;
pub const INTERFERE: u8 = 0b00100000;
pub const COLLAPSE: u8 = FOLD; // Synonym

#[wasm_bindgen]
pub struct FlowFrame {
    pub stream_id: u16,
    pub sequence: u32,
    pub flags: u8,
    payload_len: u32,
    payload: Vec<u8>,
}

#[wasm_bindgen]
impl FlowFrame {
    pub fn create(stream_id: u16, sequence: u32, flags: u8, payload: &[u8]) -> Result<FlowFrame, JsValue> {
        if payload.len() > MAX_PAYLOAD_LENGTH {
            return Err(JsValue::from_str("Payload too large"));
        }
        Ok(FlowFrame {
            stream_id,
            sequence,
            flags,
            payload_len: payload.len() as u32,
            payload: payload.to_vec(),
        })
    }

    pub fn encode(&self) -> Vec<u8> {
        let mut buffer = Vec::with_capacity(HEADER_SIZE + self.payload.len());
        
        // 0-1: Stream ID (u16 BE)
        buffer.extend_from_slice(&self.stream_id.to_be_bytes());
        // 2-5: Sequence (u32 BE)
        buffer.extend_from_slice(&self.sequence.to_be_bytes());
        // 6: Flags
        buffer.push(self.flags);
        // 7-9: Length (24-bit BE)
        buffer.push(((self.payload_len >> 16) & 0xff) as u8);
        buffer.push(((self.payload_len >> 8) & 0xff) as u8);
        buffer.push((self.payload_len & 0xff) as u8);
        
        // Payload
        buffer.extend_from_slice(&self.payload);
        
        buffer
    }

    pub fn decode(bytes: &[u8], offset: usize) -> Result<FlowFrame, JsValue> {
        if bytes.len() - offset < HEADER_SIZE {
            return Err(JsValue::from_str("Buffer too small"));
        }

        let slice = &bytes[offset..];
        
        let stream_id = u16::from_be_bytes([slice[0], slice[1]]);
        let sequence = u32::from_be_bytes([slice[2], slice[3], slice[4], slice[5]]);
        let flags = slice[6];
        let length = ((slice[7] as u32) << 16) | ((slice[8] as u32) << 8) | (slice[9] as u32);

        if bytes.len() - offset < HEADER_SIZE + length as usize {
            return Err(JsValue::from_str("Buffer incomplete"));
        }

        let payload_start = offset + HEADER_SIZE;
        let payload_end = payload_start + length as usize;
        let payload = bytes[payload_start..payload_end].to_vec();

        Ok(FlowFrame {
            stream_id,
            sequence,
            flags,
            payload_len: length,
            payload,
        })
    }

    pub fn get_payload(&self) -> Vec<u8> {
        self.payload.clone()
    }
}

// -----------------------------------------------------------------------------
// Vectorized Quantum Runtime
// -----------------------------------------------------------------------------

#[wasm_bindgen]
pub struct QuantumRuntime {
    beta1: usize,
    paths: usize,
}

#[wasm_bindgen]
impl QuantumRuntime {
    #[wasm_bindgen(constructor)]
    pub fn new() -> QuantumRuntime {
        QuantumRuntime {
            beta1: 0,
            paths: 1, 
        }
    }

    /// Takes a raw Aeon FlowFrame byte buffer, processes the topology based on flags,
    /// and returns a resulting frame (simulating a zero-copy pass-through).
    pub fn process_frame(&mut self, encoded_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
        let mut frame = FlowFrame::decode(encoded_bytes, 0)?;
        
        if (frame.flags & FORK) != 0 {
            // Simulated fork - we would read payload here to know how many paths
            self.beta1 += 1;
            self.paths += 1;
            frame.flags &= !FORK; // Clear flag after process
        }
        
        if (frame.flags & RACE) != 0 {
            self.paths = 1;
            // Retain beta1 until someone wins (in a real system)
            frame.flags &= !RACE;
        }
        
        if (frame.flags & FOLD) != 0 || (frame.flags & COLLAPSE) != 0 {
            self.beta1 = self.beta1.saturating_sub(1);
            self.paths = 1;
            frame.flags &= !(FOLD | COLLAPSE);
        }
        
        if (frame.flags & VENT) != 0 {
            self.beta1 = self.beta1.saturating_sub(1);
            self.paths = self.paths.saturating_sub(1);
            frame.flags &= !VENT;
        }
        
        if (frame.flags & INTERFERE) != 0 {
            // In a real quantum circuit, this calculates constructive/destructive 
            // interference between amplitudes. Here we just track it passed.
            frame.flags &= !INTERFERE;
        }

        Ok(frame.encode())
    }

    pub fn metrics(&self) -> String {
        format!("Paths: {}, Beta1: {}", self.paths, self.beta1)
    }
}
