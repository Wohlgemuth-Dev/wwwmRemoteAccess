import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { ProcessTreeNode, SortColumn, SortState } from './types';
import { flattenProcessTree, sortProcessTree, toggleProcessExpansion } from './utils';

const mergeExpansionState = (nextTree: ProcessTreeNode[], currentTree: ProcessTreeNode[]): ProcessTreeNode[] => {
	const currentByPid = new Map<number, ProcessTreeNode>();

	const indexTree = (nodes: ProcessTreeNode[]) => {
		nodes.forEach((node) => {
			currentByPid.set(node.pid, node);
			if (node.children.length > 0) {
				indexTree(node.children);
			}
		});
	};

	indexTree(currentTree);

	const mergeNode = (node: ProcessTreeNode): ProcessTreeNode => {
		const currentNode = currentByPid.get(node.pid);

		return {
			...node,
			isExpanded: currentNode?.isExpanded ?? node.isExpanded,
			children: node.children.map(mergeNode),
		};
	};

	return nextTree.map(mergeNode);
};

interface ProcessTableProps {
	processes: ProcessTreeNode[];
	onDelete?: (pid: number) => void;
}

const ProcessTable: React.FC<ProcessTableProps> = ({ processes: initialProcesses, onDelete }) => {
	const [tree, setTree] = useState(initialProcesses);
	const [sortState, setSortState] = useState<SortState>({ column: 'name', order: 'asc' });
	const [contextMenu, setContextMenu] = useState<null | { x: number; y: number; pid: number }>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setTree((currentTree) => mergeExpansionState(initialProcesses, currentTree));
	}, [initialProcesses]);

	const sortedTree = useMemo(() => {
		return sortProcessTree(tree, sortState);
	}, [tree, sortState]);

	const displayedProcesses = useMemo(() => {
		return flattenProcessTree(sortedTree);
	}, [sortedTree]);

	const handleSort = useCallback((column: SortColumn) => {
		setSortState((prev) => ({
			column,
			order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc',
		}));
	}, []);

	const handleToggleExpand = useCallback((pid: number) => {
		setTree((prevTree) => toggleProcessExpansion(prevTree, pid));
	}, []);

	const handleContextMenu = (e: React.MouseEvent, pid: number) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY, pid });
	};

	useEffect(() => {
		const onDocClick = () => setContextMenu(null);
		const onKey = (ev: KeyboardEvent) => {
			if (ev.key === 'Escape') setContextMenu(null);
		};
		document.addEventListener('click', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	}, []);

	const getSortIndicator = (column: SortColumn) => {
		if (sortState.column !== column) return null;
		return sortState.order === 'asc' ? '↑' : '↓';
	};

	const renderSortHeader = (column: SortColumn, label: string) => (
		<button
			className="ProcessTableHeader"
			onClick={() => handleSort(column)}
			type="button"
			aria-sort={
				sortState.column === column ? (sortState.order === 'asc' ? 'ascending' : 'descending') : 'none'
			}
		>
			<span className="ProcessTableHeaderLabel">{label}</span>
			<span className="ProcessTableHeaderArrow">{getSortIndicator(column)}</span>
		</button>
	);

	const handleDelete = () => {
		if (onDelete && contextMenu) {
			onDelete(contextMenu.pid);
			setContextMenu(null);
		}
	};

	return (
		<div className="ProcessTable" ref={containerRef}>
			<table role="grid">
				<thead>
					<tr role="row">
						<th role="columnheader">{renderSortHeader('name', 'Process Name')}</th>
						<th role="columnheader">{renderSortHeader('pid', 'PID')}</th>
						<th role="columnheader">{renderSortHeader('cpu', 'CPU %')}</th>
						<th role="columnheader">{renderSortHeader('memory', 'Memory (MB)')}</th>
						<th role="columnheader">{renderSortHeader('status', 'Status')}</th>
					</tr>
				</thead>
				<tbody>
					{displayedProcesses.map((process) => (
						<tr
							key={`${process.pid}-${process.level}`}
							className={`ProcessRow level-${process.level}`}
							onContextMenu={(e) => handleContextMenu(e, process.pid)}
						>
							<td className="ProcessNameCell">
								<div className="ProcessNameContent" style={{ marginLeft: `${process.level * 20}px` }}>
									{process.children.length > 0 && (
										<button
											className={`ExpandToggle${process.isExpanded ? ' is-expanded' : ''}`}
											onClick={() => handleToggleExpand(process.pid)}
											type="button"
											aria-label={process.isExpanded ? 'Collapse' : 'Expand'}
											aria-expanded={process.isExpanded}
										>
											▶
										</button>
									)}
									{process.children.length === 0 && <span className="ExpandTogglePlaceholder" />}
									<span className="ProcessName">{process.name}</span>
								</div>
							</td>
							<td className="ProcessPidCell">{process.pid}</td>
							<td className="ProcessCpuCell">{process.cpu.toFixed(1)}%</td>
							<td className="ProcessMemoryCell">{process.memory.toFixed(1)}</td>
							<td className="ProcessStatusCell">
								<span className={`StatusBadge status-${process.status}`}>{process.status}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{contextMenu && (
				<div
					className="file-item-menu"
					style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
					role="menu"
					onClick={(e) => e.stopPropagation()}
					onContextMenu={(e) => e.preventDefault()}
				>
					<button type="button" className="file-item-menu-item" onClick={handleDelete}>
						Delete
					</button>
				</div>
			)}
		</div>
	);
};

export default ProcessTable;
