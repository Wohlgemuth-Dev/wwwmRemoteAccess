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
import { DEFAULT_PATH, FALLBACK_FOLDER, MOCK_FOLDER_CONTENTS } from './constants';

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

// Component
const FileExplorer: React.FC = () => {
    const breadcrumbsRef = useRef<HTMLDivElement>(null);

    // Path Navigation
    const pathNavigation = usePathNavigation(DEFAULT_PATH, FALLBACK_FOLDER);

    // Folder contents
    const sortedFolderContents = useMemo(() => sortFolderContents(MOCK_FOLDER_CONTENTS), []);
    const allItemKeys = useMemo(() => sortedFolderContents.map(getItemKey), [sortedFolderContents]);

    // Selection Management
    const fileSelection = useFileSelection(allItemKeys);

    const currentPath = pathNavigation.path.currentPath;

    const fileOperations = useFileOperations({
        currentPath,
        closeItemMenu: () => fileSelection.menu.setOpenItemMenuKey(null),
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
        onDropToPath: (sourceItemKeys, segmentPath) => {
            const sourceItemPaths = fileOperations.buildPathsFromKeys(sourceItemKeys);
            fileOperations.handleMove(sourceItemPaths, segmentPath);
        },
        onDropToFolder: (sourceItemKeys, targetItem) => {
            const sourceItemPaths = fileOperations.buildPathsFromKeys(sourceItemKeys);
            const targetPath = fileOperations.getPathForCurrentFolderChild(targetItem.name);
            fileOperations.handleMove(sourceItemPaths, targetPath);
        },
    });

    useExplorerShortcuts({
        selectedItemKeys: fileSelection.items.selectedItemKeys,
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
                onRefresh={fileOperations.handleRefresh}
                onUpload={fileOperations.handleUpload}
                onDelete={fileOperations.handleDelete}
                onDownload={fileOperations.handleDownload}
                onCopy={fileOperations.handleCopy}
                onPaste={fileOperations.handlePaste}
                dragContext={dragAndDrop.context}
                breadcrumbDragHandlers={dragAndDrop.breadcrumb}
            />
            <FileGrid
                items={sortedFolderContents}
                selectedItemKeys={fileSelection.items.selectedItemKeys}
                openItemMenuKey={fileSelection.menu.openItemMenuKey}
                dragContext={dragAndDrop.context}
                onTileClick={fileSelection.handlers.handleTileSelectionToggle}
                onTileDoubleClick={pathNavigation.navigation.handleFolderOpen}
                onTileContextMenu={fileSelection.handlers.handleItemContextMenu}
                onCheckboxChange={fileSelection.handlers.handleItemCheckboxChange}
                onMenuToggle={fileSelection.handlers.handleItemMenuToggle}
                onMenuAction={fileOperations.handleItemMenuAction}
                onBlankAreaClick={fileSelection.handlers.handleBlankAreaClick}
                onItemDragStart={dragAndDrop.item.handleDragStart}
                onItemDragOver={dragAndDrop.item.handleDragOver}
                onItemDragLeave={dragAndDrop.item.handleDragLeave}
                onItemDrop={dragAndDrop.item.handleDrop}
                onItemDragEnd={dragAndDrop.item.handleDragEnd}
                isItemSelected={fileSelection.isItemSelected}
            />
        </div>
    );
};

export default FileExplorer;
