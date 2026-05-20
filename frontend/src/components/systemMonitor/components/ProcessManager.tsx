import React from 'react';
import ProcessTable from './ProcessManager/ProcessTable';
import { useProcessData } from './ProcessManager/useProcessData';

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