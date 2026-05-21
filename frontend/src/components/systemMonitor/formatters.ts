export const formatPercent = (value: number, decimals = 0) => {
    if (!Number.isFinite(value)) return 'n/a';
    return `${decimals === 0 ? Math.round(value) : value.toFixed(decimals)}%`;
};

export const formatMbps = (value: number, decimals = 2) => {
    if (!Number.isFinite(value)) return 'n/a';
    return `${value.toFixed(decimals)} Mbps`;
};

export const formatNumberWithUnit = (value: number, decimals = 0, unit = '') => {
    if (!Number.isFinite(value)) return 'n/a';
    return `${decimals === 0 ? Math.round(value) : value.toFixed(decimals)}${unit}`;
};

export default { formatPercent, formatMbps, formatNumberWithUnit };
