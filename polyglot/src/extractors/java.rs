use anyhow::{Context, Result};
use tree_sitter::{Node, Parser};

use crate::cfg::{CfgNodeKind, ControlFlowGraph, ResourceKind};
use crate::extractors::LanguageExtractor;
use crate::source_map::SourceSpan;

pub struct JavaExtractor;

impl LanguageExtractor for JavaExtractor {
    fn language_id(&self) -> &str {
        "java"
    }

    fn file_extensions(&self) -> &[&str] {
        &[".java"]
    }

    fn extract(&self, source: &str, file_path: &str) -> Result<Vec<ControlFlowGraph>> {
        let mut parser = Parser::new();
        let language = tree_sitter_java::LANGUAGE.into();
        parser
            .set_language(&language)
            .context("failed to set Java grammar")?;

        let tree = parser
            .parse(source, None)
            .context("failed to parse Java source")?;

        let root = tree.root_node();
        let mut cfgs = Vec::new();

        extract_java_methods(&root, source, file_path, &mut cfgs)?;

        Ok(cfgs)
    }
}

fn extract_java_methods(
    node: &Node,
    source: &str,
    file_path: &str,
    cfgs: &mut Vec<ControlFlowGraph>,
) -> Result<()> {
    if node.kind() == "method_declaration" || node.kind() == "constructor_declaration" {
        let name = node
            .child_by_field_name("name")
            .map(|n| node_text(n, source))
            .unwrap_or_else(|| "anonymous".to_string());

        let cfg = extract_java_method_cfg(node, source, file_path, &name)?;
        cfgs.push(cfg);
    }

    for i in 0..node.child_count() {
        if let Some(child) = node.child(i) {
            extract_java_methods(&child, source, file_path, cfgs)?;
        }
    }

    Ok(())
}

fn extract_java_method_cfg(
    method_node: &Node,
    source: &str,
    file_path: &str,
    name: &str,
) -> Result<ControlFlowGraph> {
    let mut cfg = ControlFlowGraph::new(
        name.to_string(),
        "java".to_string(),
        file_path.to_string(),
    );

    let entry = cfg.add_node(
        CfgNodeKind::Entry {
            name: name.to_string(),
        },
        SourceSpan::from_tree_sitter(file_path, method_node),
        format!("method {name}"),
    );
    cfg.entry = entry;

    let body = method_node
        .child_by_field_name("body")
        .unwrap_or(*method_node);

    let last = extract_java_body(&body, source, file_path, &mut cfg, entry)?;

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

fn extract_java_body(
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
                        extract_java_body(&consequence, source, file_path, cfg, branch)?;
                    if let Some(te) = then_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                if let Some(alternative) = child.child_by_field_name("alternative") {
                    let else_end =
                        extract_java_body(&alternative, source, file_path, cfg, branch)?;
                    if let Some(ee) = else_end {
                        cfg.add_edge(ee, merge, None);
                    }
                } else {
                    cfg.add_edge(branch, merge, Some("no-else".into()));
                }

                current = merge;
            }

            "switch_expression" => {
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

                if let Some(switch_body) = child.child_by_field_name("body") {
                    for j in 0..switch_body.child_count() {
                        if let Some(case) = switch_body.child(j) {
                            if case.kind() == "switch_block_statement_group"
                                || case.kind() == "switch_rule"
                            {
                                let case_end =
                                    extract_java_body(&case, source, file_path, cfg, branch)?;
                                if let Some(ce) = case_end {
                                    cfg.add_edge(ce, merge, None);
                                }
                            }
                        }
                    }
                }

                current = merge;
            }

            "for_statement" | "enhanced_for_statement" => {
                let bounded = child.kind() == "enhanced_for_statement";
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_java_body(&loop_body, source, file_path, cfg, loop_node)?;
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

            "while_statement" | "do_statement" => {
                let loop_node = cfg.add_node(
                    CfgNodeKind::Loop { bounded: false },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, loop_node, None);

                if let Some(loop_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_java_body(&loop_body, source, file_path, cfg, loop_node)?;
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
                        extract_java_body(&try_body, source, file_path, cfg, try_entry)?;
                    if let Some(te) = try_end {
                        cfg.add_edge(te, merge, None);
                    }
                }

                // Catch clauses.
                for j in 0..child.child_count() {
                    if let Some(handler) = child.child(j) {
                        if handler.kind() == "catch_clause" {
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

                            if let Some(catch_body) = handler.child_by_field_name("body") {
                                let catch_end = extract_java_body(
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

                // Finally.
                if let Some(finalizer) = child.child_by_field_name("finally") {
                    let finally_node = cfg.add_node(
                        CfgNodeKind::FinallyHandler,
                        SourceSpan::from_tree_sitter(file_path, &finalizer),
                        "finally".to_string(),
                    );
                    cfg.add_edge(merge, finally_node, None);

                    let finally_end =
                        extract_java_body(&finalizer, source, file_path, cfg, finally_node)?;
                    current = finally_end.unwrap_or(finally_node);
                } else {
                    current = merge;
                }
            }

            "try_with_resources_statement" => {
                // try-with-resources = acquire + body + implicit release.
                let acquire = cfg.add_node(
                    CfgNodeKind::ResourceAcquire {
                        resource_kind: ResourceKind::Generic("auto_closeable".to_string()),
                    },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, acquire, None);

                let merge = cfg.add_node(
                    CfgNodeKind::Merge,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    "try-with-resources merge".to_string(),
                );

                if let Some(try_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_java_body(&try_body, source, file_path, cfg, acquire)?;
                    if let Some(be) = body_end {
                        let release = cfg.add_node(
                            CfgNodeKind::ResourceRelease {
                                resource_kind: ResourceKind::Generic(
                                    "auto_closeable".to_string(),
                                ),
                            },
                            SourceSpan::from_tree_sitter(file_path, &child),
                            "auto-close".to_string(),
                        );
                        cfg.add_edge(be, release, None);
                        cfg.add_edge(release, merge, None);
                    }
                }

                current = merge;
            }

            "synchronized_statement" => {
                let lock = cfg.add_node(
                    CfgNodeKind::LockAcquire { lock_id: None },
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 40),
                );
                cfg.add_edge(current, lock, None);

                if let Some(sync_body) = child.child_by_field_name("body") {
                    let body_end =
                        extract_java_body(&sync_body, source, file_path, cfg, lock)?;
                    if let Some(be) = body_end {
                        let unlock = cfg.add_node(
                            CfgNodeKind::LockRelease { lock_id: None },
                            SourceSpan::from_tree_sitter(file_path, &child),
                            "sync exit".to_string(),
                        );
                        cfg.add_edge(be, unlock, None);
                        current = unlock;
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

            "throw_statement" => {
                let stmt = cfg.add_node(
                    CfgNodeKind::Return,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                cfg.exits.push(stmt);
                return Ok(Some(stmt));
            }

            "local_variable_declaration" | "expression_statement" => {
                let node_kind = classify_java_statement(&child, source);
                let stmt = cfg.add_node(
                    node_kind,
                    SourceSpan::from_tree_sitter(file_path, &child),
                    node_text_truncated(&child, source, 60),
                );
                cfg.add_edge(current, stmt, None);
                current = stmt;
            }

            "comment" | "line_comment" | "block_comment" | "{" | "}" | ";" => {}

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

fn classify_java_statement(node: &Node, source: &str) -> CfgNodeKind {
    let text = node_text(*node, source);

    // Resource patterns.
    if text.contains("new FileInputStream")
        || text.contains("new FileOutputStream")
        || text.contains("new BufferedReader")
        || text.contains("Files.newInputStream")
    {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::File,
        };
    }
    if text.contains("DriverManager.getConnection")
        || text.contains("DataSource.getConnection")
        || text.contains(".getConnection(")
    {
        return CfgNodeKind::ResourceAcquire {
            resource_kind: ResourceKind::Connection,
        };
    }
    if text.contains(".close()") {
        return CfgNodeKind::ResourceRelease {
            resource_kind: ResourceKind::Generic("resource".to_string()),
        };
    }

    // Thread spawn.
    if text.contains(".start()") || text.contains("new Thread(") || text.contains("executor.submit(") {
        return CfgNodeKind::ConcurrentSpawn;
    }

    // Join.
    if text.contains(".join()") || text.contains(".get()") {
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
    fn extracts_java_method() {
        let source = r#"
public class MyService {
    public void processData(byte[] data) throws Exception {
        if (data == null) {
            throw new IllegalArgumentException("null data");
        }
        try (var stream = new FileInputStream("input.txt")) {
            stream.read(data);
        } catch (IOException e) {
            log.error("failed", e);
        }
    }
}
"#;

        let extractor = JavaExtractor;
        let cfgs = extractor.extract(source, "MyService.java").unwrap();
        assert_eq!(cfgs.len(), 1);
        assert_eq!(cfgs[0].function_name, "processData");
    }

    #[test]
    fn try_with_resources_has_acquire_release() {
        let source = r#"
public class Reader {
    public String read() {
        try (var reader = new BufferedReader(new FileReader("f.txt"))) {
            return reader.readLine();
        }
    }
}
"#;

        let extractor = JavaExtractor;
        let cfgs = extractor.extract(source, "Reader.java").unwrap();
        let has_acquire = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceAcquire { .. }));
        let has_release = cfgs[0]
            .nodes
            .iter()
            .any(|n| matches!(n.kind, CfgNodeKind::ResourceRelease { .. }));
        assert!(has_acquire, "try-with-resources should create acquire");
        assert!(has_release, "try-with-resources should create release");
    }
}
