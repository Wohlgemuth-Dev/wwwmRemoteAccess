import { useState } from 'react';
import { ProcessTreeNode } from './types';
import { removeProcessByPid } from './utils';

/**
 * Minimal process data hook.
 * Replaces in-file mock data with a stable empty stub so UI uses consistent API.
 */
export const useProcessData = (): [ProcessTreeNode[], (pid: number) => void] => {
	const [processes, setProcesses] = useState<ProcessTreeNode[]>([]);

	const deleteProcess = (pid: number) => {
		setProcesses((prev) => removeProcessByPid(prev, pid));
	};

	return [processes, deleteProcess];
};
