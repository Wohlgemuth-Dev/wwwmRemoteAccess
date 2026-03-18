import React from 'react';
import type { DragContext, PathSegment } from '../hooks';

interface PathBarProps {
    pathSegments: PathSegment[];
    currentFolder: string;
    isEditingPath: boolean;
    onSetEditingPath: (editing: boolean) => void;
    pathDraft: string;
    onPathDraftChange: (draft: string) => void;
    onPathInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    pathInputRef: React.RefObject<HTMLInputElement | null>;
    breadcrumbsRef: React.RefObject<HTMLDivElement | null>;
    showScrollHint: boolean;
    canNavigateUp: boolean;
    onNavigateUp: () => void;
    onRefresh: () => void;
    dragContext: DragContext;
    onBreadcrumbDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
    onBreadcrumbDragLeave: (e: React.DragEvent<HTMLButtonElement>) => void;
    onBreadcrumbDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
    handlePathSegmentClick: (path: string) => (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const PathBar: React.FC<PathBarProps> = ({
    pathSegments,
    currentFolder,
    isEditingPath,
    onSetEditingPath,
    pathDraft,
    onPathDraftChange,
    onPathInputKeyDown,
    pathInputRef,
    breadcrumbsRef,
    showScrollHint,
    canNavigateUp,
    onNavigateUp,
    onRefresh,
    dragContext,
    onBreadcrumbDragOver,
    onBreadcrumbDragLeave,
    onBreadcrumbDrop,
    handlePathSegmentClick,
}) => {
    return (
        <>
            <button className="nav-button" onClick={onNavigateUp} disabled={!canNavigateUp} title="Navigate to parent folder">
                ↑
            </button>
            <button className="nav-button" onClick={onRefresh} title="Refresh">
                ⟲
            </button>
            <div className="current-path" onClick={() => onSetEditingPath(true)}>
                {isEditingPath ? (
                    <input
                        ref={pathInputRef}
                        className="path-input"
                        value={pathDraft}
                        onChange={(e) => onPathDraftChange(e.target.value)}
                        onBlur={() => onSetEditingPath(false)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={onPathInputKeyDown}
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
                                        dragContext.dropTargetType === 'breadcrumb' && dragContext.dropTargetId === segment.fullPath
                                            ? ' is-drop-target'
                                            : ''
                                    }`}
                                    data-target-path={segment.fullPath}
                                    onClick={handlePathSegmentClick(segment.fullPath)}
                                    onDragOver={onBreadcrumbDragOver}
                                    onDragLeave={onBreadcrumbDragLeave}
                                    onDrop={onBreadcrumbDrop}
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
        </>
    );
};
