import { apiClient } from './client';

export type FileItemResponse = {
    name: string;
    type: 'file' | 'folder';
};

export type NavigateResponse = {
    currentPath: string;
    items: FileItemResponse[];
};

const parseDownloadFileName = (contentDisposition: string | null) => {
    if (!contentDisposition) {
        return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (simpleMatch?.[1]) {
        return simpleMatch[1];
    }

    return null;
};

export const fileExplorerApi = {
    navigate: (path: string) =>
        apiClient.post<NavigateResponse>('/api/fileexplorer/navigate', { path }),
    create: (parentPath: string, name: string, type: 'file' | 'folder') =>
        apiClient.post('/api/fileexplorer/create', { parentPath, name, type }),
    deleteBulk: (paths: string[]) =>
        apiClient.post('/api/fileexplorer/delete-bulk', { paths }),
    rename: (oldPath: string, newPath: string) =>
        apiClient.post('/api/fileexplorer/rename', { oldPath, newPath }),
    pasteBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/paste-bulk', { items, destinationPath }),
    moveBulk: (items: string[], destinationPath: string) =>
        apiClient.post('/api/fileexplorer/move-bulk', { items, destinationPath }),
    upload: (targetPath: string, files: File[]) => {
        const formData = new FormData();
        formData.append('targetPath', targetPath);

        files.forEach((file) => {
            formData.append('files', file);
        });

        return apiClient.fetch('/api/fileexplorer/upload', {
            method: 'POST',
            body: formData,
        });
    },
    download: async (paths: string[]) => {
        const response = await apiClient.fetchRaw('/api/fileexplorer/download', {
            method: 'POST',
            body: JSON.stringify({ paths }),
        });

        const blob = await response.blob();
        const suggestedName = parseDownloadFileName(response.headers.get('content-disposition'));

        return {
            blob,
            fileName: suggestedName || 'download.zip',
        };
    },
};
