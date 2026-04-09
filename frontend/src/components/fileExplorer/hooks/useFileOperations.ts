import { useCallback, useEffect, useRef, useState } from 'react';
import type { ItemMenuAction } from './types';
import { fileExplorerApi } from '../../../service/api/fileexplorer';
import { getItemNamesFromPaths } from '../utils';

interface UseFileOperationsParams {
    currentPath: string;
    setCurrentPath: (path: string) => void;
    closeItemMenu: () => void;
}

export const useFileOperations = ({ currentPath, setCurrentPath, closeItemMenu }: UseFileOperationsParams) => {
    const itemPathClipboardRef = useRef<string[]>([]);
    const lastKnownPathRef = useRef(currentPath);
    const [rawItems, setRawItems] = useState<{ name: string; type: 'file' | 'folder' }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentPath) {
            lastKnownPathRef.current = currentPath;
        }
    }, [currentPath]);

    const handleRefresh = useCallback(async () => {
        const pathToRefresh = currentPath || lastKnownPathRef.current;
        setLoading(true);
        setError(null);
        console.log('Refreshing folder contents for path', pathToRefresh);
        try {
            const response = await fileExplorerApi.navigate(pathToRefresh);
            setRawItems(response.items);
            if (!pathToRefresh && response.currentPath) {
                setCurrentPath(response.currentPath);
                lastKnownPathRef.current = response.currentPath;
            } else if (pathToRefresh) {
                lastKnownPathRef.current = pathToRefresh;
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

    const handleUploadFiles = useCallback(async (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        setError(null);
        setLoading(true);

        try {
            await fileExplorerApi.upload(currentPath, files);
            await handleRefresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files');
            setLoading(false);
        }
    }, [currentPath, handleRefresh]);

    const handleUpload = useCallback(() => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;

        fileInput.onchange = async () => {
            const files = fileInput.files ? Array.from(fileInput.files) : [];
            await handleUploadFiles(files);
        };

        fileInput.click();
    }, [handleUploadFiles]);

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
        if (itemPaths.length === 0) {
            return;
        }

        const itemNames = getItemNamesFromPaths(itemPaths);
        if (!window.confirm(`Are you sure you want to delete the following items?\n\n${itemNames.join('\n')}`)) {
            return;
        }

        fileExplorerApi.deleteBulk(itemPaths).then(() => {
            console.log('Deleted items', itemPaths);
            handleRefresh();
        }).catch((err) => {            
            console.error('Failed to delete items', itemPaths, err);
        });
    }, [currentPath, handleRefresh]);

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
        handleUploadFiles,
        handleDelete,
        handleCopy,
        handlePaste,
        handleMove,
        handleItemMenuAction,
    };
};
