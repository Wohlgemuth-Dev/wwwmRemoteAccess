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
    const explorerRootRef = useRef<HTMLDivElement>(null);
    const breadcrumbsRef = useRef<HTMLDivElement>(null);

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [pathError, setPathError] = useState<string | null>(null);
    const [visibleError, setVisibleError] = useState<string | null>(null);

    // For path input validation, we need a ref-based approach due to hook call order
    const validatedChangeRef = useRef<((path: string) => Promise<void>) | undefined>(undefined);

    // Create the path navigation hook with validation callback for path input
    const pathNavigation = usePathNavigation(
        DEFAULT_PATH,
        FALLBACK_FOLDER,
        (newPath) => (validatedChangeRef.current?.(newPath) ?? Promise.resolve())
    );

    const fileOperations = useFileOperations({
        currentPath: pathNavigation.path.currentPath,
        setCurrentPath: pathNavigation.path.setCurrentPath,
        closeItemMenu: () => {
            fileSelection.menu.setOpenItemMenuPath(null);
            fileSelection.menu.setOpenItemMenuPosition(null);
        },
    });

    // Set up the validation callback for user-typed paths
    validatedChangeRef.current = useCallback(async (newPath: string) => {
        setPathError(null);
        try {
            // Validate the path by attempting to navigate to it
            await fileExplorerApi.navigate(newPath);
            // If validation passes, update the path
            pathNavigation.path.setCurrentPath(newPath);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to navigate to path';
            setPathError(errorMessage);
            throw err;  // Don't navigate if validation fails
        }
    }, [pathNavigation.path.setCurrentPath]);

    // Auto-clear shown errors so the banner does not stick forever.
    useEffect(() => {
        const nextError = pathError || fileOperations.error;
        if (!nextError) {
            setVisibleError(null);
            return;
        }

        setVisibleError(nextError);
        const timeoutId = window.setTimeout(() => {
            setVisibleError(null);
        }, 5000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [pathError, fileOperations.error]);

    // Clear stale path-validation errors when a new API-backed refresh starts.
    useEffect(() => {
        if (fileOperations.loading) {
            setPathError(null);
            setVisibleError(null);
        }
    }, [fileOperations.loading]);

    // Folder contents
    const sortedFolderContents = useMemo(() => sortFolderContents(fileOperations.rawItems), [fileOperations.rawItems]);
    const folderContents = useMemo(
        () => sortedFolderContents
            .filter((item) => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => ({ ...item, fullPath: joinPathSegment(pathNavigation.path.currentPath, item.name) })),
        [sortedFolderContents, pathNavigation.path.currentPath, searchQuery],
    );
    const allItemPaths = useMemo(() => folderContents.map(getItemKey), [folderContents]);

    // Selection Management
    const fileSelection = useFileSelection(allItemPaths);

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
        onExternalFileDrop: fileOperations.handleUploadFiles,
    });

    const explorerShortcuts = useExplorerShortcuts({
        selectedItemPaths: fileSelection.items.selectedItemPaths,
        selectedCount: fileSelection.items.selectedCount,
        onSelectAll: () => fileSelection.selectAll.handleSelectAllChange(true),
        onCopy: fileOperations.handleCopy,
        onPaste: fileOperations.handlePaste,
        onDelete: fileOperations.handleDelete,
    });

    const handleExplorerMouseDownCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('input, textarea, button, [contenteditable="true"]')) {
            return;
        }

        explorerRootRef.current?.focus();
    };

    // Render
    return (
        <div
            ref={explorerRootRef}
            className="file-explorer"
            tabIndex={-1}
            onMouseDownCapture={handleExplorerMouseDownCapture}
            onKeyDownCapture={explorerShortcuts.handleShortcuts}
        >
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
                onRefresh={fileOperations.handleRefresh}
                onUpload={fileOperations.handleUpload}
                onDelete={fileOperations.handleDelete}
                onDownload={fileOperations.handleDownload}
                onCopy={fileOperations.handleCopy}
                onPaste={fileOperations.handlePaste}
                onSearch={setSearchQuery}
                dragContext={dragAndDrop.context}
                breadcrumbDragHandlers={dragAndDrop.breadcrumb}
            />
            {visibleError && <div className="file-explorer-error">{visibleError}</div>}
            {fileOperations.loading ? (
                <div className="file-explorer-loading">Loading...</div>
            ) : (
                <FileGrid
                    items={folderContents}
                    selectedItemPaths={fileSelection.items.selectedItemPaths}
                    openItemMenuPath={fileSelection.menu.openItemMenuPath}
                    openItemMenuPosition={fileSelection.menu.openItemMenuPosition}
                    dragContext={dragAndDrop.context}
                    externalDragHandlers={dragAndDrop.external}
                    onCreateItem={fileOperations.handleCreateItem}
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
