import { useEffect, useState } from 'react';
import { ProcessData, ProcessTreeNode } from './types';
import { buildProcessTree, removeProcessByPid } from './utils';

const MOCK_PROCESSES: ProcessData[] = [
	// System processes
	{ pid: 1, ppid: 0, name: 'systemd', cpu: 0.1, memory: 2.5, status: 'running' },
	{ pid: 2, ppid: 1, name: 'kthreadd', cpu: 0.0, memory: 0.1, status: 'sleeping' },
	{ pid: 456, ppid: 1, name: 'sshd', cpu: 0.2, memory: 1.2, status: 'running' },
	{ pid: 457, ppid: 456, name: 'sshd', cpu: 0.3, memory: 2.1, status: 'running' },
	{ pid: 458, ppid: 457, name: 'bash', cpu: 0.1, memory: 1.5, status: 'running' },

	// User shell processes
	{ pid: 1000, ppid: 1, name: 'bash', cpu: 0.2, memory: 3.2, status: 'running' },
	{ pid: 1001, ppid: 1000, name: 'vim', cpu: 0.5, memory: 8.5, status: 'running' },
	{ pid: 1002, ppid: 1000, name: 'node', cpu: 45.2, memory: 125.3, status: 'running' },
	{ pid: 1003, ppid: 1002, name: 'node', cpu: 2.1, memory: 45.2, status: 'running' },
	{ pid: 1004, ppid: 1002, name: 'node', cpu: 1.8, memory: 38.9, status: 'running' },

	// Application processes
	{ pid: 2000, ppid: 1, name: 'docker', cpu: 5.2, memory: 256.3, status: 'running' },
	{ pid: 2001, ppid: 2000, name: 'containerd', cpu: 2.1, memory: 128.5, status: 'running' },
	{ pid: 2002, ppid: 2001, name: 'application', cpu: 8.5, memory: 512.3, status: 'running' },
	{ pid: 2003, ppid: 2002, name: 'worker', cpu: 2.3, memory: 98.5, status: 'running' },
	{ pid: 2004, ppid: 2002, name: 'worker', cpu: 1.9, memory: 87.2, status: 'running' },

	// Utility processes
	{ pid: 3000, ppid: 1, name: 'cron', cpu: 0.0, memory: 0.8, status: 'sleeping' },
	{ pid: 3001, ppid: 1, name: 'logd', cpu: 0.1, memory: 2.1, status: 'sleeping' },
	{ pid: 3002, ppid: 1, name: 'ntpd', cpu: 0.0, memory: 1.5, status: 'sleeping' },
];

/**
 * Hook to provide process data with periodic updates
 */
export const useProcessData = (): [ProcessTreeNode[], (pid: number) => void] => {
	const [processes, setProcesses] = useState<ProcessTreeNode[]>(() => {
		return buildProcessTree(MOCK_PROCESSES);
	});

	useEffect(() => {
		// Simulate process metric updates
		const intervalId = setInterval(() => {
			setProcesses((prevProcesses) => {
				// Deep copy and slightly vary the metrics
				const updated = prevProcesses.map((proc) => ({
					...proc,
					cpu: Math.max(0, proc.cpu + (Math.random() - 0.5) * 2),
					memory: Math.max(0, proc.memory + (Math.random() - 0.5) * 1),
				}));
				return updated;
			});
		}, 2000);

		return () => clearInterval(intervalId);
	}, []);

	const deleteProcess = (pid: number) => {
		setProcesses((prev) => removeProcessByPid(prev, pid));
	};

	return [processes, deleteProcess];
};
