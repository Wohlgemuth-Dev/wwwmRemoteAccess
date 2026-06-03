import type { ChartPoint } from './SystemMetricsTypes';

export const mergeSeries = (primary: ChartPoint[], extras: Record<string, ChartPoint[]>): ChartPoint[] => {
    const combined = new Map<number, ChartPoint>();

    primary.forEach((point) => {
        combined.set(point.index, { index: point.index, value: point.value });
    });

    Object.entries(extras).forEach(([key, series]) => {
        series.forEach((point) => {
            const existing = combined.get(point.index) ?? { index: point.index, value: 0 } as ChartPoint;
            existing[key] = point.value;
            combined.set(point.index, existing);
        });
    });

    return Array.from(combined.values()).sort((left, right) => left.index - right.index);
};

export const cumulativeBytesToMbps = (series: ChartPoint[], sampleIntervalSeconds = 5): ChartPoint[] => {
    const raw: number[] = series.map((point, index) => {
        const previousValue = series[index - 1]?.value ?? point.value;
        const deltaBytes = index === 0 ? 0 : Math.max(point.value - previousValue, 0);
        const mbps = (deltaBytes * 8) / sampleIntervalSeconds / 1_000_000;
        return Number.isFinite(mbps) && mbps >= 0 ? mbps : 0;
    });

    const result: ChartPoint[] = raw.map((_, index) => {
        const window: number[] = [];
        for (let w = 0; w < 3; w++) {
            const i = index - w;
            if (i >= 0) window.push(raw[i]);
        }
        const smoothed = window.reduce((s, v) => s + v, 0) / Math.max(window.length, 1);

        const threshold = 0.005;
        const cleaned = smoothed >= threshold ? smoothed : 0;

        return { index: series[index].index, value: cleaned };
    });

    return result;
};

export const getNetworkChartBounds = (series: ChartPoint[]) => {
    const values = series.flatMap((point) => [point.value, point.sent].filter((value): value is number => typeof value === 'number' && Number.isFinite(value)));

    if (values.length === 0) {
        return { min: 0, max: 1 };
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const spread = Math.max(maxValue - minValue, 0.01);
    const padding = Math.max(spread * 0.25, 0.01);

    return {
        min: Math.max(0, minValue - padding),
        max: maxValue + padding,
    };
};

export default {
    mergeSeries,
    cumulativeBytesToMbps,
    getNetworkChartBounds,
};
