import { useEffect, useState, useCallback } from 'react';
import { ProcessData, ProcessTreeNode } from './types';
import { buildProcessTree, removeProcessByPid } from './utils';
import { systemManagerApi } from '../../../../service/api/systemmanager';

/**
 * Hook to provide process data with periodic updates
 */
export const useProcessData = (): [ProcessTreeNode[], (pid: number) => void] => {
	const [processes, setProcesses] = useState<ProcessTreeNode[]>([]);

	const fetchProcesses = useCallback(async () => {
		try {
			const data = await systemManagerApi.getProcesses();
			const mapped: ProcessData[] = data.map(p => ({
				pid: p.pid,
				name: p.name,
				ppid: p.ppid,
				cpu: p.cpuPercent,
				memory: p.memoryPercent,
				status: p.status,
				user: p.username
			}));
			setProcesses(buildProcessTree(mapped));
		} catch (error) {
			console.error("Failed to fetch processes", error);
		}
	}, []);

	useEffect(() => {
		fetchProcesses();
		const intervalId = setInterval(fetchProcesses, 5000);
		return () => clearInterval(intervalId);
	}, [fetchProcesses]);

	const deleteProcess = (pid: number) => {
		setProcesses((prev) => removeProcessByPid(prev, pid));
	};

	return [processes, deleteProcess];
};
