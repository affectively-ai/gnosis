import React, { useState } from 'react';
import { render, Text, Box, useApp } from 'ink';
import TextInput from 'ink-text-input';
import {
  BettyCompiler,
  type ASTEdge,
  type Diagnostic,
  type GraphAST
} from './betty/compiler.js';
import { GnosisEngine } from './runtime/engine.js';
import { GnosisRegistry } from './runtime/registry.js';
import {
  buildVisualizationFromExecution,
  createInitialVisualization,
  type ReplVisualizationState,
  type VisualNodeStatus
} from './repl-visualization.js';

type HistoryEntry = {
  type: 'input' | 'output' | 'error';
  text: string;
};

const MAX_HISTORY_ENTRIES = 80;
const MAX_DISPLAYED_HISTORY = 12;
const MAX_SOURCE_LINES = 8;
const STATUS_STYLE: Record<VisualNodeStatus, { glyph: string; color: string }> = {
  pending: { glyph: '[ ]', color: 'gray' },
  active: { glyph: '[*]', color: 'cyan' },
  completed: { glyph: '[x]', color: 'green' },
  cycled: { glyph: '[!]', color: 'red' }
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function formatDiagnostics(diagnostics: Diagnostic[]): string {
  const noteworthy = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error' || diagnostic.severity === 'warning'
  );
  if (noteworthy.length === 0) {
    return '';
  }

  const rendered = noteworthy
    .slice(0, 5)
    .map(
      (diagnostic) =>
        `[${diagnostic.severity.toUpperCase()} L${diagnostic.line}:C${diagnostic.column}] ${diagnostic.message}`
    );
  if (noteworthy.length > rendered.length) {
    rendered.push(`... ${noteworthy.length - rendered.length} more diagnostics`);
  }

  return rendered.join('\n');
}

function formatCompilationMessage(output: string, diagnostics: Diagnostic[]): string {
  const diagnosticSummary = formatDiagnostics(diagnostics);
  if (diagnosticSummary.length === 0) {
    return output;
  }
  return `${output}\n${diagnosticSummary}`;
}

function edgeTouchesWave(edge: ASTEdge, activeWave: Set<string>): boolean {
  return (
    edge.sourceIds.some((nodeId) => activeWave.has(nodeId.trim())) ||
    edge.targetIds.some((nodeId) => activeWave.has(nodeId.trim()))
  );
}

const SourcePanel = ({ sourceLines }: { sourceLines: string[] }) => {
  if (sourceLines.length === 0) {
    return (
      <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
        <Text color="gray">Editor empty. Type GGL lines to build the topology.</Text>
      </Box>
    );
  }

  const startLine = Math.max(0, sourceLines.length - MAX_SOURCE_LINES);
  const visibleLines = sourceLines.slice(startLine);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1} marginY={1}>
      <Text bold color="blue">
        TOPOLOGY SOURCE
      </Text>
      {visibleLines.map((line, index) => {
        const lineNumber = startLine + index + 1;
        return (
          <Box key={`source-${lineNumber}`} flexDirection="row">
            <Text color="gray">{String(lineNumber).padStart(2, '0')} | </Text>
            <Text color="white">{line}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

const GraphCanvas = ({
  ast,
  visualization
}: {
  ast: GraphAST | null;
  visualization: ReplVisualizationState;
}) => {
  if (!ast || ast.edges.length === 0) {
    return (
      <Box borderStyle="round" paddingX={1} marginY={1} borderColor="gray">
        <Text color="gray">No topology defined. Start drawing: (a)-[:FORK]-{'>'}(b|c)</Text>
      </Box>
    );
  }

  const nodeIds = Array.from(ast.nodes.keys());
  const activeWave = new Set(visualization.activeWaveFunction);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1} marginY={1}>
      <Text bold color="cyan">
        GNOSIS VISUAL GRAPH EDITOR
      </Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color="white">
          Nodes
        </Text>
        {nodeIds.map((nodeId) => {
          const style = STATUS_STYLE[visualization.nodeStates[nodeId] ?? 'pending'];
          const label = ast.nodes.get(nodeId)?.labels[0];
          return (
            <Text key={nodeId} color={style.color}>
              {style.glyph} {nodeId}
              {label ? `:${label}` : ''}
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color="white">
          Edges
        </Text>
        {ast.edges.map((edge, index) => {
          const edgeColor = edgeTouchesWave(edge, activeWave) ? 'cyan' : 'gray';
          return (
            <Text key={`edge-${index}`} color={edgeColor}>
              ({edge.sourceIds.join('|')}) -[{edge.type}]-{'>'} ({edge.targetIds.join('|')})
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color="magenta">
          psi(t):{' '}
          {visualization.activeWaveFunction.length > 0
            ? `[${visualization.activeWaveFunction.join(', ')}]`
            : '[collapsed]'}
        </Text>
        {visualization.quantumEvents.length === 0 ? (
          <Text color="gray">No quantum events yet. Run EXECUTE to evolve the graph.</Text>
        ) : (
          visualization.quantumEvents.map((event, index) => (
            <Text key={`event-${index}`} color="yellow">
              {event}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};

const MetricsPanel = ({
  beta1,
  paths,
  activeWaveCount
}: {
  beta1: number;
  paths: number;
  activeWaveCount: number;
}) => (
  <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
    <Box>
      <Text color="white">Betti Number (</Text>
      <Text color="yellow" bold>
        beta1
      </Text>
      <Text color="white">): </Text>
      <Text color="cyan" bold>
        {beta1}
      </Text>
    </Box>
    <Box>
      <Text color="white">Wave Amplitudes: </Text>
      <Text color="magenta" bold>
        {activeWaveCount > 0 ? activeWaveCount : paths}
      </Text>
    </Box>
  </Box>
);

export function startRepl() {
  const betty = new BettyCompiler();
  const registry = new GnosisRegistry();
  const engine = new GnosisEngine(registry);

  // Register basic handlers for REPL testing
  registry.register('Codec', async (payload, props) => {
    const type = props['type'] || 'unknown';
    return `[Codec:${type}] Encoded: ${payload}`;
  });

  const Repl = () => {
    const { exit } = useApp();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [query, setQuery] = useState('');
    const [sourceLines, setSourceLines] = useState<string[]>([]);
    const [ast, setAst] = useState<GraphAST | null>(null);
    const [metrics, setMetrics] = useState({ b1: 0, paths: 1 });
    const [visualization, setVisualization] = useState<ReplVisualizationState>(
      createInitialVisualization(null)
    );

    const appendHistory = (...entries: HistoryEntry[]) => {
      setHistory((previousHistory) =>
        [...previousHistory, ...entries].slice(-MAX_HISTORY_ENTRIES)
      );
    };

    const applyCompiledSource = (nextSourceLines: string[], inputLabel: string) => {
      if (nextSourceLines.length === 0) {
        setSourceLines([]);
        setAst(null);
        setMetrics({ b1: 0, paths: 1 });
        setVisualization(createInitialVisualization(null));
        appendHistory({ type: 'input', text: inputLabel }, { type: 'output', text: '[Editor] Topology cleared.' });
        return;
      }

      try {
        const source = nextSourceLines.join('\n');
        const { ast: compiledAst, output, b1, diagnostics } = betty.parse(source);
        const parsedAst = compiledAst ?? null;

        setSourceLines(nextSourceLines);
        setAst(parsedAst);
        setMetrics({ b1, paths: Math.max(1, b1 + 1) });
        setVisualization(createInitialVisualization(parsedAst));

        appendHistory(
          { type: 'input', text: inputLabel },
          { type: 'output', text: formatCompilationMessage(output, diagnostics) }
        );
      } catch (error: unknown) {
        appendHistory(
          { type: 'input', text: inputLabel },
          { type: 'error', text: `[Compiler Crash] ${formatError(error)}` }
        );
      }
    };

    const handleSubmit = async (submittedQuery: string) => {
      const trimmedQuery = submittedQuery.trim();
      if (trimmedQuery.length === 0) {
        setQuery('');
        return;
      }

      const upperQuery = trimmedQuery.toUpperCase();
      if (upperQuery === 'EXIT') {
        exit();
        return;
      }

      if (upperQuery === 'CLEAR') {
        setHistory([]);
        setSourceLines([]);
        setAst(null);
        setMetrics({ b1: 0, paths: 1 });
        setVisualization(createInitialVisualization(null));
        setQuery('');
        return;
      }

      if (upperQuery === 'SOURCE') {
        const sourceDump =
          sourceLines.length > 0
            ? sourceLines.map((line, index) => `${index + 1}. ${line}`).join('\n')
            : '[Editor] Topology source is empty.';
        appendHistory({ type: 'input', text: 'SOURCE' }, { type: 'output', text: sourceDump });
        setQuery('');
        return;
      }

      if (upperQuery === 'UNDO') {
        if (sourceLines.length === 0) {
          appendHistory(
            { type: 'input', text: 'UNDO' },
            { type: 'error', text: '[Editor] Nothing to undo.' }
          );
        } else {
          const nextSourceLines = sourceLines.slice(0, -1);
          applyCompiledSource(nextSourceLines, `UNDO (${sourceLines[sourceLines.length - 1]})`);
        }
        setQuery('');
        return;
      }

      if (upperQuery === 'EXECUTE') {
        if (!ast || ast.edges.length === 0) {
          appendHistory(
            { type: 'input', text: 'EXECUTE' },
            { type: 'error', text: '[Engine] No topology to execute. Add graph lines first.' }
          );
          setQuery('');
          return;
        }

        try {
          const executionOutput = await engine.execute(ast, 'REPL_INIT');
          const waveState = buildVisualizationFromExecution(ast, executionOutput);
          setVisualization(waveState);
          appendHistory(
            { type: 'input', text: 'EXECUTE' },
            { type: 'output', text: executionOutput }
          );
        } catch (error: unknown) {
          appendHistory(
            { type: 'input', text: 'EXECUTE' },
            { type: 'error', text: `[Engine Crash] ${formatError(error)}` }
          );
        }

        setQuery('');
        return;
      }

      const nextSourceLines = [...sourceLines, submittedQuery];
      applyCompiledSource(nextSourceLines, submittedQuery);
      setQuery('');
    };

    return (
      <Box flexDirection="column" padding={1} minHeight={20}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="magenta">
            Gnosis Visual Graph REPL v1.1.0
          </Text>
          <Text color="gray">Edit topology lines, then EXECUTE to observe wave evolution.</Text>
        </Box>

        <MetricsPanel
          beta1={metrics.b1}
          paths={metrics.paths}
          activeWaveCount={visualization.activeWaveFunction.length}
        />

        <SourcePanel sourceLines={sourceLines} />
        <GraphCanvas ast={ast} visualization={visualization} />

        <Box flexDirection="column" marginTop={1}>
          {history.slice(-MAX_DISPLAYED_HISTORY).map((entry, index) => (
            <Box key={`history-${index}`} flexDirection="row">
              <Text color={entry.type === 'input' ? 'green' : entry.type === 'error' ? 'red' : 'cyan'}>
                {entry.type === 'input' ? '>> ' : '   '}
              </Text>
              <Text color={entry.type === 'error' ? 'red' : 'white'}>{entry.text}</Text>
            </Box>
          ))}
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color="green" bold>
            {'>'}{' '}
          </Text>
          <TextInput value={query} onChange={setQuery} onSubmit={handleSubmit} />
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Commands: EXECUTE | SOURCE | UNDO | CLEAR | EXIT</Text>
        </Box>
      </Box>
    );
  };

  render(<Repl />);
}
