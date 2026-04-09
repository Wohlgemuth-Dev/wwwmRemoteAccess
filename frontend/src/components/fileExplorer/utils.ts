export const getItemNameFromPath = (itemPath: string) => {
    const normalizedPath = itemPath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);

    return parts[parts.length - 1] || itemPath;
};

export const getItemNamesFromPaths = (itemPaths: string[]) => itemPaths.map(getItemNameFromPath);
