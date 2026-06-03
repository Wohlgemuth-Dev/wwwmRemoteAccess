import React from 'react';
import DeviceMetricChart from './DeviceMetricChart';
import ResourceDetailMetrics from './ResourceDetailMetrics';
import ResourceInfoCards from './ResourceInfoCards';
import { useSystemMetrics, type ChartPoint } from '../../metrics';
import { useResourceCatalog } from '../../hooks';
import { mergeSeries, getNetworkChartBounds } from '../../metrics/seriesUtils';
import { formatAutoRate, formatNumberWithUnit } from '../../formatters';

const SystemResources: React.FC = () => {
    const { getSeries, getCurrent } = useSystemMetrics();
    const { resources, selectedResource, setSelectedResource, selectedDetail } = useResourceCatalog();

    const getTileBounds = (resourceUnit: string, tileSeries: ChartPoint[]) => {
        const values = tileSeries.flatMap((s) => [s.value, s.sent, s.readSpeed, s.writeSpeed].filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));

        if (values.length === 0) {
            return resourceUnit === '%' ? { min: 0, max: 100 } : { min: 0, max: 1 };
        }

        const allZero = values.every((value) => value === 0);
        if (allZero) {
            return { min: 0, max: 1 };
        }

        if (resourceUnit === '%') {
            return { min: 0, max: 100 };
        }

        return {
            min: Math.min(...values),
            max: Math.max(...values),
        };
    };

    const normalizeNetworkSeries = (series: ChartPoint[], baseUnit = ' Mbps') => {
        if (!Array.isArray(series) || series.length === 0) {
            return { series, unit: baseUnit, scale: 1 };
        }

        const values = series.flatMap((s) => [s.value, s.sent].filter((v): v is number => typeof v === 'number' && Number.isFinite(v)));
        const maxAbs = values.length > 0 ? Math.max(...values.map((v) => Math.abs(v))) : 0;
        const smallValueThresholdMbps = 0.01;
        const noiseThresholdMbps = 0.000001;
        const scale = maxAbs > 0 && maxAbs < smallValueThresholdMbps ? 1000 : 1;
        const unit = scale === 1000 ? ' Kbps' : baseUnit;

        const normalized = series.map((pt) => {
            const copy = { ...pt } as any;
            Object.keys(copy).forEach((k) => {
                if (k === 'index') return;
                if (typeof copy[k] !== 'number') return;

                const scaledValue = copy[k] * scale;
                copy[k] = Math.abs(scaledValue) < (noiseThresholdMbps * scale) ? 0 : scaledValue;
            });
            return copy as ChartPoint;
        });

        return { series: normalized, unit, scale };
    };

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
    let selectedChartUnit = selectedIsDisk ? ' KB/s' : selectedDetail.unit;
    let selectedNetworkSeriesUnit = ' Mbps';
    const selectedChartData = (() => {
        if (selectedDetail.key === 'network') {
            const received = getSeries(selectedDetail.id, 'receivedMbps');
            const sent = getSeries(selectedDetail.id, 'sentMbps');
            const merged = mergeSeries(received, { sent });
            const scaled = normalizeNetworkSeries(merged, selectedDetail.unit);
            selectedChartUnit = scaled.unit;
            selectedNetworkSeriesUnit = scaled.unit;
            return scaled.series;
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
                            const recv = getSeries(resource.id, 'usage');
                            const sent = getSeries(resource.id, 'sentMbps');
                            const merged = mergeSeries(recv, { sent });
                            return normalizeNetworkSeries(merged, resource.unit);
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

                    const tileNetworkDisplay = resource.key === 'network'
                        ? (tileSeries as ReturnType<typeof normalizeNetworkSeries>)
                        : undefined;
                    const tileData = resource.key === 'network' ? tileNetworkDisplay!.series : (tileSeries as ChartPoint[]);
                    const { min: tileMin, max: tileMax } = getTileBounds(resource.unit, tileData);

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
                                    data={tileData}
                                    unit={resource.key === 'network' ? tileNetworkDisplay!.unit : resource.unit}
                                    interpolation={resource.key === 'network' ? 'linear' : undefined}
                                    valueDecimals={resource.key === 'network' ? 2 : 0}
                                    min={tileMin}
                                    max={tileMax}
                                />
                            </div>
                            <div className="ResourceTileContent">
                                <h2>{resource.title}</h2>
                                <p>{resource.key === 'network' ? (
                                    formatAutoRate(Number(getCurrent(resource.id)) * (tileNetworkDisplay?.scale ?? 1), 2, tileNetworkDisplay?.unit ?? resource.unit).valueText
                                ) : (
                                    formatNumberWithUnit(Number(getCurrent(resource.id)) ?? 0, 0, resource.unit)
                                )}</p>
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
                        axes={selectedDetail.key === 'network' ? { ...selectedChartAxes, yLabel: selectedNetworkSeriesUnit } : selectedChartAxes}
                        data={selectedChartData}
                        interpolation={selectedDetail.key === 'network' ? 'linear' : undefined}
                        // let disk charts autoscale in KB/s; other resources keep configured bounds
                        min={selectedNetworkBounds?.min ?? (selectedIsDisk ? undefined : selectedDetail.min)}
                        max={selectedNetworkBounds?.max ?? (selectedIsDisk ? undefined : selectedDetail.max)}
                        initialValue={selectedIsDisk ? undefined : selectedDetail.initialValue}
                        unit={selectedChartUnit}
                        showArea={true}
                        valueDecimals={selectedDetail.key === 'network' ? 2 : 0}
                        primarySeriesLabel={selectedDetail.key === 'network' ? 'Received' : selectedIsDisk ? 'Read' : undefined}
                        series={selectedDetail.key === 'memory' ? [
                            { dataKey: 'swap', label: 'Swap', color: '#60a5fa', unit: '%' },
                        ] : selectedDetail.key === 'network' ? [
                            { dataKey: 'sent', label: 'Sent', color: '#60a5fa', unit: selectedNetworkSeriesUnit },
                        ] : selectedIsDisk ? [
                            { dataKey: 'readSpeed', label: 'Read', color: '#60a5fa', unit: ' KB/s' },
                            { dataKey: 'writeSpeed', label: 'Write', color: '#f97316', unit: ' KB/s' },
                        ] : []}
                    />
                </div>
                <ResourceDetailMetrics resourceId={selectedDetail.id} networkDisplayUnit={selectedDetail.key === 'network' ? selectedNetworkSeriesUnit : undefined} />
                <ResourceInfoCards resourceId={selectedDetail.id} />
            </div>
        </div>
    );
}

export default SystemResources;
