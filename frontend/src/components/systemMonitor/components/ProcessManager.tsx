import React from 'react';
import ProcessTable from './ProcessManager/ProcessTable';
import { useProcessData } from './ProcessManager/useProcessData';

const ProcessManager: React.FC = () => {
	const [processTree, deleteProcess] = useProcessData();

	return (
		<div className="ProcessManager">
			<div className="ProcessManagerHeader">
				<h1>Process Manager</h1>
			</div>
			<ProcessTable processes={processTree} onDelete={deleteProcess} />
		</div>
	);
};

export default ProcessManager;