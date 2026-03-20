use anyhow::{Context, Result};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, ResourceKind};
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

pub struct PythonExtractor;

impl LanguageExtractor for PythonExtractor {
    fn language_id(&self) -> &str {
        "python"
    }

    fn file_extensions(&self) -> &[&str] {
        &[".py", ".pyw"]
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let mut parser = Parser::new();
        let language = tree_sitter_python::LANGUAGE.into();
        parser
            .set_language(&language)
            .context("failed to set Python grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse Python source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        extract_python_functions(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

fn extract_python_functions(
    node: &Node,
    source: &str,
    file_path: &str,
    cfgs: &mut Vec<ControlFlowGraph>,
) -> Result<()> {
    if node.kind() == "function_definition" {
        let name = node
            .child_by_field_name("name")
            .map(|n| node_text(n, source))
            .unwrap_or_else(|| "anonymous".to_string());

        let cfg = extract_python_function_cfg(node, source, file_path, &name)?;
        cfgs.push(cfg);
    }

    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            extract_python_functions(&child, source, file_path, cfgs)?;
        }
    }

    Ok(())
}

fn extract_python_function_cfg(
    func_node: &Node,
    source: &str,
    file_path: &str,
    name: &str,
) -> Result<ControlFlowGraph> {
    let mut cfg = ControlFlowGraph::new(
        name.to_string(),
        "python".to_string(),
        file_path.to_string(),
    );

    let entry = cfg.add_node(
        CfgNodeKind::Entry {
            name: name.to_string(),
        },
        SourceSpan::from_tree_sitter(file_path, func_node),
        format!("def {name}"),
    );
    cfg.entry = entry;

    let body = func_node
        .child_by_field_name("body")
        .unwrap_or(*func_node);

    let last = extract_python_body(&body, source, file_path, &mut cfg, entry)?;

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

fn extract_python_body(
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
                let has_else = has_child_of_kind(&child, "else_clause");
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

                // Then body.
                if let Some(consequence) = child.child_by_field_name("consequence") {
                    let then_end =
                        extract_python_body(&consequence, source, file_path, cfg, branch)?;
                    if let Some(te) = then_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                // Elif / else branches.
                let mut found_else = false;
                for j in 0..child.child_count() {
                    if let Some(clause) = child.child(j) {
                        match clause.kind() {
                            "elif_clause" => {
                                if let Some(elif_body) = clause.child_by_field_name("consequence") {
                                    let elif_end = extract_python_body(
                                        &elif_body, source, file_path, cfg, branch,
                                    )?;
                                    if let Some(ee) = elif_end {
                                        cfg.add_edge(ee, merge, None);
                                    }
                                }
                            }
                            "else_clause" => {
                                found_else = true;
                                if let Some(else_body) = clause.child_by_field_name("body") {
                                    let else_end = extract_python_body(
                                        &else_body, source, file_path, cfg, branch,
                                    )?;
                                    if let Some(ee) = else_end {
                                        cfg.add_edge(ee, merge, None);
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                }

                if !found_else {
                    cfg.add_edge(branch, merge, Some("no-else".into()));
                }

                current = merge;
            }

            "for_statement" => {
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded: true },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_python_body(&loop_body, source, file_path, cfg, loop_node)?;
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

            "while_statement" => {
                let text = node_text(child, source);
                // while loops with explicit termination conditions are bounded.
                let bounded = text.contains(" < ")
                    || text.contains(" <= ")
                    || text.contains(" > ")
                    || text.contains(" >= ")
                    || text.contains(" not ")
                    || text.contains("len(")
                    || text.contains(".empty")
                    || text.contains("is not None");
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_python_body(&loop_body, source, file_path, cfg, loop_node)?;
                    if let Some(be) = body_end {
                        cfg.add_edge(be, loop_node, Some("back".into()));
                    }
                }

                let exit = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "while exit".to_string(),
                );
                cfg.add_edge(loop_node, exit, Some("exit".into()));
                current = exit;
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
                        extract_python_body(&try_body, source, file_path, cfg, try_entry)?;
                    if let Some(te) = try_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                // Except handlers.
                for j in 0..child.child_count() {
                    if let Some(handler) = child.child(j) {
                        if handler.kind() == "except_clause" {
                            let catch_node = cfg.add_node(
                                CfgNodeKind::CatchHandler,
                                SourceSpan::from_tree_sitter(file_path, &handler),
                                "except".to_string(),
                            );
                            cfg.add_exceptional_edge(
                                try_entry,
                                catch_node,
                                Some("error".into()),
                            );

                            // Except body is direct children.
                            let catch_end = extract_python_body(
                                &handler,
                                source,
                                file_path,
                                cfg,
                                catch_node,
                            )?;
                            if let Some(ce) = catch_end {
                                cfg.add_edge(ce, merge, None);
                            }
                        } else if handler.kind() == "finally_clause" {
                            let finally_node = cfg.add_node(
                                CfgNodeKind::FinallyHandler,
                                SourceSpan::from_tree_sitter(file_path, &handler),
                                "finally".to_string(),
                            );
                            cfg.add_edge(merge, finally_node, None);

                            let finally_end = extract_python_body(
                                &handler,
                                source,
                                file_path,
                                cfg,
                                finally_node,
                            )?;
                            if let Some(fe) = finally_end {
                                current = fe;
                                continue;
                            }
                        }
                    }
                }

                current = merge;
            }

            "with_statement" => {
                // with statement = acquire + body + implicit release.
                let acquire = cfg.add_node(
                    CfgNodeKind::ResourceAcquire {
                        resource_kind: ResourceKind::Generic("context_manager".to_string()),
                    },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, acquire, None);

                if let Some(with_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_python_body(&with_body, source, file_path, cfg, acquire)?;
                    if let Some(be) = body_end {
                        let release = cfg.add_node(
                            CfgNodeKind::ResourceRelease {
                                resource_kind: ResourceKind::Generic(
                                    "context_manager".to_string(),
                                ),
                            },
                            SourceSpan::from_tree_sitter(file_path, &child),
                            "with exit".to_string(),
                        );
                        cfg.add_edge(be, release, None);
                        current = release;
                    }
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

            "raise_statement" => {
                let stmt = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                cfg.exits.push(stmt);
                return Ok(Some(stmt));
            }

            "expression_statement" => {
                let node_kind = classify_python_expression(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "comment" | "decorator" | "pass_statement" => {}

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

fn classify_python_expression(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Resource acquire patterns.
    if text.contains("open(") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::File,
        };
    }
    if text.contains("connect(") || text.contains("create_connection(") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Connection,
        };
    }

    // Resource release patterns.
    if text.contains(".close()") {
        return CfgNodeKind::ResourceRelease {
            resource_kind: ResourceKind::Generic("resource".to_string()),
        };
    }

    // Async patterns.
    if text.starts_with("await ") || text.contains("await ") {
        return CfgNodeKind::SyncJoin;
    }

    // Thread spawn.
    if text.contains("Thread(") || text.contains("Process(") || text.contains("create_task(") {
        return CfgNodeKind::ConcurrentSpawn;
    }

    // Lock acquire.
    if text.contains(".acquire(") || text.contains("Lock(") {
        return CfgNodeKind::LockAcquire { lock_id: None };
    }

    // Lock release.
    if text.contains(".release(") {
        return CfgNodeKind::LockRelease { lock_id: None };
    }

    CfgNodeKind::Statement
}

fn has_child_of_kind(node: &Node, kind: &str) -> bool {
    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            if child.kind() == kind {
                return true;
            }
        }
    }
    false
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
    fn extracts_python_function() {
        let source = r#"
def process_data(data):
    if not data:
        raise ValueError("empty")
    with open("output.txt", "w") as f:
        f.write(str(data))
    return True
"#;

        let extractor = PythonExtractor;
        let cfgs = extractor.extract(source, "test.py").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "process_data");
    }

    #[test]
    fn with_statement_has_acquire_release() {
        let source = r#"
def safe_read():
    with open("data.txt") as f:
        return f.read()
"#;

        let extractor = PythonExtractor;
        let cfgs = extractor.extract(source, "test.py").unwrap();
        let has_acquire = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceAcquire { .. }));
        let has_release = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceRelease { .. }));
        assert!(has_acquire, "with should create acquire");
        assert!(has_release, "with should create release");
    }
}
