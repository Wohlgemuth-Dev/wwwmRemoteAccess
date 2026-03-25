import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './FileExplorer.css';
import { useExplorerShortcuts } from './hooks/useExplorerShortcuts';
import { useFileOperations } from './hooks/useFileOperations';
import {
    useDragAndDrop,
    useFileSelection,
    usePathNavigation,
    useScrollHint,
} from './hooks';
import type { FileItem } from './hooks';
import { FileExplorerNavBar, FileGrid } from './components';
import { DEFAULT_PATH, FALLBACK_FOLDER } from './constants';
import { fileExplorerApi } from '../../service/api/fileexplorer';

// Pure helpers
const joinPathSegment = (basePath: string, childName: string) => {
    const trimmed = basePath.replace(/\/+$/, '');
    return `${trimmed}/${childName}`;
};
const getItemKey = (item: FileItem) => item.fullPath;

type SortableFileItem = Pick<FileItem, 'name' | 'type'>;

const sortFolderContents = <T extends SortableFileItem>(items: T[]) => {
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

// Component
const FileExplorer: React.FC = () => {
    const breadcrumbsRef = useRef<HTMLDivElement>(null);
    const [rawItems, setRawItems] = useState<{ name: string; type: 'file' | 'folder' }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Path Navigation
    const pathNavigation = usePathNavigation(DEFAULT_PATH, FALLBACK_FOLDER);

    // Fetch directory contents from backend
    const fetchDirectoryContents = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fileExplorerApi.navigate(path);
            setRawItems(response.items);
            // On initial load (empty path), set path from server response
            if (!path && response.currentPath) {
                pathNavigation.path.setCurrentPath(response.currentPath);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load directory');
            setRawItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDirectoryContents(pathNavigation.path.currentPath);
    }, [pathNavigation.path.currentPath, fetchDirectoryContents]);

    // Folder contents
    const sortedFolderContents = useMemo(() => sortFolderContents(rawItems), [rawItems]);
    const folderContents = useMemo(
        () => sortedFolderContents.map((item) => ({ ...item, fullPath: joinPathSegment(pathNavigation.path.currentPath, item.name) })),
        [sortedFolderContents, pathNavigation.path.currentPath],
    );
    const allItemPaths = useMemo(() => folderContents.map(getItemKey), [folderContents]);

    // Selection Management
    const fileSelection = useFileSelection(allItemPaths);

    const currentPath = pathNavigation.path.currentPath;

    const fileOperations = useFileOperations({
        currentPath,
        closeItemMenu: () => {
            fileSelection.menu.setOpenItemMenuPath(null);
            fileSelection.menu.setOpenItemMenuPosition(null);
        },
    });

    // Scroll hint
    const { showScrollHintLeft, showScrollHintRight } = useScrollHint(
        breadcrumbsRef,
        pathNavigation.editing.isEditingPath,
        pathNavigation.path.currentPath,
    );

    // Drag & Drop
    const dragAndDrop = useDragAndDrop({
        getItemKey,
        onDropToPath: (sourceItemPaths, segmentPath) => {
            fileOperations.handleMove(sourceItemPaths, segmentPath);
        },
        onDropToFolder: (sourceItemPaths, targetItem) => {
            fileOperations.handleMove(sourceItemPaths, targetItem.fullPath);
        },
    });

    useExplorerShortcuts({
        selectedItemPaths: fileSelection.items.selectedItemPaths,
        selectedCount: fileSelection.items.selectedCount,
        onSelectAll: () => fileSelection.selectAll.handleSelectAllChange(true),
        onCopy: fileOperations.handleCopy,
        onPaste: fileOperations.handlePaste,
    });

    // Render
    return (
        <div className="file-explorer">
            <FileExplorerNavBar
                path={pathNavigation.path}
                editing={pathNavigation.editing}
                navigation={pathNavigation.navigation}
                pathHandlers={pathNavigation.handlers}
                selection={fileSelection.items}
                selectAll={fileSelection.selectAll}
                breadcrumbsRef={breadcrumbsRef}
                showScrollHintLeft={showScrollHintLeft}
                showScrollHintRight={showScrollHintRight}
                onRefresh={() => fetchDirectoryContents(currentPath)}
                onUpload={fileOperations.handleUpload}
                onDelete={fileOperations.handleDelete}
                onDownload={fileOperations.handleDownload}
                onCopy={fileOperations.handleCopy}
                onPaste={fileOperations.handlePaste}
                dragContext={dragAndDrop.context}
                breadcrumbDragHandlers={dragAndDrop.breadcrumb}
            />
            {error && <div className="file-explorer-error">{error}</div>}
            {loading ? (
                <div className="file-explorer-loading">Loading...</div>
            ) : (
                <FileGrid
                    items={folderContents}
                    selectedItemPaths={fileSelection.items.selectedItemPaths}
                    openItemMenuPath={fileSelection.menu.openItemMenuPath}
                    openItemMenuPosition={fileSelection.menu.openItemMenuPosition}
                    dragContext={dragAndDrop.context}
                    onTileClick={fileSelection.handlers.handleTileSelectionToggle}
                    onTileDoubleClick={pathNavigation.navigation.handleFolderOpen}
                    onTileContextMenu={fileSelection.handlers.handleItemContextMenu}
                    onCheckboxChange={fileSelection.handlers.handleItemCheckboxChange}
                    onMenuAction={fileOperations.handleItemMenuAction}
                    onBlankAreaClick={fileSelection.handlers.handleBlankAreaClick}
                    onItemDragStart={dragAndDrop.item.handleDragStart}
                    onItemDragOver={dragAndDrop.item.handleDragOver}
                    onItemDragLeave={dragAndDrop.item.handleDragLeave}
                    onItemDrop={dragAndDrop.item.handleDrop}
                    onItemDragEnd={dragAndDrop.item.handleDragEnd}
                    isItemSelected={fileSelection.isItemSelected}
                />
            )}
        </div>
    );
};

export default FileExplorer;
