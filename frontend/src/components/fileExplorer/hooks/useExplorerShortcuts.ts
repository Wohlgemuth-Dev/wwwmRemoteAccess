import { useCallback, useEffect, useRef } from 'react';

interface UseExplorerShortcutsParams {
    selectedItemPaths: string[];
    selectedCount: number;
    onSelectAll: () => void;
    onCopy: (paths: string[]) => void;
    onPaste: () => void;
    onDelete: (paths: string[]) => void;
}

const isTypingIntoEditableElement = () => {
    const activeElement = document.activeElement as HTMLElement | null;

    return (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.isContentEditable
    );
};

export const useExplorerShortcuts = ({
    selectedItemPaths,
    selectedCount,
    onSelectAll,
    onCopy,
    onPaste,
    onDelete,
}: UseExplorerShortcutsParams) => {
    const latestStateRef = useRef({
        selectedItemPaths,
        selectedCount,
        onSelectAll,
        onCopy,
        onPaste,
        onDelete,
    });

    useEffect(() => {
        latestStateRef.current = {
            selectedItemPaths,
            selectedCount,
            onSelectAll,
            onCopy,
            onPaste,
            onDelete,
        };
    }, [selectedItemPaths, selectedCount, onSelectAll, onCopy, onPaste, onDelete]);

    const handleShortcuts = useCallback((e: React.KeyboardEvent) => {
        if (isTypingIntoEditableElement()) {
            return;
        }

        const { selectedItemPaths, selectedCount, onSelectAll, onCopy, onPaste, onDelete } = latestStateRef.current;

        const key = e.key.toLowerCase();
        if (key === 'delete' || key === 'backspace') {
            if (selectedCount === 0) {
                return;
            }

            e.preventDefault();
            onDelete(selectedItemPaths);
            return;
        }

        if (!(e.ctrlKey || e.metaKey)) {
            return;
        }

        if (key === 'a') {
            e.preventDefault();
            onSelectAll();
            return;
        }

        if (key === 'c') {
            if (selectedCount === 0) {
                return;
            }

            e.preventDefault();
            onCopy(selectedItemPaths);
            return;
        }

        if (key === 'v') {
            e.preventDefault();
            onPaste();
        }
    }, []);

    return {
        handleShortcuts,
    };
};
