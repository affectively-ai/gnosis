import React, { useState, useEffect } from 'react';
import { render, Text, Box, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { BettyCompiler } from './betty/compiler.js';

export function startRepl() {
    // Global Betty instance for the REPL session
    const betty = new BettyCompiler();

    const Repl = () => {
        const { exit } = useApp();
        const [history, setHistory] = useState<Array<{ type: 'input' | 'output' | 'error', text: string }>>([]);
        const [query, setQuery] = useState('');
        const [suggestion, setSuggestion] = useState('');

        useEffect(() => {
            if (query.endsWith('-[')) {
                setSuggestion(':FORK]->() | :RACE]->() | :FOLD { strategy: \'quorum\' }]->() | :VENT]->()');
            } else if (query.endsWith('[:FO')) {
                setSuggestion('RK]->');
            } else if (query.endsWith('[:RA')) {
                setSuggestion('CE]->');
            } else if (query.endsWith('[:FOL')) {
                setSuggestion('D]->');
            } else if (query.endsWith('[:VE')) {
                setSuggestion('NT]->');
            } else {
                setSuggestion('');
            }
        }, [query]);

        const handleSubmit = async (query: string) => {
            if (query.trim().toLowerCase() === 'exit') {
                exit();
                return;
            }

            const newHistory = [...history, { type: 'input' as const, text: query }];
            setHistory(newHistory);
            setQuery('');
            
            try {
                if (query.trim().toUpperCase() === 'EXECUTE') {
                    const execOutput = await betty.execute();
                    setHistory(prev => [...prev, { type: 'output' as const, text: execOutput }]);
                    return;
                }

                const { output } = betty.parse(query);
                if (output) {
                    setHistory(prev => [...prev, { type: 'output' as const, text: output }]);
                }
            } catch (err: any) {
                setHistory(prev => [...prev, { type: 'error' as const, text: err.message }]);
            }
        };

        return (
            <Box flexDirection="column" padding={1}>
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold color="magenta">Gnosis REPL v0.6.0 — Powered by Betty</Text>
                    <Text color="gray">Type graph topologies, then type 'EXECUTE' to run them in aeon-pipelines.</Text>
                    <Text color="gray">Type 'exit' to quit.</Text>
                </Box>

                {history.map((entry, index) => (
                    <Box key={index} flexDirection="row">
                        <Text color={entry.type === 'input' ? 'green' : entry.type === 'error' ? 'red' : 'cyan'}>
                            {entry.type === 'input' ? '❯ ' : entry.type === 'error' ? '✖ ' : '  '}
                        </Text>
                        <Text>{entry.text}</Text>
                    </Box>
                ))}

                <Box flexDirection="row">
                    <Text color="green">❯ </Text>
                    <TextInput 
                        value={query} 
                        onChange={setQuery} 
                        onSubmit={handleSubmit}
                    />
                    {suggestion && <Text color="gray">{suggestion}</Text>}
                </Box>
            </Box>
        );
    };

    render(<Repl />);
}
