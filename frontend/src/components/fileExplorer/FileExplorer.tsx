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

// Constants
const DEFAULT_PATH = 'C:\\Users\\Lukas\\Documents';
const FALLBACK_FOLDER = 'Folder';
const FOLDER_CONTENTS: FileItem[] = [
    { name: 'File1.txt', type: 'file' },
    { name: 'File2.txt', type: 'file' },
    { name: 'Subfolder', type: 'folder' },
];

// Pure helpers
const getItemKey = (item: FileItem) => `${item.type}:${item.name}`;

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
    const pathInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbsRef = useRef<HTMLDivElement>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    // Derived values
    const sortedFolderContents = useMemo(() => sortFolderContents(FOLDER_CONTENTS), []);
    const allItemKeys = sortedFolderContents.map(getItemKey);
    const selectedItemKeySet = useMemo(() => new Set(selectedItemKeys), [selectedItemKeys]);
    const selectedCount = selectedItemKeys.length;
    const totalCount = allItemKeys.length;
    const isSelectAllChecked = totalCount > 0 && selectedCount === totalCount;
    const isSelectAllIndeterminate = selectedCount > 0 && selectedCount < totalCount;

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

    const pathSegments = buildPathSegments(currentPath);
    const canNavigateUp = pathSegments.length > 1;
    const currentFolder = pathSegments[pathSegments.length - 1]?.label ?? FALLBACK_FOLDER;

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
        const isSelected = selectedItemKeySet.has(itemKey);
        setOpenItemMenuKey(null);
        updateItemSelection(itemKey, !isSelected);
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

    const handleItemMenuAction = (action: string, itemKey: string) => {
        void action;
        void itemKey;
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
                                        className="path-segment"
                                        onClick={handlePathSegmentClick(segment.fullPath)}
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
                <button type="button" className="nav-download-button" onClick={() => handleDownload(selectedItemKeys)}>
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
                        const isItemSelected = selectedItemKeySet.has(itemKey);
                        const isItemMenuOpen = openItemMenuKey === itemKey;

                        return (
                            <div
                                key={itemKey}
                                className={`file-item ${item.type}${isItemSelected ? ' is-selected' : ''}`}
                                onClick={() => handleTileSelectionToggle(itemKey)}
                                onContextMenu={handleItemContextMenu(itemKey)}
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox-control file-item-checkbox"
                                    checked={isItemSelected}
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