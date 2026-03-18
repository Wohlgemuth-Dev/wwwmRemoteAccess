import React, { useMemo, useRef } from 'react';
import './FileExplorer.css';
import {
    useDragAndDrop,
    useFileSelection,
    usePathNavigation,
    useScrollHint,
} from './hooks';
import type { ItemMenuAction, FileItem } from './hooks';
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

    // Scroll hint
    const { showScrollHint } = useScrollHint(breadcrumbsRef, pathNavigation.editing.isEditingPath, pathNavigation.path.currentPath);

    // Drag & Drop
    const dragAndDrop = useDragAndDrop({
        getItemKey,
        onDropToPath: (sourceItemKeys, segmentPath) => {
            // TODO: wire move behavior to backend (move items to segmentPath).
            void sourceItemKeys;
            void segmentPath;
        },
        onDropToFolder: (sourceItemKeys, targetItem) => {
            // TODO: wire move behavior to backend (move items to target folder).
            void sourceItemKeys;
            void targetItem;
        },
    });

    // ============ Navigation Handlers ============
    const handleRefresh = () => {
        // TODO: implement refresh logic once backend is wired.
    };

    // ============ File Operation Handlers ============
    const handleDownload = (itemKeys: string[]) => {
        // TODO: wire to backend download endpoint when file selection is implemented.
        void itemKeys;
    };

    const handleUpload = () => {
        // TODO: wire to upload flow when file selection/target directory is implemented.
    };

    const handleDelete = (itemKeys: string[]) => {
        // TODO: implement delete logic once backend is wired.
        void itemKeys;
    };

    const handleRename = (itemKey: string) => {
        // TODO: implement rename logic once backend is wired.
        void itemKey;
    };

    // ============ Item Menu Handlers ============
    const handleItemMenuAction = (action: ItemMenuAction, itemKey: string) => {
        fileSelection.menu.setOpenItemMenuKey(null);

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
            <FileExplorerNavBar
                path={pathNavigation.path}
                editing={pathNavigation.editing}
                navigation={pathNavigation.navigation}
                pathHandlers={pathNavigation.handlers}
                selection={fileSelection.items}
                selectAll={fileSelection.selectAll}
                selectionHandlers={fileSelection.handlers}
                breadcrumbsRef={breadcrumbsRef}
                showScrollHint={showScrollHint}
                onRefresh={handleRefresh}
                onUpload={handleUpload}
                onDelete={handleDelete}
                onDownload={handleDownload}
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
                onMenuAction={handleItemMenuAction}
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
