pub mod go;
pub mod java;
pub mod python;
pub mod rust_lang;
pub mod typescript;

use crate::cfg::ControlFlowGraph;
use anyhow::Result;

/// Trait that all language extractors implement. An extractor takes source code
/// and a tree-sitter parse tree and produces one or more ControlFlowGraphs
/// (one per function/method in the source).
pub trait LanguageExtractor: Send + Sync {
    /// The language identifier (e.g. "typescript", "rust", "python").
    fn language_id(&self) -> &str;

    /// File extensions this extractor handles (e.g. [".ts", ".tsx", ".js"]).
    fn file_extensions(&self) -> &[&str];

    /// Extract CFGs from the given source code.
    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>>;
}

/// Detect language from file extension and return the appropriate extractor.
pub fn extractor_for_file(file_path: &str) -> Option<Box<dyn LanguageExtractor>> {
    let extractors: Vec<Box<dyn LanguageExtractor>> = vec![
        Box::new(typescript::TypeScriptExtractor),
        Box::new(rust_lang::RustExtractor),
        Box::new(python::PythonExtractor),
        Box::new(go::GoExtractor),
        Box::new(java::JavaExtractor),
    ];

    let lower = file_path.to_lowercase();
    for extractor in extractors {
        for ext in extractor.file_extensions() {
            if lower.ends_with(ext) {
                return Some(extractor);
            }
        }
    }
    None
}

/// Get all registered extractors.
pub fn all_extractors() -> Vec<Box<dyn LanguageExtractor>> {
    vec![
        Box::new(typescript::TypeScriptExtractor),
        Box::new(rust_lang::RustExtractor),
        Box::new(python::PythonExtractor),
        Box::new(go::GoExtractor),
        Box::new(java::JavaExtractor),
    ]
}

/// List all supported language IDs.
pub fn supported_languages() -> Vec<&'static str> {
    vec!["typescript", "javascript", "rust", "python", "go", "java"]
}
