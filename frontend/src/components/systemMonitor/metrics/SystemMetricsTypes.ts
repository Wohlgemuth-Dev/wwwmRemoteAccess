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
	| 'temperature'
	| 'memoryUsed'
	| 'memoryFree'
	| 'memoryTotal'
	| 'readSpeed'
	| 'writeSpeed';


export interface ChartPoint {
	index: number;
	value: number;
	[key: string]: number;
}

export type MetricSeriesMap = Partial<Record<MetricKey, ChartPoint[]>>;

export type SystemMetricsSnapshot = Record<string, MetricSeriesMap>;
