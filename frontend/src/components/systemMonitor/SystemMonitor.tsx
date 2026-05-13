import React, { useEffect, useRef, useState } from 'react';
import './SystemMonitor.css';
import { SystemMetricsProvider } from './metrics';
import SystemResources from './components/SystemResources';
import ProcessManager from './components/ProcessManager';

type MonitorPanel = 'resources' | 'processes';

const RESPONSIVE_BREAKPOINT_DESKTOP = 1050;
const TOUCH_SWIPE_THRESHOLD = 44;

const SystemMonitor: React.FC = () => {
    const [activePanel, setActivePanel] = useState<MonitorPanel>('resources');
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const updateViewport = () => {
            setIsMobileViewport(window.innerWidth <= RESPONSIVE_BREAKPOINT_DESKTOP);
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);

        return () => window.removeEventListener('resize', updateViewport);
    }, []);

    const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
        const touch = event.changedTouches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (window.innerWidth > RESPONSIVE_BREAKPOINT_DESKTOP || !touchStartRef.current) {
            touchStartRef.current = null;
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        if (Math.abs(deltaX) >= TOUCH_SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
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
                    {(!isMobileViewport || activePanel === 'resources') && (
                        <div className={`SystemMonitorPanel${activePanel === 'resources' ? ' is-active' : ''}`}>
                            <SystemResources />
                        </div>
                    )}
                    {!isMobileViewport && <div aria-hidden="true" className="SystemMonitorDivider" />}
                    {(!isMobileViewport || activePanel === 'processes') && (
                        <div className={`SystemMonitorPanel${activePanel === 'processes' ? ' is-active' : ''}`}>
                            <ProcessManager />
                        </div>
                    )}
                </div>
            </div>
        </SystemMetricsProvider>
    );
}

export default SystemMonitor;