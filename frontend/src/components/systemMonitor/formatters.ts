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

export const formatAutoRate = (value: number, decimals = 2, baseUnit = ' Mbps') => {
    if (!Number.isFinite(value)) return { valueText: 'n/a', unit: baseUnit, scale: 1 };

    const absValue = Math.abs(value);
    const scale = absValue > 0 && absValue < 0.01 ? 1000 : 1;
    const unit = scale === 1000 ? ' Kbps' : baseUnit;
    const scaledValue = value * scale;

    return {
        valueText: `${scaledValue.toFixed(decimals)}${unit}`,
        unit,
        scale,
    };
};

export default { formatPercent, formatMbps, formatNumberWithUnit, formatAutoRate };
