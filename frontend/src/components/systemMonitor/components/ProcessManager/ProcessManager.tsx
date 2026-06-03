import React from 'react';
import ProcessTable from './ProcessTable';
import { useProcessData } from './useProcessData';

const ProcessManager: React.FC = () => {
    const [processTree, killProcess] = useProcessData();

    return (
        <div className="ProcessManager">
            <div className="ProcessManagerHeader">
                <h1>Process Manager</h1>
            </div>
            <ProcessTable processes={processTree} onKill={killProcess} />
        </div>
    );
};

export default ProcessManager;
