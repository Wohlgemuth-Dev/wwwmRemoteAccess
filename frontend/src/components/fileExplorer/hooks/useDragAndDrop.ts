import { useState } from 'react';
import type { DragContext, FileItem } from './types';

const validateDropTarget = (sourcePaths: string[], targetId: string): boolean => {
    if (sourcePaths.length === 0) return false;
    if (sourcePaths.includes(targetId)) return false;
    return true;
};

type UseDragAndDropOptions = {
    getItemKey: (item: FileItem) => string;
    onDropToPath: (sourceItemPaths: string[], segmentPath: string) => void;
    onDropToFolder: (sourceItemPaths: string[], targetItem: FileItem) => void;
};

export const useDragAndDrop = ({ getItemKey, onDropToPath, onDropToFolder }: UseDragAndDropOptions) => {
    const [dragContext, setDragContext] = useState<DragContext>({
        draggedItemPaths: [],
        dropTargetType: null,
        dropTargetId: null,
    });

    const setDropTarget = (dropTargetType: DragContext['dropTargetType'], dropTargetId: string | null) => {
        setDragContext((prev) => {
            if (prev.dropTargetType === dropTargetType && prev.dropTargetId === dropTargetId) {
                return prev;
            }

            return {
                ...prev,
                dropTargetType,
                dropTargetId,
            };
        });
    };

    const clearDragContext = () => {
        setDragContext((prev) => {
            if (prev.draggedItemPaths.length === 0 && prev.dropTargetType === null && prev.dropTargetId === null) {
                return prev;
            }

            return {
                draggedItemPaths: [],
                dropTargetType: null,
                dropTargetId: null,
            };
        });
    };

    const handleBreadcrumbDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        const targetPath = e.currentTarget.dataset.targetPath;
        if (!targetPath || dragContext.draggedItemPaths.length === 0) return;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget('breadcrumb', targetPath);
    };

    const handleBreadcrumbDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
        const targetPath = e.currentTarget.dataset.targetPath;
        e.stopPropagation();
        if (dragContext.dropTargetId === targetPath) {
            setDropTarget(null, null);
        }
    };

    const handleBreadcrumbDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        const segmentPath = e.currentTarget.dataset.targetPath;
        e.preventDefault();
        e.stopPropagation();

        const sourceItemPaths = dragContext.draggedItemPaths;
        clearDragContext();

        if (sourceItemPaths.length === 0 || !segmentPath) return;
        onDropToPath(sourceItemPaths, segmentPath);
    };

    const handleItemDragStart = (itemPath: string, selectedItemPaths: string[]) => (e: React.DragEvent<HTMLDivElement>) => {
        const itemsToMove = selectedItemPaths.includes(itemPath) ? selectedItemPaths : [itemPath];
        setDragContext({
            draggedItemPaths: itemsToMove,
            dropTargetType: null,
            dropTargetId: null,
        });

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'wwwm-file-explorer-dnd');
    };

    const handleItemDragOver = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder' || dragContext.draggedItemPaths.length === 0) return;

        const itemPath = getItemKey(targetItem);
        if (dragContext.draggedItemPaths.includes(itemPath)) return;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget('item', itemPath);
    };

    const handleItemDragLeave = (itemPath: string) => (_e: React.DragEvent<HTMLDivElement>) => {
        if (dragContext.dropTargetId === itemPath) {
            setDropTarget(null, null);
        }
    };

    const handleItemDrop = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder') return;

        e.preventDefault();
        e.stopPropagation();

        const sourceItemPaths = dragContext.draggedItemPaths;
        const targetItemPath = getItemKey(targetItem);

        clearDragContext();

        if (!validateDropTarget(sourceItemPaths, targetItemPath)) return;

        onDropToFolder(sourceItemPaths, targetItem);
    };

    const handleItemDragEnd = () => {
        clearDragContext();
    };

    return {
        // State
        context: dragContext,
        // Breadcrumb handlers
        breadcrumb: {
            handleDragOver: handleBreadcrumbDragOver,
            handleDragLeave: handleBreadcrumbDragLeave,
            handleDrop: handleBreadcrumbDrop,
        },
        // Item/file handlers
        item: {
            handleDragStart: handleItemDragStart,
            handleDragOver: handleItemDragOver,
            handleDragLeave: handleItemDragLeave,
            handleDrop: handleItemDrop,
            handleDragEnd: handleItemDragEnd,
        },
    };
};
