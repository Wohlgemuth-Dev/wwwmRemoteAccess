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
        console.log('Refreshing folder contents for path', currentPath);
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

    const handleCreateItem = useCallback((type: 'file' | 'folder', name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            return;
        }

        fileExplorerApi.create(currentPath, trimmedName, type)
        .then(() => {
            handleRefresh();
        }).catch((err) => {
            console.error(`Failed to create ${type}`, err);
        });
    }, [currentPath, handleRefresh]);

    const handleDelete = useCallback((itemPaths: string[]) => {
        // TODO: implement delete logic once backend is wired.
        void itemPaths;
        fileExplorerApi.deleteBulk(itemPaths).then(() => {
            console.log('Deleted items', itemPaths);
            handleRefresh();
        }).catch((err) => {            
            console.error('Failed to delete items', itemPaths, err);
        });
    }, [currentPath]);

    const handleCopy = useCallback((itemPaths: string[]) => {
        // TODO: implement copy logic once backend is wired.
        void itemPaths;

        itemPathClipboardRef.current = itemPaths;

        console.log('Copying items', itemPaths);
    }, []);

    const handlePaste = useCallback(() => {
        // TODO: implement paste logic once backend is wired.
        console.log('Pasting items ', itemPathClipboardRef.current, ' into ', currentPath);
        fileExplorerApi.pasteBulk(itemPathClipboardRef.current, currentPath)
        .then(() => {
            itemPathClipboardRef.current = [];
            handleRefresh();
        }).catch((err) => {
            console.error('Failed to paste items', err);
        });
    }, [currentPath]);

    const handleMove = useCallback((sourceItemPaths: string[], targetPath: string) => {
        // TODO: implement move logic once backend is wired.
        console.log('Moving items', sourceItemPaths, 'to', targetPath);

        fileExplorerApi.moveBulk(sourceItemPaths, targetPath)
        .then(() => {
            handleRefresh();
        }).catch((err) => {
            console.error('Failed to move items', err, "to target path", targetPath);
        });
    }, [currentPath]);

    const handleRename = useCallback((itemPath: string, newPath: string) => {
        // TODO: implement rename logic once backend is wired.
        void itemPath;
        console.log('Renaming item', itemPath, "to", newPath);
        fileExplorerApi.rename(itemPath, newPath)
        .then(() => {
            console.log('Renamed item', itemPath);
            handleRefresh();
        }).catch((err) => {
            console.error('Failed to rename item', itemPath, err);
        });
    }, [currentPath]);

    const handleItemMenuAction = useCallback(
        (action: ItemMenuAction, itemPaths: string[], newName?: string) => {
            closeItemMenu();

            if (itemPaths.length === 0) {
                return;
            }

            console.log('Menu action', action, 'on items', itemPaths);
            switch (action) {
                case 'rename':
                    handleRename(itemPaths[0], newName || '');
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
        handleCreateItem,
        handleDownload,
        handleUpload,
        handleDelete,
        handleCopy,
        handlePaste,
        handleMove,
        handleItemMenuAction,
    };
};
