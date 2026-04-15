import { useEffect, useMemo, useRef, useState } from 'react';
import type { FileItem, PathSegment } from './types';

const joinPathSegment = (basePath: string, childName: string) => {
    const trimmed = basePath.replace(/\/+$/, '');
    return `${trimmed}/${childName}`;
};

const buildPathSegments = (path: string): PathSegment[] => {
    if (!path || path === '/') {
        return [{ label: '/', fullPath: '/' }];
    }

    const parts = path.split('/').filter(Boolean);
    const segments: PathSegment[] = [{ label: '/', fullPath: '/' }];

    parts.forEach((part, index) => {
        const fullPath = '/' + parts.slice(0, index + 1).join('/');
        segments.push({ label: part, fullPath });
    });

    return segments;
};

const normalizePathInput = (value: string, fallbackPath: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return fallbackPath;
    }

    // Normalize multiple slashes
    return trimmed.replace(/\/{2,}/g, '/');
};

export const usePathNavigation = (initialPath: string, fallbackFolder: string, onValidatedPathChange?: (path: string) => Promise<void>) => {
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

    const commitPathEdit = async () => {
        const normalizedPath = normalizePathInput(pathDraft, currentPath);
        if (onValidatedPathChange) {
            try {
                await onValidatedPathChange(normalizedPath);
            } catch {
                // Error is handled by onValidatedPathChange callback
            }
        } else {
            setCurrentPath(normalizedPath);
        }
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
            return joinPathSegment(prevPath, item.name);
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
            setCurrentPath,
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

