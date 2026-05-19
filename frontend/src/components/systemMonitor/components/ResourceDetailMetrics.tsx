import React from 'react';
import { useResourceDetailMetrics } from '../hooks';

interface ResourceDetailMetricsProps {
	resourceId: string;
}

const ResourceDetailMetrics: React.FC<ResourceDetailMetricsProps> = ({ resourceId }) => {
	const metricValues = useResourceDetailMetrics(resourceId);

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
