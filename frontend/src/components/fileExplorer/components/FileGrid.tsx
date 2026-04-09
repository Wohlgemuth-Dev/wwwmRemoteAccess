import React from 'react';
import type { DragContext, FileItem as FileItemType, ItemMenuAction } from '../hooks';
import { FileItem } from './FileItem';

const getItemKey = (item: FileItemType) => item.fullPath;

const getItemNameFromPath = (itemPath: string) => {
    const normalizedPath = itemPath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);
    
    return [`/${parts.slice(0, -1).join('/')}`, parts[parts.length - 1] || itemPath];
};

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
    onCreateItem: (type: 'file' | 'folder', name: string) => void;
    onTileClick: (itemPath: string) => void;
    onTileDoubleClick: (item: FileItemType) => void;
    onTileContextMenu: (itemPath: string) => (e: React.MouseEvent<HTMLDivElement>) => void;
    onCheckboxChange: (itemPath: string, checked: boolean) => void;
    onMenuAction: (action: ItemMenuAction, itemPaths: string[], newName?: string) => void;
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
    onCreateItem,
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
    const [openGridMenuPosition, setOpenGridMenuPosition] = React.useState<MenuPosition | null>(null);

    const menuTargetPaths =
        selectedItemPaths.length > 1
            ? selectedItemPaths
            : openItemMenuPath
              ? [openItemMenuPath]
              : [];
    const isRenameDisabled = menuTargetPaths.length > 1;

    const getMenuPosition = (e: React.MouseEvent<HTMLDivElement>, menuWidth: number, menuHeight: number): MenuPosition => {
        const menuOffset = 6;
        const maxX = Math.max(8, window.innerWidth - menuWidth - 8);
        const maxY = Math.max(8, window.innerHeight - menuHeight - 8);
        return {
            x: Math.min(maxX, e.clientX + menuOffset),
            y: Math.min(maxY, e.clientY + menuOffset),
        };
    };

    const newNamePrompt = (itemPath: string): string | undefined => {
        const pathPlusName = getItemNameFromPath(itemPath);
        const promptValue = window.prompt('Enter new name:', pathPlusName[1]);
        const newName = promptValue?.trim() || pathPlusName[1];
        const pathWithNewname = pathPlusName[0] ? `${pathPlusName[0]}/${newName}` : newName;
        return pathWithNewname?.trim() || undefined;
    };
    const confirmDeletePrompt = (itemPaths: string[]): boolean => {
        const itemNames = itemPaths.map(getItemNameFromPath).map(([, name]) => name);
        return window.confirm(`Are you sure you want to delete the following items?\n\n${itemNames.join('\n')}`);
    };

    const handleDeleteClick = () => {
        if (!confirmDeletePrompt(menuTargetPaths)) {
            return;
        }

        onMenuAction('delete', menuTargetPaths);
    };

    const handleGridContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        onBlankAreaClick(e);
        setOpenGridMenuPosition(getMenuPosition(e, 136, 86));
    };

    const closeGridMenu = () => {
        setOpenGridMenuPosition(null);
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        closeGridMenu();
        onBlankAreaClick(e);
    };

    const handleCreateClick = (type: 'file' | 'folder') => {
        const defaultName = type === 'file' ? 'new-file.txt' : 'New Folder';
        const enteredName = window.prompt(type === 'file' ? 'Enter file name:' : 'Enter folder name:', defaultName)?.trim();

        closeGridMenu();
        if (!enteredName) {
            return;
        }

        onCreateItem(type, enteredName);
    };

    React.useEffect(() => {
        if (openItemMenuPath) {
            closeGridMenu();
        }
    }, [openItemMenuPath]);

    return (
        <div className="file-explorer-content" onClick={handleContainerClick} onContextMenu={handleGridContextMenu}>
            <div className="file-list" onClick={handleContainerClick} onContextMenu={handleGridContextMenu}>
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
                        onClick={() => onMenuAction('rename', menuTargetPaths, newNamePrompt(menuTargetPaths[0]))}
                    >
                        Rename
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('download', menuTargetPaths)}>
                        Download
                    </button>
                    <button 
                        type="button" 
                        className="file-item-menu-item"
                        onClick={handleDeleteClick}>
                        Delete
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('copy', menuTargetPaths)}>
                        Copy
                    </button>
                </div>
            )}
            {openGridMenuPosition && (
                <div
                    className="file-item-menu"
                    role="menu"
                    style={{ left: `${openGridMenuPosition.x}px`, top: `${openGridMenuPosition.y}px` }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button type="button" className="file-item-menu-item" onClick={() => handleCreateClick('file')}>
                        Add File
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => handleCreateClick('folder')}>
                        Add Folder
                    </button>
                </div>
            )}
        </div>
    );
};
