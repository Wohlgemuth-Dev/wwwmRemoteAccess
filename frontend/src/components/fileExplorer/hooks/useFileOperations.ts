import { useCallback, useEffect, useRef, useState } from 'react';
import type { ItemMenuAction } from './types';
import { fileExplorerApi } from '../../../service/api/fileexplorer';

interface UseFileOperationsParams {
    currentPath: string;
    setCurrentPath: (path: string) => void;
    closeItemMenu: () => void;
}

export const useFileOperations = ({ currentPath, setCurrentPath, closeItemMenu }: UseFileOperationsParams) => {
    const itemPathClipboardRef = useRef<string[]>([]);
    const [rawItems, setRawItems] = useState<{ name: string; type: 'file' | 'folder' }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fileExplorerApi.navigate(currentPath);
            setRawItems(response.items);
            if (!currentPath && response.currentPath) {
                setCurrentPath(response.currentPath);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load directory');
            setRawItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentPath, setCurrentPath]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    const handleDownload = useCallback((itemPaths: string[]) => {
        // TODO: wire to backend download endpoint when file selection is implemented.
        void itemPaths;
    }, []);

    const handleUpload = useCallback(() => {
        // TODO: wire to upload flow when file selection/target directory is implemented.
    }, []);

    const handleDelete = useCallback((itemPaths: string[]) => {
        // TODO: implement delete logic once backend is wired.
        void itemPaths;
    }, []);

    const handleCopy = useCallback((itemPaths: string[]) => {
        // TODO: implement copy logic once backend is wired.
        void itemPaths;

        itemPathClipboardRef.current = itemPaths;

        console.log('Copying items', itemPaths);
    }, []);

    const handlePaste = useCallback(() => {
        // TODO: implement paste logic once backend is wired.
        console.log('Pasting items ', itemPathClipboardRef.current, ' into ', currentPath);
    }, [currentPath]);

    const handleMove = useCallback((sourceItemPaths: string[], targetPath: string) => {
        // TODO: implement move logic once backend is wired.
        void sourceItemPaths;
        void targetPath;

        console.log('Moving items', sourceItemPaths, 'to', targetPath);
    }, []);

    const handleRename = useCallback((itemPath: string) => {
        // TODO: implement rename logic once backend is wired.
        void itemPath;
    }, []);

    const handleItemMenuAction = useCallback(
        (action: ItemMenuAction, itemPaths: string[]) => {
            closeItemMenu();

            if (itemPaths.length === 0) {
                return;
            }

            console.log('Menu action', action, 'on items', itemPaths);
            switch (action) {
                case 'rename':
                    handleRename(itemPaths[0]);
                    break;
                case 'download':
                    handleDownload(itemPaths);
                    break;
                case 'delete':
                    handleDelete(itemPaths);
                    break;
                case 'copy':
                    handleCopy(itemPaths);
                    break;
                default:
                    break;
            }
        },
        [closeItemMenu, handleCopy, handleDelete, handleDownload, handleRename],
    );

    return {
        rawItems,
        loading,
        error,
        handleRefresh,
        handleDownload,
        handleUpload,
        handleDelete,
        handleCopy,
        handlePaste,
        handleMove,
        handleItemMenuAction,
    };
};
