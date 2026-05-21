import React from 'react';
import DeviceMetricChart from './DeviceMetricChart';
import ResourceDetailMetrics from './ResourceDetailMetrics';
import ResourceInfoCards from './ResourceInfoCards';
import { useSystemMetrics, type ChartPoint } from '../../metrics';
import { useResourceCatalog } from '../../hooks';
import { mergeSeries, cumulativeBytesToMbps, getNetworkChartBounds } from '../../metrics/seriesUtils';
import { formatMbps, formatNumberWithUnit } from '../../formatters';

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
        if (selectedDetail.key === 'network') {
            const received = cumulativeBytesToMbps(getSeries(selectedDetail.id, 'bytesRecv'));
            const sent = cumulativeBytesToMbps(getSeries(selectedDetail.id, 'bytesSent'));
            return mergeSeries(received, { sent });
        }

        if (!selectedIsDisk && selectedDetail.id !== 'memory') return getSeries(selectedDetail.id);

        if (selectedDetail.id === 'memory') {
            const primary = getSeries(selectedDetail.id, 'usage');
            return mergeSeries(primary, { swap: getSeries(selectedDetail.id, 'swap') });
        }

        const KB = 1024;
        const raw = mergeSeries(getSeries(selectedDetail.id, 'readSpeed'), {
            writeSpeed: getSeries(selectedDetail.id, 'writeSpeed'),
        });

        return raw.map((pt) => {
            const copy = { ...pt } as any;
            if (typeof copy.value === 'number') copy.value = copy.value / KB;
            if (typeof copy.readSpeed === 'number') copy.readSpeed = copy.readSpeed / KB;
            if (typeof copy.writeSpeed === 'number') copy.writeSpeed = copy.writeSpeed / KB;
            return copy as ChartPoint;
        });
    })();

    const selectedNetworkBounds = selectedDetail.key === 'network' ? getNetworkChartBounds(selectedChartData) : undefined;

    return (
        <div className="SystemResources">
            <div className="SystemResourcesList tile graph" role="tablist" aria-label="System resources">
                {resources.map((resource) => {
                    const isSelected = selectedResource === resource.id;
                    const tileSeries = (() => {
                        if (resource.key === 'network') {
                            const recv = cumulativeBytesToMbps(getSeries(resource.id, 'bytesRecv'));
                            const sent = cumulativeBytesToMbps(getSeries(resource.id, 'bytesSent'));
                            return mergeSeries(recv, { sent });
                        }

                        if (resource.key === 'memory') {
                            const primary = getSeries(resource.id, 'usage');
                            return mergeSeries(primary, { swap: getSeries(resource.id, 'swap') });
                        }

                        if (resource.key === 'disk') {
                            const KB = 1024;
                            return mergeSeries(getSeries(resource.id, 'readSpeed'), { writeSpeed: getSeries(resource.id, 'writeSpeed') }).map((pt) => {
                                const copy = { ...pt } as any;
                                if (typeof copy.value === 'number') copy.value = copy.value / KB;
                                if (typeof copy.readSpeed === 'number') copy.readSpeed = copy.readSpeed / KB;
                                if (typeof copy.writeSpeed === 'number') copy.writeSpeed = copy.writeSpeed / KB;
                                return copy as ChartPoint;
                            });
                        }

                        return getSeries(resource.id);
                    })();

                    // compute tile numeric min/max and enforce percent tiles to 0..100
                    const values = tileSeries.flatMap((s) => [s.value, s.sent, s.readSpeed, s.writeSpeed].filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
                    const tileMin = resource.unit === '%' ? 0 : (values.length > 0 ? Math.min(...values) : 0);
                    const tileMax = resource.unit === '%' ? 100 : (values.length > 0 ? Math.max(...values) : 1);

                    return (
                        <button
                            key={resource.id}
                            role="tab"
                            aria-selected={isSelected}
                            className={`SystemResourceTile ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => setSelectedResource(resource.id)}
                        >
                            <div className="ResourceTileGraph" aria-hidden="true">
                                <DeviceMetricChart
                                    color={resource.color}
                                    axes={resource.axes}
                                    compact
                                    data={tileSeries}
                                    unit={resource.unit}
                                    interpolation={resource.key === 'network' ? 'linear' : undefined}
                                    valueDecimals={resource.key === 'network' ? 2 : 0}
                                    min={tileMin}
                                    max={tileMax}
                                />
                            </div>
                            <div className="ResourceTileContent">
                                <h2>{resource.title}</h2>
                                <p>{resource.key === 'network'
                                    ? formatMbps(Number(getCurrent(resource.id)) ?? 0, 2)
                                    : formatNumberWithUnit(Number(getCurrent(resource.id)) ?? 0, 0, resource.unit)
                                }</p>
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
                        interpolation={selectedDetail.key === 'network' ? 'linear' : undefined}
                        // let disk charts autoscale in KB/s; other resources keep configured bounds
                        min={selectedNetworkBounds?.min ?? (selectedIsDisk ? undefined : selectedDetail.min)}
                        max={selectedNetworkBounds?.max ?? (selectedIsDisk ? undefined : selectedDetail.max)}
                        initialValue={selectedIsDisk ? undefined : selectedDetail.initialValue}
                        unit={selectedChartUnit}
                        showArea={selectedDetail.key !== 'network'}
                        valueDecimals={selectedDetail.key === 'network' ? 2 : 0}
                        primarySeriesLabel={selectedDetail.key === 'network' ? 'Received' : selectedIsDisk ? 'Read' : undefined}
                        series={selectedDetail.key === 'memory' ? [
                            { dataKey: 'swap', label: 'Swap', color: '#60a5fa', unit: '%' },
                        ] : selectedDetail.key === 'network' ? [
                            { dataKey: 'sent', label: 'Sent', color: '#60a5fa', unit: ' Mbps' },
                        ] : selectedIsDisk ? [
                            { dataKey: 'readSpeed', label: 'Read', color: '#60a5fa', unit: ' KB/s' },
                            { dataKey: 'writeSpeed', label: 'Write', color: '#f97316', unit: ' KB/s' },
                        ] : []}
                    />
                </div>
                <ResourceDetailMetrics resourceId={selectedDetail.id} />
                <ResourceInfoCards resourceId={selectedDetail.id} />
            </div>
        </div>
    );
}

export default SystemResources;
