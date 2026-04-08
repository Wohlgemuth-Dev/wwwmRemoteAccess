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
};
