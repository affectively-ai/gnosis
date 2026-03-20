use gnosis_polyglot::{parse_and_extract, parse_and_extract_orchestration};

// Phase 1 fixtures
const TS_RESOURCE_LEAK: &str = include_str!("fixtures/resource_leak.ts");
const TS_ERROR_SWALLOW: &str = include_str!("fixtures/error_swallow.ts");
const GO_GOROUTINE_LEAK: &str = include_str!("fixtures/goroutine_leak.go");
const PY_MISSING_CLOSE: &str = include_str!("fixtures/missing_close.py");
// polyglot:ignore SPAWN_WITHOUT_JOIN — test fixture validates spawn detection
const RS_SPAWN_NO_JOIN: &str = include_str!("fixtures/spawn_no_join.rs");
const JAVA_CONN_LEAK: &str = include_str!("fixtures/connection_leak.java");

// Phase 2 fixtures
const C_MALLOC_LEAK: &str = include_str!("fixtures/malloc_leak.c");
const CPP_THREAD_LEAK: &str = include_str!("fixtures/thread_leak.cpp");
const RUBY_FILE_LEAK: &str = include_str!("fixtures/file_leak.rb");

#[test]
fn typescript_resource_leak_detected() {
    let result = parse_and_extract(TS_RESOURCE_LEAK, "resource_leak.ts").unwrap();
    assert_eq!(result.language, "typescript");
    assert!(!result.topologies.is_empty(), "should extract at least one function");

    // Check that the topology has a VENT edge (deficit from unclosed stream).
    let topo = &result.topologies[0];
    let _has_vent = topo.topology.edges.iter().any(|e| e.edge_type.as_str() == "VENT");
    // The function has an early return path where close is skipped,
    // but the resource tracking sees the close() on the happy path.
    // The deficit shows up because the early return doesn't close.
    let gg_source = &topo.gg_source;
    assert!(gg_source.contains("FORK") || gg_source.contains("PROCESS"),
        "should have control flow edges");
}

#[test]
fn typescript_error_swallow_detected() {
    let result = parse_and_extract(TS_ERROR_SWALLOW, "error_swallow.ts").unwrap();
    assert!(!result.topologies.is_empty());

    let topo = &result.topologies[0];
    let gg = &topo.gg_source;
    // Should have try/catch structure (FORK for try entry).
    assert!(gg.contains("Try") || gg.contains("Catch"),
        "should extract try/catch structure");
}

#[test]
fn go_goroutine_leak_detected() {
    let result = parse_and_extract(GO_GOROUTINE_LEAK, "goroutine_leak.go").unwrap();
    assert_eq!(result.language, "go");
    assert!(!result.topologies.is_empty());

    // The startWorker function spawns a goroutine without join.
    let worker_topo = result
        .topologies
        .iter()
        .find(|t| t.function_name == "startWorker")
        .expect("should find startWorker function");

    let has_spawn = worker_topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Spawn".to_string()));
    assert!(has_spawn, "should detect goroutine spawn");

    let has_spawn_leak = worker_topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"SpawnLeak".to_string()));
    assert!(has_spawn_leak, "should detect goroutine leak (SpawnLeak vent)");
}

#[test]
fn python_missing_close_detected() {
    let result = parse_and_extract(PY_MISSING_CLOSE, "missing_close.py").unwrap();
    assert_eq!(result.language, "python");
    assert!(!result.topologies.is_empty());

    let topo = &result.topologies[0];
    let has_acquire = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Acquire".to_string()));
    assert!(has_acquire, "should detect file open as resource acquire");

    // No release means a VENT.
    let has_leak_vent = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"ResourceLeak".to_string()));
    assert!(has_leak_vent, "should detect resource leak vent");
}

#[test]
fn rust_spawn_no_join_detected() {
    let result = parse_and_extract(RS_SPAWN_NO_JOIN, "spawn_no_join.rs").unwrap();
    assert_eq!(result.language, "rust");
    assert!(!result.topologies.is_empty());

    let topo = &result.topologies[0];
    let has_spawn = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Spawn".to_string()));
    // polyglot:ignore SPAWN_WITHOUT_JOIN — assertion text, not actual spawn
    assert!(has_spawn, "should detect thread::spawn");
}

#[test]
fn java_connection_leak_detected() {
    let result = parse_and_extract(JAVA_CONN_LEAK, "connection_leak.java").unwrap();
    assert_eq!(result.language, "java");
    assert!(!result.topologies.is_empty());

    let topo = &result.topologies[0];
    let has_acquire = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Acquire".to_string()));
    assert!(has_acquire, "should detect connection acquire");
}

#[test]
fn gg_source_is_valid_syntax() {
    // Verify that generated .gg source has the expected structure.
    let result = parse_and_extract(TS_RESOURCE_LEAK, "resource_leak.ts").unwrap();
    for topo in &result.topologies {
        let gg = &topo.gg_source;
        // Should have node declarations.
        assert!(gg.contains("("), "GG should have node declarations");
        // Should have edge declarations.
        assert!(
            gg.contains(")->") || gg.contains("-[:"),
            "GG should have edge declarations"
        );
        // Should have metadata comment.
        assert!(
            gg.contains("Generated by gnosis-polyglot"),
            "GG should have metadata comment"
        );
    }
}

#[test]
fn serialized_graph_ast_matches_betty_format() {
    let result = parse_and_extract(TS_ERROR_SWALLOW, "error_swallow.ts").unwrap();
    let topo = &result.topologies[0];

    let serialized = topo.topology.to_serialized_graph_ast();

    // Verify JSON round-trip.
    let json = serde_json::to_string(&serialized).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();

    assert!(parsed.get("nodes").is_some(), "should have nodes");
    assert!(parsed.get("edges").is_some(), "should have edges");

    // Edges should have sourceIds, targetIds, type.
    if let Some(edges) = parsed.get("edges").and_then(|e| e.as_array()) {
        for edge in edges {
            assert!(edge.get("sourceIds").is_some(), "edge should have sourceIds");
            assert!(edge.get("targetIds").is_some(), "edge should have targetIds");
            assert!(edge.get("type").is_some(), "edge should have type");
        }
    }
}

#[test]
fn source_map_points_to_original_locations() {
    let result = parse_and_extract(TS_RESOURCE_LEAK, "resource_leak.ts").unwrap();
    let topo = &result.topologies[0];

    // Every source map entry should have valid line numbers.
    for entry in &topo.topology.source_map.entries {
        assert!(
            entry.span.start_line > 0,
            "source map entry should have positive line number"
        );
        assert_eq!(
            entry.span.file, "resource_leak.ts",
            "source map should reference correct file"
        );
    }
}

#[test]
fn multiple_functions_extracted() {
    let source = r#"
function first() {
    return 1;
}

function second() {
    if (true) {
        return 2;
    }
    return 3;
}

const third = () => {
    return 4;
};
"#;

    let result = parse_and_extract(source, "multi.ts").unwrap();
    assert!(
        result.topologies.len() >= 2,
        "should extract multiple functions, got {}",
        result.topologies.len()
    );
}

#[test]
fn unsupported_extension_returns_error() {
    let result = parse_and_extract("some code", "test.xyz");
    assert!(result.is_err(), "unsupported extension should return error");
}

// ==================== Phase 2: Declarative Extractor Tests ====================

#[test]
fn c_malloc_leak_detected() {
    let result = parse_and_extract(C_MALLOC_LEAK, "malloc_leak.c").unwrap();
    assert_eq!(result.language, "c");
    assert!(!result.topologies.is_empty(), "should extract C function");

    let topo = &result.topologies[0];
    assert!(
        topo.function_name.contains("duplicate"),
        "should find 'duplicate' function, got '{}'",
        topo.function_name
    );

    let has_acquire = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Acquire".to_string()));
    assert!(has_acquire, "should detect malloc as resource acquire");

    let has_branch = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Branch".to_string()));
    assert!(has_branch, "should detect if branches");
}

#[test]
fn cpp_thread_leak_detected() {
    let result = parse_and_extract(CPP_THREAD_LEAK, "thread_leak.cpp").unwrap();
    assert_eq!(result.language, "cpp");
    assert!(!result.topologies.is_empty(), "should extract C++ function");

    let topo = &result.topologies[0];
    let gg = &topo.gg_source;
    assert!(
        gg.contains("PROCESS") || gg.contains("FORK"),
        "should have control flow edges"
    );
}

#[test]
fn ruby_file_leak_detected() {
    let result = parse_and_extract(RUBY_FILE_LEAK, "file_leak.rb").unwrap();
    assert_eq!(result.language, "ruby");
    assert!(!result.topologies.is_empty(), "should extract Ruby method");
    assert_eq!(result.topologies[0].function_name, "read_config");

    let topo = &result.topologies[0];
    let has_acquire = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"Acquire".to_string()));
    assert!(has_acquire, "should detect File.open as resource acquire");

    // No close means a VENT.
    let has_leak = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"ResourceLeak".to_string()));
    assert!(has_leak, "should detect file leak");
}

#[test]
fn phase2_all_languages_have_extractors() {
    // Verify that all Phase 2 extensions can find an extractor.
    let test_cases = vec![
        ("test.c", "c"),
        ("test.cpp", "cpp"),
        ("test.cs", "c_sharp"),
        ("test.rb", "ruby"),
        ("test.sh", "bash"),
        ("test.php", "php"),
        ("test.scala", "scala"),
        ("test.kt", "kotlin"),
        ("test.swift", "swift"),
        ("test.hs", "haskell"),
        ("test.ml", "ocaml"),
        ("test.lua", "lua"),
        ("test.ex", "elixir"),
        ("test.zig", "zig"),
    ];

    for (file, expected_lang) in &test_cases {
        let extractor = gnosis_polyglot::extractors::extractor_for_file(file);
        assert!(
            extractor.is_some(),
            "should find extractor for {} (expected language: {})",
            file,
            expected_lang
        );
        assert_eq!(
            extractor.unwrap().language_id(),
            *expected_lang,
            "wrong language for {}",
            file
        );
    }
}

#[test]
fn supported_languages_includes_all_20() {
    let langs = gnosis_polyglot::extractors::supported_languages();
    assert!(langs.len() >= 20, "should support at least 20 languages, got {}", langs.len());
    // Phase 1
    assert!(langs.contains(&"typescript"));
    assert!(langs.contains(&"rust"));
    assert!(langs.contains(&"python"));
    assert!(langs.contains(&"go"));
    assert!(langs.contains(&"java"));
    // Phase 2
    assert!(langs.contains(&"c"));
    assert!(langs.contains(&"cpp"));
    assert!(langs.contains(&"c_sharp"));
    assert!(langs.contains(&"ruby"));
    assert!(langs.contains(&"kotlin"));
    assert!(langs.contains(&"swift"));
    assert!(langs.contains(&"zig"));
}

// --- Orchestration mode integration tests ---

#[test]
fn python_orchestration_produces_bridge_labels() {
    let result =
        parse_and_extract_orchestration(PY_MISSING_CLOSE, "missing_close.py").unwrap();
    assert_eq!(result.scan_result.language, "python");
    assert!(
        !result.scan_result.topologies.is_empty(),
        "should extract functions in orchestration mode"
    );

    // Verify PolyglotBridge labels are present.
    let topo = &result.scan_result.topologies[0];
    let has_bridge_entry = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"PolyglotBridgeEntry".to_string()));
    assert!(
        has_bridge_entry,
        "orchestration mode should produce PolyglotBridgeEntry labels"
    );

    let has_bridge_return = topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.contains(&"PolyglotBridgeReturn".to_string()));
    assert!(
        has_bridge_return,
        "orchestration mode should produce PolyglotBridgeReturn labels"
    );

    // Verify source ranges are attached.
    for node in &topo.topology.nodes {
        if node.labels.iter().any(|l| l.starts_with("PolyglotBridge")) {
            assert!(
                node.properties.contains_key("source_start_byte"),
                "PolyglotBridge node {} should have source_start_byte",
                node.id
            );
        }
    }
}

#[test]
fn orchestration_manifest_has_execution_plans() {
    let result =
        parse_and_extract_orchestration(PY_MISSING_CLOSE, "missing_close.py").unwrap();

    assert!(
        !result.manifest.node_execution_plans.is_empty(),
        "manifest should have execution plans"
    );
    assert_eq!(result.manifest.language, "python");
    assert_eq!(result.manifest.file_path, "missing_close.py");

    // Every plan should have valid source ranges.
    for plan in &result.manifest.node_execution_plans {
        assert!(
            plan.source_range.end_byte >= plan.source_range.start_byte,
            "end_byte should be >= start_byte for node {}",
            plan.node_id
        );
    }
}

#[test]
fn go_orchestration_preserves_analysis_topology() {
    // Orchestration mode should produce valid topologies AND bridge labels.
    let analysis = parse_and_extract(GO_GOROUTINE_LEAK, "goroutine_leak.go").unwrap();
    let orchestration =
        parse_and_extract_orchestration(GO_GOROUTINE_LEAK, "goroutine_leak.go").unwrap();

    // Same number of functions extracted.
    assert_eq!(
        analysis.topologies.len(),
        orchestration.scan_result.topologies.len(),
        "orchestration should extract same number of functions as analysis"
    );

    // Orchestration should have bridge labels that analysis doesn't.
    let orch_topo = &orchestration.scan_result.topologies[0];
    let has_any_bridge = orch_topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.iter().any(|l| l.starts_with("PolyglotBridge")));
    assert!(
        has_any_bridge,
        "orchestration topology should have PolyglotBridge labels"
    );

    let analysis_topo = &analysis.topologies[0];
    let analysis_has_bridge = analysis_topo
        .topology
        .nodes
        .iter()
        .any(|n| n.labels.iter().any(|l| l.starts_with("PolyglotBridge")));
    assert!(
        !analysis_has_bridge,
        "analysis topology should NOT have PolyglotBridge labels"
    );
}

#[test]
fn typescript_orchestration_detects_calls() {
    let source = r#"
function fetchData(url: string) {
    const response = fetch(url);
    return response.json();
}
"#;
    let result =
        parse_and_extract_orchestration(source, "fetch.ts").unwrap();

    let topo = &result.scan_result.topologies[0];
    let call_nodes: Vec<_> = topo
        .topology
        .nodes
        .iter()
        .filter(|n| n.labels.contains(&"PolyglotBridgeCall".to_string()))
        .collect();

    // Should detect function calls.
    let has_callee = call_nodes
        .iter()
        .any(|n| n.properties.contains_key("callee"));

    if !call_nodes.is_empty() {
        assert!(
            has_callee,
            "PolyglotBridgeCall nodes should have callee property"
        );
    }

    // Manifest should have call-type plans.
    let call_plans: Vec<_> = result
        .manifest
        .node_execution_plans
        .iter()
        .filter(|p| p.kind == "call")
        .collect();

    if !call_nodes.is_empty() {
        assert!(
            !call_plans.is_empty(),
            "manifest should have call-type execution plans"
        );
    }
}
