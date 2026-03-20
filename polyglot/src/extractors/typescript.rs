use anyhow::{Context, Result};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, FunctionParam, ResourceKind};
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

pub struct TypeScriptExtractor;

impl LanguageExtractor for TypeScriptExtractor {
    fn language_id(&self) -> &str {
        "typescript"
    }

    fn file_extensions(&self) -> &[&str] {
        &[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let mut parser = Parser::new();
        let is_tsx = file_path.ends_with(".tsx") || file_path.ends_with(".jsx");
        let language = if is_tsx {
            tree_sitter_typescript::LANGUAGE_TSX.into()
        } else {
            tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
        };
        parser
            .set_language(&language)
            .context("failed to set TypeScript grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse TypeScript source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        extract_functions_recursive(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

fn extract_functions_recursive(
    node: &Node,
    source: &str,
    file_path: &str,
    cfgs: &mut Vec<ControlFlowGraph>,
) -> Result<()> {
    match node.kind() {
        "function_declaration" | "method_definition" | "function" => {
            let name = get_function_name(node, source).unwrap_or_else(|| "anonymous".to_string());
            let cfg = extract_function_cfg(node, source, file_path, &name)?;
            cfgs.push(cfg);
        }
        "arrow_function" | "function_expression" => {
            // Only extract top-level or named arrow functions.
            if let Some(parent) = node.parent() {
                if parent.kind() == "variable_declarator" {
                    let name = parent
                        .child_by_field_name("name")
                        .map(|n| node_text(n, source))
                        .unwrap_or_else(|| "anonymous".to_string());
                    let cfg = extract_function_cfg(node, source, file_path, &name)?;
                    cfgs.push(cfg);
                }
            }
        }
        "export_statement" => {
            // Look for exported function declarations.
            for i in 0..node.child_count() {
                if let Some(child) = node.child(i) {
                    extract_functions_recursive(&child, source, file_path, cfgs)?;
                }
            }
            return Ok(());
        }
        _ => {}
    }

    // Recurse into children (but not into nested functions we've already extracted).
    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            let kind = child.kind();
            if kind != "function_declaration"
                && kind != "method_definition"
                && kind != "function"
                && kind != "arrow_function"
                && kind != "function_expression"
            {
                extract_functions_recursive(&child, source, file_path, cfgs)?;
            } else if kind == "function_declaration" || kind == "method_definition" {
                // These are top-level, extract them.
                extract_functions_recursive(&child, source, file_path, cfgs)?;
            }
        }
    }

    Ok(())
}

fn extract_function_cfg(
    func_node: &Node,
    source: &str,
    file_path: &str,
    name: &str,
) -> Result<ControlFlowGraph> {
    let mut cfg = ControlFlowGraph::new(
        name.to_string(),
        "typescript".to_string(),
        file_path.to_string(),
    );

    // Extract TypeScript function signature.
    let func_text = node_text(*func_node, source);
    cfg.signature.is_async = func_text.starts_with("async ");
    cfg.signature.is_generator = func_text.contains("function*");

    // Extract parameters.
    if let Some(params_node) = func_node.child_by_field_name("parameters") {
        extract_ts_params(&params_node, source, &mut cfg.signature.params);
    }
    // Extract return type.
    if let Some(ret_type) = func_node.child_by_field_name("return_type") {
        cfg.signature.return_type = Some(node_text(ret_type, source).trim_start_matches(':').trim().to_string());
    }
    // Extract callees.
    if let Some(body_node) = func_node.child_by_field_name("body") {
        extract_ts_callees(&body_node, source, &mut cfg.signature.callees);
    }

    let entry = cfg.add_node(
        CfgNodeKind::Entry {
            name: name.to_string(),
        },
        SourceSpan::from_tree_sitter(file_path, func_node),
        format!("function {name}"),
    );
    cfg.entry = entry;

    let body = func_node
        .child_by_field_name("body")
        .unwrap_or(*func_node);

    let last = extract_body_cfg(&body, source, file_path, &mut cfg, entry)?;

    // Add implicit return if needed.
    if let Some(last_id) = last {
        let last_node = &cfg.nodes[last_id];
        if !matches!(last_node.kind, CfgNodeKind::Return) {
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

fn extract_body_cfg(
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

        match child.kind() {
            "if_statement" => {
                let branch = cfg.add_node(
                    CfgNodeKind::Branch { exhaustive: child.child_by_field_name("alternative").is_some() },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, branch, None);

                let merge = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "if merge".to_string(),
                );

                // Then branch.
                if let Some(consequence) = child.child_by_field_name("consequence") {
                    let then_end = extract_body_cfg(&consequence, source, file_path, cfg, branch)?;
                    if let Some(te) = then_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                // Else branch.
                if let Some(alternative) = child.child_by_field_name("alternative") {
                    let else_end =
                        extract_body_cfg(&alternative, source, file_path, cfg, branch)?;
                    if let Some(ee) = else_end {
                        cfg.add_edge(ee, merge, None);
                    }
                } else {
                    // No else: branch can skip directly to merge.
                    cfg.add_edge(branch, merge, Some("no-else".into()));
                }

                current = merge;
            }

            "switch_statement" => {
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

                // Extract cases.
                if let Some(body_node) = child.child_by_field_name("body") {
                    for j in 0..body_node.child_count() {
                        if let Some(case) = body_node.child(j) {
                            if case.kind() == "switch_case" || case.kind() == "switch_default" {
                                let case_end =
                                    extract_body_cfg(&case, source, file_path, cfg, branch)?;
                                if let Some(ce) = case_end {
                                    cfg.add_edge(ce, merge, None);
                                }
                            }
                        }
                    }
                }

                current = merge;
            }

            "for_statement" | "for_in_statement" | "while_statement" | "do_statement" => {
                let bounded = is_bounded_loop(&child, source);
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_body_cfg(&loop_body, source, file_path, cfg, loop_node)?;
                    if let Some(be) = body_end {
                        // Back edge (loop).
                        cfg.add_edge(be, loop_node, Some("back".into()));
                    }
                }

                let loop_exit = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "loop exit".to_string(),
                );
                cfg.add_edge(loop_node, loop_exit, Some("exit".into()));
                current = loop_exit;
            }

            "try_statement" => {
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
                if let Some(try_body) = child.child_by_field_name("body") {
                    let try_end =
                        extract_body_cfg(&try_body, source, file_path, cfg, try_entry)?;
                    if let Some(te) = try_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                // Catch handler.
                if let Some(handler) = child.child_by_field_name("handler") {
                    let catch_node = cfg.add_node(
                        CfgNodeKind::CatchHandler,
                        SourceSpan::from_tree_sitter(file_path, &handler),
                        "catch".to_string(),
                    );
                    cfg.add_exceptional_edge(try_entry, catch_node, Some("error".into()));

                    if let Some(catch_body) = handler.child_by_field_name("body") {
                        let catch_end =
                            extract_body_cfg(&catch_body, source, file_path, cfg, catch_node)?;
                        if let Some(ce) = catch_end {
                            cfg.add_edge(ce, merge, None);
                        }
                    }
                }

                // Finally.
                if let Some(finalizer) = child.child_by_field_name("finalizer") {
                    let finally_node = cfg.add_node(
                        CfgNodeKind::FinallyHandler,
                        SourceSpan::from_tree_sitter(file_path, &finalizer),
                        "finally".to_string(),
                    );
                    cfg.add_edge(merge, finally_node, None);

                    let finally_end =
                        extract_body_cfg(&finalizer, source, file_path, cfg, finally_node)?;
                    current = finally_end.unwrap_or(finally_node);
                } else {
                    current = merge;
                }
            }

            "return_statement" => {
                let ret = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, ret, None);
                cfg.exits.push(ret);
                return Ok(Some(ret));
            }

            "expression_statement" => {
                let node_kind = classify_expression(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "lexical_declaration" | "variable_declaration" => {
                let node_kind = classify_declaration(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "throw_statement" => {
                let stmt = cfg.add_node(
                    CfgNodeKind::Return, // throw is like an exceptional return
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                cfg.exits.push(stmt);
                return Ok(Some(stmt));
            }

            // Skip non-statement nodes.
            "comment" | "{" | "}" | ";" | "," | "type_alias_declaration"
            | "interface_declaration" | "import_statement" | "export_statement" => {}

            _ => {
                // Generic statement.
                let stmt = cfg.add_node(
                    CfgNodeKind::Statement,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }
        }
    }

    Ok(Some(current))
}

/// Classify an expression statement into a more specific CFG node kind.
fn classify_expression(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Detect awaited expressions (sync join).
    if text.contains("await ") {
        return CfgNodeKind::SyncJoin;
    }

    // Detect resource patterns.
    // Note: .connect( alone is too broad -- matches Web Audio node.connect(),
    // GraphQL isConnection, UI state connections, etc. Only match explicit
    // network connection creation patterns.
    let resource_patterns = [
        ("fs.open", ResourceKind::File),
        ("createReadStream", ResourceKind::File),
        ("createWriteStream", ResourceKind::File),
        ("net.connect", ResourceKind::Socket),
        ("net.createConnection", ResourceKind::Socket),
        ("tls.connect", ResourceKind::Socket),
        ("new WebSocket", ResourceKind::Socket),
        ("http.request(", ResourceKind::Connection),
        ("https.request(", ResourceKind::Connection),
    ];

    for (pattern, kind) in &resource_patterns {
        if text.contains(pattern) {
            return CfgNodeKind::ResourceAcquire {
                resource_kind: kind.clone(),
            };
        }
    }

    let close_patterns = [".close(", ".end(", ".destroy(", ".disconnect("];
    for pattern in &close_patterns {
        if text.contains(pattern) {
            return CfgNodeKind::ResourceRelease {
                resource_kind: ResourceKind::Generic("stream".to_string()),
            };
        }
    }

    // Detect spawn patterns.
    // Note: setTimeout/setInterval are NOT concurrent spawns -- they are
    // timer scheduling on the same event loop. Only flag actual thread/process spawns.
    if text.contains("new Worker(")
        || text.contains("child_process.fork(")
        || text.contains("child_process.spawn(")
        || text.contains("cluster.fork(")
    {
        return CfgNodeKind::ConcurrentSpawn;
    }

    CfgNodeKind::Statement
}

/// Classify a variable declaration.
fn classify_declaration(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Check for resource acquisition in declaration.
    // Note: readFileSync/writeFileSync are NOT resource acquires -- they are
    // synchronous operations that open, read/write, and close in one call.
    let resource_patterns = [
        ("fs.open", ResourceKind::File),
        ("createReadStream", ResourceKind::File),
        ("createWriteStream", ResourceKind::File),
        ("createConnection", ResourceKind::Connection),
        ("new Pool(", ResourceKind::Connection),
    ];

    for (pattern, kind) in &resource_patterns {
        if text.contains(pattern) {
            return CfgNodeKind::ResourceAcquire {
                resource_kind: kind.clone(),
            };
        }
    }

    CfgNodeKind::Statement
}

fn get_function_name(node: &Node, source: &str) -> Option<String> {
    node.child_by_field_name("name")
        .map(|n| node_text(n, source))
}

fn extract_ts_params(params_node: &Node, source: &str, params: &mut Vec<FunctionParam>) {
    for i in 0..params_node.child_count() {
        if let Some(child) = params_node.child(i) {
            let kind = child.kind();
            if kind == "required_parameter" || kind == "optional_parameter" || kind == "rest_pattern" {
                let name = child.child_by_field_name("pattern")
                    .or_else(|| child.child(0))
                    .map(|n| node_text(n, source))
                    .unwrap_or_default()
                    .trim_start_matches("...")
                    .to_string();
                let type_ann = child.child_by_field_name("type")
                    .map(|n| node_text(n, source).trim_start_matches(':').trim().to_string());
                let default_val = child.child_by_field_name("value")
                    .map(|n| node_text(n, source));
                let is_variadic = kind == "rest_pattern" || node_text(child, source).starts_with("...");

                if !name.is_empty() {
                    params.push(FunctionParam { name, type_annotation: type_ann, default_value: default_val, is_variadic });
                }
            } else if kind == "identifier" {
                let name = node_text(child, source);
                if !name.is_empty() && name != "," {
                    params.push(FunctionParam { name, type_annotation: None, default_value: None, is_variadic: false });
                }
            }
        }
    }
}

fn extract_ts_callees(node: &Node, source: &str, callees: &mut Vec<String>) {
    if node.kind() == "call_expression" {
        if let Some(func) = node.child_by_field_name("function") {
            let callee = node_text(func, source);
            if !callee.is_empty() && !callees.contains(&callee) {
                callees.push(callee);
            }
        }
    }
    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            if child.kind() != "function_declaration" && child.kind() != "arrow_function" {
                extract_ts_callees(&child, source, callees);
            }
        }
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

fn is_bounded_loop(node: &Node, source: &str) -> bool {
    let kind = node.kind();
    match kind {
        // for...in / for...of are always bounded (iterate over collection).
        "for_in_statement" => true,
        "for_statement" => {
            let text = node_text(*node, source);
            // C-style for with .length, .size, numeric bound, or collection iteration.
            text.contains(".length")
                || text.contains(".size")
                || text.contains(" of ")
                || text.contains(" in ")
                || text.contains(" < ")
                || text.contains(" <= ")
                || text.contains(" > ")
                || text.contains(" >= ")
        }
        "while_statement" | "do_statement" => {
            // while loops with explicit termination conditions are bounded.
            let text = node_text(*node, source);
            // while (i < n), while (arr.length), while (queue.length > 0), etc.
            text.contains(" < ")
                || text.contains(" <= ")
                || text.contains(" > ")
                || text.contains(" >= ")
                || text.contains(".length")
                || text.contains(".size")
                || text.contains(".hasNext")
                || text.contains("!done")
                || text.contains("!finished")
                || text.contains("!eof")
        }
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_simple_function() {
        let source = r#"
function greet(name: string): string {
    if (name === "world") {
        return "Hello, World!";
    } else {
        return `Hello, ${name}!`;
    }
}
"#;

        let extractor = TypeScriptExtractor;
        let cfgs = extractor.extract(source, "test.ts").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "greet");
        assert!(cfgs[0].nodes.len() >= 4, "should have entry, branch, then, else");
    }

    #[test]
    fn detects_try_catch() {
        let source = r#"
function riskyOp() {
    try {
        dangerousCall();
    } catch (e) {
        handleError(e);
    }
}
"#;

        let extractor = TypeScriptExtractor;
        let cfgs = extractor.extract(source, "test.ts").unwrap();
        assert_eq!(cfgs.len(), 1);

        let has_try = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::TryEntry));
        assert!(has_try, "should detect try entry");

        let has_catch = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::CatchHandler));
        assert!(has_catch, "should detect catch handler");
    }

    #[test]
    fn detects_resource_acquire() {
        let source = r#"
function readFile() {
    const stream = fs.createReadStream("data.txt");
    const data = stream.read();
    stream.close();
    return data;
}
"#;

        let extractor = TypeScriptExtractor;
        let cfgs = extractor.extract(source, "test.ts").unwrap();
        assert_eq!(cfgs.len(), 1);

        let has_acquire = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceAcquire { .. }));
        assert!(has_acquire, "should detect resource acquire");

        let has_release = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceRelease { .. }));
        assert!(has_release, "should detect resource release");
    }
}
