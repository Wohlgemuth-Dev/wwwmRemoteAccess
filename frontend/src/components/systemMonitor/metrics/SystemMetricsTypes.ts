export type ResourceKey = 'cpu' | 'memory' | 'disk' | 'network';

export type MetricKey = 'usage' | 'speed' | 'threads' | 'available';

export interface ChartPoint {
    index: number;
    value: number;
}

export type MetricSeriesMap = Partial<Record<MetricKey, ChartPoint[]>>;

export type SystemMetricsSnapshot = Record<ResourceKey, MetricSeriesMap>;
