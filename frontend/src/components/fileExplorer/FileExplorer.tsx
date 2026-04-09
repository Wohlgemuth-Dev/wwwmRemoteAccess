import React, { useMemo, useRef } from 'react';
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

    // Path Navigation
    const pathNavigation = usePathNavigation(DEFAULT_PATH, FALLBACK_FOLDER);

    const currentPath = pathNavigation.path.currentPath;

    const fileOperations = useFileOperations({
        currentPath,
        setCurrentPath: pathNavigation.path.setCurrentPath,
        closeItemMenu: () => {
            fileSelection.menu.setOpenItemMenuPath(null);
            fileSelection.menu.setOpenItemMenuPosition(null);
        },
    });

    // Folder contents
    const sortedFolderContents = useMemo(() => sortFolderContents(fileOperations.rawItems), [fileOperations.rawItems]);
    const folderContents = useMemo(
        () => sortedFolderContents.map((item) => ({ ...item, fullPath: joinPathSegment(currentPath, item.name) })),
        [sortedFolderContents, currentPath],
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
                dragContext={dragAndDrop.context}
                breadcrumbDragHandlers={dragAndDrop.breadcrumb}
            />
            {fileOperations.error && <div className="file-explorer-error">{fileOperations.error}</div>}
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
