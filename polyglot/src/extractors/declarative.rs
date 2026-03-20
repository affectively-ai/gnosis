use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, ResourceKind};
use crate::extractors::grammars;
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

/// Declarative language configuration loaded from TOML.
/// Reduces per-language cost to a config file instead of hand-written Rust.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LanguageConfig {
    pub language: LanguageMeta,
    pub patterns: PatternConfig,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LanguageMeta {
    pub id: String,
    pub grammar: String,
    pub extensions: Vec<String>,
    /// Display name for the language.
    #[serde(default)]
    pub name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PatternConfig {
    pub function: FunctionPatterns,
    #[serde(default)]
    pub branch: BranchPatterns,
    #[serde(default)]
    pub r#loop: LoopPatterns,
    #[serde(default)]
    pub error_handling: ErrorHandlingPatterns,
    #[serde(default)]
    pub resource: ResourcePatterns,
    #[serde(default)]
    pub concurrency: ConcurrencyPatterns,
    #[serde(default)]
    pub locking: LockingPatterns,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FunctionPatterns {
    /// Tree-sitter node types that represent function/method definitions.
    pub node_types: Vec<String>,
    /// Field name for the function's identifier.
    #[serde(default = "default_name_field")]
    pub name_field: String,
    /// Field name for the function's body.
    #[serde(default = "default_body_field")]
    pub body_field: String,
}

fn default_name_field() -> String {
    "name".to_string()
}
fn default_body_field() -> String {
    "body".to_string()
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct BranchPatterns {
    #[serde(default)]
    pub if_pattern: Option<IfPattern>,
    #[serde(default)]
    pub switch_pattern: Option<SwitchPattern>,
    #[serde(default)]
    pub match_pattern: Option<MatchPattern>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IfPattern {
    pub node_type: String,
    #[serde(default = "default_consequence")]
    pub consequence_field: String,
    #[serde(default = "default_alternative")]
    pub alternative_field: String,
}

fn default_consequence() -> String {
    "consequence".to_string()
}
fn default_alternative() -> String {
    "alternative".to_string()
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SwitchPattern {
    pub node_type: String,
    #[serde(default = "default_body_field")]
    pub body_field: String,
    /// Node types for individual cases.
    pub case_types: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MatchPattern {
    pub node_type: String,
    #[serde(default = "default_body_field")]
    pub body_field: String,
    pub arm_type: String,
    /// Whether match is always exhaustive in this language.
    #[serde(default)]
    pub always_exhaustive: bool,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct LoopPatterns {
    /// Bounded loop node types (for-in, for-each, etc.).
    #[serde(default)]
    pub bounded: Vec<LoopPattern>,
    /// Unbounded loop node types (while, loop, etc.).
    #[serde(default)]
    pub unbounded: Vec<LoopPattern>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LoopPattern {
    pub node_type: String,
    #[serde(default = "default_body_field")]
    pub body_field: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ErrorHandlingPatterns {
    #[serde(default)]
    pub try_pattern: Option<TryPattern>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TryPattern {
    pub try_type: String,
    #[serde(default = "default_body_field")]
    pub body_field: String,
    /// Node type for catch/rescue/except clauses.
    pub catch_type: String,
    /// Field name for the catch body.
    #[serde(default = "default_body_field")]
    pub catch_body_field: String,
    /// Node type for finally/ensure clause (optional).
    #[serde(default)]
    pub finally_type: Option<String>,
    /// Field name for the finally body.
    #[serde(default = "default_body_field")]
    pub finally_body_field: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ResourcePatterns {
    /// Text patterns that indicate resource acquisition.
    #[serde(default)]
    pub acquire: Vec<TextPattern>,
    /// Text patterns that indicate resource release.
    #[serde(default)]
    pub release: Vec<TextPattern>,
    /// Structured resource blocks (with, using, defer).
    #[serde(default)]
    pub scoped: Vec<ScopedResourcePattern>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TextPattern {
    pub text: String,
    #[serde(default = "default_generic_kind")]
    pub kind: String,
}

fn default_generic_kind() -> String {
    "Generic".to_string()
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ScopedResourcePattern {
    /// The tree-sitter node type (e.g. "using_statement").
    pub node_type: String,
    #[serde(default = "default_body_field")]
    pub body_field: String,
    #[serde(default = "default_generic_kind")]
    pub kind: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ConcurrencyPatterns {
    /// Text patterns for spawning concurrent tasks.
    #[serde(default)]
    pub spawn: Vec<TextPattern>,
    /// Text patterns for joining/awaiting concurrent tasks.
    #[serde(default)]
    pub join: Vec<TextPattern>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct LockingPatterns {
    /// Text patterns for lock acquisition.
    #[serde(default)]
    pub acquire: Vec<TextPattern>,
    /// Text patterns for lock release.
    #[serde(default)]
    pub release: Vec<TextPattern>,
    /// Structured lock blocks (synchronized, etc.).
    #[serde(default)]
    pub scoped: Vec<ScopedResourcePattern>,
}

/// Node types that should be skipped during extraction.
const SKIP_NODE_TYPES: &[&str] = &[
    "comment",
    "line_comment",
    "block_comment",
    "doc_comment",
    "{",
    "}",
    "(",
    ")",
    ";",
    ",",
    "import_declaration",
    "import_statement",
    "package_declaration",
    "package_clause",
    "use_declaration",
    "module_declaration",
    "namespace_declaration",
    "attribute",
    "decorator",
    "annotation",
];

/// Return statement node types across languages.
const RETURN_NODE_TYPES: &[&str] = &[
    "return_statement",
    "return_expression",
    "return",
];

/// Throw/raise statement node types.
const THROW_NODE_TYPES: &[&str] = &[
    "throw_statement",
    "throw_expression",
    "raise",
    "raise_statement",
];

/// A declarative extractor driven by TOML configuration.
pub struct DeclarativeExtractor {
    config: LanguageConfig,
}

impl DeclarativeExtractor {
    pub fn new(config: LanguageConfig) -> Self {
        Self { config }
    }

    pub fn from_toml(toml_str: &str) -> Result<Self> {
        let config: LanguageConfig =
            toml::from_str(toml_str).context("failed to parse language config TOML")?;
        Ok(Self::new(config))
    }
}

impl LanguageExtractor for DeclarativeExtractor {
    fn language_id(&self) -> &str {
        &self.config.language.id
    }

    fn file_extensions(&self) -> &[&str] {
        // This is a bit of a hack to return &[&str] from owned strings.
        // We leak the strings since extractors live for the program's duration.
        let exts: Vec<&str> = self
            .config
            .language
            .extensions
            .iter()
            .map(|s| &**s)
            .collect();
        Box::leak(exts.into_boxed_slice())
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let grammar_id = &self.config.language.grammar;
        let language = grammars::get_grammar(grammar_id)
            .ok_or_else(|| anyhow::anyhow!("no grammar registered for '{}'", grammar_id))?;

        let mut parser = Parser::new();
        parser
            .set_language(&language)
            .context("failed to set grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        self.extract_functions(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

impl DeclarativeExtractor {
    fn extract_functions(
        &self,
        node: &Node,
        source: &str,
        file_path: &str,
        cfgs: &mut Vec<ControlFlowGraph>,
    ) -> Result<()> {
        let kind = node.kind();

        if self
            .config
            .patterns
            .function
            .node_types
            .iter()
            .any(|t| t == kind)
        {
            let name = node
                .child_by_field_name(&self.config.patterns.function.name_field)
                .map(|n| node_text(n, source))
                .unwrap_or_else(|| "anonymous".to_string());

            let cfg = self.extract_function_cfg(node, source, file_path, &name)?;
            cfgs.push(cfg);
        }

        for i in 0..node.child_count() {
            if let Some(child) = node.child(i) {
                self.extract_functions(&child, source, file_path, cfgs)?;
            }
        }

        Ok(())
    }

    fn extract_function_cfg(
        &self,
        func_node: &Node,
        source: &str,
        file_path: &str,
        name: &str,
    ) -> Result<ControlFlowGraph> {
        let lang_id = &self.config.language.id;
        let mut cfg = ControlFlowGraph::new(
            name.to_string(),
            lang_id.clone(),
            file_path.to_string(),
        );

        let entry = cfg.add_node(
            CfgNodeKind::Entry {
                name: name.to_string(),
            },
            SourceSpan::from_tree_sitter(file_path, func_node),
            format!("{name}"),
        );
        cfg.entry = entry;

        let body_field = &self.config.patterns.function.body_field;
        let body = func_node
            .child_by_field_name(body_field)
            .unwrap_or(*func_node);

        let last = self.extract_body(&body, source, file_path, &mut cfg, entry)?;

        if let Some(last_id) = last {
            if !matches!(cfg.nodes[last_id].kind, CfgNodeKind::Return) {
                let ret = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &body),
                    "implicit return".to_string(),
                );
                cfg.add_edge(last_id, ret, None);
                cfg.exits.push(ret);
            }
        } else {
            let ret = cfg.add_node(
                CfgNodeKind::Return,
                SourceSpan::from_tree_sitter(file_path, &body),
                "implicit return".to_string(),
            );
            cfg.add_edge(entry, ret, None);
            cfg.exits.push(ret);
        }

        Ok(cfg)
    }

    fn extract_body(
        &self,
        body: &Node,
        source: &str,
        file_path: &str,
        cfg: &mut ControlFlowGraph,
        predecessor: usize,
    ) -> Result<Option<usize>> {
        let mut current = predecessor;

        for i in 0..body.child_count() {
            let child = match body.child(i) {
                Some(c) => c,
                None => continue,
            };

            let kind = child.kind();

            // Skip noise nodes.
            if SKIP_NODE_TYPES.contains(&kind) {
                continue;
            }

            // Return statements.
            if RETURN_NODE_TYPES.contains(&kind) {
                let ret = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, ret, None);
                cfg.exits.push(ret);
                return Ok(Some(ret));
            }

            // Throw/raise statements.
            if THROW_NODE_TYPES.contains(&kind) {
                let stmt = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                cfg.exits.push(stmt);
                return Ok(Some(stmt));
            }

            // If patterns.
            if let Some(ref if_pat) = self.config.patterns.branch.if_pattern {
                if kind == if_pat.node_type {
                    let has_else = child
                        .child_by_field_name(&if_pat.alternative_field)
                        .is_some();
                    let branch = cfg.add_node(
                        CfgNodeKind::Branch {
                            exhaustive: has_else,
                        },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, branch, None);

                    let merge = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "if merge".to_string(),
                    );

                    if let Some(consequence) =
                        child.child_by_field_name(&if_pat.consequence_field)
                    {
                        let then_end =
                            self.extract_body(&consequence, source, file_path, cfg, branch)?;
                        if let Some(te) = then_end {
                            cfg.add_edge(te, merge, None);
                        }
                    }

                    if let Some(alternative) =
                        child.child_by_field_name(&if_pat.alternative_field)
                    {
                        let else_end =
                            self.extract_body(&alternative, source, file_path, cfg, branch)?;
                        if let Some(ee) = else_end {
                            cfg.add_edge(ee, merge, None);
                        }
                    } else {
                        cfg.add_edge(branch, merge, Some("no-else".into()));
                    }

                    current = merge;
                    continue;
                }
            }

            // Switch patterns.
            if let Some(ref sw_pat) = self.config.patterns.branch.switch_pattern {
                if kind == sw_pat.node_type {
                    let branch = cfg.add_node(
                        CfgNodeKind::Branch { exhaustive: false },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, branch, None);

                    let merge = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "switch merge".to_string(),
                    );

                    if let Some(switch_body) = child.child_by_field_name(&sw_pat.body_field) {
                        for j in 0..switch_body.child_count() {
                            if let Some(case) = switch_body.child(j) {
                                if sw_pat.case_types.iter().any(|t| t == case.kind()) {
                                    let case_end = self.extract_body(
                                        &case, source, file_path, cfg, branch,
                                    )?;
                                    if let Some(ce) = case_end {
                                        cfg.add_edge(ce, merge, None);
                                    }
                                }
                            }
                        }
                    }

                    current = merge;
                    continue;
                }
            }

            // Match patterns.
            if let Some(ref match_pat) = self.config.patterns.branch.match_pattern {
                if kind == match_pat.node_type {
                    let branch = cfg.add_node(
                        CfgNodeKind::Branch {
                            exhaustive: match_pat.always_exhaustive,
                        },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, branch, None);

                    let merge = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "match merge".to_string(),
                    );

                    if let Some(match_body) = child.child_by_field_name(&match_pat.body_field) {
                        for j in 0..match_body.child_count() {
                            if let Some(arm) = match_body.child(j) {
                                if arm.kind() == match_pat.arm_type {
                                    let arm_end = self.extract_body(
                                        &arm, source, file_path, cfg, branch,
                                    )?;
                                    if let Some(ae) = arm_end {
                                        cfg.add_edge(ae, merge, None);
                                    }
                                }
                            }
                        }
                    }

                    current = merge;
                    continue;
                }
            }

            // Bounded loop patterns.
            let mut matched_loop = false;
            for lp in &self.config.patterns.r#loop.bounded {
                if kind == lp.node_type {
                    let loop_node = cfg.add_node(
                        CfgNodeKind::Loop { bounded: true },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, loop_node, None);

                    if let Some(loop_body) = child.child_by_field_name(&lp.body_field) {
                        let body_end =
                            self.extract_body(&loop_body, source, file_path, cfg, loop_node)?;
                        if let Some(be) = body_end {
                            cfg.add_edge(be, loop_node, Some("back".into()));
                        }
                    }

                    let exit = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "loop exit".to_string(),
                    );
                    cfg.add_edge(loop_node, exit, Some("exit".into()));
                    current = exit;
                    matched_loop = true;
                    break;
                }
            }
            if matched_loop {
                continue;
            }

            for lp in &self.config.patterns.r#loop.unbounded {
                if kind == lp.node_type {
                    let loop_node = cfg.add_node(
                        CfgNodeKind::Loop { bounded: false },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, loop_node, None);

                    if let Some(loop_body) = child.child_by_field_name(&lp.body_field) {
                        let body_end =
                            self.extract_body(&loop_body, source, file_path, cfg, loop_node)?;
                        if let Some(be) = body_end {
                            cfg.add_edge(be, loop_node, Some("back".into()));
                        }
                    }

                    let exit = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "loop exit".to_string(),
                    );
                    cfg.add_edge(loop_node, exit, Some("exit".into()));
                    current = exit;
                    matched_loop = true;
                    break;
                }
            }
            if matched_loop {
                continue;
            }

            // Try/catch patterns.
            if let Some(ref try_pat) = self.config.patterns.error_handling.try_pattern {
                if kind == try_pat.try_type {
                    let try_entry = cfg.add_node(
                        CfgNodeKind::TryEntry,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "try".to_string(),
                    );
                    cfg.add_edge(current, try_entry, None);

                    let merge = cfg.add_node(
                        CfgNodeKind::Merge,
                        SourceSpan::from_tree_sitter(file_path, &child),
                        "try merge".to_string(),
                    );

                    // Try body.
                    if let Some(try_body) = child.child_by_field_name(&try_pat.body_field) {
                        let try_end =
                            self.extract_body(&try_body, source, file_path, cfg, try_entry)?;
                        if let Some(te) = try_end {
                            cfg.add_edge(te, merge, None);
                        }
                    }

                    // Catch handlers.
                    for j in 0..child.child_count() {
                        if let Some(handler) = child.child(j) {
                            if handler.kind() == try_pat.catch_type {
                                let catch_node = cfg.add_node(
                                    CfgNodeKind::CatchHandler,
                                    SourceSpan::from_tree_sitter(file_path, &handler),
                                    "catch".to_string(),
                                );
                                cfg.add_exceptional_edge(
                                    try_entry,
                                    catch_node,
                                    Some("error".into()),
                                );

                                if let Some(catch_body) =
                                    handler.child_by_field_name(&try_pat.catch_body_field)
                                {
                                    let catch_end = self.extract_body(
                                        &catch_body,
                                        source,
                                        file_path,
                                        cfg,
                                        catch_node,
                                    )?;
                                    if let Some(ce) = catch_end {
                                        cfg.add_edge(ce, merge, None);
                                    }
                                }
                            }
                        }
                    }

                    // Finally handler.
                    if let Some(ref finally_type) = try_pat.finally_type {
                        for j in 0..child.child_count() {
                            if let Some(handler) = child.child(j) {
                                if handler.kind() == *finally_type {
                                    let finally_node = cfg.add_node(
                                        CfgNodeKind::FinallyHandler,
                                        SourceSpan::from_tree_sitter(file_path, &handler),
                                        "finally".to_string(),
                                    );
                                    cfg.add_edge(merge, finally_node, None);

                                    let finally_end = self.extract_body(
                                        &handler,
                                        source,
                                        file_path,
                                        cfg,
                                        finally_node,
                                    )?;
                                    current = finally_end.unwrap_or(finally_node);
                                    break;
                                }
                            }
                        }
                    } else {
                        current = merge;
                    }

                    continue;
                }
            }

            // Scoped resource patterns (with, using, defer).
            let mut matched_scoped = false;
            for sp in &self.config.patterns.resource.scoped {
                if kind == sp.node_type {
                    let acquire = cfg.add_node(
                        CfgNodeKind::ResourceAcquire {
                            resource_kind: ResourceKind::Generic(sp.kind.clone()),
                        },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, acquire, None);

                    if let Some(scoped_body) = child.child_by_field_name(&sp.body_field) {
                        let body_end =
                            self.extract_body(&scoped_body, source, file_path, cfg, acquire)?;
                        if let Some(be) = body_end {
                            let release = cfg.add_node(
                                CfgNodeKind::ResourceRelease {
                                    resource_kind: ResourceKind::Generic(sp.kind.clone()),
                                },
                                SourceSpan::from_tree_sitter(file_path, &child),
                                "scoped release".to_string(),
                            );
                            cfg.add_edge(be, release, None);
                            current = release;
                        }
                    }
                    matched_scoped = true;
                    break;
                }
            }
            if matched_scoped {
                continue;
            }

            // Scoped lock patterns.
            for sp in &self.config.patterns.locking.scoped {
                if kind == sp.node_type {
                    let lock = cfg.add_node(
                        CfgNodeKind::LockAcquire { lock_id: None },
                        SourceSpan::from_tree_sitter(file_path, &child),
                        node_text_truncated(&child, source, 40),
                    );
                    cfg.add_edge(current, lock, None);

                    if let Some(lock_body) = child.child_by_field_name(&sp.body_field) {
                        let body_end =
                            self.extract_body(&lock_body, source, file_path, cfg, lock)?;
                        if let Some(be) = body_end {
                            let unlock = cfg.add_node(
                                CfgNodeKind::LockRelease { lock_id: None },
                                SourceSpan::from_tree_sitter(file_path, &child),
                                "lock release".to_string(),
                            );
                            cfg.add_edge(be, unlock, None);
                            current = unlock;
                        }
                    }
                    matched_scoped = true;
                    break;
                }
            }
            if matched_scoped {
                continue;
            }

            // Text-based pattern matching for statements/expressions.
            let text = node_text(child, source);
            let node_kind = self.classify_by_text(&text);
            let stmt = cfg.add_node(
                node_kind,
                SourceSpan::from_tree_sitter(file_path, &child),
                node_text_truncated(&child, source, 60),
            );
            cfg.add_edge(current, stmt, None);
            current = stmt;
        }

        Ok(Some(current))
    }

    /// Classify a statement by matching its text against configured patterns.
    fn classify_by_text(&self, text: &str) -> CfgNodeKind {
        // Resource acquire patterns.
        for pat in &self.config.patterns.resource.acquire {
            if text.contains(&pat.text) {
                return CfgNodeKind::ResourceAcquire {
                    resource_kind: text_to_resource_kind(&pat.kind),
                };
            }
        }

        // Resource release patterns.
        for pat in &self.config.patterns.resource.release {
            if text.contains(&pat.text) {
                return CfgNodeKind::ResourceRelease {
                    resource_kind: text_to_resource_kind(&pat.kind),
                };
            }
        }

        // Concurrency spawn patterns.
        for pat in &self.config.patterns.concurrency.spawn {
            if text.contains(&pat.text) {
                return CfgNodeKind::ConcurrentSpawn;
            }
        }

        // Concurrency join patterns.
        for pat in &self.config.patterns.concurrency.join {
            if text.contains(&pat.text) {
                return CfgNodeKind::SyncJoin;
            }
        }

        // Lock acquire patterns.
        for pat in &self.config.patterns.locking.acquire {
            if text.contains(&pat.text) {
                return CfgNodeKind::LockAcquire { lock_id: None };
            }
        }

        // Lock release patterns.
        for pat in &self.config.patterns.locking.release {
            if text.contains(&pat.text) {
                return CfgNodeKind::LockRelease { lock_id: None };
            }
        }

        CfgNodeKind::Statement
    }
}

fn text_to_resource_kind(kind: &str) -> ResourceKind {
    match kind {
        "File" => ResourceKind::File,
        "Socket" => ResourceKind::Socket,
        "Connection" => ResourceKind::Connection,
        "Lock" => ResourceKind::Lock,
        "Thread" => ResourceKind::Thread,
        "Channel" => ResourceKind::Channel,
        "Memory" => ResourceKind::Memory,
        other => ResourceKind::Generic(other.to_string()),
    }
}

fn node_text(node: Node, source: &str) -> String {
    source[node.start_byte()..node.end_byte()].to_string()
}

fn node_text_truncated(node: &Node, source: &str, max: usize) -> String {
    let full = &source[node.start_byte()..node.end_byte()];
    let first_line = full.lines().next().unwrap_or(full);
    if first_line.len() > max {
        let end = first_line.char_indices().nth(max).map(|(i, _)| i).unwrap_or(first_line.len());
        format!("{}...", &first_line[..end])
    } else {
        first_line.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn c_config() -> LanguageConfig {
        toml::from_str(include_str!("../../configs/c.toml")).unwrap()
    }

    fn ruby_config() -> LanguageConfig {
        toml::from_str(include_str!("../../configs/ruby.toml")).unwrap()
    }

    #[test]
    fn declarative_c_extracts_function() {
        let config = c_config();
        let extractor = DeclarativeExtractor::new(config);
        let source = r#"
void process(int* data, int len) {
    if (data == NULL) {
        return;
    }
    for (int i = 0; i < len; i++) {
        data[i] *= 2;
    }
}
"#;
        let cfgs = extractor.extract(source, "test.c").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert!(cfgs[0].function_name.contains("process"), "function name should contain 'process'");
        let has_branch = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::Branch { .. }));
        assert!(has_branch, "should detect if branch");
    }

    #[test]
    fn declarative_ruby_extracts_method() {
        let config = ruby_config();
        let extractor = DeclarativeExtractor::new(config);
        let source = r#"
def process_data(data)
  if data.nil?
    raise ArgumentError, "nil data"
  end
  data.each do |item|
    transform(item)
  end
end
"#;
        let cfgs = extractor.extract(source, "test.rb").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "process_data");
    }
}
