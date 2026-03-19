import React from 'react';
import type { FileItem as FileItemType } from '../hooks';

interface FileItemProps {
    item: FileItemType;
    selected: boolean;
    isDropTarget: boolean;
    isDragging: boolean;
    onTileClick: () => void;
    onTileDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
    onCheckboxChange: (checked: boolean) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({
    item,
    selected,
    isDropTarget,
    isDragging,
    onTileClick,
    onTileDoubleClick,
    onContextMenu,
    onCheckboxChange,
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
            <span className="file-icon">{item.type === 'folder' ? '📁' : '📄'}</span>
            <span className="file-name">{item.name}</span>
        </div>
    );
};
