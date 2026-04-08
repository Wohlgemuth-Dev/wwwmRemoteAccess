import { useState } from 'react';
import Navbar from "../navbar/Navbar";
import Console from "../console/Console";
import FileExplorer from '../fileExplorer/FileExplorer';

const Desktop = () => {
    const [activeApp, setActiveApp] = useState<string>('home');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Navbar setActiveApp={setActiveApp} />
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f0f0f0' }}>
                <div style={{ display: activeApp === 'home' ? 'block' : 'none', padding: '20px' }}>
                    <h1>Desktop Home</h1>
                    <p>Welcome to wwwmRemoteAccess. Select an app from the navbar.</p>
                </div>
                <div style={{ display: activeApp === 'console' ? 'block' : 'none', height: '100%' }}>
                    <Console />
                </div>
                <div style={{ display: activeApp === 'file-explorer' ? 'block' : 'none', height: '100%' }}>
                    <FileExplorer />
                </div>
                <div style={{ display: activeApp === 'system-monitor' ? 'block' : 'none', padding: '20px' }}>
                    <h1>System Monitor</h1>
                    <p>System Monitor content to be populated later.</p>
                </div>
            </div>
        </div>
    );
};

export default Desktop;
