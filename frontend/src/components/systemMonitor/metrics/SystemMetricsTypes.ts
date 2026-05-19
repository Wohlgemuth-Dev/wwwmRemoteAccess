export type ResourceKey = 'cpu' | 'memory' | 'disk' | 'network' | 'gpu';

export type MetricKey =
	| 'usage'
	| 'speed'
	| 'threads'
	| 'available'
	| 'cores'
	| 'total'
	| 'used'
	| 'swap'
	| 'temperature';

export interface ChartPoint {
    index: number;
    value: number;
}

export type MetricSeriesMap = Partial<Record<MetricKey, ChartPoint[]>>;

export type SystemMetricsSnapshot = Record<ResourceKey, MetricSeriesMap>;
