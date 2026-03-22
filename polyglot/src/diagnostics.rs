use serde::{Deserialize, Serialize};

use crate::gg_compiler::{GgEdgeType, GgTopology};
use crate::source_map::SourceSpan;

/// Polyglot-specific diagnostic codes detected via topological analysis.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum PolyglotDiagnosticCode {
    /// Resource acquired (FORK) without matching release (FOLD).
    ResourceLeak,
    /// Concurrent spawn without synchronization join.
    SpawnWithoutJoin,
    /// Error path swallowed -- catch/rescue/except with no action.
    ErrorSwallowed,
    /// Try without catch -- error paths not handled.
    MissingErrorHandler,
    /// Unbounded loop without termination proof.
    UnboundedLoop,
    /// Concurrent FORKs without synchronization FOLD.
    RaceNoSync,
    /// Cyclic SLIVER edges indicating potential deadlock.
    DeadlockCycle,
    /// Disconnected graph components (unreachable code).
    UnreachableComponent,
    /// Assignment node with no outgoing PROCESS (dead store).
    DeadStore,
}

impl PolyglotDiagnosticCode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::ResourceLeak => "RESOURCE_LEAK",
            Self::SpawnWithoutJoin => "SPAWN_WITHOUT_JOIN",
            Self::ErrorSwallowed => "ERROR_SWALLOWED",
            Self::MissingErrorHandler => "MISSING_ERROR_HANDLER",
            Self::UnboundedLoop => "UNBOUNDED_LOOP",
            Self::RaceNoSync => "RACE_NO_SYNC",
            Self::DeadlockCycle => "DEADLOCK_CYCLE",
            Self::UnreachableComponent => "UNREACHABLE_COMPONENT",
            Self::DeadStore => "DEAD_STORE",
        }
    }

    pub fn severity(&self) -> DiagnosticSeverity {
        match self {
            Self::ResourceLeak => DiagnosticSeverity::Error,
            Self::SpawnWithoutJoin => DiagnosticSeverity::Warning,
            Self::ErrorSwallowed => DiagnosticSeverity::Warning,
            Self::MissingErrorHandler => DiagnosticSeverity::Warning,
            Self::UnboundedLoop => DiagnosticSeverity::Info,
            Self::RaceNoSync => DiagnosticSeverity::Error,
            Self::DeadlockCycle => DiagnosticSeverity::Error,
            Self::UnreachableComponent => DiagnosticSeverity::Warning,
            Self::DeadStore => DiagnosticSeverity::Info,
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            Self::ResourceLeak => "Resource acquired but never released. FORK (acquire) without matching FOLD (release) creates a topological deficit.",
            Self::SpawnWithoutJoin => "Concurrent task spawned but never joined. The spawned FORK has no synchronizing FOLD.",
            Self::ErrorSwallowed => "Error path enters a FOLD that destroys all information. The catch/rescue handler discards the error.",
            Self::MissingErrorHandler => "Try block without catch handler. Error FORK has no matching error FOLD.",
            Self::UnboundedLoop => "Loop with unbounded beta-1. No termination proof found in the topology cycle.",
            Self::RaceNoSync => "Concurrent FORKs detected without a synchronizing FOLD. Potential race condition.",
            Self::DeadlockCycle => "Cyclic SLIVER edges detected. Lock ordering creates potential deadlock.",
            Self::UnreachableComponent => "Disconnected topology component detected. Code after this point is unreachable.",
            Self::DeadStore => "Value assigned but never read. Assignment node has no outgoing PROCESS.",
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

impl DiagnosticSeverity {
    pub fn as_sarif(&self) -> &'static str {
        match self {
            Self::Error => "error",
            Self::Warning => "warning",
            Self::Info => "note",
        }
    }
}

/// A diagnostic finding from polyglot analysis.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PolyglotDiagnostic {
    pub code: PolyglotDiagnosticCode,
    pub message: String,
    pub severity: DiagnosticSeverity,
    /// Source location (if available via source map).
    pub location: Option<SourceSpan>,
    /// Related GG node IDs.
    pub related_nodes: Vec<String>,
}

/// Analyze a GG topology for universal bug patterns.
pub fn analyze_topology(topology: &GgTopology) -> Vec<PolyglotDiagnostic> {
    let mut diagnostics = Vec::new();

    detect_resource_leaks(topology, &mut diagnostics);
    detect_spawn_leaks(topology, &mut diagnostics);
    detect_missing_error_handlers(topology, &mut diagnostics);
    detect_unbounded_loops(topology, &mut diagnostics);
    detect_unreachable_components(topology, &mut diagnostics);

    diagnostics
}

fn detect_resource_leaks(topology: &GgTopology, diagnostics: &mut Vec<PolyglotDiagnostic>) {
    for node in &topology.nodes {
        if node.labels.contains(&"ResourceLeak".to_string()) {
            let resource = node
                .properties
                .get("resource")
                .cloned()
                .unwrap_or_else(|| "unknown".to_string());

            // Find the acquire node this vent connects to.
            let acquire_id = topology
                .edges
                .iter()
                .filter(|e| e.target_ids.contains(&node.id))
                .flat_map(|e| e.source_ids.iter())
                .next()
                .cloned();

            let location = acquire_id
                .as_ref()
                .and_then(|id| topology.source_map.find_by_gg_id(id))
                .map(|entry| entry.span.clone());

            diagnostics.push(PolyglotDiagnostic {
                code: PolyglotDiagnosticCode::ResourceLeak,
                message: format!(
                    "{} resource acquired but never released",
                    resource
                ),
                severity: DiagnosticSeverity::Error,
                location,
                related_nodes: vec![node.id.clone()],
            });
        }
    }
}

fn detect_spawn_leaks(topology: &GgTopology, diagnostics: &mut Vec<PolyglotDiagnostic>) {
    for node in &topology.nodes {
        if node.labels.contains(&"SpawnLeak".to_string()) {
            let spawn_id = topology
                .edges
                .iter()
                .filter(|e| e.target_ids.contains(&node.id))
                .flat_map(|e| e.source_ids.iter())
                .next()
                .cloned();

            let location = spawn_id
                .as_ref()
                .and_then(|id| topology.source_map.find_by_gg_id(id))
                .map(|entry| entry.span.clone());

            diagnostics.push(PolyglotDiagnostic {
                code: PolyglotDiagnosticCode::SpawnWithoutJoin,
                message: "concurrent task spawned but never joined".to_string(),
                severity: DiagnosticSeverity::Warning,
                location,
                related_nodes: vec![node.id.clone()],
            });
        }
    }
}

fn detect_missing_error_handlers(
    topology: &GgTopology,
    diagnostics: &mut Vec<PolyglotDiagnostic>,
) {
    // Find FORK edges with missing_catch property.
    for edge in &topology.edges {
        if edge.properties.get("missing_catch").map(|v| v == "true").unwrap_or(false) {
            let location = edge
                .source_ids
                .first()
                .and_then(|id| topology.source_map.find_by_gg_id(id))
                .map(|entry| entry.span.clone());

            diagnostics.push(PolyglotDiagnostic {
                code: PolyglotDiagnosticCode::MissingErrorHandler,
                message: "try block without catch handler".to_string(),
                severity: DiagnosticSeverity::Warning,
                location,
                related_nodes: edge.source_ids.clone(),
            });
        }
    }
}

fn detect_unbounded_loops(topology: &GgTopology, diagnostics: &mut Vec<PolyglotDiagnostic>) {
    let mut seen_sources = std::collections::HashSet::new();
    for edge in &topology.edges {
        if edge.properties.get("unbounded").map(|v| v == "true").unwrap_or(false)
            && edge.properties.get("loop").map(|v| v == "true").unwrap_or(false)
        {
            // Deduplicate: only report once per loop source node.
            let source_key = edge.source_ids.first().cloned().unwrap_or_default();
            if !seen_sources.insert(source_key) {
                continue;
            }

            let location = edge
                .source_ids
                .first()
                .and_then(|id| topology.source_map.find_by_gg_id(id))
                .map(|entry| entry.span.clone());

            let code = PolyglotDiagnosticCode::UnboundedLoop;
            let severity = code.severity();
            diagnostics.push(PolyglotDiagnostic {
                code,
                message: "loop without termination proof (unbounded beta-1)".to_string(),
                severity,
                location,
                related_nodes: edge.source_ids.clone(),
            });
        }
    }
}

fn detect_unreachable_components(
    topology: &GgTopology,
    diagnostics: &mut Vec<PolyglotDiagnostic>,
) {
    if topology.nodes.is_empty() {
        return;
    }

    // BFS from the first node (entry) to find reachable nodes.
    let mut reachable = std::collections::HashSet::new();
    let mut queue = std::collections::VecDeque::new();

    if let Some(first) = topology.nodes.first() {
        queue.push_back(first.id.clone());
        reachable.insert(first.id.clone());
    }

    while let Some(current) = queue.pop_front() {
        for edge in &topology.edges {
            if edge.source_ids.contains(&current) {
                for target in &edge.target_ids {
                    if reachable.insert(target.clone()) {
                        queue.push_back(target.clone());
                    }
                }
            }
        }
    }

    // Any node not reachable from entry is unreachable.
    for node in &topology.nodes {
        if !reachable.contains(&node.id)
            && !node.labels.contains(&"Vent".to_string())
            && !node.labels.contains(&"ResourceLeak".to_string())
            && !node.labels.contains(&"SpawnLeak".to_string())
        {
            let location = topology
                .source_map
                .find_by_gg_id(&node.id)
                .map(|entry| entry.span.clone());

            diagnostics.push(PolyglotDiagnostic {
                code: PolyglotDiagnosticCode::UnreachableComponent,
                message: format!("unreachable code: node '{}' not reachable from entry", node.id),
                severity: DiagnosticSeverity::Warning,
                location,
                related_nodes: vec![node.id.clone()],
            });
        }
    }
}

/// Filter out diagnostics suppressed by `polyglot:ignore` comments in source.
///
/// Checks the diagnostic's source line and the line above it for:
/// - `polyglot:ignore` (suppresses all diagnostics on that line)
/// - `polyglot:ignore RULE_NAME` (suppresses only that specific rule)
pub fn filter_suppressed(diagnostics: Vec<PolyglotDiagnostic>, sources: &std::collections::HashMap<String, String>) -> Vec<PolyglotDiagnostic> {
    diagnostics.into_iter().filter(|diag| {
        let Some(ref loc) = diag.location else { return true };
        let Some(source) = sources.get(&loc.file) else { return true };

        let lines: Vec<&str> = source.lines().collect();
        let line_idx = loc.start_line.saturating_sub(1);

        // Check the flagged line and up to 3 lines above (comments may precede by 1-3 lines).
        let mut check_lines = vec![line_idx];
        for offset in 1..=3 {
            if line_idx >= offset {
                check_lines.push(line_idx - offset);
            }
        }

        for idx in check_lines {
            if let Some(line) = lines.get(idx) {
                if let Some(pos) = line.find("polyglot:ignore") {
                    let after = &line[pos + 15..].trim_start();
                    // Bare `polyglot:ignore` suppresses everything.
                    if after.is_empty() || after.starts_with("--") || after.starts_with("//") || after.starts_with('#') {
                        return false;
                    }
                    // `polyglot:ignore RULE_NAME` suppresses that specific rule.
                    if after.starts_with(diag.code.as_str()) {
                        return false;
                    }
                }
            }
        }

        true
    }).collect()
}

/// Generate SARIF 2.1.0 output from polyglot diagnostics.
pub fn diagnostics_to_sarif(
    file_path: &str,
    language: &str,
    diagnostics: &[PolyglotDiagnostic],
) -> serde_json::Value {
    let mut rules = Vec::new();
    let mut rule_ids_seen = std::collections::HashSet::new();
    let mut results = Vec::new();

    for diag in diagnostics {
        let rule_id = format!("gnosis.polyglot.{}", diag.code.as_str());

        if rule_ids_seen.insert(rule_id.clone()) {
            rules.push(serde_json::json!({
                "id": rule_id,
                "shortDescription": { "text": diag.code.as_str() },
                "fullDescription": { "text": diag.code.description() },
            }));
        }

        let mut result = serde_json::json!({
            "ruleId": rule_id,
            "level": diag.severity.as_sarif(),
            "message": { "text": diag.message },
        });

        if let Some(ref loc) = diag.location {
            result["locations"] = serde_json::json!([{
                "physicalLocation": {
                    "artifactLocation": { "uri": loc.file },
                    "region": {
                        "startLine": loc.start_line,
                        "startColumn": loc.start_column,
                        "endLine": loc.end_line,
                        "endColumn": loc.end_column,
                    }
                }
            }]);
        } else {
            result["locations"] = serde_json::json!([{
                "physicalLocation": {
                    "artifactLocation": { "uri": file_path }
                }
            }]);
        }

        results.push(result);
    }

    if results.is_empty() {
        results.push(serde_json::json!({
            "ruleId": "gnosis.polyglot.pass",
            "level": "note",
            "message": { "text": format!("Polyglot analysis passed for {} ({})", file_path, language) },
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": { "uri": file_path }
                }
            }]
        }));
    }

    serde_json::json!({
        "version": "2.1.0",
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "runs": [{
            "tool": {
                "driver": {
                    "name": "gnosis-polyglot",
                    "informationUri": "https://github.com/forkjoin-ai/gnosis",
                    "version": env!("CARGO_PKG_VERSION"),
                    "rules": rules,
                }
            },
            "results": results,
        }]
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse_and_extract;

    #[test]
    fn detects_resource_leak_diagnostic() {
        let source = r#"
def leaky():
    f = open("data.txt", "r")
    data = f.read()
    return data
"#;
        let result = parse_and_extract(source, "test.py").unwrap();
        let topo = &result.topologies[0].topology;
        let diags = analyze_topology(topo);

        let has_leak = diags
            .iter()
            .any(|d| d.code == PolyglotDiagnosticCode::ResourceLeak);
        assert!(has_leak, "should detect resource leak");
    }

    #[test]
    fn detects_spawn_leak_diagnostic() {
        let source = r#"
package main

func leaky() {
    go worker()
}
"#;
        let result = parse_and_extract(source, "test.go").unwrap();
        let topo = &result.topologies[0].topology;
        let diags = analyze_topology(topo);

        let has_spawn_leak = diags
            .iter()
            .any(|d| d.code == PolyglotDiagnosticCode::SpawnWithoutJoin);
        assert!(has_spawn_leak, "should detect spawn without join");
    }

    #[test]
    fn sarif_output_is_valid() {
        let diags = vec![PolyglotDiagnostic {
            code: PolyglotDiagnosticCode::ResourceLeak,
            message: "file handle leaked".to_string(),
            severity: DiagnosticSeverity::Error,
            location: Some(SourceSpan {
                file: "test.py".to_string(),
                start_line: 3,
                start_column: 5,
                end_line: 3,
                end_column: 30,
                start_byte: 20,
                end_byte: 45,
            }),
            related_nodes: vec!["acquire_1".to_string()],
        }];

        let sarif = diagnostics_to_sarif("test.py", "python", &diags);

        assert_eq!(sarif["version"], "2.1.0");
        assert!(sarif["runs"][0]["results"].as_array().unwrap().len() > 0);
        assert_eq!(
            sarif["runs"][0]["results"][0]["ruleId"],
            "gnosis.polyglot.RESOURCE_LEAK"
        );
        assert_eq!(sarif["runs"][0]["results"][0]["level"], "error");
        assert_eq!(
            sarif["runs"][0]["results"][0]["locations"][0]["physicalLocation"]["region"]["startLine"],
            3
        );
    }

    #[test]
    fn sarif_pass_when_no_diagnostics() {
        let sarif = diagnostics_to_sarif("clean.py", "python", &[]);
        let results = sarif["runs"][0]["results"].as_array().unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0]["level"], "note");
    }
}
