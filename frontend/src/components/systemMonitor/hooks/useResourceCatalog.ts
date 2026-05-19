import { useMemo, useState } from 'react';
import type { ChartAxes } from '../components/DeviceMetricChart';
import { useSystemMetrics, type MetricKey, type ResourceKey } from '../metrics';

export interface ResourceDetailMetricConfig {
	metricKey: Exclude<MetricKey, 'usage'>;
	label: string;
	unit: string;
	conversionFactor?: number;
	decimals?: number;
	/** Optional: customize how value is displayed (e.g. bytes to GB) */
	formatter?: (value: number) => string;
}

export interface ResourceDefinition {
	key: ResourceKey;
	title: string;
	detailTitle: string;
	color: string;
	axes: ChartAxes;
	unit: string;
	min: number;
	max: number;
	initialValue: number;
	detailMetrics: ResourceDetailMetricConfig[];
}

const CPU_SPEED_CONVERSION_FACTOR = 1000;
const CPU_SPEED_DECIMALS = 2;
const DEFAULT_DECIMALS = 0;
const BYTES_TO_GB = 1_073_741_824;

/**
 * Metadata for singleton resources (always present with fixed metric structure)
 */
interface SingletonResourceMetadata {
	title: string;
	detailTitle: string;
	color: string;
	axes: ChartAxes;
	unit: string;
	min: number;
	max: number;
	initialValue: number;
	detailMetrics: Array<{
		metricKey: Exclude<MetricKey, 'usage'>;
		label: string;
		unit: string;
		conversionFactor?: number;
		decimals?: number;
	}>;
}

/**
 * Metadata for indexed resources (may have multiple instances like disks or GPUs)
 */
interface IndexedResourceMetadata extends SingletonResourceMetadata {
	/** Resource can have multiple instances (e.g., per-disk, per-gpu) */
	indexed: true;
	/** Display name pattern for indexed instances. Use {index} placeholder */
	instanceTitle?: (index: number, total: number) => string;
}

const singletonResourceMetadata: Record<'cpu' | 'memory', SingletonResourceMetadata> = {
	cpu: {
		title: 'CPU Usage',
		detailTitle: 'CPU Details',
		color: '#7ba7d6',
		axes: { xLabel: 'Samples', yLabel: 'CPU %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 45,
		detailMetrics: [
			{ metricKey: 'speed', label: 'Speed', unit: ' GHz', decimals: CPU_SPEED_DECIMALS, conversionFactor: CPU_SPEED_CONVERSION_FACTOR },
			{ metricKey: 'cores', label: 'Cores', unit: '', decimals: DEFAULT_DECIMALS },
			{ metricKey: 'threads', label: 'Threads', unit: '', decimals: DEFAULT_DECIMALS },
		],
	},
	memory: {
		title: 'Memory Usage',
		detailTitle: 'Memory Details',
		color: '#7dd3fc',
		axes: { xLabel: 'Samples', yLabel: 'Memory %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 60,
		detailMetrics: [
			{ metricKey: 'used', label: 'Used', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
			{ metricKey: 'total', label: 'Total', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
			{ metricKey: 'available', label: 'Available', unit: '%', decimals: DEFAULT_DECIMALS },
		],
	},
};

const indexedResourceMetadata: Record<'disk' | 'network' | 'gpu', IndexedResourceMetadata> = {
	disk: {
		title: 'Disk Usage',
		detailTitle: 'Disk Details',
		color: '#fbbf24',
		axes: { xLabel: 'Samples', yLabel: 'Disk %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 70,
		indexed: true,
		instanceTitle: (index, total) => total === 1 ? 'Disk' : `Disk ${index + 1}`,
		detailMetrics: [
			{ metricKey: 'total', label: 'Total', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
			{ metricKey: 'cores', label: 'Partitions', unit: '', decimals: DEFAULT_DECIMALS },
		],
	},
	network: {
		title: 'Network Usage',
		detailTitle: 'Network Details',
		color: '#34d399',
		axes: { xLabel: 'Samples', yLabel: 'Mbps' },
		unit: ' Mbps',
		min: 0,
		max: 100,
		initialValue: 20,
		indexed: true,
		instanceTitle: (index, total) => total === 1 ? 'Network' : `Network ${index + 1}`,
		detailMetrics: [
			{ metricKey: 'cores', label: 'Interfaces', unit: '', decimals: DEFAULT_DECIMALS },
		],
	},
	gpu: {
		title: 'GPU Usage',
		detailTitle: 'GPU Details',
		color: '#d946ef',
		axes: { xLabel: 'Samples', yLabel: 'GPU %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 35,
		indexed: true,
		instanceTitle: (index, total) => total === 1 ? 'GPU' : `GPU ${index + 1}`,
		detailMetrics: [
			{ metricKey: 'temperature', label: 'Temperature', unit: '°C', decimals: 1 },
			{ metricKey: 'cores', label: 'Cores', unit: '', decimals: DEFAULT_DECIMALS },
		],
	},
};

/**
 * Generate resource definitions from metadata.
 * Currently aggregates indexed resources (disk, network) into single entries.
 * Can be extended to support per-instance resources (per-disk, per-interface, per-gpu) in the future.
 */
const generateResourceDefinitions = (): ResourceDefinition[] => {
	const definitions: ResourceDefinition[] = [];

	// Add all singleton resources
	(Object.keys(singletonResourceMetadata) as Array<'cpu' | 'memory'>).forEach((key) => {
		const meta = singletonResourceMetadata[key];
		definitions.push({
			key,
			title: meta.title,
			detailTitle: meta.detailTitle,
			color: meta.color,
			axes: meta.axes,
			unit: meta.unit,
			min: meta.min,
			max: meta.max,
			initialValue: meta.initialValue,
			detailMetrics: meta.detailMetrics,
		});
	});

	// Add aggregated indexed resources
	(Object.keys(indexedResourceMetadata) as Array<'disk' | 'network' | 'gpu'>).forEach((key) => {
		const meta = indexedResourceMetadata[key];
		definitions.push({
			key,
			title: meta.title,
			detailTitle: meta.detailTitle,
			color: meta.color,
			axes: meta.axes,
			unit: meta.unit,
			min: meta.min,
			max: meta.max,
			initialValue: meta.initialValue,
			detailMetrics: meta.detailMetrics,
		});
	});

	return definitions;
};

export const resourceDefinitions: ResourceDefinition[] = generateResourceDefinitions();

const formatMetricValue = (value: number, metric: ResourceDetailMetricConfig): string => {
	if (metric.formatter) {
		return metric.formatter(value);
	}

	const factor = metric.conversionFactor ?? 1;
	const decimals = metric.decimals ?? DEFAULT_DECIMALS;
	const converted = value / factor;
	const formatted = decimals === 0 ? Math.round(converted) : converted.toFixed(decimals);
	return `${formatted}${metric.unit}`;
};

export const useResourceCatalog = () => {
	const [selectedResource, setSelectedResource] = useState<ResourceKey>('cpu');

	const selectedDetail = useMemo(
		() => resourceDefinitions.find((resource) => resource.key === selectedResource) ?? resourceDefinitions[0],
		[selectedResource],
	);

	return {
		resources: resourceDefinitions,
		selectedResource,
		setSelectedResource,
		selectedDetail,
	};
};

export const useResourceDetailMetrics = (resourceKey: ResourceKey) => {
	const { getCurrent } = useSystemMetrics();
	const resource = resourceDefinitions.find((definition) => definition.key === resourceKey);
	const metrics = resource?.detailMetrics ?? [];

	return useMemo(() => {
		return metrics.map((metric) => {
			const value = getCurrent(resourceKey, metric.metricKey);

			return {
				...metric,
				value,
				formatted: formatMetricValue(value, metric),
			};
		});
	}, [getCurrent, metrics, resourceKey]);
};