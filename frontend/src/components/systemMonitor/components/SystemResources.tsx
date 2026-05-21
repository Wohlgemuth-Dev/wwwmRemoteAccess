import React from 'react';
import DeviceMetricChart from './DeviceMetricChart';
import ResourceDetailMetrics from './ResourceDetailMetrics';
import ResourceInfoCards from './ResourceInfoCards';
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

const cumulativeBytesToMbps = (series: ChartPoint[], sampleIntervalSeconds = 5): ChartPoint[] => {
    // Convert cumulative byte counts to Mbps per sample and apply
    // a short smoothing window + threshold to avoid tiny jitter spikes
    const raw: number[] = series.map((point, index) => {
        const previousValue = series[index - 1]?.value ?? point.value;
        const deltaBytes = index === 0 ? 0 : Math.max(point.value - previousValue, 0);
        const mbps = (deltaBytes * 8) / sampleIntervalSeconds / 1_000_000;
        return Number.isFinite(mbps) && mbps >= 0 ? mbps : 0;
    });

    const result: ChartPoint[] = raw.map((_, index) => {
        // 3-sample moving average (current + up to two previous samples)
        const window: number[] = [];
        for (let w = 0; w < 3; w++) {
            const i = index - w;
            if (i >= 0) window.push(raw[i]);
        }
        const smoothed = window.reduce((s, v) => s + v, 0) / Math.max(window.length, 1);

        // threshold small values (e.g., < 0.005 Mbps ~= 5 Kbps) to zero to avoid visible spikes
        const threshold = 0.005;
        const cleaned = smoothed >= threshold ? smoothed : 0;

        return { index: series[index].index, value: cleaned };
    });

    return result;
};

const getNetworkChartBounds = (series: ChartPoint[]) => {
    const values = series.flatMap((point) => [point.value, point.sent].filter((value): value is number => typeof value === 'number' && Number.isFinite(value)));

    if (values.length === 0) {
        return { min: 0, max: 1 };
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const spread = Math.max(maxValue - minValue, 0.01);
    const padding = Math.max(spread * 0.25, 0.01);

    return {
        min: Math.max(0, minValue - padding),
        max: maxValue + padding,
    };
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
        if (selectedDetail.key === 'network') {
            const received = cumulativeBytesToMbps(getSeries(selectedDetail.id, 'bytesRecv'));
            const sent = cumulativeBytesToMbps(getSeries(selectedDetail.id, 'bytesSent'));
            return mergeSeries(received, { sent });
        }

        if (!selectedIsDisk && selectedDetail.id !== 'memory') return getSeries(selectedDetail.id);

        if (selectedDetail.id === 'memory') {
            // merge primary usage series with the swap percentage series so the chart
            // has both `value` (usage) and `swap` fields available for plotting
            const primary = getSeries(selectedDetail.id, 'usage');
            const merged = mergeSeries(primary, { swap: getSeries(selectedDetail.id, 'swap') });
            return merged;
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
            return copy;
        });
    })();
    const selectedNetworkBounds = selectedDetail.key === 'network' ? getNetworkChartBounds(selectedChartData) : null;

    return (
        <div className="SystemResources">
            <div className="SystemResourcesList tile graph" role="tablist" aria-label="System resources">
                {resources.map((resource) => {
                    const isSelected = selectedResource === resource.id;

                    // Build the tile series using the same transforms as the detail chart.
                    // This ensures tiles and details are plotted from the same data shape
                    // and use consistent units (e.g., network -> Mbps, disk -> KB).
                    let tileSeries: ChartPoint[] = [];
                    if (resource.key === 'network') {
                        const received = cumulativeBytesToMbps(getSeries(resource.id, 'bytesRecv'));
                        const sent = cumulativeBytesToMbps(getSeries(resource.id, 'bytesSent'));
                        tileSeries = mergeSeries(received, { sent });
                    } else if (resource.key === 'memory') {
                        const primary = getSeries(resource.id, 'usage');
                        tileSeries = mergeSeries(primary, { swap: getSeries(resource.id, 'swap') });
                    } else if (resource.key === 'disk') {
                        const KB = 1024;
                        const raw = mergeSeries(getSeries(resource.id, 'readSpeed'), { writeSpeed: getSeries(resource.id, 'writeSpeed') });
                        tileSeries = raw.map((pt) => {
                            const copy = { ...pt } as any;
                            if (typeof copy.value === 'number') copy.value = copy.value / KB;
                            if (typeof copy.readSpeed === 'number') copy.readSpeed = copy.readSpeed / KB;
                            if (typeof copy.writeSpeed === 'number') copy.writeSpeed = copy.writeSpeed / KB;
                            return copy;
                        });
                    } else {
                        tileSeries = getSeries(resource.id);
                    }

                    // compute compact tile bounds only for non-% resources (e.g. network)
                    // Percentage-based resources (CPU, memory, disk, GPU) should keep
                    // the configured min/max so their tiles don't get rescaled.
                    const tileValues = tileSeries.map((pt) => pt.value).filter((v) => typeof v === 'number' && Number.isFinite(v));
                    const shouldAutoScale = !String(resource.unit).includes('%');
                    const maxValue = tileValues.length > 0 ? Math.max(...tileValues) : 0;
                    // If auto-scaling is enabled and there are values, compute bounds from data.
                    // Otherwise, fall back to an explicit numeric min/max.
                    // For percentage resources, enforce 0-100 explicitly to avoid any
                    // accidental auto-scaling by Recharts.
                    const tileMax = shouldAutoScale && tileValues.length > 0 ? Math.max(maxValue * 1.25, 0.01) : (String(resource.unit).includes('%') ? 100 : (resource.max ?? 100));
                    const tileMin = shouldAutoScale && tileValues.length > 0 ? 0 : (String(resource.unit).includes('%') ? 0 : (resource.min ?? 0));

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
                                    ? `${(Number(getCurrent(resource.id)) ?? 0).toFixed(2)}${resource.unit}`
                                    : `${Math.round(getCurrent(resource.id))}${resource.unit}`
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