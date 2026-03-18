import { useState } from 'react';
import type { DragContext, FileItem } from './types';

const parseDraggedItems = (draggedKeys: string[], dataTransfer: DataTransfer): string[] => {
    if (draggedKeys.length > 0) {
        return draggedKeys;
    }
    const data = dataTransfer.getData('text/plain');
    return data.split(',').filter(Boolean);
};

const validateDropTarget = (sourceKeys: string[], targetId: string): boolean => {
    if (sourceKeys.length === 0) return false;
    if (sourceKeys.includes(targetId)) return false;
    return true;
};

type UseDragAndDropOptions = {
    getItemKey: (item: FileItem) => string;
    onDropToPath: (sourceItemKeys: string[], segmentPath: string) => void;
    onDropToFolder: (sourceItemKeys: string[], targetItem: FileItem) => void;
};

export const useDragAndDrop = ({ getItemKey, onDropToPath, onDropToFolder }: UseDragAndDropOptions) => {
    const [dragContext, setDragContext] = useState<DragContext>({
        draggedItemKeys: [],
        dropTargetType: null,
        dropTargetId: null,
    });

    const clearDragContext = () => {
        setDragContext({
            draggedItemKeys: [],
            dropTargetType: null,
            dropTargetId: null,
        });
    };

    const handleBreadcrumbDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        const targetPath = e.currentTarget.dataset.targetPath;
        if (!targetPath || dragContext.draggedItemKeys.length === 0) return;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragContext((prev) => ({
            ...prev,
            dropTargetType: 'breadcrumb',
            dropTargetId: targetPath,
        }));
    };

    const handleBreadcrumbDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
        const targetPath = e.currentTarget.dataset.targetPath;
        e.stopPropagation();
        if (dragContext.dropTargetId === targetPath) {
            setDragContext((prev) => ({
                ...prev,
                dropTargetType: null,
                dropTargetId: null,
            }));
        }
    };

    const handleBreadcrumbDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        const segmentPath = e.currentTarget.dataset.targetPath;
        e.preventDefault();
        e.stopPropagation();

        const sourceItemKeys = parseDraggedItems(dragContext.draggedItemKeys, e.dataTransfer);
        clearDragContext();

        if (sourceItemKeys.length === 0 || !segmentPath) return;
        onDropToPath(sourceItemKeys, segmentPath);
    };

    const handleItemDragStart = (itemKey: string, selectedItemKeys: string[]) => (e: React.DragEvent<HTMLDivElement>) => {
        const itemsToMove = selectedItemKeys.includes(itemKey) ? selectedItemKeys : [itemKey];
        setDragContext({
            draggedItemKeys: itemsToMove,
            dropTargetType: null,
            dropTargetId: null,
        });

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', itemsToMove.join(','));
    };

    const handleItemDragOver = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder' || dragContext.draggedItemKeys.length === 0) return;

        const itemKey = getItemKey(targetItem);
        if (dragContext.draggedItemKeys.includes(itemKey)) return;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragContext((prev) => ({
            ...prev,
            dropTargetType: 'item',
            dropTargetId: itemKey,
        }));
    };

    const handleItemDragLeave = (itemKey: string) => (_e: React.DragEvent<HTMLDivElement>) => {
        if (dragContext.dropTargetId === itemKey) {
            setDragContext((prev) => ({
                ...prev,
                dropTargetType: null,
                dropTargetId: null,
            }));
        }
    };

    const handleItemDrop = (targetItem: FileItem) => (e: React.DragEvent<HTMLDivElement>) => {
        if (targetItem.type !== 'folder') return;

        e.preventDefault();
        e.stopPropagation();

        const sourceItemKeys = parseDraggedItems(dragContext.draggedItemKeys, e.dataTransfer);
        const targetItemKey = getItemKey(targetItem);

        clearDragContext();

        if (!validateDropTarget(sourceItemKeys, targetItemKey)) return;

        onDropToFolder(sourceItemKeys, targetItem);
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
