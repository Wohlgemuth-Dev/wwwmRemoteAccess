import React, { useMemo } from 'react';
import { useSystemMetrics, type ResourceKey } from '../metrics';

// Constants for unit conversion and formatting
const CPU_SPEED_CONVERSION_FACTOR = 1000; // MHz to GHz
const CPU_SPEED_DECIMALS = 2;
const DEFAULT_CONVERSION_FACTOR = 1;
const DEFAULT_DECIMALS = 0;

interface DetailMetricConfig {
	metricKey: 'speed' | 'threads' | 'available';
	label: string;
	unit: string;
	/**
	 * Factor to convert the raw value to display value.
	 * For example: 1000 to convert MHz to GHz.
	 * Defaults to 1 (no conversion).
	 */
	conversionFactor?: number;
	/**
	 * Number of decimal places to display.
	 * Defaults to 0.
	 */
	decimals?: number;
}

interface ResourceMetricsConfig {
	[key: string]: DetailMetricConfig[];
}

const metricsConfig: ResourceMetricsConfig = {
	cpu: [
		{ metricKey: 'speed', label: 'Speed', unit: ' GHz', decimals: CPU_SPEED_DECIMALS, conversionFactor: CPU_SPEED_CONVERSION_FACTOR },
		{ metricKey: 'threads', label: 'Threads', unit: '', decimals: DEFAULT_DECIMALS },
	],
	memory: [
		{ metricKey: 'available', label: 'Available', unit: '%', decimals: DEFAULT_DECIMALS },
	],
	disk: [],
	network: [],
};

interface ResourceDetailMetricsProps {
	resourceKey: ResourceKey;
}

const formatMetricValue = (value: number, config: DetailMetricConfig): string => {
	const factor = config.conversionFactor ?? DEFAULT_CONVERSION_FACTOR;
	const decimals = config.decimals ?? DEFAULT_DECIMALS;
	const converted = value / factor;
	const formatted = decimals === 0 ? Math.round(converted) : converted.toFixed(decimals);
	return `${formatted}${config.unit}`;
};

const ResourceDetailMetrics: React.FC<ResourceDetailMetricsProps> = ({ resourceKey }) => {
	const { getCurrent } = useSystemMetrics();
	const metrics = metricsConfig[resourceKey] || [];

	const metricValues = useMemo(() => {
		return metrics.map((metric) => ({
			...metric,
			value: getCurrent(resourceKey, metric.metricKey),
			formatted: formatMetricValue(getCurrent(resourceKey, metric.metricKey), metric),
		}));
	}, [resourceKey, metrics, getCurrent]);

	if (metricValues.length === 0) {
		return null;
	}

	return (
		<div className="ResourceDetailMetrics">
			{metricValues.map((metric) => (
				<div key={metric.metricKey} className="DetailMetricItem">
					<div className="DetailMetricLabel">{metric.label}</div>
					<div className="DetailMetricValue">{metric.formatted}</div>
				</div>
			))}
		</div>
	);
};

export default ResourceDetailMetrics;
