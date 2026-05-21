import React from 'react';
import { useResourceDetailMetrics } from '../hooks';
import MetricCards, { type MetricCardItem } from './MetricCards';

interface ResourceDetailMetricsProps {
    resourceId: string;
}

const ResourceDetailMetrics: React.FC<ResourceDetailMetricsProps> = ({ resourceId }) => {
    const metricValues = useResourceDetailMetrics(resourceId);
    const items: MetricCardItem[] = metricValues.map((metric) => ({
        key: metric.metricKey,
        label: metric.label,
        value: metric.formatted,
    }));

    if (items.length === 0) {
        return null;
    }

    return <MetricCards className="ResourceDetailMetrics" items={items} />;
};

export default ResourceDetailMetrics;
