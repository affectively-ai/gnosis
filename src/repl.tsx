import React, { useState } from 'react';
import { render, Text, Box, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { BettyCompiler } from './betty/compiler.js';
import { GnosisEngine } from './runtime/engine.js';
import { GnosisRegistry } from './runtime/registry.js';

const GraphCanvas = ({ ast }: { ast: any }) => {
    if (!ast || !ast.edges || ast.edges.length === 0) {
        return (
            <Box borderStyle="round" paddingX={1} marginY={1} borderColor="gray">
                <Text color="gray">No topology defined. Start drawing: (a)-[:FORK]-{'>'}(b|c)</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1} marginY={1}>
            <Text bold color="cyan">TOPOLOGICAL PREVIEW</Text>
            <Box flexDirection="column" marginTop={1}>
                {ast.edges.map((edge: any, i: number) => (
                    <Box key={i} flexDirection="row">
                        <Text color="green">({edge.sourceIds.join('|')})</Text>
                        <Text color="yellow">  == {edge.type} =={'>'}  </Text>
                        <Text color="magenta">({edge.targetIds.join('|')})</Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const MetricsPanel = ({ beta1, paths }: { beta1: number, paths: number }) => (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
        <Box>
            <Text color="white">Betti Number (</Text>
            <Text color="yellow" bold>beta1</Text>
            <Text color="white">): </Text>
            <Text color="cyan" bold>{beta1}</Text>
        </Box>
        <Box>
            <Text color="white">Wave Amplitudes: </Text>
            <Text color="magenta" bold>{paths}</Text>
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
        const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error', text: string }>>([]);
        const [query, setQuery] = useState('');
        const [ast, setAst] = useState<any>(null);
        const [metrics, setMetrics] = useState({ b1: 0, paths: 1 });

        const handleSubmit = async (query: string) => {
            const trimmedQuery = query.trim();
            if (trimmedQuery.toLowerCase() === 'exit') {
                exit();
                return;
            }

            if (trimmedQuery.toLowerCase() === 'clear') {
                setHistory([]);
                setAst(null);
                setMetrics({ b1: 0, paths: 1 });
                setQuery('');
                return;
            }

            if (trimmedQuery.toUpperCase() === 'EXECUTE') {
                if (ast) {
                    try {
                        const execOutput = await engine.execute(ast, "REPL_INIT");
                        setHistory(prev => [...prev, { type: 'input', text: 'EXECUTE' }, { type: 'output', text: execOutput }]);
                    } catch (err: any) {
                        setHistory(prev => [...prev, { type: 'input', text: 'EXECUTE' }, { type: 'error', text: err.message }]);
                    }
                }
                setQuery('');
                return;
            }

            const { ast: newAst, output, b1 } = betty.parse(query);
            
            if (newAst) {
                setAst({ ...newAst }); 
                setMetrics({ b1, paths: b1 + 1 });
            }

            if (output) {
                setHistory(prev => [...prev, { type: 'input', text: query }, { type: 'output', text: output }]);
            }
            
            setQuery('');
        };

        return (
            <Box flexDirection="column" padding={1} minHeight={20}>
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold color="magenta">Gnosis Visual Graph REPL v1.0.0</Text>
                    <Text color="gray">Drawing quantum topologies via Wallington Rotation.</Text>
                </Box>

                <MetricsPanel beta1={metrics.b1} paths={metrics.paths} />
                
                <GraphCanvas ast={ast} />

                <Box flexDirection="column" marginTop={1}>
                    {history.slice(-10).map((entry, index) => (
                        <Box key={index} flexDirection="row">
                            <Text color={entry.type === 'input' ? 'green' : entry.type === 'error' ? 'red' : 'cyan'}>
                                {entry.type === 'input' ? '>> ' : '   '}
                            </Text>
                            <Text color={entry.type === 'error' ? 'red' : 'white'}>{entry.text}</Text>
                        </Box>
                    ))}
                </Box>

                <Box flexDirection="row" marginTop={1}>
                    <Text color="green" bold>{'>'} </Text>
                    <TextInput 
                        value={query} 
                        onChange={setQuery} 
                        onSubmit={handleSubmit}
                    />
                </Box>
                
                <Box marginTop={1}>
                    <Text color="gray">Commands: EXECUTE | CLEAR | EXIT</Text>
                </Box>
            </Box>
        );
    };

    render(<Repl />);
}
