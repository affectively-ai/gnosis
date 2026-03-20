use anyhow::{Context, Result};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, ResourceKind};
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

pub struct RustExtractor;

impl LanguageExtractor for RustExtractor {
    fn language_id(&self) -> &str {
        "rust"
    }

    fn file_extensions(&self) -> &[&str] {
        &[".rs"]
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let mut parser = Parser::new();
        let language = tree_sitter_rust::LANGUAGE.into();
        parser
            .set_language(&language)
            .context("failed to set Rust grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse Rust source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        extract_rust_functions(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

fn extract_rust_functions(
    node: &Node,
    source: &str,
    file_path: &str,
    cfgs: &mut Vec<ControlFlowGraph>,
) -> Result<()> {
    if node.kind() == "function_item" {
        let name = node
            .child_by_field_name("name")
            .map(|n| node_text(n, source))
            .unwrap_or_else(|| "anonymous".to_string());

        let cfg = extract_rust_function_cfg(node, source, file_path, &name)?;
        cfgs.push(cfg);
    }

    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            extract_rust_functions(&child, source, file_path, cfgs)?;
        }
    }

    Ok(())
}

fn extract_rust_function_cfg(
    func_node: &Node,
    source: &str,
    file_path: &str,
    name: &str,
) -> Result<ControlFlowGraph> {
    let mut cfg = ControlFlowGraph::new(
        name.to_string(),
        "rust".to_string(),
        file_path.to_string(),
    );

    let entry = cfg.add_node(
        CfgNodeKind::Entry {
            name: name.to_string(),
        },
        SourceSpan::from_tree_sitter(file_path, func_node),
        format!("fn {name}"),
    );
    cfg.entry = entry;

    let body = func_node
        .child_by_field_name("body")
        .unwrap_or(*func_node);

    let last = extract_rust_body(&body, source, file_path, &mut cfg, entry)?;

    if let Some(last_id) = last {
        let last_node_kind = &cfg.nodes[last_id].kind;
        if !matches!(last_node_kind, CfgNodeKind::Return) {
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

fn extract_rust_body(
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
            "if_expression" => {
                let has_else = child.child_by_field_name("alternative").is_some();
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

                if let Some(consequence) = child.child_by_field_name("consequence") {
                    let then_end =
                        extract_rust_body(&consequence, source, file_path, cfg, branch)?;
                    if let Some(te) = then_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                if let Some(alternative) = child.child_by_field_name("alternative") {
                    let else_end =
                        extract_rust_body(&alternative, source, file_path, cfg, branch)?;
                    if let Some(ee) = else_end {
                        cfg.add_edge(ee, merge, None);
                    }
                } else {
                    cfg.add_edge(branch, merge, Some("no-else".into()));
                }

                current = merge;
            }

            "match_expression" => {
                let branch = cfg.add_node(
                    CfgNodeKind::Branch { exhaustive: true }, // Rust match is always exhaustive.
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, branch, None);

                let merge = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "match merge".to_string(),
                );

                if let Some(match_body) = child.child_by_field_name("body") {
                    for j in 0..match_body.child_count() {
                        if let Some(arm) = match_body.child(j) {
                            if arm.kind() == "match_arm" {
                                let arm_end =
                                    extract_rust_body(&arm, source, file_path, cfg, branch)?;
                                if let Some(ae) = arm_end {
                                    cfg.add_edge(ae, merge, None);
                                }
                            }
                        }
                    }
                }

                current = merge;
            }

            "for_expression" => {
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded: true }, // for...in is bounded.
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_rust_body(&loop_body, source, file_path, cfg, loop_node)?;
                    if let Some(be) = body_end {
                        cfg.add_edge(be, loop_node, Some("back".into()));
                    }
                }

                let exit = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "for exit".to_string(),
                );
                cfg.add_edge(loop_node, exit, Some("exit".into()));
                current = exit;
            }

            "while_expression" | "loop_expression" => {
                let bounded = child.kind() == "while_expression";
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_rust_body(&loop_body, source, file_path, cfg, loop_node)?;
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
            }

            "return_expression" => {
                let ret = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, ret, None);
                cfg.exits.push(ret);
                return Ok(Some(ret));
            }

            "let_declaration" => {
                let node_kind = classify_rust_let(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "expression_statement" => {
                // Unwrap expression_statement to check the inner expression.
                let inner = child.child(0).unwrap_or(child);
                match inner.kind() {
                    "match_expression" => {
                        let branch = cfg.add_node(
                            CfgNodeKind::Branch { exhaustive: true },
                            SourceSpan::from_tree_sitter(file_path, &inner),
                            node_text_truncated(&inner, source, 40),
                        );
                        cfg.add_edge(current, branch, None);

                        let merge = cfg.add_node(
                            CfgNodeKind::Merge,
                            SourceSpan::from_tree_sitter(file_path, &inner),
                            "match merge".to_string(),
                        );

                        if let Some(match_body) = inner.child_by_field_name("body") {
                            for j in 0..match_body.child_count() {
                                if let Some(arm) = match_body.child(j) {
                                    if arm.kind() == "match_arm" {
                                        let arm_end =
                                            extract_rust_body(&arm, source, file_path, cfg, branch)?;
                                        if let Some(ae) = arm_end {
                                            cfg.add_edge(ae, merge, None);
                                        }
                                    }
                                }
                            }
                        }

                        current = merge;
                    }
                    "if_expression" => {
                        let has_else = inner.child_by_field_name("alternative").is_some();
                        let branch = cfg.add_node(
                            CfgNodeKind::Branch { exhaustive: has_else },
                            SourceSpan::from_tree_sitter(file_path, &inner),
                            node_text_truncated(&inner, source, 40),
                        );
                        cfg.add_edge(current, branch, None);

                        let merge = cfg.add_node(
                            CfgNodeKind::Merge,
                            SourceSpan::from_tree_sitter(file_path, &inner),
                            "if merge".to_string(),
                        );

                        if let Some(consequence) = inner.child_by_field_name("consequence") {
                            let then_end =
                                extract_rust_body(&consequence, source, file_path, cfg, branch)?;
                            if let Some(te) = then_end {
                                cfg.add_edge(te, merge, None);
                            }
                        }

                        if let Some(alternative) = inner.child_by_field_name("alternative") {
                            let else_end =
                                extract_rust_body(&alternative, source, file_path, cfg, branch)?;
                            if let Some(ee) = else_end {
                                cfg.add_edge(ee, merge, None);
                            }
                        } else {
                            cfg.add_edge(branch, merge, Some("no-else".into()));
                        }

                        current = merge;
                    }
                    _ => {
                        let node_kind = classify_rust_expression(&child, source);
                        let stmt = cfg.add_node(
                            node_kind,
                            SourceSpan::from_tree_sitter(file_path, &child),
                            node_text_truncated(&child, source, 60),
                        );
                        cfg.add_edge(current, stmt, None);
                        current = stmt;
                    }
                }
            }

            "comment" | "{" | "}" | ";" | "use_declaration" | "attribute_item" => {}

            _ => {
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

fn classify_rust_let(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Detect resource acquisition patterns.
    if text.contains("File::open") || text.contains("File::create") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::File,
        };
    }
    if text.contains("TcpStream::connect") || text.contains("TcpListener::bind") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Socket,
        };
    }
    if text.contains("Mutex::new") || text.contains(".lock()") {
        return CfgNodeKind::LockAcquire {
            lock_id: None,
        };
    }

    // Detect spawn patterns.
    if text.contains("tokio::spawn") || text.contains("thread::spawn") || text.contains("task::spawn") {
        return CfgNodeKind::ConcurrentSpawn;
    }

    CfgNodeKind::Statement
}

fn classify_rust_expression(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Detect .await (sync join).
    if text.contains(".await") {
        return CfgNodeKind::SyncJoin;
    }

    // Detect spawn patterns.
    if text.contains("tokio::spawn") || text.contains("thread::spawn") {
        return CfgNodeKind::ConcurrentSpawn;
    }

    // Detect drop/close.
    if text.contains("drop(") || text.contains(".close()") || text.contains(".shutdown()") {
        return CfgNodeKind::ResourceRelease {
            resource_kind: ResourceKind::Generic("resource".to_string()),
        };
    }

    CfgNodeKind::Statement
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

    #[test]
    // polyglot:ignore RESOURCE_LEAK — file read in test helper, auto-closed
    fn extracts_rust_function() {
        let source = r#"
fn process(data: &[u8]) -> Result<(), Error> {
    if data.is_empty() {
        return Err(Error::new("empty"));
    }
    let file = File::open("output.txt")?;
    file.write_all(data)?;
    Ok(())
}
"#;

        let extractor = RustExtractor;
        let cfgs = extractor.extract(source, "test.rs").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "process");
    }

    #[test]
    fn detects_match_as_exhaustive() {
        let source = r#"
fn handle(result: Result<i32, Error>) -> String {
    match result {
        Ok(val) => format!("success: {}", val),
        Err(e) => format!("error: {}", e),
    }
}
"#;

        let extractor = RustExtractor;
        let cfgs = extractor.extract(source, "test.rs").unwrap();
        let has_exhaustive_branch = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::Branch { exhaustive: true }));
        assert!(has_exhaustive_branch, "match should be exhaustive branch");
    }
}
