import React from 'react';
import type { FileItem as FileItemType, ItemMenuAction } from '../hooks';

interface FileItemProps {
    item: FileItemType;
    selected: boolean;
    isMenuOpen: boolean;
    isDropTarget: boolean;
    isDragging: boolean;
    onTileClick: () => void;
    onTileDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    onCheckboxChange: (checked: boolean) => void;
    onMenuToggle: () => void;
    onMenuAction: (action: ItemMenuAction) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({
    item,
    selected,
    isMenuOpen,
    isDropTarget,
    isDragging,
    onTileClick,
    onTileDoubleClick,
    onContextMenu,
    onCheckboxChange,
    onMenuToggle,
    onMenuAction,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
}) => {
    return (
        <div
            className={`file-item ${item.type}${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
            onClick={onTileClick}
            onDoubleClick={onTileDoubleClick}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <input
                type="checkbox"
                className="checkbox-control file-item-checkbox"
                checked={selected}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
            />
            <button
                type="button"
                className="file-item-menu-trigger"
                aria-label={`Open actions for ${item.name}`}
                aria-expanded={isMenuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    onMenuToggle();
                }}
            >
                ⋮
            </button>
            {isMenuOpen && (
                <div className="file-item-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('rename')}>
                        Rename
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('download')}>
                        Download
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('delete')}>
                        Delete
                    </button>
                    <button type="button" className="file-item-menu-item" onClick={() => onMenuAction('copy')}>
                        Copy
                    </button>
                </div>
            )}
            <span className="file-icon">{item.type === 'folder' ? '📁' : '📄'}</span>
            <span className="file-name">{item.name}</span>
        </div>
    );
};
