export const formatBytes = (bytes: number): string => {
    if (!bytes && bytes !== 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = Number(bytes) || 0;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i += 1;
    }
    return `${typeof v === 'number' ? v.toFixed(2) : v} ${units[i]}`;
};

export default formatBytes;
