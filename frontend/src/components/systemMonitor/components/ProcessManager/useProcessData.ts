import { useEffect, useState } from 'react';
import { systemManagerApi, type ProcessInfo } from '../../../../service/api/systemmanager';
import type { ProcessData, ProcessTreeNode } from './types';
import { buildProcessTree, removeProcessByPid } from './utils';

const PROCESS_POLL_INTERVAL_MS = 5000;

const toProcessData = (process: ProcessInfo): ProcessData => ({
	pid: process.pid,
	ppid: process.ppid,
	name: process.name || `pid:${process.pid}`,
	cpu: Number.isFinite(process.cpuPercent) ? process.cpuPercent : 0,
	memory: Number.isFinite(process.memoryPercent) ? process.memoryPercent : 0,
	status: process.status || 'unknown',
	user: process.username || undefined,
});

const toFlatTree = (processes: ProcessData[]): ProcessTreeNode[] => {
	return processes
		.slice()
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((process) => ({
			...process,
			children: [],
			isExpanded: false,
			level: 0,
		}));
};

/**
 * Loads process data from backend and supports killing a process by pid.
 */
export const useProcessData = (): [ProcessTreeNode[], (pid: number) => Promise<void>] => {
	const [processes, setProcesses] = useState<ProcessTreeNode[]>([]);

	useEffect(() => {
		let isDisposed = false;

		const refresh = async () => {
			try {
				const data = await systemManagerApi.getProcesses();
				if (isDisposed) {
					return;
				}

				const normalized = data.map(toProcessData);
				const tree = buildProcessTree(normalized);

				// Defensive fallback: some environments can report process parent relations
				// that don't produce visible roots; render a flat list instead of an empty table.
				setProcesses(tree.length > 0 || normalized.length === 0 ? tree : toFlatTree(normalized));
			} catch (error) {
				console.error('Failed to load process data:', error);
			}
		};

		void refresh();
		const intervalId = window.setInterval(() => {
			void refresh();
		}, PROCESS_POLL_INTERVAL_MS);

		return () => {
			isDisposed = true;
			window.clearInterval(intervalId);
		};
	}, []);

	const killProcess = async (pid: number) => {
		try {
			await systemManagerApi.killProcess(pid);
			setProcesses((prev) => removeProcessByPid(prev, pid));
		} catch (error) {
			console.error(`Failed to kill process ${pid}:`, error);
		}
	};

	return [processes, killProcess];
};
