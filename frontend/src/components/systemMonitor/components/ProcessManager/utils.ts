import { ProcessData, ProcessTreeNode, SortColumn, SortState } from './types';

/**
 * Build a hierarchical tree of processes based on parent-child relationships
 */
export const buildProcessTree = (processes: ProcessData[]): ProcessTreeNode[] => {
	const processMap = new Map<number, ProcessTreeNode>();
	const roots: ProcessTreeNode[] = [];

	// First pass: create all nodes
	processes.forEach((process) => {
		const node: ProcessTreeNode = {
			...process,
			children: [],
			isExpanded: false,
			level: 0,
		};
		processMap.set(process.pid, node);
	});

	// Second pass: establish parent-child relationships
	processes.forEach((process) => {
		const node = processMap.get(process.pid)!;
		const parent = processMap.get(process.ppid);

		if (parent) {
			parent.children.push(node);
			node.level = parent.level + 1;
		} else {
			// No parent found, treat as root
			roots.push(node);
		}
	});

	// Sort children of each node
	const sortChildren = (node: ProcessTreeNode) => {
		node.children.sort((a, b) => a.name.localeCompare(b.name));
		node.children.forEach(sortChildren);
	};

	roots.forEach(sortChildren);
	roots.sort((a, b) => a.name.localeCompare(b.name));

	return roots;
};

/**
 * Flatten tree while respecting expansion state
 */
export const flattenProcessTree = (tree: ProcessTreeNode[]): ProcessTreeNode[] => {
	const flattened: ProcessTreeNode[] = [];

	const traverse = (nodes: ProcessTreeNode[]) => {
		nodes.forEach((node) => {
			flattened.push(node);
			if (node.isExpanded && node.children.length > 0) {
				traverse(node.children);
			}
		});
	};

	traverse(tree);
	return flattened;
};

/**
 * Sort process tree by specified column
 */
export const sortProcessTree = (
	tree: ProcessTreeNode[],
	sortState: SortState
): ProcessTreeNode[] => {
	const compare = (a: ProcessTreeNode, b: ProcessTreeNode): number => {
		let aVal: any = a[sortState.column];
		let bVal: any = b[sortState.column];

		if (typeof aVal === 'string') {
			const cmp = aVal.localeCompare(bVal);
			return sortState.order === 'asc' ? cmp : -cmp;
		}

		if (typeof aVal === 'number') {
			const cmp = aVal - bVal;
			return sortState.order === 'asc' ? cmp : -cmp;
		}

		return 0;
	};

	const sortNode = (node: ProcessTreeNode): ProcessTreeNode => ({
		...node,
		children: node.children.map(sortNode).sort(compare),
	});

	return tree.map(sortNode).sort(compare);
};

/**
 * Toggle expansion state of a process by pid
 */
export const toggleProcessExpansion = (
	tree: ProcessTreeNode[],
	targetPid: number
): ProcessTreeNode[] => {
	const toggle = (node: ProcessTreeNode): ProcessTreeNode => {
		if (node.pid === targetPid) {
			return { ...node, isExpanded: !node.isExpanded };
		}

		return {
			...node,
			children: node.children.map(toggle),
		};
	};

	return tree.map(toggle);
};

/**
 * Remove a process (and its children) from the tree by pid
 */
export const removeProcessByPid = (
	tree: ProcessTreeNode[],
	targetPid: number
): ProcessTreeNode[] => {
	const filterNode = (node: ProcessTreeNode): ProcessTreeNode | null => {
		if (node.pid === targetPid) return null;
		const children = node.children
			.map(filterNode)
			.filter((c): c is ProcessTreeNode => c !== null);
		return { ...node, children };
	};

	return tree
		.map(filterNode)
		.filter((n): n is ProcessTreeNode => n !== null);
};
