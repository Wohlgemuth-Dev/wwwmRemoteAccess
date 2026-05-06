import React, { useRef, useState } from 'react';
import './SystemMonitor.css';
import { SystemMetricsProvider } from './metrics';
import SystemResources from './components/SystemResources';
import ProcessManager from './components/ProcessManager';

type MonitorPanel = 'resources' | 'processes';

const SystemMonitor: React.FC = () => {
    const [activePanel, setActivePanel] = useState<MonitorPanel>('resources');
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
        const touch = event.changedTouches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (window.innerWidth > 1050 || !touchStartRef.current) {
            touchStartRef.current = null;
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const horizontalSwipeThreshold = 44;

        if (Math.abs(deltaX) >= horizontalSwipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                setActivePanel('processes');
            } else {
                setActivePanel('resources');
            }
        }

        touchStartRef.current = null;
    };

    return (
        <SystemMetricsProvider>
            <div className="SystemMonitor">
                <div className="SystemMonitorMobileNav" role="tablist" aria-label="System monitor sections">
                <button
                    type="button"
                    className={`SystemMonitorMobileNavButton${activePanel === 'resources' ? ' is-active' : ''}`}
                    role="tab"
                    aria-selected={activePanel === 'resources'}
                    onClick={() => setActivePanel('resources')}
                >
                    Resources
                </button>
                <button
                    type="button"
                    className={`SystemMonitorMobileNavButton${activePanel === 'processes' ? ' is-active' : ''}`}
                    role="tab"
                    aria-selected={activePanel === 'processes'}
                    onClick={() => setActivePanel('processes')}
                >
                    Processes
                </button>
            </div>

                <div className="SystemMonitorPanels" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    <div className={`SystemMonitorPanel${activePanel === 'resources' ? ' is-active' : ''}`}>
                        <SystemResources />
                    </div>
                    <div aria-hidden="true" className="SystemMonitorDivider" />
                    <div className={`SystemMonitorPanel${activePanel === 'processes' ? ' is-active' : ''}`}>
                        <ProcessManager />
                    </div>
                </div>
            </div>
        </SystemMetricsProvider>
    );
}

export default SystemMonitor;