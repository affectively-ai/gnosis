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

/// Execution manifest for orchestration mode.
/// Describes how each node in the topology should be executed by the polyglot bridge.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotExecutionManifest {
    pub language: String,
    pub file_path: String,
    pub entry_function: String,
    pub node_execution_plans: Vec<NodeExecutionPlan>,
}

/// Execution plan for a single node in the topology.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeExecutionPlan {
    pub node_id: String,
    pub source_range: SourceRange,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub callee: Option<String>,
}

/// Byte range in the source file.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SourceRange {
    pub start_byte: usize,
    pub end_byte: usize,
}

/// Combined output for orchestration mode: topology + execution manifest.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotOrchestrationResult {
    pub scan_result: PolyglotScanResult,
    pub manifest: PolyglotExecutionManifest,
}

impl PolyglotOrchestrationResult {
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

/// Build an execution manifest from a topology compiled in orchestration mode.
pub fn build_execution_manifest(
    topology: &crate::gg_compiler::GgTopology,
) -> PolyglotExecutionManifest {
    let mut plans = Vec::new();

    for node in &topology.nodes {
        // Determine the execution kind from labels.
        let kind = if node.labels.contains(&"PolyglotBridgeEntry".to_string()) {
            "entry"
        } else if node.labels.contains(&"PolyglotBridgeCall".to_string()) {
            "call"
        } else if node.labels.contains(&"PolyglotBridgeReturn".to_string()) {
            "return"
        } else if node.labels.contains(&"PolyglotBridgeStatement".to_string()) {
            "statement"
        } else if node.labels.contains(&"PolyglotBridgeJoin".to_string()) {
            "join"
        } else {
            continue; // Not an execution node.
        };

        let start_byte = node
            .properties
            .get("source_start_byte")
            .and_then(|s| s.parse::<usize>().ok())
            .unwrap_or(0);
        let end_byte = node
            .properties
            .get("source_end_byte")
            .and_then(|s| s.parse::<usize>().ok())
            .unwrap_or(0);
        let callee = node.properties.get("callee").cloned();

        plans.push(NodeExecutionPlan {
            node_id: node.id.clone(),
            source_range: SourceRange {
                start_byte,
                end_byte,
            },
            kind: kind.to_string(),
            callee,
        });
    }

    // Determine entry function name from the first Entry node.
    let entry_function = topology
        .nodes
        .iter()
        .find(|n| n.labels.contains(&"Entry".to_string()))
        .and_then(|n| n.properties.get("name"))
        .cloned()
        .unwrap_or_else(|| "main".to_string());

    PolyglotExecutionManifest {
        language: topology.metadata.language.clone(),
        file_path: topology.metadata.file_path.clone(),
        entry_function,
        node_execution_plans: plans,
    }
}
