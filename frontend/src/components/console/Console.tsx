import React, { useState, useRef, useEffect } from 'react';
import './Console.css';
import { useAuth } from '../../service/AuthContext';
import { API_BASE_URL } from '../../service/api/client';

interface ConsoleLine {
    id: number;
    text: string;
    type: 'input' | 'output' | 'error';
}

const Console: React.FC = () => {
    const { token } = useAuth();
    const [lines, setLines] = useState<ConsoleLine[]>([
        { id: 1, text: 'Connecting to server...', type: 'output' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [currentPath, setCurrentPath] = useState('~');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const lastLineRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!token) {
            console.log("WebSocket: waiting for token...");
            return;
        }
        const wsUrl = `${API_BASE_URL.replace("http://", "ws://")}/api/console`;

        // Sends token via Subprotocol
        const safeToken = btoa(token).replace(/=/g, '');
        const ws = new WebSocket(wsUrl, ["access_token", safeToken]);
        wsRef.current = ws;

        ws.onopen = () => {
            setLines(prev => [...prev, { id: Date.now(), text: 'Connected to bash socket.', type: 'output' }]);
            ws.send('echo "###CWD###$(pwd)"\n');
        };

        ws.onmessage = (event) => {
            const data = event.data;
            if (typeof data === 'string' && data.startsWith('###CWD###')) {
                setCurrentPath(data.replace('###CWD###', '').trim());
            } else {
                setLines(prev => [...prev, { id: Date.now(), text: data, type: 'output' }]);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setLines(prev => [...prev, { id: Date.now(), text: 'Error connecting to socket.', type: 'error' }]);
        };

        ws.onclose = () => {
            setLines(prev => [...prev, { id: Date.now(), text: 'Connection closed.', type: 'error' }]);
        };

        return () => {
            ws.close();
        };
    }, [token]);

    useEffect(() => {
        // Auto-scroll to the bottom whenever a new line is added
        if (lastLineRef.current) {
            lastLineRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lines]);

    //Handles command posting and history navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const command = inputValue.trim();
            addCommand(command);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const nextIndex = historyIndex < 0 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(nextIndex);
                setInputValue(commandHistory[nextIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex >= 0) {
                const nextIndex = historyIndex + 1;
                if (nextIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setInputValue('');
                } else {
                    setHistoryIndex(nextIndex);
                    setInputValue(commandHistory[nextIndex]);
                }
            }
        }
    };

    //Function that calls the console commands
    const addCommand = (command: string) => {
        if (!command) return;

        setCommandHistory((prev) => {
            if (prev[prev.length - 1] === command) return prev;
            return [...prev, command];
        });
        setHistoryIndex(-1);

        const newLineId = Date.now();
        setLines((prev) => [...prev, { id: newLineId, text: `${currentPath}>${command}`, type: 'input' }]);

        // Handle local commands first
        if (command.toLowerCase() === 'clear') {
            setLines([]);
            setInputValue('');
            return;
        }

        // Send to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(command + '\necho "###CWD###$(pwd)"\n');
        } else {
            setLines((prev) => [...prev, { id: newLineId + 1, text: 'Error: WebSocket not connected', type: 'error' }]);
        }

        setInputValue('');
    };

    return (
        <div className="console-container">
            <div className="console-header">
                <span>Terminal</span>
            </div>
            <div className="console-body">
                {lines.map((line) => (
                    <div key={line.id} className={`console-line ${line.type}`}>
                        {line.text}
                    </div>
                ))}
                <div ref={lastLineRef} />
            </div>
            <div className="console-input-area">
                <span className="console-prompt">${currentPath}&gt;</span>
                <input
                    type="text"
                    className="console-input"
                    // uses the string that is inputed in the input field for command input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Console;