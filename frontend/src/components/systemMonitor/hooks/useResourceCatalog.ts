import { useEffect, useMemo, useState } from 'react';
import type { ChartAxes } from '../components/DeviceMetricChart';
import { useSystemMetrics, type MetricKey, type ResourceKey } from '../metrics';

export interface ResourceDetailMetricConfig {
	metricKey: MetricKey;
	label: string;
	unit: string;
	conversionFactor?: number;
	decimals?: number;
	/** Optional: customize how value is displayed (e.g. bytes to GB) */
	formatter?: (value: number) => string;
}

export interface ResourceDefinition {
	id: string;
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
const BYTES_TO_MB = 1_048_576;

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
		metricKey: MetricKey;
		label: string;
		unit: string;
		conversionFactor?: number;
		decimals?: number;
	}>;
}

type InstanceResourceKey = 'cpu' | 'disk' | 'network' | 'gpu';

const memoryResourceMetadata: SingletonResourceMetadata = {
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
			{ metricKey: 'swap', label: 'Swap %', unit: '%', decimals: DEFAULT_DECIMALS },
			{ metricKey: 'swapUsed', label: 'Swap Used', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
	],
};

const instanceResourceMetadata: Record<InstanceResourceKey, SingletonResourceMetadata> = {
	cpu: {
		title: 'CPU',
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
	disk: {
		title: 'Disk',
		detailTitle: 'Disk Details',
		color: '#fbbf24',
		axes: { xLabel: 'Samples', yLabel: 'Disk %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 70,
		detailMetrics: [
			{ metricKey: 'usage', label: 'Utilization', unit: '%' },
			{ metricKey: 'total', label: 'Total', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
				{ metricKey: 'cores', label: 'Devices', unit: '', decimals: DEFAULT_DECIMALS },
				{ metricKey: 'readBytes', label: 'Read', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
				{ metricKey: 'writeBytes', label: 'Write', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
		],
	},
	network: {
		title: 'Network',
		detailTitle: 'Network Details',
		color: '#34d399',
		axes: { xLabel: 'Samples', yLabel: 'Mbps' },
		unit: ' Mbps',
		min: 0,
		max: 100,
		initialValue: 20,
		detailMetrics: [
			{ metricKey: 'usage', label: 'Throughput', unit: ' Mbps' },
			{ metricKey: 'cores', label: 'Interfaces', unit: '', decimals: DEFAULT_DECIMALS },
				{ metricKey: 'bytesRecv', label: 'Received', unit: ' MB', decimals: 1, conversionFactor: BYTES_TO_MB },
				{ metricKey: 'bytesSent', label: 'Sent', unit: ' MB', decimals: 1, conversionFactor: BYTES_TO_MB },
		],
	},
	gpu: {
		title: 'GPU',
		detailTitle: 'GPU Details',
		color: '#d946ef',
		axes: { xLabel: 'Samples', yLabel: 'GPU %' },
		unit: '%',
		min: 0,
		max: 100,
		initialValue: 35,
		detailMetrics: [
			{ metricKey: 'usage', label: 'Utilization', unit: '%' },
			{ metricKey: 'temperature', label: 'Temperature', unit: '°C', decimals: 1 },
			{ metricKey: 'memoryUsed', label: 'Memory Used', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
			{ metricKey: 'memoryTotal', label: 'Memory Total', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
			{ metricKey: 'memoryFree', label: 'Memory Free', unit: ' GB', decimals: 2, conversionFactor: BYTES_TO_GB },
		],
	},
};

const getInstanceIds = (snapshot: Record<string, unknown>, resourceKey: InstanceResourceKey) => {
	const numberedIds = Object.keys(snapshot)
		.filter((resourceId) => new RegExp(`^${resourceKey}:\\d+$`).test(resourceId))
		.sort((left, right) => {
			const leftIndex = Number(left.split(':')[1] ?? 0);
			const rightIndex = Number(right.split(':')[1] ?? 0);
			return leftIndex - rightIndex;
		});

	if (numberedIds.length > 0) {
		return numberedIds;
	}

	return Object.keys(snapshot).filter((resourceId) => resourceId === resourceKey);
};

const buildInstanceTitle = (baseTitle: string, index: number, total: number) => {
	return total === 1 ? baseTitle : `${baseTitle} ${index + 1}`;
};

const buildInstanceDetailTitle = (baseTitle: string, index: number, total: number) => {
	return total === 1 ? `${baseTitle} Details` : `${baseTitle} ${index + 1} Details`;
};

const generateResourceDefinitions = (snapshot: Record<string, unknown>): ResourceDefinition[] => {
	const definitions: ResourceDefinition[] = [];

	(['cpu', 'disk', 'network', 'gpu'] as InstanceResourceKey[]).forEach((resourceKey) => {
		const resourceIds = getInstanceIds(snapshot, resourceKey);
		const metadata = instanceResourceMetadata[resourceKey];

		resourceIds.forEach((resourceId, index) => {
			const total = resourceIds.length;
			definitions.push({
				id: resourceId,
				key: resourceKey,
				title: buildInstanceTitle(metadata.title, index, total),
				detailTitle: buildInstanceDetailTitle(metadata.detailTitle, index, total),
				color: metadata.color,
				axes: metadata.axes,
				unit: metadata.unit,
				min: metadata.min,
				max: metadata.max,
				initialValue: metadata.initialValue,
				detailMetrics: metadata.detailMetrics,
			});
		});
	});

	if (Object.prototype.hasOwnProperty.call(snapshot, 'memory')) {
		definitions.push({
			id: 'memory',
			key: 'memory',
			title: memoryResourceMetadata.title,
			detailTitle: memoryResourceMetadata.detailTitle,
			color: memoryResourceMetadata.color,
			axes: memoryResourceMetadata.axes,
			unit: memoryResourceMetadata.unit,
			min: memoryResourceMetadata.min,
			max: memoryResourceMetadata.max,
			initialValue: memoryResourceMetadata.initialValue,
			detailMetrics: memoryResourceMetadata.detailMetrics,
		});
	}

	return definitions;
};

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
	const { snapshot } = useSystemMetrics();
	const [selectedResource, setSelectedResource] = useState<string>('cpu');
	const resources = useMemo(() => generateResourceDefinitions(snapshot), [snapshot]);

	useEffect(() => {
		if (resources.length === 0) {
			return;
		}

		if (!resources.some((resource) => resource.id === selectedResource)) {
			setSelectedResource(resources[0].id);
		}
	}, [resources, selectedResource]);

	const selectedDetail = useMemo(
		() => resources.find((resource) => resource.id === selectedResource) ?? resources[0],
		[resources, selectedResource],
	);

	return {
		resources,
		selectedResource,
		setSelectedResource,
		selectedDetail,
	};
};

export const useResourceDetailMetrics = (resourceId: string) => {
	const { getCurrent, snapshot } = useSystemMetrics();
	const resource = useMemo(() => generateResourceDefinitions(snapshot).find((definition) => definition.id === resourceId), [resourceId, snapshot]);
	const metrics = resource?.detailMetrics ?? [];

	return useMemo(() => {
		return metrics.map((metric) => {
			const value = getCurrent(resourceId, metric.metricKey);

			return {
				...metric,
				value,
				formatted: formatMetricValue(value, metric),
			};
		});
	}, [getCurrent, metrics, resourceId]);
};