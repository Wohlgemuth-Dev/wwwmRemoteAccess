import React, { useMemo, useState } from 'react';
import DeviceMetricChart, { type ChartAxes } from './DeviceMetricChart';
import { useSystemMetrics, type ResourceKey } from '../metrics';

interface ResourceInfo {
    key: ResourceKey;
    title: string;
    summary: string;
    detailTitle: string;
    detailText: string;
    color: string;
    axes: ChartAxes;
    unit: string;
    min: number;
    max: number;
    initialValue: number;
}

const resources: ResourceInfo[] = [
    {
        key: 'cpu',
        title: 'CPU Usage',
        summary: 'Current CPU usage: 45%',
        detailTitle: 'CPU Details',
        detailText: 'CPU load is moderate. Top processes and per-core utilization will be shown here.',
        color: '#7ba7d6',
        axes: { xLabel: 'Samples', yLabel: 'CPU %' },
        unit: '%',
        min: 0,
        max: 100,
        initialValue: 45,
    },
    {
        key: 'memory',
        title: 'Memory Usage',
        summary: 'Current memory usage: 60%',
        detailTitle: 'Memory Details',
        detailText: 'Memory usage is stable. Breakdown by process and cache usage will be shown here.',
        color: '#7dd3fc',
        axes: { xLabel: 'Samples', yLabel: 'Memory %' },
        unit: '%',
        min: 0,
        max: 100,
        initialValue: 60,
    },
    {
        key: 'disk',
        title: 'Disk Usage',
        summary: 'Current disk usage: 70%',
        detailTitle: 'Disk Details',
        detailText: 'Disk utilization is elevated. Partition usage and IO activity will be shown here.',
        color: '#fbbf24',
        axes: { xLabel: 'Samples', yLabel: 'Disk %' },
        unit: '%',
        min: 0,
        max: 100,
        initialValue: 70,
    },
    {
        key: 'network',
        title: 'Network Usage',
        summary: 'Current network usage: 20 Mbps',
        detailTitle: 'Network Details',
        detailText: 'Network throughput is healthy. Interface traffic and connection details will be shown here.',
        color: '#34d399',
        axes: { xLabel: 'Samples', yLabel: 'Mbps' },
        unit: ' Mbps',
        min: 0,
        max: 100,
        initialValue: 20,
    },
];

const SystemResources: React.FC = () => {
    const [selectedResource, setSelectedResource] = useState<ResourceKey>('cpu');
    const { getSeries, getCurrent } = useSystemMetrics();

    const selectedDetail = useMemo(
        () => resources.find((resource) => resource.key === selectedResource) ?? resources[0],
        [selectedResource],
    );

    return (
        <div className="SystemResources">
            <div className="SystemResourcesList" role="tablist" aria-label="System resources">
                {resources.map((resource) => {
                    const isSelected = selectedResource === resource.key;

                    return (
                        <button
                            key={resource.key}
                            type="button"
                            className={`SystemResourceTile${isSelected ? ' is-selected' : ''}`}
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedResource(resource.key)}
                        >
                                    <div className="ResourceTileGraph" aria-hidden="true">
                                        <DeviceMetricChart
                                            color={resource.color}
                                            axes={resource.axes}
                                            compact
                                            data={getSeries(resource.key)}
                                            unit={resource.unit}
                                        />
                                    </div>
                            <div className="ResourceTileContent">
                                <h2>{resource.title}</h2>
                                <p>{`${Math.round(getCurrent(resource.key))}${resource.unit}`}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div aria-hidden="true" className="SystemResourcesDivider" />
            <div className="SystemResourceDetails" role="tabpanel">
                <div className="SystemResourceDetailsHeader">
                    <h1>{selectedDetail.detailTitle}</h1>
                    <p>{selectedDetail.detailText}</p>
                </div>
                <div className="SystemResourceDetailsChart">
                    <DeviceMetricChart
                        color={selectedDetail.color}
                        axes={selectedDetail.axes}
                        data={getSeries(selectedDetail.key)}
                        min={selectedDetail.min}
                        max={selectedDetail.max}
                        initialValue={selectedDetail.initialValue}
                        unit={selectedDetail.unit}
                    />
                </div>
            </div>
        </div>
    );
}

export default SystemResources;