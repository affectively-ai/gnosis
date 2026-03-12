import React, { useEffect, useState } from 'react';
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
const BREATH_INTERVAL_MS = 280;
const STATUS_STYLE: Record<VisualNodeStatus, { glyph: string; color: string }> = {
  pending: { glyph: '[ ]', color: 'gray' },
  active: { glyph: '[*]', color: 'cyan' },
  completed: { glyph: '[x]', color: 'green' },
  cycled: { glyph: '[!]', color: 'red' }
};
const COLOR_SPECTRUM = [
  'red',
  'yellow',
  'green',
  'cyan',
  'blue',
  'magenta',
  'redBright',
  'yellowBright',
  'greenBright',
  'cyanBright',
  'blueBright',
  'magentaBright'
] as const;
const EDGE_TYPE_COLOR_INDEX: Record<string, number> = {
  PROCESS: 2,
  FORK: 5,
  RACE: 0,
  FOLD: 3,
  COLLAPSE: 3,
  SUPERPOSE: 7,
  EVOLVE: 1,
  ENTANGLE: 10,
  OBSERVE: 4,
  MEASURE: 9,
  HALT: 8,
  VENT: 6,
  TUNNEL: 11
};

type SpectrumColor = (typeof COLOR_SPECTRUM)[number];

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

function spectrumColor(index: number, phase: number): SpectrumColor {
  const cursor = (index + Math.floor(phase / 2)) % COLOR_SPECTRUM.length;
  const wrappedCursor = cursor < 0 ? cursor + COLOR_SPECTRUM.length : cursor;
  return COLOR_SPECTRUM[wrappedCursor];
}

function breatheIntensity(phase: number): number {
  return (Math.sin(phase / 8) + 1) / 2;
}

function isDimBreath(phase: number): boolean {
  return breatheIntensity(phase) < 0.45;
}

function edgeColor(edge: ASTEdge, phase: number): SpectrumColor {
  const offset = EDGE_TYPE_COLOR_INDEX[edge.type] ?? 0;
  return spectrumColor(offset, phase);
}

function edgeTouchesWave(edge: ASTEdge, activeWave: Set<string>): boolean {
  return (
    edge.sourceIds.some((nodeId) => activeWave.has(nodeId.trim())) ||
    edge.targetIds.some((nodeId) => activeWave.has(nodeId.trim()))
  );
}

const SpectrumHeading = ({ phase }: { phase: number }) => {
  const title = 'Gnosis Visual Graph REPL v1.2.0';
  const subtitle = 'Gentle full-spectrum breathing with smooth wave evolution.';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold={!isDimBreath(phase)} dimColor={isDimBreath(phase)}>
        {title.split('').map((character, index) => (
          <Text key={`title-${index}`} color={spectrumColor(index, phase)}>
            {character}
          </Text>
        ))}
      </Text>
      <Text dimColor={isDimBreath(phase)}>
        {subtitle.split('').map((character, index) => (
          <Text key={`subtitle-${index}`} color={spectrumColor(index + 3, phase)}>
            {character}
          </Text>
        ))}
      </Text>
    </Box>
  );
};

const SourcePanel = ({
  sourceLines,
  phase
}: {
  sourceLines: string[];
  phase: number;
}) => {
  if (sourceLines.length === 0) {
    return (
      <Box borderStyle="single" borderColor={spectrumColor(2, phase)} paddingX={1} marginY={1}>
        <Text color={spectrumColor(3, phase)} dimColor={isDimBreath(phase)}>
          Editor empty. Type GGL lines to build the topology.
        </Text>
      </Box>
    );
  }

  const startLine = Math.max(0, sourceLines.length - MAX_SOURCE_LINES);
  const visibleLines = sourceLines.slice(startLine);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={spectrumColor(1, phase)}
      paddingX={1}
      marginY={1}
    >
      <Text bold color={spectrumColor(0, phase)} dimColor={isDimBreath(phase)}>
        TOPOLOGY SOURCE
      </Text>
      {visibleLines.map((line, index) => {
        const lineNumber = startLine + index + 1;
        const lineColor = spectrumColor(index + 4, phase);
        return (
          <Box key={`source-${lineNumber}`} flexDirection="row">
            <Text color={spectrumColor(index + 8, phase)}>{String(lineNumber).padStart(2, '0')} | </Text>
            <Text color={lineColor} dimColor={isDimBreath(phase)}>
              {line}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

const GraphCanvas = ({
  ast,
  visualization,
  phase
}: {
  ast: GraphAST | null;
  visualization: ReplVisualizationState;
  phase: number;
}) => {
  if (!ast || ast.edges.length === 0) {
    return (
      <Box borderStyle="round" paddingX={1} marginY={1} borderColor={spectrumColor(6, phase)}>
        <Text color={spectrumColor(7, phase)} dimColor={isDimBreath(phase)}>
          No topology defined. Start drawing: (a)-[:FORK]-{'>'}(b|c)
        </Text>
      </Box>
    );
  }

  const nodeIds = Array.from(ast.nodes.keys());
  const activeWave = new Set(visualization.activeWaveFunction);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={spectrumColor(5, phase)}
      paddingX={1}
      marginY={1}
    >
      <Text bold color={spectrumColor(4, phase)} dimColor={isDimBreath(phase)}>
        GNOSIS VISUAL GRAPH EDITOR
      </Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color={spectrumColor(9, phase)}>
          Nodes
        </Text>
        {nodeIds.map((nodeId, index) => {
          const style = STATUS_STYLE[visualization.nodeStates[nodeId] ?? 'pending'];
          const label = ast.nodes.get(nodeId)?.labels[0];
          return (
            <Box key={nodeId} flexDirection="row">
              <Text color={style.color}>{style.glyph} </Text>
              <Text color={spectrumColor(index, phase)} dimColor={isDimBreath(phase)}>
                {nodeId}
              </Text>
              {label ? (
                <Text color={spectrumColor(index + 2, phase)} dimColor={isDimBreath(phase)}>
                  :{label}
                </Text>
              ) : null}
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold color={spectrumColor(10, phase)}>
          Edges
        </Text>
        {ast.edges.map((edge, index) => {
          const lineColor = edgeColor(edge, phase + index);
          const isWaveEdge = edgeTouchesWave(edge, activeWave);
          return (
            <Text
              key={`edge-${index}`}
              color={lineColor}
              bold={isWaveEdge}
              dimColor={isDimBreath(phase) && !isWaveEdge}
            >
              ({edge.sourceIds.join('|')}) -[{edge.type}]-{'>'} ({edge.targetIds.join('|')})
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color={spectrumColor(11, phase)} bold={!isDimBreath(phase)}>
          psi(t):{' '}
          {visualization.activeWaveFunction.length > 0
            ? `[${visualization.activeWaveFunction.join(', ')}]`
            : '[collapsed]'}
        </Text>
        {visualization.quantumEvents.length === 0 ? (
          <Text color={spectrumColor(8, phase)} dimColor={isDimBreath(phase)}>
            No quantum events yet. Run EXECUTE to evolve the graph.
          </Text>
        ) : (
          visualization.quantumEvents.map((event, index) => (
            <Text
              key={`event-${index}`}
              color={spectrumColor(index + 1, phase)}
              dimColor={isDimBreath(phase)}
            >
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
  activeWaveCount,
  phase
}: {
  beta1: number;
  paths: number;
  activeWaveCount: number;
  phase: number;
}) => (
  <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
    <Box>
      <Text color={spectrumColor(3, phase)}>Betti Number (</Text>
      <Text color={spectrumColor(1, phase)} bold={!isDimBreath(phase)}>
        beta1
      </Text>
      <Text color={spectrumColor(3, phase)}>): </Text>
      <Text color={spectrumColor(4, phase)} bold={!isDimBreath(phase)}>
        {beta1}
      </Text>
    </Box>
    <Box>
      <Text color={spectrumColor(7, phase)}>Wave Amplitudes: </Text>
      <Text color={spectrumColor(9, phase)} bold={!isDimBreath(phase)}>
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
    const [phase, setPhase] = useState(0);
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

    useEffect(() => {
      const timer = setInterval(() => {
        setPhase((previousPhase) => previousPhase + 1);
      }, BREATH_INTERVAL_MS);

      return () => {
        clearInterval(timer);
      };
    }, []);

    const applyCompiledSource = (nextSourceLines: string[], inputLabel: string) => {
      if (nextSourceLines.length === 0) {
        setSourceLines([]);
        setAst(null);
        setMetrics({ b1: 0, paths: 1 });
        setVisualization(createInitialVisualization(null));
        appendHistory(
          { type: 'input', text: inputLabel },
          { type: 'output', text: '[Editor] Topology cleared.' }
        );
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
        <SpectrumHeading phase={phase} />

        <MetricsPanel
          beta1={metrics.b1}
          paths={metrics.paths}
          activeWaveCount={visualization.activeWaveFunction.length}
          phase={phase}
        />

        <SourcePanel sourceLines={sourceLines} phase={phase} />
        <GraphCanvas ast={ast} visualization={visualization} phase={phase} />

        <Box flexDirection="column" marginTop={1}>
          {history.slice(-MAX_DISPLAYED_HISTORY).map((entry, index) => {
            const markerColor =
              entry.type === 'input'
                ? spectrumColor(index + 2, phase)
                : entry.type === 'error'
                  ? 'redBright'
                  : spectrumColor(index + 6, phase);
            const textColor =
              entry.type === 'error' ? 'redBright' : spectrumColor(index + 1, phase);

            return (
              <Box key={`history-${index}`} flexDirection="row">
                <Text color={markerColor} dimColor={isDimBreath(phase) && entry.type !== 'error'}>
                  {entry.type === 'input' ? '>> ' : '   '}
                </Text>
                <Text color={textColor} dimColor={isDimBreath(phase) && entry.type !== 'error'}>
                  {entry.text}
                </Text>
              </Box>
            );
          })}
        </Box>

        <Box flexDirection="row" marginTop={1}>
          <Text color={spectrumColor(0, phase)} bold={!isDimBreath(phase)}>
            {'>'}{' '}
          </Text>
          <TextInput value={query} onChange={setQuery} onSubmit={handleSubmit} />
        </Box>

        <Box marginTop={1} flexDirection="row">
          <Text color={spectrumColor(3, phase)} dimColor={isDimBreath(phase)}>
            Commands:
          </Text>
          <Text color={spectrumColor(0, phase)}> EXECUTE</Text>
          <Text color={spectrumColor(2, phase)}> | SOURCE</Text>
          <Text color={spectrumColor(4, phase)}> | UNDO</Text>
          <Text color={spectrumColor(6, phase)}> | CLEAR</Text>
          <Text color={spectrumColor(8, phase)}> | EXIT</Text>
        </Box>
      </Box>
    );
  };

  render(<Repl />);
}
