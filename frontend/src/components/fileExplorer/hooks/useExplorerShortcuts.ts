import { useEffect, useRef } from 'react';

interface UseExplorerShortcutsParams {
    selectedItemPaths: string[];
    selectedCount: number;
    onSelectAll: () => void;
    onCopy: (paths: string[]) => void;
    onPaste: () => void;
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
}: UseExplorerShortcutsParams) => {
    const latestStateRef = useRef({
        selectedItemPaths,
        selectedCount,
        onSelectAll,
        onCopy,
        onPaste,
    });

    useEffect(() => {
        latestStateRef.current = {
            selectedItemPaths,
            selectedCount,
            onSelectAll,
            onCopy,
            onPaste,
        };
    }, [selectedItemPaths, selectedCount, onSelectAll, onCopy, onPaste]);

    useEffect(() => {
        const handleShortcuts = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || isTypingIntoEditableElement()) {
                return;
            }

            const { selectedItemPaths, selectedCount, onSelectAll, onCopy, onPaste } = latestStateRef.current;

            const key = e.key.toLowerCase();
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
        };

        window.addEventListener('keydown', handleShortcuts);
        return () => {
            window.removeEventListener('keydown', handleShortcuts);
        };
    }, []);
};
