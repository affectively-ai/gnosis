pub mod becky;
pub mod cfg;
pub mod diagnostics;
pub mod extractors;
pub mod framework_compiler;
pub mod framework_recognizer;
pub mod framework_recognizers;
pub mod gg_compiler;
pub mod gg_parser;
pub mod semantic_bridge;
pub mod serialization;
pub mod source_map;

use anyhow::{bail, Result};

use crate::extractors::{extractor_for_file, LanguageExtractor};
use crate::gg_compiler::{compile_cfg_to_gg, compile_cfg_to_gg_with_mode, CompilationMode};
use crate::semantic_bridge::build_semantic_contract;
use crate::serialization::{
    build_execution_manifest, PolyglotError, PolyglotExecutionManifest,
    PolyglotFunctionResult, PolyglotOrchestrationResult, PolyglotScanResult,
};

/// Parse a source file and extract GG topologies for all functions.
///
/// This is the main entry point. It:
/// 1. Detects the language from the file extension
/// 2. Parses with tree-sitter
/// 3. Extracts CFGs (one per function)
/// 4. Compiles each CFG to a GG topology
/// 5. Returns the complete scan result as JSON-serializable struct
pub fn parse_and_extract(source: &str, file_path: &str) -> Result<PolyglotScanResult> {
    let extractor = extractor_for_file(file_path);
    match extractor {
        Some(ext) => parse_with_extractor(source, file_path, ext.as_ref()),
        None => bail!(
            "no extractor for file: {}. Supported: {}",
            file_path,
            extractors::supported_languages().join(", ")
        ),
    }
}

/// Parse with a specific language extractor.
pub fn parse_with_extractor(
    source: &str,
    file_path: &str,
    extractor: &dyn LanguageExtractor,
) -> Result<PolyglotScanResult> {
    let cfgs = match extractor.extract(source, file_path) {
        Ok(cfgs) => cfgs,
        Err(e) => {
            return Ok(PolyglotScanResult {
                file_path: file_path.to_string(),
                language: extractor.language_id().to_string(),
                topologies: Vec::new(),
                errors: vec![PolyglotError {
                    message: format!("parse error: {e}"),
                    line: None,
                    column: None,
                }],
            });
        }
    };

    let mut topologies = Vec::new();
    let mut errors = Vec::new();

    // Populate semantic contracts from type annotations before GG compilation.
    let mut cfgs = cfgs;
    let language = extractor.language_id();
    for cfg in &mut cfgs {
        cfg.signature.semantic_contract = build_semantic_contract(&cfg.signature, language);
        // Also populate semantic_type on each param.
        for param in &mut cfg.signature.params {
            if let Some(ref type_ann) = param.type_annotation {
                param.semantic_type = crate::semantic_bridge::denote_type(language, type_ann);
            }
        }
    }

    for cfg in &cfgs {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            compile_cfg_to_gg(cfg)
        })) {
            Ok(gg) => {
                let gg_source = gg.to_gg_source();
                topologies.push(PolyglotFunctionResult {
                    function_name: cfg.function_name.clone(),
                    topology: gg,
                    gg_source,
                    semantic_contract: cfg.signature.semantic_contract.clone(),
                    signature: cfg.signature.clone(),
                });
            }
            Err(_) => {
                errors.push(PolyglotError {
                    message: format!(
                        "compilation panic in function '{}'",
                        cfg.function_name
                    ),
                    line: None,
                    column: None,
                });
            }
        }
    }

    Ok(PolyglotScanResult {
        file_path: file_path.to_string(),
        language: extractor.language_id().to_string(),
        topologies,
        errors,
    })
}

/// Parse and extract, returning the serialized GraphAST JSON for each function.
/// This is the format consumed by the TypeScript bridge.
pub fn parse_and_extract_json(source: &str, file_path: &str) -> Result<String> {
    let result = parse_and_extract(source, file_path)?;
    Ok(serde_json::to_string_pretty(&result)?)
}

/// Parse and extract in orchestration mode, producing execution-ready topologies
/// with PolyglotBridge* labels and an execution manifest.
pub fn parse_and_extract_orchestration(
    source: &str,
    file_path: &str,
) -> Result<PolyglotOrchestrationResult> {
    let extractor = extractor_for_file(file_path);
    match extractor {
        Some(ext) => {
            parse_with_extractor_orchestration(source, file_path, ext.as_ref())
        }
        None => bail!(
            "no extractor for file: {}. Supported: {}",
            file_path,
            extractors::supported_languages().join(", ")
        ),
    }
}

/// Parse with a specific extractor in orchestration mode.
fn parse_with_extractor_orchestration(
    source: &str,
    file_path: &str,
    extractor: &dyn LanguageExtractor,
) -> Result<PolyglotOrchestrationResult> {
    let cfgs = match extractor.extract(source, file_path) {
        Ok(cfgs) => cfgs,
        Err(e) => {
            return Ok(PolyglotOrchestrationResult {
                scan_result: PolyglotScanResult {
                    file_path: file_path.to_string(),
                    language: extractor.language_id().to_string(),
                    topologies: Vec::new(),
                    errors: vec![PolyglotError {
                        message: format!("parse error: {e}"),
                        line: None,
                        column: None,
                    }],
                },
                manifest: PolyglotExecutionManifest {
                    language: extractor.language_id().to_string(),
                    file_path: file_path.to_string(),
                    entry_function: "main".to_string(),
                    node_execution_plans: Vec::new(),
                },
            });
        }
    };

    let mode = CompilationMode::Orchestration;
    let mut topologies = Vec::new();
    let mut errors = Vec::new();
    let mut all_plans = Vec::new();
    let mut entry_function = "main".to_string();

    // Populate semantic contracts from type annotations.
    let mut cfgs = cfgs;
    let language = extractor.language_id();
    for cfg in &mut cfgs {
        cfg.signature.semantic_contract = build_semantic_contract(&cfg.signature, language);
        for param in &mut cfg.signature.params {
            if let Some(ref type_ann) = param.type_annotation {
                param.semantic_type = crate::semantic_bridge::denote_type(language, type_ann);
            }
        }
    }

    for cfg in &cfgs {
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            compile_cfg_to_gg_with_mode(cfg, &mode)
        })) {
            Ok(gg) => {
                let manifest = build_execution_manifest(&gg);
                if entry_function == "main" && !manifest.entry_function.is_empty() {
                    entry_function = manifest.entry_function.clone();
                }
                all_plans.extend(manifest.node_execution_plans);

                let gg_source = gg.to_gg_source();
                topologies.push(PolyglotFunctionResult {
                    function_name: cfg.function_name.clone(),
                    topology: gg,
                    gg_source,
                    semantic_contract: cfg.signature.semantic_contract.clone(),
                    signature: cfg.signature.clone(),
                });
            }
            Err(_) => {
                errors.push(PolyglotError {
                    message: format!(
                        "compilation panic in function '{}'",
                        cfg.function_name
                    ),
                    line: None,
                    column: None,
                });
            }
        }
    }

    Ok(PolyglotOrchestrationResult {
        scan_result: PolyglotScanResult {
            file_path: file_path.to_string(),
            language: extractor.language_id().to_string(),
            topologies,
            errors,
        },
        manifest: PolyglotExecutionManifest {
            language: extractor.language_id().to_string(),
            file_path: file_path.to_string(),
            entry_function,
            node_execution_plans: all_plans,
        },
    })
}

/// Parse and extract in framework mode (Ditto).
///
/// Detects server frameworks (Express, Flask, Gin, Hono, Sinatra, Spring)
/// from source code, extracts routes/middleware, and compiles to a server
/// topology. Falls back to orchestration mode if no framework is detected.
///
/// This is the Ditto entry point: assume whatever interface the developer
/// already knows. The diversity theorem guarantees this is optimal.
pub fn parse_and_extract_framework(
    source: &str,
    file_path: &str,
) -> Result<FrameworkDetectionResult> {
    use crate::framework_recognizer::{detect_framework, FrameworkDetectionResult};

    let extractor = extractor_for_file(file_path);
    let ext = match extractor {
        Some(ext) => ext,
        None => bail!(
            "no extractor for file: {}. Supported: {}",
            file_path,
            extractors::supported_languages().join(", ")
        ),
    };

    // Extract CFGs first (needed by both framework detection and fallback).
    let cfgs = ext.extract(source, file_path).unwrap_or_default();

    // Try framework detection.
    let framework_topology = detect_framework(source, file_path, &cfgs);

    // Build the standard scan result regardless.
    let scan_result = parse_with_extractor(source, file_path, ext.as_ref())?;

    Ok(FrameworkDetectionResult {
        topology: framework_topology,
        scan_result,
    })
}

/// Convenience: parse, detect framework, and compile to GG server topology.
/// Returns the compiled .gg source string if a framework is detected.
pub fn ditto_compile(source: &str, file_path: &str) -> Result<Option<String>> {
    let result = parse_and_extract_framework(source, file_path)?;
    Ok(result.topology.map(|ft| {
        framework_compiler::compile_framework_to_gg(&ft)
    }))
}

use crate::framework_recognizer::FrameworkDetectionResult;
