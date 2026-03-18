import React from 'react';
import type { DragContext, PathSegment } from '../hooks';
import { PathBar } from './PathBar';
import { SelectionBar } from './SelectionBar';

interface FileExplorerNavBarProps {
    path: {
        currentPath: string;
        currentFolder: string;
        pathSegments: PathSegment[];
    };
    editing: {
        isEditingPath: boolean;
        setIsEditingPath: (editing: boolean) => void;
        pathDraft: string;
        setPathDraft: (draft: string) => void;
        pathInputRef: React.RefObject<HTMLInputElement | null>;
    };
    navigation: {
        canNavigateUp: boolean;
        navigateUp: () => void;
        handleFolderOpen: (item: any) => void;
    };
    pathHandlers: {
        handlePathInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        handlePathSegmentClick: (path: string) => (e: React.MouseEvent<HTMLButtonElement>) => void;
    };
    selection: {
        selectedItemKeys: string[];
        selectedCount: number;
        totalCount: number;
    };
    selectAll: {
        isSelectAllChecked: boolean;
        isSelectAllIndeterminate: boolean;
        selectAllCheckboxRef: React.RefObject<HTMLInputElement | null>;
        handleSelectAllChange: (checked: boolean) => void;
    };
    selectionHandlers: {
        handleSelectAllChange: (checked: boolean) => void;
        handleItemCheckboxChange: (itemKey: string, checked: boolean) => void;
        handleTileSelectionToggle: (itemKey: string) => void;
        handleBlankAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
        handleItemMenuToggle: (itemKey: string) => void;
        handleItemContextMenu: (itemKey: string) => (e: React.MouseEvent<HTMLDivElement>) => void;
    };
    breadcrumbsRef: React.RefObject<HTMLDivElement | null>;
    showScrollHint: boolean;
    onRefresh: () => void;
    onUpload: () => void;
    onDelete: (keys: string[]) => void;
    onDownload: (keys: string[]) => void;
    dragContext: DragContext;
    breadcrumbDragHandlers: {
        handleDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
        handleDragLeave: (e: React.DragEvent<HTMLButtonElement>) => void;
        handleDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
    };
}

export const FileExplorerNavBar: React.FC<FileExplorerNavBarProps> = ({
    path,
    editing,
    navigation,
    pathHandlers,
    selection,
    selectAll,
    breadcrumbsRef,
    showScrollHint,
    onRefresh,
    onUpload,
    onDelete,
    onDownload,
    dragContext,
    breadcrumbDragHandlers,
}) => {
    return (
        <div className="file-explorer-navbar">
            <PathBar
                pathSegments={path.pathSegments}
                currentFolder={path.currentFolder}
                isEditingPath={editing.isEditingPath}
                onSetEditingPath={editing.setIsEditingPath}
                pathDraft={editing.pathDraft}
                onPathDraftChange={editing.setPathDraft}
                onPathInputKeyDown={pathHandlers.handlePathInputKeyDown}
                pathInputRef={editing.pathInputRef}
                breadcrumbsRef={breadcrumbsRef}
                showScrollHint={showScrollHint}
                canNavigateUp={navigation.canNavigateUp}
                onNavigateUp={navigation.navigateUp}
                onRefresh={onRefresh}
                dragContext={dragContext}
                onBreadcrumbDragOver={breadcrumbDragHandlers.handleDragOver}
                onBreadcrumbDragLeave={breadcrumbDragHandlers.handleDragLeave}
                onBreadcrumbDrop={breadcrumbDragHandlers.handleDrop}
                handlePathSegmentClick={pathHandlers.handlePathSegmentClick}
            />
            <SelectionBar
                isSelectAllChecked={selectAll.isSelectAllChecked}
                selectAllCheckboxRef={selectAll.selectAllCheckboxRef}
                onSelectAllChange={selectAll.handleSelectAllChange}
                selectedCount={selection.selectedCount}
                selectedItemKeys={selection.selectedItemKeys}
                onDelete={onDelete}
                onDownload={onDownload}
            />
            <button type="button" className="nav-upload-button" onClick={onUpload} title="Upload files">
                <span className="nav-upload-icon">⇧</span>
                <span className="nav-upload-label">Upload</span>
            </button>
        </div>
    );
};
