import React from 'react';
import type { DragContext, PathSegment } from '../hooks';
import { PathBar } from './PathBar';
import { SelectionBar } from './SelectionBar';

interface FileExplorerNavBarProps {
    path: {
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
    };
    pathHandlers: {
        handlePathInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        handlePathSegmentClick: (path: string) => (e: React.MouseEvent<HTMLButtonElement>) => void;
    };
    selection: {
        selectedItemPaths: string[];
        selectedCount: number;
    };
    selectAll: {
        isSelectAllChecked: boolean;
        selectAllCheckboxRef: React.RefObject<HTMLInputElement | null>;
        handleSelectAllChange: (checked: boolean) => void;
    };
    breadcrumbsRef: React.RefObject<HTMLDivElement | null>;
    showScrollHintLeft: boolean;
    showScrollHintRight: boolean;
    onRefresh: () => void;
    onUpload: () => void;
    onDelete: (paths: string[]) => void;
    onDownload: (paths: string[]) => void;
    onCopy: (paths: string[]) => void;
    onPaste: () => void;
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
    showScrollHintLeft,
    showScrollHintRight,
    onRefresh,
    onUpload,
    onDelete,
    onDownload,
    onCopy,
    onPaste,
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
                showScrollHintLeft={showScrollHintLeft}
                showScrollHintRight={showScrollHintRight}
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
                selectedItemPaths={selection.selectedItemPaths}
                onDelete={onDelete}
                onDownload={onDownload}
                onCopy={onCopy}
            />
            <button type="button" className="nav-upload-button" onClick={onUpload} title="Upload files">
                <span className="nav-upload-icon">⇧</span>
                <span className="nav-upload-label">Upload</span>
            </button>
            <button type="button" className="nav-paste-button" onClick={onPaste} title="Paste files">
                <span className="nav-paste-icon">⎘</span>
                <span className="nav-paste-label">Paste</span>
            </button>
        </div>
    );
};
