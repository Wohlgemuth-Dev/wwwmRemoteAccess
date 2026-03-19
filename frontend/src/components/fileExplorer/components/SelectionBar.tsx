import React from 'react';

interface SelectionBarProps {
    isSelectAllChecked: boolean;
    selectAllCheckboxRef: React.RefObject<HTMLInputElement | null>;
    onSelectAllChange: (checked: boolean) => void;
    selectedCount: number;
    selectedItemPaths: string[];
    onDelete: (paths: string[]) => void;
    onDownload: (paths: string[]) => void;
    onCopy: (paths: string[]) => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
    isSelectAllChecked,
    selectAllCheckboxRef,
    onSelectAllChange,
    selectedCount,
    selectedItemPaths,
    onDelete,
    onCopy,
    onDownload,
}) => {
    return (
        <>
            <label className={`nav-checkbox-button${isSelectAllChecked ? ' is-checked' : ''}`} title="Select or deselect all items">
                <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    className="checkbox-control nav-checkbox"
                    checked={isSelectAllChecked}
                    onChange={(e) => onSelectAllChange(e.target.checked)}
                />
                <span className="nav-checkbox-label">Select All</span>
            </label>

            <button
                type="button"
                className="nav-delete-button"
                onClick={() => onDelete(selectedItemPaths)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Select items to delete' : `Delete ${selectedCount} item(s)`}
            >
                <span className="nav-delete-icon">🗑</span>
                <span className="nav-delete-label">Delete</span>
            </button>

            <button
                type="button"
                className="nav-copy-button"
                onClick={() => onCopy(selectedItemPaths)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Select items to copy' : `Copy ${selectedCount} item(s)`}
            >
                <span className="nav-copy-icon">📋</span>
                <span className="nav-copy-label">Copy</span>
            </button>

            <button
                type="button"
                className="nav-download-button"
                onClick={() => onDownload(selectedItemPaths)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Select items to download' : `Download ${selectedCount} item(s)`}
            >
                <span className="nav-download-icon">⇩</span>
                <span className="nav-download-label">Download</span>
            </button>
        </>
    );
};
