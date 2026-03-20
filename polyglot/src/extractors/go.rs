use anyhow::{Context, Result};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, ResourceKind};
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

pub struct GoExtractor;

impl LanguageExtractor for GoExtractor {
    fn language_id(&self) -> &str {
        "go"
    }

    fn file_extensions(&self) -> &[&str] {
        &[".go"]
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let mut parser = Parser::new();
        let language = tree_sitter_go::LANGUAGE.into();
        parser
            .set_language(&language)
            .context("failed to set Go grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse Go source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        extract_go_functions(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

fn extract_go_functions(
    node: &Node,
    source: &str,
    file_path: &str,
    cfgs: &mut Vec<ControlFlowGraph>,
) -> Result<()> {
    if node.kind() == "function_declaration" || node.kind() == "method_declaration" {
        let name = node
            .child_by_field_name("name")
            .map(|n| node_text(n, source))
            .unwrap_or_else(|| "anonymous".to_string());

        let cfg = extract_go_function_cfg(node, source, file_path, &name)?;
        cfgs.push(cfg);
    }

    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            extract_go_functions(&child, source, file_path, cfgs)?;
        }
    }

    Ok(())
}

fn extract_go_function_cfg(
    func_node: &Node,
    source: &str,
    file_path: &str,
    name: &str,
) -> Result<ControlFlowGraph> {
    let mut cfg = ControlFlowGraph::new(
        name.to_string(),
        "go".to_string(),
        file_path.to_string(),
    );

    let entry = cfg.add_node(
        CfgNodeKind::Entry {
            name: name.to_string(),
        },
        SourceSpan::from_tree_sitter(file_path, func_node),
        format!("func {name}"),
    );
    cfg.entry = entry;

    let body = func_node
        .child_by_field_name("body")
        .unwrap_or(*func_node);

    let last = extract_go_body(&body, source, file_path, &mut cfg, entry)?;

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

fn extract_go_body(
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
                        extract_go_body(&consequence, source, file_path, cfg, branch)?;
                    if let Some(te) = then_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                if let Some(alternative) = child.child_by_field_name("alternative") {
                    let else_end =
                        extract_go_body(&alternative, source, file_path, cfg, branch)?;
                    if let Some(ee) = else_end {
                        cfg.add_edge(ee, merge, None);
                    }
                } else {
                    cfg.add_edge(branch, merge, Some("no-else".into()));
                }

                current = merge;
            }

            "expression_switch_statement" | "type_switch_statement" => {
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

                for j in 0..child.child_count() {
                    if let Some(case) = child.child(j) {
                        if case.kind() == "expression_case"
                            || case.kind() == "type_case"
                            || case.kind() == "default_case"
                        {
                            let case_end =
                                extract_go_body(&case, source, file_path, cfg, branch)?;
                            if let Some(ce) = case_end {
                                cfg.add_edge(ce, merge, None);
                            }
                        }
                    }
                }

                current = merge;
            }

            "for_statement" => {
                let text = node_text(child, source);
                // Go's `for` with no condition is unbounded.
                let bounded = text.contains("range") || text.contains(";");
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_go_body(&loop_body, source, file_path, cfg, loop_node)?;
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

            "select_statement" => {
                // select is Go's concurrent RACE.
                let branch = cfg.add_node(
                    CfgNodeKind::Branch { exhaustive: false },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "select".to_string(),
                );
                cfg.add_edge(current, branch, None);

                let merge = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "select merge".to_string(),
                );

                for j in 0..child.child_count() {
                    if let Some(case) = child.child(j) {
                        if case.kind() == "communication_case" || case.kind() == "default_case" {
                            let case_end =
                                extract_go_body(&case, source, file_path, cfg, branch)?;
                            if let Some(ce) = case_end {
                                cfg.add_edge(ce, merge, None);
                            }
                        }
                    }
                }

                current = merge;
            }

            "go_statement" => {
                // goroutine launch = FORK.
                let spawn = cfg.add_node(
                    CfgNodeKind::ConcurrentSpawn,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, spawn, None);
                current = spawn;
            }

            "defer_statement" => {
                // defer = resource release at function exit.
                let text = node_text(child, source);
                let kind = if text.contains(".Close()") || text.contains(".close()") {
                    CfgNodeKind::ResourceRelease {
                        resource_kind: ResourceKind::Generic("deferred".to_string()),
                    }
                } else if text.contains(".Unlock()") || text.contains(".RUnlock()") {
                    CfgNodeKind::LockRelease { lock_id: None }
                } else {
                    CfgNodeKind::Statement
                };
                let stmt = cfg.add_node(
                    kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
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

            "short_var_declaration" | "var_declaration" | "assignment_statement" => {
                let node_kind = classify_go_declaration(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "expression_statement" => {
                let node_kind = classify_go_expression(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "comment" | "{" | "}" => {}

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

fn classify_go_declaration(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // File/resource open.
    if text.contains("os.Open") || text.contains("os.Create") || text.contains("os.OpenFile") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::File,
        };
    }
    if text.contains("net.Dial") || text.contains("net.Listen") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Socket,
        };
    }
    if text.contains("sql.Open") || text.contains(".Connect(") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Connection,
        };
    }

    // Channel creation.
    if text.contains("make(chan") {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Channel,
        };
    }

    // Lock acquire.
    if text.contains(".Lock()") || text.contains(".RLock()") {
        return CfgNodeKind::LockAcquire { lock_id: None };
    }

    CfgNodeKind::Statement
}

fn classify_go_expression(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    if text.contains(".Close()") || text.contains(".close()") {
        return CfgNodeKind::ResourceRelease {
            resource_kind: ResourceKind::Generic("resource".to_string()),
        };
    }

    if text.contains(".Lock()") || text.contains(".RLock()") {
        return CfgNodeKind::LockAcquire { lock_id: None };
    }

    if text.contains(".Unlock()") || text.contains(".RUnlock()") {
        return CfgNodeKind::LockRelease { lock_id: None };
    }

    // WaitGroup.Wait = sync join.
    if text.contains(".Wait()") {
        return CfgNodeKind::SyncJoin;
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
        format!("{}...", &first_line[..max])
    } else {
        first_line.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_go_function() {
        let source = r#"
package main

func processData(data []byte) error {
    if len(data) == 0 {
        return fmt.Errorf("empty data")
    }
    f, err := os.Open("input.txt")
    if err != nil {
        return err
    }
    defer f.Close()
    return nil
}
"#;

        let extractor = GoExtractor;
        let cfgs = extractor.extract(source, "test.go").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "processData");
    }

    #[test]
    fn detects_goroutine_spawn() {
        let source = r#"
package main

func startWorkers() {
    go worker()
    go func() {
        process()
    }()
}
"#;

        let extractor = GoExtractor;
        let cfgs = extractor.extract(source, "test.go").unwrap();
        let spawn_count = cfgs[0]
            .nodes
            .iter()
            .filter(|n| matches!(n.kind, CfgNodeKind::ConcurrentSpawn))
            .count();
        assert!(spawn_count >= 1, "should detect goroutine spawns");
    }
}
