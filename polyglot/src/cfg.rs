use serde::{Deserialize, Serialize};

use crate::source_map::SourceSpan;

/// Unique identifier for a CFG node.
pub type CfgNodeId = usize;

/// The kind of control-flow a CFG node represents.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "kind")]
pub enum CfgNodeKind {
    /// Function or method entry point.
    Entry { name: String },
    /// Normal statement / expression (sequential).
    Statement,
    /// Branch point (if / match / switch).
    Branch { exhaustive: bool },
    /// Loop header (for / while / loop).
    Loop { bounded: bool },
    /// Try block entry.
    TryEntry,
    /// Catch / except / rescue handler.
    CatchHandler,
    /// Finally / ensure / defer block.
    FinallyHandler,
    /// Resource acquisition (open, lock, connect, spawn).
    ResourceAcquire { resource_kind: ResourceKind },
    /// Resource release (close, unlock, disconnect, join).
    ResourceRelease { resource_kind: ResourceKind },
    /// Concurrent spawn (goroutine, thread, task, spawn).
    ConcurrentSpawn,
    /// Synchronization join (await, join, WaitGroup).
    SyncJoin,
    /// Lock acquire.
    LockAcquire { lock_id: Option<String> },
    /// Lock release.
    LockRelease { lock_id: Option<String> },
    /// Return / exit from function.
    Return,
    /// Unreachable / dead code marker.
    Unreachable,
    /// Merge point where branches rejoin.
    Merge,
}

/// Kinds of resources tracked for leak detection.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum ResourceKind {
    File,
    Socket,
    Connection,
    Lock,
    Thread,
    Channel,
    Memory,
    Generic(String),
}

/// An edge in the control flow graph.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CfgEdge {
    pub from: CfgNodeId,
    pub to: CfgNodeId,
    pub label: Option<String>,
    /// True if this is an exceptional / error flow edge.
    pub exceptional: bool,
}

/// A node in the control flow graph.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CfgNode {
    pub id: CfgNodeId,
    pub kind: CfgNodeKind,
    pub span: SourceSpan,
    /// Human-readable label for this node (e.g. the source text).
    pub label: String,
}

/// A control flow graph extracted from source code.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ControlFlowGraph {
    pub nodes: Vec<CfgNode>,
    pub edges: Vec<CfgEdge>,
    pub entry: CfgNodeId,
    pub exits: Vec<CfgNodeId>,
    pub function_name: String,
    pub language: String,
    pub file_path: String,
}

impl ControlFlowGraph {
    pub fn new(function_name: String, language: String, file_path: String) -> Self {
        Self {
            nodes: Vec::new(),
            edges: Vec::new(),
            entry: 0,
            exits: Vec::new(),
            function_name,
            language,
            file_path,
        }
    }

    pub fn add_node(&mut self, kind: CfgNodeKind, span: SourceSpan, label: String) -> CfgNodeId {
        let id = self.nodes.len();
        self.nodes.push(CfgNode {
            id,
            kind,
            span,
            label,
        });
        id
    }

    pub fn add_edge(&mut self, from: CfgNodeId, to: CfgNodeId, label: Option<String>) {
        self.edges.push(CfgEdge {
            from,
            to,
            label,
            exceptional: false,
        });
    }

    pub fn add_exceptional_edge(
        &mut self,
        from: CfgNodeId,
        to: CfgNodeId,
        label: Option<String>,
    ) {
        self.edges.push(CfgEdge {
            from,
            to,
            label,
            exceptional: true,
        });
    }

    /// Return all successor node ids for a given node.
    pub fn successors(&self, node_id: CfgNodeId) -> Vec<CfgNodeId> {
        self.edges
            .iter()
            .filter(|e| e.from == node_id)
            .map(|e| e.to)
            .collect()
    }

    /// Return all predecessor node ids for a given node.
    pub fn predecessors(&self, node_id: CfgNodeId) -> Vec<CfgNodeId> {
        self.edges
            .iter()
            .filter(|e| e.to == node_id)
            .map(|e| e.from)
            .collect()
    }
}
