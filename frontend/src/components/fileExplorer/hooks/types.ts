export type PathSegment = {
    label: string;
    fullPath: string;
};

export type FileItem = {
    name: string;
    type: 'file' | 'folder';
};

export type ItemMenuAction = 'rename' | 'download' | 'delete';

export type DragContext = {
    draggedItemKeys: string[];
    dropTargetType: 'item' | 'breadcrumb' | null;
    dropTargetId: string | null;
};
