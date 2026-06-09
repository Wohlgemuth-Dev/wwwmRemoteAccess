import { useState } from 'react';
import Navbar from "../navbar/Navbar";
import Console from "../console/Console";
import FileExplorer from '../fileExplorer/FileExplorer';
import SystemMonitor from '../systemMonitor/SystemMonitor';

const Desktop = () => {
    const [activeApp, setActiveApp] = useState<string>('console');
    const [terminalInitialPath, setTerminalInitialPath] = useState<string | null>(null);

    const handleOpenTerminal = (path: string) => {
        setTerminalInitialPath(path);
        setActiveApp('console');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Navbar activeApp={activeApp} setActiveApp={setActiveApp} />
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f0f0f0' }}>
                <div style={{ display: activeApp === 'console' ? 'block' : 'none', height: '100%' }}>
                    <Console initialPath={terminalInitialPath} onClearInitialPath={() => setTerminalInitialPath(null)} />
                </div>
                <div style={{ display: activeApp === 'file-explorer' ? 'block' : 'none', height: '100%' }}>
                    <FileExplorer onOpenTerminal={handleOpenTerminal} />
                </div>
                <div style={{ display: activeApp === 'system-monitor' ? 'block' : 'none', height: '100%' }}>
                    <SystemMonitor />
                </div>
            </div>
        </div>
    );
};

export default Desktop;
