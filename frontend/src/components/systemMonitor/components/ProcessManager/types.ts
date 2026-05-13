export interface ProcessData {
	pid: number;
	name: string;
	ppid: number; // Parent Process ID
	cpu: number; // CPU usage percentage
	memory: number; // Memory usage in MB
	status: 'running' | 'sleeping' | 'stopped' | 'zombie';
	user?: string;
}

export interface ProcessTreeNode extends ProcessData {
	children: ProcessTreeNode[];
	isExpanded?: boolean;
	level: number; // Nesting level (0 for root processes)
}

export type SortColumn = 'name' | 'pid' | 'cpu' | 'memory' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface SortState {
	column: SortColumn;
	order: SortOrder;
}
