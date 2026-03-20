use tree_sitter::Language;

/// Registry mapping language IDs to tree-sitter Language objects.
/// All grammars are compiled into the binary via their respective crates.
pub fn get_grammar(language_id: &str) -> Option<Language> {
    match language_id {
        // Phase 1 (hand-written extractors also use these)
        "typescript" => Some(tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()),
        "tsx" => Some(tree_sitter_typescript::LANGUAGE_TSX.into()),
        "javascript" => Some(tree_sitter_javascript::LANGUAGE.into()),
        "rust" => Some(tree_sitter_rust::LANGUAGE.into()),
        "python" => Some(tree_sitter_python::LANGUAGE.into()),
        "go" => Some(tree_sitter_go::LANGUAGE.into()),
        "java" => Some(tree_sitter_java::LANGUAGE.into()),

        // Phase 2 (declarative extractors)
        "c" => Some(tree_sitter_c::LANGUAGE.into()),
        "cpp" => Some(tree_sitter_cpp::LANGUAGE.into()),
        "c_sharp" => Some(tree_sitter_c_sharp::LANGUAGE.into()),
        "ruby" => Some(tree_sitter_ruby::LANGUAGE.into()),
        "bash" => Some(tree_sitter_bash::LANGUAGE.into()),
        "php" => Some(tree_sitter_php::LANGUAGE_PHP.into()),
        "scala" => Some(tree_sitter_scala::LANGUAGE.into()),
        "haskell" => Some(tree_sitter_haskell::LANGUAGE.into()),
        "ocaml" => Some(tree_sitter_ocaml::LANGUAGE_OCAML.into()),
        // tree-sitter-kotlin 0.3.x uses the old tree-sitter 0.20 API.
        // Bridge via unsafe pointer cast since both wrap TSLanguage*.
        "kotlin" => {
            let old_lang = tree_sitter_kotlin::language();
            // SAFETY: tree_sitter::Language from 0.20 and 0.24 both wrap *const TSLanguage.
            let raw: *const () = unsafe { std::mem::transmute(old_lang) };
            let new_lang: Language = unsafe { std::mem::transmute(raw) };
            Some(new_lang)
        }
        "swift" => Some(tree_sitter_swift::LANGUAGE.into()),
        // tree-sitter-lua 0.4.x depends on tree-sitter ^0.26 but we use 0.24.
        // Bridge via unsafe pointer cast like Kotlin -- both wrap *const TSLanguage.
        "lua" => {
            let lang_fn = tree_sitter_lua::LANGUAGE;
            let raw: *const () = unsafe { std::mem::transmute(lang_fn) };
            let new_lang: Language = unsafe { std::mem::transmute(raw) };
            Some(new_lang)
        }
        "elixir" => Some(tree_sitter_elixir::LANGUAGE.into()),
        "zig" => Some(tree_sitter_zig::LANGUAGE.into()),

        _ => None,
    }
}

/// Map file extensions to grammar language IDs.
pub fn grammar_for_extension(ext: &str) -> Option<&'static str> {
    match ext {
        ".c" | ".h" => Some("c"),
        ".cpp" | ".cc" | ".cxx" | ".hpp" | ".hxx" | ".h++" => Some("cpp"),
        ".cs" => Some("c_sharp"),
        ".rb" | ".rake" | ".gemspec" => Some("ruby"),
        ".sh" | ".bash" | ".zsh" => Some("bash"),
        ".php" => Some("php"),
        ".scala" | ".sc" => Some("scala"),
        ".hs" | ".lhs" => Some("haskell"),
        ".ml" | ".mli" => Some("ocaml"),
        ".kt" | ".kts" => Some("kotlin"),
        ".swift" => Some("swift"),
        ".lua" => Some("lua"),
        ".ex" | ".exs" => Some("elixir"),
        ".zig" => Some("zig"),
        // Phase 2 doesn't need dart -- crate compatibility issues.
        _ => None,
    }
}

/// All supported Phase 2 language IDs.
pub fn phase2_language_ids() -> Vec<&'static str> {
    vec![
        "c", "cpp", "c_sharp", "ruby", "bash", "php", "scala",
        "haskell", "ocaml", "kotlin", "swift", "lua", "elixir", "zig",
    ]
}

/// All Phase 2 file extensions.
pub fn phase2_extensions() -> Vec<&'static str> {
    vec![
        ".c", ".h", ".cpp", ".cc", ".cxx", ".hpp", ".hxx",
        ".cs", ".rb", ".rake", ".sh", ".bash", ".php",
        ".scala", ".sc", ".hs", ".ml", ".mli",
        ".kt", ".kts", ".swift", ".lua", ".ex", ".exs", ".zig",
    ]
}
