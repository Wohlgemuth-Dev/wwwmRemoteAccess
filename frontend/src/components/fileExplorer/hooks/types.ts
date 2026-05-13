export type PathSegment = {
    label: string;
    fullPath: string;
};

export type FileItem = {
    name: string;
    type: 'file' | 'folder';
    fullPath: string;
    size: number;
};

export type ItemMenuAction = 'rename' | 'download' | 'delete' | 'copy';

export type DragContext = {
    draggedItemPaths: string[];
    dropTargetType: 'item' | 'breadcrumb' | null;
    dropTargetId: string | null;
    isExternalDropActive: boolean;
};
