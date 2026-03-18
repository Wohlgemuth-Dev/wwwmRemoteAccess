import React from 'react';

interface SelectionBarProps {
    isSelectAllChecked: boolean;
    selectAllCheckboxRef: React.RefObject<HTMLInputElement | null>;
    onSelectAllChange: (checked: boolean) => void;
    selectedCount: number;
    selectedItemKeys: string[];
    onDelete: (keys: string[]) => void;
    onDownload: (keys: string[]) => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
    isSelectAllChecked,
    selectAllCheckboxRef,
    onSelectAllChange,
    selectedCount,
    selectedItemKeys,
    onDelete,
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
                onClick={() => onDelete(selectedItemKeys)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Select items to delete' : `Delete ${selectedCount} item(s)`}
            >
                <span className="nav-delete-icon">🗑</span>
                <span className="nav-delete-label">Delete</span>
            </button>

            <button
                type="button"
                className="nav-download-button"
                onClick={() => onDownload(selectedItemKeys)}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Select items to download' : `Download ${selectedCount} item(s)`}
            >
                <span className="nav-download-icon">⇩</span>
                <span className="nav-download-label">Download</span>
            </button>
        </>
    );
};
