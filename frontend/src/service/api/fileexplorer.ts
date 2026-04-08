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
    pasteBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/paste-bulk', { items, destinationPath }),
    moveBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/move-bulk', { items, destinationPath }),
};
