import React from 'react';
import type { DragContext, FileItem as FileItemType, ItemMenuAction } from '../hooks';
import { FileItem } from './FileItem';

const getItemKey = (item: FileItemType) => `${item.type}:${item.name}`;

interface FileGridProps {
    items: FileItemType[];
    selectedItemKeys: string[];
    openItemMenuKey: string | null;
    dragContext: DragContext;
    onTileClick: (itemKey: string) => void;
    onTileDoubleClick: (item: FileItemType) => void;
    onTileContextMenu: (itemKey: string) => (e: React.MouseEvent<HTMLDivElement>) => void;
    onCheckboxChange: (itemKey: string, checked: boolean) => void;
    onMenuToggle: (itemKey: string) => void;
    onMenuAction: (action: ItemMenuAction, itemKey: string) => void;
    onBlankAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onItemDragStart: (itemKey: string, selectedKeys: string[]) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragOver: (item: FileItemType) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragLeave: (itemKey: string) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDrop: (item: FileItemType) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragEnd: () => void;
    isItemSelected: (itemKey: string) => boolean;
}

export const FileGrid: React.FC<FileGridProps> = ({
    items,
    selectedItemKeys,
    openItemMenuKey,
    dragContext,
    onTileClick,
    onTileDoubleClick,
    onTileContextMenu,
    onCheckboxChange,
    onMenuToggle,
    onMenuAction,
    onBlankAreaClick,
    onItemDragStart,
    onItemDragOver,
    onItemDragLeave,
    onItemDrop,
    onItemDragEnd,
    isItemSelected,
}) => {
    return (
        <div className="file-explorer-content" onClick={onBlankAreaClick}>
            <div className="file-list" onClick={onBlankAreaClick}>
                {items.map((item) => {
                    const itemKey = getItemKey(item);
                    const selected = isItemSelected(itemKey);
                    const isItemMenuOpen = openItemMenuKey === itemKey;
                    const isItemDropTarget = item.type === 'folder' && dragContext.dropTargetType === 'item' && dragContext.dropTargetId === itemKey;
                    const isItemDragging = dragContext.draggedItemKeys.includes(itemKey);

                    return (
                        <FileItem
                            key={itemKey}
                            item={item}
                            selected={selected}
                            isMenuOpen={isItemMenuOpen}
                            isDropTarget={isItemDropTarget}
                            isDragging={isItemDragging}
                            onTileClick={() => onTileClick(itemKey)}
                            onTileDoubleClick={() => onTileDoubleClick(item)}
                            onContextMenu={onTileContextMenu(itemKey)}
                            onCheckboxChange={(checked) => onCheckboxChange(itemKey, checked)}
                            onMenuToggle={() => onMenuToggle(itemKey)}
                            onMenuAction={(action) => onMenuAction(action, itemKey)}
                            onDragStart={onItemDragStart(itemKey, selectedItemKeys)}
                            onDragOver={onItemDragOver(item)}
                            onDragLeave={onItemDragLeave(itemKey)}
                            onDrop={onItemDrop(item)}
                            onDragEnd={onItemDragEnd}
                        />
                    );
                })}
            </div>
        </div>
    );
};
