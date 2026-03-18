import { useEffect, useMemo, useRef, useState } from 'react';

export const useFileSelection = (allItemKeys: string[]) => {
    const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
    const [openItemMenuKey, setOpenItemMenuKey] = useState<string | null>(null);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    const selectedItemKeySet = useMemo(() => new Set(selectedItemKeys), [selectedItemKeys]);
    const selectedCount = selectedItemKeys.length;
    const totalCount = allItemKeys.length;
    const isSelectAllChecked = totalCount > 0 && selectedCount === totalCount;
    const isSelectAllIndeterminate = selectedCount > 0 && selectedCount < totalCount;

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = isSelectAllIndeterminate;
        }
    }, [isSelectAllIndeterminate]);

    const handleSelectAllChange = (checked: boolean) => {
        setSelectedItemKeys(checked ? allItemKeys : []);
    };

    const updateItemSelection = (itemKey: string, shouldSelect: boolean) => {
        setSelectedItemKeys((prev) => {
            if (shouldSelect) {
                if (prev.includes(itemKey)) {
                    return prev;
                }

                return [...prev, itemKey];
            }

            return prev.filter((key) => key !== itemKey);
        });
    };

    const handleItemCheckboxChange = (itemKey: string, checked: boolean) => {
        updateItemSelection(itemKey, checked);
    };

    const handleTileSelectionToggle = (itemKey: string) => {
        setOpenItemMenuKey(null);
        setSelectedItemKeys((prev) => {
            if (prev.includes(itemKey)) {
                return prev.filter((entry) => entry !== itemKey);
            }
            return [...prev, itemKey];
        });
    };

    const clearSelection = () => {
        if (selectedItemKeys.length === 0) {
            return;
        }

        setSelectedItemKeys([]);
    };

    const handleBlankAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setOpenItemMenuKey(null);
            clearSelection();
        }
    };

    const handleItemMenuToggle = (itemKey: string) => {
        setOpenItemMenuKey((prev) => (prev === itemKey ? null : itemKey));
    };

    const handleItemContextMenu = (itemKey: string) => (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenItemMenuKey(itemKey);
    };

    const isItemSelected = (itemKey: string) => selectedItemKeySet.has(itemKey);

    return {
        // State
        items: {
            selectedItemKeys,
            selectedCount,
            totalCount,
        },
        // UI state
        menu: {
            openItemMenuKey,
            setOpenItemMenuKey,
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
            handleItemMenuToggle,
            handleItemContextMenu,
        },
        // Utilities
        isItemSelected,
    };
};
