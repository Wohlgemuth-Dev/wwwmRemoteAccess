import { useEffect, useRef } from 'react';

interface UseExplorerShortcutsParams {
    selectedItemKeys: string[];
    selectedCount: number;
    onSelectAll: () => void;
    onCopy: (keys: string[]) => void;
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
    selectedItemKeys,
    selectedCount,
    onSelectAll,
    onCopy,
    onPaste,
}: UseExplorerShortcutsParams) => {
    const latestStateRef = useRef({
        selectedItemKeys,
        selectedCount,
        onSelectAll,
        onCopy,
        onPaste,
    });

    useEffect(() => {
        latestStateRef.current = {
            selectedItemKeys,
            selectedCount,
            onSelectAll,
            onCopy,
            onPaste,
        };
    }, [selectedItemKeys, selectedCount, onSelectAll, onCopy, onPaste]);

    useEffect(() => {
        const handleShortcuts = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || isTypingIntoEditableElement()) {
                return;
            }

            const { selectedItemKeys, selectedCount, onSelectAll, onCopy, onPaste } = latestStateRef.current;

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
                onCopy(selectedItemKeys);
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
