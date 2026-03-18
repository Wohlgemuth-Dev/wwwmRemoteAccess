import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FileExplorer.css';

// Types
type PathSegment = {
    label: string;
    fullPath: string;
};

type FileItem = {
    name: string;
    type: 'file' | 'folder';
};

type ItemMenuAction = 'rename' | 'download' | 'delete';

type DropTarget =
    | { type: 'item'; key: string }
    | { type: 'pathSegment'; path: string }
    | null;

// Constants
const DEFAULT_PATH = 'C:\\Users\\Lukas\\Documents';
const FALLBACK_FOLDER = 'Folder';
const FOLDER_CONTENTS: FileItem[] = [
    { name: 'File1.txt', type: 'file' },
    { name: 'File2.txt', type: 'file' },
    { name: 'Subfolder', type: 'folder' },
    { name: 'AnotherFile.docx', type: 'file' },
    { name: 'ZippedFolder.zip', type: 'folder' },
    { name: 'Image.png', type: 'file' },
    { name: 'Music.mp3', type: 'file' },
    { name: 'Projects', type: 'folder' },
    { name: 'Notes.txt', type: 'file' },
    { name: 'Archive.rar', type: 'folder' },
    { name: 'Presentation.pptx', type: 'file' },
    { name: 'Videos', type: 'folder' },
    { name: 'Spreadsheet.xlsx', type: 'file' },
    { name: 'OldFiles', type: 'folder' },
];

// Pure helpers
const getItemKey = (item: FileItem) => `${item.type}:${item.name}`;

const toggleItemInList = (items: string[], item: string) => {
    if (items.includes(item)) {
        return items.filter((entry) => entry !== item);
    }

    return [...items, item];
};

const sortFolderContents = (items: FileItem[]) => {
    return [...items].sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }

        return a.name.localeCompare(b.name, undefined, {
            sensitivity: 'base',
            numeric: true,
        });
    });
};

const buildPathSegments = (path: string): PathSegment[] => {
    const normalizedPath = path.replace(/\/+|\\+/g, '\\');
    const driveMatch = normalizedPath.match(/^[A-Za-z]:/);
    const drive = driveMatch ? driveMatch[0] : '';

    const withoutDrive = drive ? normalizedPath.slice(drive.length).replace(/^\\+/, '') : normalizedPath;
    const folders = withoutDrive.split('\\').filter(Boolean);

    const segments: PathSegment[] = [];

    if (drive) {
        segments.push({ label: drive, fullPath: `${drive}\\` });
    }

    folders.forEach((folder, index) => {
        const leading = drive ? `${drive}\\` : '';
        const fullPath = `${leading}${folders.slice(0, index + 1).join('\\')}`;
        segments.push({ label: folder, fullPath });
    });

    return segments;
};

const normalizePathInput = (value: string, fallbackPath: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return fallbackPath;
    }

    const withBackslashes = trimmed.replace(/\//g, '\\');
    return withBackslashes.replace(/\\{2,}/g, '\\');
};

// Component
const FileExplorer: React.FC = () => {
    // State & refs
    const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
    const [isEditingPath, setIsEditingPath] = useState(false);
    const [pathDraft, setPathDraft] = useState(currentPath);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
    const [openItemMenuKey, setOpenItemMenuKey] = useState<string | null>(null);
    const [draggedItemKeys, setDraggedItemKeys] = useState<string[]>([]);
    const [dropTarget, setDropTarget] = useState<DropTarget>(null);
    const pathInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbsRef = useRef<HTMLDivElement>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    // Derived values
    const sortedFolderContents = useMemo(() => sortFolderContents(FOLDER_CONTENTS), []);
    const allItemKeys = useMemo(() => sortedFolderContents.map(getItemKey), [sortedFolderContents]);
    const selectedItemKeySet = useMemo(() => new Set(selectedItemKeys), [selectedItemKeys]);
    const draggedItemKeySet = useMemo(() => new Set(draggedItemKeys), [draggedItemKeys]);
    const selectedCount = selectedItemKeys.length;
    const totalCount = allItemKeys.length;
    const isSelectAllChecked = totalCount > 0 && selectedCount === totalCount;
    const isSelectAllIndeterminate = selectedCount > 0 && selectedCount < totalCount;
    const pathSegments = useMemo(() => buildPathSegments(currentPath), [currentPath]);
    const canNavigateUp = pathSegments.length > 1;
    const currentFolder = pathSegments[pathSegments.length - 1]?.label ?? FALLBACK_FOLDER;

    // Effects
    useEffect(() => {
        if (isEditingPath && pathInputRef.current) {
            pathInputRef.current.focus();
            pathInputRef.current.select();
        }
    }, [isEditingPath]);

    useEffect(() => {
        if (!isEditingPath) {
            setPathDraft(currentPath);
        }
    }, [currentPath, isEditingPath]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isSelectAllIndeterminate;
        }
    }, [isSelectAllIndeterminate]);

    useEffect(() => {
        const handleSelectAllShortcut = (e: KeyboardEvent) => {
            const isSelectAllShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a';
            if (!isSelectAllShortcut) {
                return;
            }

            const activeElement = document.activeElement as HTMLElement | null;
            const isTypingTarget =
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA' ||
                activeElement?.isContentEditable;

            if (isTypingTarget) {
                return;
            }

            e.preventDefault();
            setSelectedItemKeys(allItemKeys);
        };

        window.addEventListener('keydown', handleSelectAllShortcut);
        return () => {
            window.removeEventListener('keydown', handleSelectAllShortcut);
        };
    }, [allItemKeys]);

    useEffect(() => {
        const updateScrollHint = () => {
            if (!breadcrumbsRef.current || isEditingPath) {
                setShowScrollHint(false);
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth } = breadcrumbsRef.current;
            const canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
            setShowScrollHint(canScrollRight);
        };

        updateScrollHint();

        const breadcrumbs = breadcrumbsRef.current;
        if (breadcrumbs) {
            breadcrumbs.addEventListener('scroll', updateScrollHint);
        }

        window.addEventListener('resize', updateScrollHint);

        return () => {
            if (breadcrumbs) {
                breadcrumbs.removeEventListener('scroll', updateScrollHint);
            }
            window.removeEventListener('resize', updateScrollHint);
        };
    }, [currentPath, isEditingPath]);

    // Path handling
    const commitPathEdit = () => {
        setCurrentPath(normalizePathInput(pathDraft, currentPath));
        setIsEditingPath(false);
    };

    const cancelPathEdit = () => {
        setPathDraft(currentPath);
        setIsEditingPath(false);
    };

    // Toolbar actions
    const navigateUp = () => {
        if (!canNavigateUp) {
            return;
        }

        const parentPath = pathSegments[pathSegments.length - 2]?.fullPath;
        if (parentPath) {
            setCurrentPath(parentPath);
        }
    };

    const handleFolderOpen = (item: FileItem) => {
        if (item.type !== 'folder') {
            return;
        }

        setCurrentPath((prevPath) => {
            const sanitizedBase = prevPath.replace(/[\\/]+$/, '');
            const separator = sanitizedBase.includes('\\') ? '\\' : '/';
            return `${sanitizedBase}${separator}${item.name}`;
        });
    };

    const handleDownload = (itemsToDownload: string[]) => {
        // TODO: wire to backend download endpoint when file selection is implemented.
        void itemsToDownload;
    };

    const handleUpload = () => {
        // TODO: wire to upload flow when file selection/target directory is implemented.
    };

    const handleRefresh = () => {
        // TODO: implement refresh logic once backend is wired.
    };

    const handleRename = (itemKey: string) => {
        // TODO: implement rename logic once backend is wired.
        void itemKey;
    };

    const handleDelete = (itemKeys: string[]) => {
        // TODO: implement delete logic once backend is wired.
        void itemKeys;
    };


    // Input and breadcrumb interactions
    const handlePathInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            commitPathEdit();
        }

        if (e.key === 'Escape') {
            cancelPathEdit();
        }
    };

    const handlePathSegmentClick = (segmentPath: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setCurrentPath(segmentPath);
    };

    // Generic drop target handlers
    const handleDropTargetDragOver = (target: DropTarget) => (e: React.DragEvent<any>) => {
        if (draggedItemKeys.length === 0 || !target) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(target);
    };

    const handleDropTargetDragLeave = () => (e: React.DragEvent<any>) => {
        e.stopPropagation();
        setDropTarget(null);
    };

    const handleDropTargetDrop = (target: DropTarget) => (e: React.DragEvent<any>) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);

        if (!target || draggedItemKeys.length === 0) {
            return;
        }

        if (target.type === 'item') {
            const targetItemKey = target.key;
            const targetIsInSelection = draggedItemKeys.includes(targetItemKey);
            if (targetIsInSelection) {
                return;
            }
            // TODO: wire move behavior to backend API for one or more items (e.g. move into folder).
        } else if (target.type === 'pathSegment') {
            const targetPath = target.path;
            const targetIsCurrentPath = targetPath === currentPath;
            if (targetIsCurrentPath) {
                return;
            }
            // TODO: wire move behavior to backend API - move draggedItemKeys to targetPath.
        }

        setDraggedItemKeys([]);
    };

    // Selection handling
    const handleSelectAllChange = (checked: boolean) => {
        setSelectedItemKeys(checked ? allItemKeys : []);
    };

    const updateItemSelection = (itemKey: string, shouldSelect: boolean) => {
        setSelectedItemKeys((prev) => {
            if (shouldSelect) {
                if (prev.includes(itemKey)) {
                    return prev;
                }

                return [...prev, itemKey];
            }

            return prev.filter((key) => key !== itemKey);
        });
    };

    const handleItemCheckboxChange = (itemKey: string, checked: boolean) => {
        updateItemSelection(itemKey, checked);
    };

    const handleTileSelectionToggle = (itemKey: string) => {
        setOpenItemMenuKey(null);
        setSelectedItemKeys((prev) => toggleItemInList(prev, itemKey));
    };

    const clearSelection = () => {
        if (selectedItemKeys.length === 0) {
            return;
        }

        setSelectedItemKeys([]);
    };

    const handleBlankAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setOpenItemMenuKey(null);
            clearSelection();
        }
    };

    const handleItemMenuToggle = (itemKey: string) => {
        setOpenItemMenuKey((prev) => (prev === itemKey ? null : itemKey));
    };

    const handleItemContextMenu = (itemKey: string) => (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenItemMenuKey(itemKey);
    };

    const handleItemMenuAction = (action: ItemMenuAction, itemKey: string) => {
        setOpenItemMenuKey(null);

        switch (action) {
            case 'rename':
                handleRename(itemKey);
                break;
            case 'download':
                handleDownload([itemKey]);
                break;
            case 'delete':
                handleDelete([itemKey]);
                break;
            default:
                break;
        }
    };

    // Drag and drop interactions
    const handleItemDragStart = (itemKey: string) => (e: React.DragEvent<HTMLDivElement>) => {
        const itemKeysToDrag = selectedItemKeySet.has(itemKey) ? selectedItemKeys : [itemKey];

        setOpenItemMenuKey(null);
        setSelectedItemKeys(itemKeysToDrag);
        setDraggedItemKeys(itemKeysToDrag);

        e.dataTransfer.effectAllowed = 'move';
    };

    const handleItemDragOver = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder' || draggedItemKeys.length === 0) {
            return;
        }

        const itemKey = getItemKey(targetItem);
        handleDropTargetDragOver({ type: 'item', key: itemKey })(e);
    };

    const handleItemDragLeave = (itemKey: string) => (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (dropTarget?.type === 'item' && dropTarget?.key === itemKey) {
            setDropTarget(null);
        }
    };

    const handleItemDrop = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder') {
            return;
        }

        const itemKey = getItemKey(targetItem);
        handleDropTargetDrop({ type: 'item', key: itemKey })(e);
    };

    const handleItemDragEnd = () => {
        setDraggedItemKeys([]);
        setDropTarget(null);
    };

    const isItemSelected = (itemKey: string) => selectedItemKeySet.has(itemKey);

    // Render
    return (
        <div className="file-explorer">
            <div className="file-explorer-navbar">
                <button className="nav-button" onClick={navigateUp} disabled={!canNavigateUp}>↑</button>
                <button className="nav-button" onClick={handleRefresh}>⟲</button>
                <div className="current-path" onClick={() => setIsEditingPath(true)}>
                    {isEditingPath ? (
                        <input
                            ref={pathInputRef}
                            className="path-input"
                            value={pathDraft}
                            onChange={(e) => setPathDraft(e.target.value)}
                            onBlur={commitPathEdit}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={handlePathInputKeyDown}
                        />
                    ) : (
                        <div ref={breadcrumbsRef} className="path-breadcrumbs">
                            {pathSegments.map((segment, index) => (
                                <React.Fragment key={segment.fullPath}>
                                    {index > 0 && (
                                        <span className="path-separator">
                                            <span className="path-chevron">&gt;</span>
                                        </span>
                                    )}
                                    <button
                                        className={`path-segment${
                                            dropTarget?.type === 'pathSegment' && dropTarget?.path === segment.fullPath
                                                ? ' is-drop-target'
                                                : ''
                                        }`}
                                        onClick={handlePathSegmentClick(segment.fullPath)}
                                        onDragOver={handleDropTargetDragOver({ type: 'pathSegment', path: segment.fullPath })}
                                        onDragLeave={handleDropTargetDragLeave()}
                                        onDrop={handleDropTargetDrop({ type: 'pathSegment', path: segment.fullPath })}
                                    >
                                        {segment.label}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {!isEditingPath && showScrollHint && (
                        <span className="path-scroll-hint">
                            <span className="path-chevron">&gt;</span>
                        </span>
                    )}
                </div>
                <input className="search-input" type="text" placeholder={`Search ${currentFolder}`} />
                <label className={`nav-checkbox-button${isSelectAllChecked ? ' is-checked' : ''}`}>
                    <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        className="checkbox-control nav-checkbox"
                        checked={isSelectAllChecked}
                        onChange={(e) => handleSelectAllChange(e.target.checked)}
                    />
                    <span className="nav-checkbox-label">Select All</span>
                </label>

                <button type="button" className="nav-delete-button" onClick={() => handleDelete(selectedItemKeys)} disabled={selectedItemKeys.length === 0}>
                    <span className="nav-delete-icon">🗑</span>
                    <span className="nav-delete-label">Delete</span>
                </button>

                <button type="button" className="nav-download-button" onClick={() => handleDownload(selectedItemKeys)} disabled={selectedItemKeys.length === 0}>
                    <span className="nav-download-icon">⇩</span>
                    <span className="nav-download-label">Download</span>
                </button>

                <button type="button" className="nav-upload-button" onClick={handleUpload}>
                    <span className="nav-upload-icon">⇧</span>
                    <span className="nav-upload-label">Upload</span>
                </button>
            </div>
            <div className="file-explorer-content" onClick={handleBlankAreaClick}>
                <div className="file-list" onClick={handleBlankAreaClick}>
                    {sortedFolderContents.map((item) => {
                        const itemKey = getItemKey(item);
                        const selected = isItemSelected(itemKey);
                        const isItemMenuOpen = openItemMenuKey === itemKey;
                        const isItemDropTarget =
                            item.type === 'folder' &&
                            dropTarget?.type === 'item' &&
                            dropTarget?.key === itemKey;
                        const isItemDragging = draggedItemKeySet.has(itemKey);

                        return (
                            <div
                                key={itemKey}
                                className={`file-item ${item.type}${selected ? ' is-selected' : ''}${isItemDragging ? ' is-dragging' : ''}${isItemDropTarget ? ' is-drop-target' : ''}`}
                                onClick={() => handleTileSelectionToggle(itemKey)}
                                onDoubleClick={() => handleFolderOpen(item)}
                                onContextMenu={handleItemContextMenu(itemKey)}
                                draggable
                                onDragStart={handleItemDragStart(itemKey)}
                                onDragOver={handleItemDragOver(item)}
                                onDragLeave={handleItemDragLeave(itemKey)}
                                onDrop={handleItemDrop(item)}
                                onDragEnd={handleItemDragEnd}
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox-control file-item-checkbox"
                                    checked={selected}
                                    onChange={(e) => handleItemCheckboxChange(itemKey, e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    type="button"
                                    className="file-item-menu-trigger"
                                    aria-label={`Open actions for ${item.name}`}
                                    aria-expanded={isItemMenuOpen}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleItemMenuToggle(itemKey);
                                    }}
                                >
                                    ⋮
                                </button>
                                {isItemMenuOpen && (
                                    <div
                                        className="file-item-menu"
                                        role="menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className="file-item-menu-item"
                                            onClick={() => handleItemMenuAction('rename', itemKey)}
                                        >
                                            Rename
                                        </button>
                                        <button
                                            type="button"
                                            className="file-item-menu-item"
                                            onClick={() => handleItemMenuAction('download', itemKey)}
                                        >
                                            Download
                                        </button>
                                        <button
                                            type="button"
                                            className="file-item-menu-item"
                                            onClick={() => handleItemMenuAction('delete', itemKey)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                                <span className="file-icon">{item.type === 'folder' ? '📁' : '📄'}</span>
                                <span className="file-name">{item.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;