import { useCallback } from 'react';
import type { ItemMenuAction } from './types';

const getItemNameFromKey = (itemKey: string) => {
    const separatorIndex = itemKey.indexOf(':');
    return separatorIndex >= 0 ? itemKey.slice(separatorIndex + 1) : itemKey;
};

const normalizePathSeparators = (value: string) => value.replace(/\//g, '\\').replace(/\\{2,}/g, '\\');

const trimTrailingSeparators = (value: string) => value.replace(/[\\/]+$/, '');

const joinPathSegment = (basePath: string, childName: string) => {
    const normalizedBasePath = trimTrailingSeparators(normalizePathSeparators(basePath));
    return `${normalizedBasePath}\\${childName}`;
};

interface UseFileOperationsParams {
    currentPath: string;
    closeItemMenu: () => void;
}

export const useFileOperations = ({ currentPath, closeItemMenu }: UseFileOperationsParams) => {
    const buildPathsFromKeys = useCallback(
        (itemKeys: string[]) => itemKeys.map((itemKey) => joinPathSegment(currentPath, getItemNameFromKey(itemKey))),
        [currentPath],
    );

    const getPathForCurrentFolderChild = useCallback((childName: string) => joinPathSegment(currentPath, childName), [currentPath]);

    const handleRefresh = useCallback(() => {
        // TODO: implement refresh logic once backend is wired.
    }, []);

    const handleDownload = useCallback((itemKeys: string[]) => {
        // TODO: wire to backend download endpoint when file selection is implemented.
        void itemKeys;
    }, []);

    const handleUpload = useCallback(() => {
        // TODO: wire to upload flow when file selection/target directory is implemented.
    }, []);

    const handleDelete = useCallback((itemKeys: string[]) => {
        // TODO: implement delete logic once backend is wired.
        void itemKeys;
    }, []);

    const handleCopy = useCallback((itemKeys: string[]) => {
        // TODO: implement copy logic once backend is wired.
        void itemKeys;

        console.log('Copying items', itemKeys);
    }, []);

    const handlePaste = useCallback(() => {
        // TODO: implement paste logic once backend is wired.
        console.log('Pasting items into', currentPath);
    }, [currentPath]);

    const handleMove = useCallback((sourceItemPaths: string[], targetPath: string) => {
        // TODO: implement move logic once backend is wired.
        void sourceItemPaths;
        void targetPath;

        console.log('Moving items', sourceItemPaths, 'to', targetPath);
    }, []);

    const handleRename = useCallback((itemKey: string) => {
        // TODO: implement rename logic once backend is wired.
        void itemKey;
    }, []);

    const handleItemMenuAction = useCallback(
        (action: ItemMenuAction, itemKey: string) => {
            closeItemMenu();

            console.log('Menu action', action, 'on item', itemKey);
            switch (action) {
                case 'rename':
                    handleRename(itemKey);
                    break;
                case 'download':
                    handleDownload([itemKey]);
                    break;
                case 'delete':
                    handleDelete([itemKey]);
                    break;
                case 'copy':
                    handleCopy([itemKey]);
                    break;
                default:
                    break;
            }
        },
        [closeItemMenu, handleCopy, handleDelete, handleDownload, handleRename],
    );

    return {
        handleRefresh,
        handleDownload,
        handleUpload,
        handleDelete,
        handleCopy,
        handlePaste,
        handleMove,
        handleItemMenuAction,
        buildPathsFromKeys,
        getPathForCurrentFolderChild,
    };
};
