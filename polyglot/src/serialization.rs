use crate::gg_compiler::GgTopology;
use serde::{Deserialize, Serialize};
/// Complete output from a polyglot scan -- one or more topologies with metadata.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotScanResult {
    pub file_path: String,
    pub language: String,
    pub topologies: Vec<PolyglotFunctionResult>,
    pub errors: Vec<PolyglotError>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotFunctionResult {
    pub function_name: String,
    pub topology: GgTopology,
    /// The .gg source text.
    pub gg_source: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotError {
    pub message: String,
    pub line: Option<usize>,
    pub column: Option<usize>,
}

/// SARIF-compatible location for mapping diagnostics back to source.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotSourceLocation {
    pub file: String,
    pub start_line: usize,
    pub start_column: usize,
    pub end_line: usize,
    pub end_column: usize,
}

impl PolyglotScanResult {
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}
