import React from 'react';
import type { DragContext, FileItem as FileItemType, ItemMenuAction } from '../hooks';
import { FileItem } from './FileItem';

const getItemKey = (item: FileItemType) => item.fullPath;

type MenuPosition = {
    x: number;
    y: number;
};

interface FileGridProps {
    items: FileItemType[];
    selectedItemPaths: string[];
    openItemMenuPath: string | null;
    openItemMenuPosition: MenuPosition | null;
    dragContext: DragContext;
    onTileClick: (itemPath: string) => void;
    onTileDoubleClick: (item: FileItemType) => void;
    onTileContextMenu: (itemPath: string) => (e: React.MouseEvent<HTMLDivElement>) => void;
    onCheckboxChange: (itemPath: string, checked: boolean) => void;
    onMenuAction: (action: ItemMenuAction, itemPaths: string[]) => void;
    onBlankAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onItemDragStart: (itemPath: string, selectedPaths: string[]) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragOver: (item: FileItemType) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragLeave: (itemPath: string) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDrop: (item: FileItemType) => (e: React.DragEvent<HTMLDivElement>) => void;
    onItemDragEnd: () => void;
    isItemSelected: (itemPath: string) => boolean;
}

export const FileGrid: React.FC<FileGridProps> = ({
    items,
    selectedItemPaths,
    openItemMenuPath,
    openItemMenuPosition,
    dragContext,
    onTileClick,
    onTileDoubleClick,
    onTileContextMenu,
    onCheckboxChange,
    onMenuAction,
    onBlankAreaClick,
    onItemDragStart,
    onItemDragOver,
    onItemDragLeave,
    onItemDrop,
    onItemDragEnd,
    isItemSelected,
}) => {
    const menuTargetPaths =
        selectedItemPaths.length > 0
            ? selectedItemPaths
            : openItemMenuPath
              ? [openItemMenuPath]
              : [];
    const isRenameDisabled = menuTargetPaths.length !== 1;

    return (
        <div className="file-explorer-content" onClick={onBlankAreaClick}>
            <div className="file-list" onClick={onBlankAreaClick}>
                {items.map((item) => {
                    const itemPath = getItemKey(item);
                    const selected = isItemSelected(itemPath);
                    const isItemDropTarget = item.type === 'folder' && dragContext.dropTargetType === 'item' && dragContext.dropTargetId === itemPath;
                    const isItemDragging = dragContext.draggedItemPaths.includes(itemPath);

                    return (
                        <FileItem
                            key={itemPath}
                            item={item}
                            selected={selected}
                            isDropTarget={isItemDropTarget}
                            isDragging={isItemDragging}
                            onTileClick={() => onTileClick(itemPath)}
                            onTileDoubleClick={() => onTileDoubleClick(item)}
                            onContextMenu={onTileContextMenu(itemPath)}
                            onCheckboxChange={(checked) => onCheckboxChange(itemPath, checked)}
                            onDragStart={onItemDragStart(itemPath, selectedItemPaths)}
                            onDragOver={onItemDragOver(item)}
                            onDragLeave={onItemDragLeave(itemPath)}
                            onDrop={onItemDrop(item)}
                            onDragEnd={onItemDragEnd}
                        />
                    );
                })}
            </div>
            {openItemMenuPath && openItemMenuPosition && (
                <div
                    className="file-item-menu"
                    role="menu"
                    style={{ left: `${openItemMenuPosition.x}px`, top: `${openItemMenuPosition.y}px` }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button
                        type="button"
                        className="file-item-menu-item"
                        disabled={isRenameDisabled}
                        onClick={() => onMenuAction('rename', menuTargetPaths)}
                    >
                        Rename
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('download', menuTargetPaths)}>
                        Download
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('delete', menuTargetPaths)}>
                        Delete
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('copy', menuTargetPaths)}>
                        Copy
                    </button>
                </div>
            )}
        </div>
    );
};
