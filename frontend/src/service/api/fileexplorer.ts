import { apiClient } from './client';

export type FileItemResponse = {
    name: string;
    type: 'file' | 'folder';
};

export type NavigateResponse = {
    currentPath: string;
    items: FileItemResponse[];
};

export const fileExplorerApi = {
    navigate: (path: string) =>
        apiClient.post<NavigateResponse>('/api/fileexplorer/navigate', { path }),
    deleteBulk: (paths: string[]) =>
        apiClient.post('/api/fileexplorer/delete-bulk', { paths }),
    rename: (oldPath: string, newPath: string) =>
        apiClient.post('/api/fileexplorer/rename', { oldPath, newPath }),
    pasteBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/paste-bulk', { items, destinationPath }),
    moveBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/move-bulk', { items, destinationPath }),
};
