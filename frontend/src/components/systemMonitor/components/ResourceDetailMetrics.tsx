import React from 'react';
import { type ResourceKey } from '../metrics';
import { useResourceDetailMetrics } from '../hooks';

interface ResourceDetailMetricsProps {
	resourceKey: ResourceKey;
}

const ResourceDetailMetrics: React.FC<ResourceDetailMetricsProps> = ({ resourceKey }) => {
	const metricValues = useResourceDetailMetrics(resourceKey);

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
