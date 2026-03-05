import React, { useState, useRef, useEffect } from 'react';
import './Console.css';

interface ConsoleLine {
    id: number;
    text: string;
    type: 'input' | 'output' | 'error';
}

const Console: React.FC = () => {
    const [lines, setLines] = useState<ConsoleLine[]>([
        { id: 1, text: 'Welcome to the wwwmRemoteAccess Console v1.0.0', type: 'output' },
        { id: 2, text: 'Type "help" for a list of available commands.', type: 'output' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const lastLineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to the bottom whenever a new line is added
        if (lastLineRef.current) {
            lastLineRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lines]);

    //Handles command posting
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const command = inputValue.trim();
            addCommand(command);
        }
    };

    //Function that calls the console commands
    const addCommand = (command: string) => {
        if (!command) return;

        // Add user's command to the console
        const newLineId = Date.now();
        setLines((prev) => [...prev, { id: newLineId, text: `> ${command}`, type: 'input' }]);

        // Simple command handling logic
        let response: string | null = null;
        let responseType: 'output' | 'error' = 'output';

        switch (command.toLowerCase()) {
            case 'help':
                response = 'Available commands: help, clear';
                break;
            case 'clear':
                setLines([]);
                setInputValue('');
                return;
            default:
                response = `Command unknown: ${command}`;
                responseType = 'error';
        }

        if (response) {
            setLines((prev) => [...prev, { id: newLineId + 1, text: response!, type: responseType }]);
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
                <span className="console-prompt">&gt;</span>
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