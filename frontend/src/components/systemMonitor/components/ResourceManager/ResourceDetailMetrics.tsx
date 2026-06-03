import React from 'react';
import { useResourceDetailMetrics } from '../../hooks';
import { formatAutoRate } from '../../formatters';
import MetricCards, { type MetricCardItem } from './MetricCards';

interface ResourceDetailMetricsProps {
    resourceId: string;
    networkDisplayUnit?: string;
}

const ResourceDetailMetrics: React.FC<ResourceDetailMetricsProps> = ({ resourceId, networkDisplayUnit }) => {
    const metricValues = useResourceDetailMetrics(resourceId);
    const items: MetricCardItem[] = metricValues.map((metric) => ({
        key: metric.metricKey,
        label: metric.label,
        value: resourceId.startsWith('network') && metric.metricKey === 'usage' && networkDisplayUnit
            ? formatAutoRate(metric.value, 2, networkDisplayUnit).valueText
            : metric.formatted,
    }));

    if (items.length === 0) {
        return null;
    }

    return <MetricCards className="ResourceDetailMetrics" items={items} />;
};

export default ResourceDetailMetrics;
