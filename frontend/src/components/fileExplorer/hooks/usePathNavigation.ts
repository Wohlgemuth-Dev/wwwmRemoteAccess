import { useEffect, useMemo, useRef, useState } from 'react';
import type { FileItem, PathSegment } from './types';

const buildPathSegments = (path: string): PathSegment[] => {
    const normalizedPath = path.replace(/\/+|\\+/g, '\\');
    const driveMatch = normalizedPath.match(/^[A-Za-z]:/);
    const drive = driveMatch ? driveMatch[0] : '';

    const withoutDrive = drive ? normalizedPath.slice(drive.length).replace(/^\\+/, '') : normalizedPath;
    const folders = withoutDrive.split('\\').filter(Boolean);

    const segments: PathSegment[] = [];

    if (drive) {
        segments.push({ label: drive, fullPath: `${drive}\\` });
    }

    folders.forEach((folder, index) => {
        const leading = drive ? `${drive}\\` : '';
        const fullPath = `${leading}${folders.slice(0, index + 1).join('\\')}`;
        segments.push({ label: folder, fullPath });
    });

    return segments;
};

const normalizePathInput = (value: string, fallbackPath: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return fallbackPath;
    }

    const withBackslashes = trimmed.replace(/\//g, '\\');
    return withBackslashes.replace(/\\{2,}/g, '\\');
};

export const usePathNavigation = (initialPath: string, fallbackFolder: string) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [isEditingPath, setIsEditingPath] = useState(false);
    const [pathDraft, setPathDraft] = useState(initialPath);
    const pathInputRef = useRef<HTMLInputElement>(null);

    const pathSegments = useMemo(() => buildPathSegments(currentPath), [currentPath]);
    const canNavigateUp = pathSegments.length > 1;
    const currentFolder = pathSegments[pathSegments.length - 1]?.label ?? fallbackFolder;

    useEffect(() => {
        if (isEditingPath && pathInputRef.current) {
            pathInputRef.current.focus();
            pathInputRef.current.select();
        }
    }, [isEditingPath]);

    useEffect(() => {
        if (!isEditingPath) {
            setPathDraft(currentPath);
        }
    }, [currentPath, isEditingPath]);

    const commitPathEdit = () => {
        setCurrentPath(normalizePathInput(pathDraft, currentPath));
        setIsEditingPath(false);
    };

    const cancelPathEdit = () => {
        setPathDraft(currentPath);
        setIsEditingPath(false);
    };

    const navigateUp = () => {
        if (!canNavigateUp) {
            return;
        }

        const parentPath = pathSegments[pathSegments.length - 2]?.fullPath;
        if (parentPath) {
            setCurrentPath(parentPath);
        }
    };

    const handleFolderOpen = (item: FileItem) => {
        if (item.type !== 'folder') {
            return;
        }

        setCurrentPath((prevPath) => {
            const sanitizedBase = prevPath.replace(/[\\/]+$/, '');
            const separator = sanitizedBase.includes('\\') ? '\\' : '/';
            return `${sanitizedBase}${separator}${item.name}`;
        });
    };

    const handlePathInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            commitPathEdit();
        }

        if (e.key === 'Escape') {
            cancelPathEdit();
        }
    };

    const handlePathSegmentClick = (segmentPath: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setCurrentPath(segmentPath);
    };

    return {
        // Current state
        path: {
            currentPath,
            currentFolder,
            pathSegments,
        },
        // Editing mode
        editing: {
            isEditingPath,
            setIsEditingPath,
            pathDraft,
            setPathDraft,
            pathInputRef,
        },
        // Navigation
        navigation: {
            canNavigateUp,
            navigateUp,
            handleFolderOpen,
        },
        // Handlers
        handlers: {
            handlePathInputKeyDown,
            handlePathSegmentClick,
            commitPathEdit,
            cancelPathEdit,
        },
    };
};
