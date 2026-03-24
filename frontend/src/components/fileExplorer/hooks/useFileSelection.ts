import { useEffect, useMemo, useRef, useState } from 'react';

type MenuPosition = {
    x: number;
    y: number;
};

export const useFileSelection = (allItemPaths: string[]) => {
    const [selectedItemPaths, setSelectedItemPaths] = useState<string[]>([]);
    const [openItemMenuPath, setOpenItemMenuPath] = useState<string | null>(null);
    const [openItemMenuPosition, setOpenItemMenuPosition] = useState<MenuPosition | null>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    const selectedItemPathSet = useMemo(() => new Set(selectedItemPaths), [selectedItemPaths]);
    const selectedCount = selectedItemPaths.length;
    const totalCount = allItemPaths.length;
    const isSelectAllChecked = totalCount > 0 && selectedCount === totalCount;
    const isSelectAllIndeterminate = selectedCount > 0 && selectedCount < totalCount;

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isSelectAllIndeterminate;
        }
    }, [isSelectAllIndeterminate]);

    const handleSelectAllChange = (checked: boolean) => {
        setSelectedItemPaths(checked ? allItemPaths : []);
    };

    const updateItemSelection = (itemPath: string, shouldSelect: boolean) => {
        setSelectedItemPaths((prev) => {
            if (shouldSelect) {
                if (prev.includes(itemPath)) {
                    return prev;
                }

                return [...prev, itemPath];
            }

            return prev.filter((path) => path !== itemPath);
        });
    };

    const handleItemCheckboxChange = (itemPath: string, checked: boolean) => {
        updateItemSelection(itemPath, checked);
    };

    const handleTileSelectionToggle = (itemPath: string) => {
        setOpenItemMenuPath(null);
        setOpenItemMenuPosition(null);
        setSelectedItemPaths((prev) => {
            if (prev.includes(itemPath)) {
                return prev.filter((entry) => entry !== itemPath);
            }
            return [...prev, itemPath];
        });
    };

    const clearSelection = () => {
        if (selectedItemPaths.length === 0) {
            return;
        }

        setSelectedItemPaths([]);
    };

    const handleBlankAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setOpenItemMenuPath(null);
            setOpenItemMenuPosition(null);
            clearSelection();
        }
    };

    const handleItemContextMenu = (itemPath: string) => (e: React.MouseEvent<HTMLDivElement>) => {
        const menuOffset = 6;
        const menuWidth = 132;
        const menuHeight = 152;
        const maxX = Math.max(8, window.innerWidth - menuWidth - 8);
        const maxY = Math.max(8, window.innerHeight - menuHeight - 8);
        const x = Math.min(maxX, e.clientX + menuOffset);
        const y = Math.min(maxY, e.clientY + menuOffset);

        e.preventDefault();
        e.stopPropagation();

        setSelectedItemPaths((prev) => (prev.includes(itemPath) ? prev : [itemPath]));
        setOpenItemMenuPath(itemPath);
        setOpenItemMenuPosition({ x, y });
    };

    const isItemSelected = (itemPath: string) => selectedItemPathSet.has(itemPath);

    return {
        // State
        items: {
            selectedItemPaths,
            selectedCount,
            totalCount,
        },
        // UI state
        menu: {
            openItemMenuPath,
            openItemMenuPosition,
            setOpenItemMenuPath,
            setOpenItemMenuPosition,
        },
        // Checkboxes
        selectAll: {
            isSelectAllChecked,
            isSelectAllIndeterminate,
            selectAllCheckboxRef,
            handleSelectAllChange,
        },
        // Handlers
        handlers: {
            handleSelectAllChange,
            handleItemCheckboxChange,
            handleTileSelectionToggle,
            handleBlankAreaClick,
            handleItemContextMenu,
        },
        // Utilities
        isItemSelected,
    };
};
