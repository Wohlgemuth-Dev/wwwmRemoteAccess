import { useState } from 'react';
import Navbar from "../navbar/Navbar";
import Console from "../console/Console";

const Desktop = () => {
    const [activeApp, setActiveApp] = useState<string>('home');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Navbar setActiveApp={setActiveApp} />
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f0f0f0' }}>
                {activeApp === 'home' && (
                    <div style={{ padding: '20px' }}>
                        <h1>Desktop Home</h1>
                        <p>Welcome to wwwmRemoteAccess. Select an app from the navbar.</p>
                    </div>
                )}
                {activeApp === 'console' && <Console />}
                {activeApp === 'file-explorer' && (
                    <div style={{ padding: '20px' }}>
                        <h1>File Explorer</h1>
                        <p>File Explorer content to be populated later.</p>
                    </div>
                )}
                {activeApp === 'system-monitor' && (
                    <div style={{ padding: '20px' }}>
                        <h1>System Monitor</h1>
                        <p>System Monitor content to be populated later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Desktop;
