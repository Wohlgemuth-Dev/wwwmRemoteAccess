export const getItemNameFromPath = (itemPath: string) => {
    const normalizedPath = itemPath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);

    return parts[parts.length - 1] || itemPath;
};

export const getItemNamesFromPaths = (itemPaths: string[]) => itemPaths.map(getItemNameFromPath);

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0 || isNaN(bytes)) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    
    return `${parseFloat(size.toFixed(1))} ${sizes[i]}`;
};
