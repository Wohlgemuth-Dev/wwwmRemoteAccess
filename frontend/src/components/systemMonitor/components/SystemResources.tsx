import React from 'react';
import DeviceMetricChart from './DeviceMetricChart';
import ResourceDetailMetrics from './ResourceDetailMetrics';
import { useSystemMetrics, type ChartPoint } from '../metrics';
import { useResourceCatalog } from '../hooks';

const mergeSeries = (primary: ChartPoint[], extras: Record<string, ChartPoint[]>): ChartPoint[] => {
    const combined = new Map<number, ChartPoint>();

    primary.forEach((point) => {
        combined.set(point.index, { index: point.index, value: point.value });
    });

    Object.entries(extras).forEach(([key, series]) => {
        series.forEach((point) => {
            const existing = combined.get(point.index) ?? { index: point.index, value: 0 };
            existing[key] = point.value;
            combined.set(point.index, existing);
        });
    });

    return Array.from(combined.values()).sort((left, right) => left.index - right.index);
};

const SystemResources: React.FC = () => {
    const { getSeries, getCurrent } = useSystemMetrics();
    const { resources, selectedResource, setSelectedResource, selectedDetail } = useResourceCatalog();

    if (!selectedDetail) {
        return (
            <div className="SystemResources">
                <div className="SystemResourcesList" role="tablist" aria-label="System resources" />
                <div aria-hidden="true" className="SystemResourcesDivider" />
                <div className="SystemResourceDetails" role="tabpanel">
                    <div className="SystemResourceDetailsHeader">
                        <h1>Loading system resources</h1>
                    </div>
                </div>
            </div>
        );
    }

    const selectedIsDisk = selectedDetail.key === 'disk';
    const selectedChartAxes = selectedIsDisk
        ? { xLabel: 'Samples', yLabel: 'KB/s' }
        : selectedDetail.axes;
    const selectedChartUnit = selectedIsDisk ? ' KB/s' : selectedDetail.unit;
    const selectedChartData = (() => {
        if (!selectedIsDisk) return getSeries(selectedDetail.id);

        const KB = 1024;
        const raw = mergeSeries(getSeries(selectedDetail.id, 'readSpeed'), {
            writeSpeed: getSeries(selectedDetail.id, 'writeSpeed'),
        });

        return raw.map((pt) => {
            const copy = { ...pt } as any;
            if (typeof copy.value === 'number') copy.value = copy.value / KB;
            if (typeof copy.readSpeed === 'number') copy.readSpeed = copy.readSpeed / KB;
            if (typeof copy.writeSpeed === 'number') copy.writeSpeed = copy.writeSpeed / KB;
            return copy;
        });
    })();

    return (
        <div className="SystemResources">
            <div className="SystemResourcesList" role="tablist" aria-label="System resources">
                {resources.map((resource) => {
                    const isSelected = selectedResource === resource.id;

                    return (
                        <button
                            key={resource.id}
                            type="button"
                            className={`SystemResourceTile${isSelected ? ' is-selected' : ''}`}
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedResource(resource.id)}
                        >
                            <div className="ResourceTileGraph" aria-hidden="true">
                                <DeviceMetricChart
                                    color={resource.color}
                                    axes={resource.axes}
                                    compact
                                    data={getSeries(resource.id)}
                                    unit={resource.unit}
                                />
                            </div>
                            <div className="ResourceTileContent">
                                <h2>{resource.title}</h2>
                                <p>{`${Math.round(getCurrent(resource.id))}${resource.unit}`}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div aria-hidden="true" className="SystemResourcesDivider" />
            <div className="SystemResourceDetails" role="tabpanel">
                <div className="SystemResourceDetailsHeader">
                    <h1>{selectedDetail.detailTitle}</h1>
                </div>
                <div className="SystemResourceDetailsChart">
                    <DeviceMetricChart
                        color={selectedDetail.color}
                        axes={selectedChartAxes}
                        data={selectedChartData}
                        // let disk charts autoscale in KB/s; other resources keep configured bounds
                        min={selectedIsDisk ? undefined : selectedDetail.min}
                        max={selectedIsDisk ? undefined : selectedDetail.max}
                        initialValue={selectedIsDisk ? undefined : selectedDetail.initialValue}
                        unit={selectedChartUnit}
                        primarySeriesLabel={selectedIsDisk ? 'Read' : undefined}
                        series={selectedIsDisk ? [
                            { dataKey: 'readSpeed', label: 'Read', color: '#60a5fa', unit: ' KB/s' },
                            { dataKey: 'writeSpeed', label: 'Write', color: '#f97316', unit: ' KB/s' },
                        ] : []}
                    />
                </div>
                <ResourceDetailMetrics resourceId={selectedDetail.id} />
            </div>
        </div>
    );
}

export default SystemResources;