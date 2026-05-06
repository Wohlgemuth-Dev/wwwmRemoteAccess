import { ChartPoint, MetricKey, ResourceKey, SystemMetricsSnapshot } from './SystemMetricsTypes';

export interface SystemMetricsUpdater {
    start: (onSnapshot: (snapshot: SystemMetricsSnapshot) => void) => () => void;
}

interface SeedConfig {
    value: number;
    metrics: MetricKey[];
}

const DEFAULT_POINT_COUNT = 24;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const buildInitialSeries = (pointCount: number, initialValue: number, min: number, max: number): ChartPoint[] => {
    return Array.from({ length: pointCount }, (_, index) => ({
        index,
        value: clamp(initialValue + Math.sin(index / 3) * 8 + (index % 4 - 1.5) * 2, min, max),
    }));
};

const seedConfig: Record<ResourceKey, SeedConfig> = {
    cpu: { value: 45, metrics: ['usage', 'speed', 'threads'] },
    memory: { value: 60, metrics: ['usage', 'available'] },
    disk: { value: 70, metrics: ['usage'] },
    network: { value: 20, metrics: ['usage'] },
};

const metricBounds: Record<MetricKey, { min: number; max: number }> = {
    usage: { min: 0, max: 100 },
    speed: { min: 0, max: 100 },
    threads: { min: 0, max: 64 },
    available: { min: 0, max: 100 },
};

const makeInitialSnapshot = (pointCount: number): SystemMetricsSnapshot => {
    return (Object.keys(seedConfig) as ResourceKey[]).reduce<SystemMetricsSnapshot>((snapshot, resourceKey) => {
        const config = seedConfig[resourceKey];
        const series = config.metrics.reduce<NonNullable<SystemMetricsSnapshot[ResourceKey]>>((resourceSnapshot, metricKey) => {
            const bounds = metricBounds[metricKey];
            resourceSnapshot[metricKey] = buildInitialSeries(pointCount, config.value, bounds.min, bounds.max);
            return resourceSnapshot;
        }, {});

        snapshot[resourceKey] = series;
        return snapshot;
    }, { cpu: {}, memory: {}, disk: {}, network: {} });
};

const nextValueForMetric = (metricKey: MetricKey, currentValue: number) => {
    const bounds = metricBounds[metricKey];
    const driftScale = metricKey === 'threads' ? 3 : metricKey === 'speed' ? 5 : 6;
    const nextValue = currentValue + (Math.random() - 0.5) * driftScale;
    return clamp(nextValue, bounds.min, bounds.max);
};

export class SimulatedSystemMetricsUpdater implements SystemMetricsUpdater {
    constructor(private readonly pointCount = DEFAULT_POINT_COUNT) {}

    start(onSnapshot: (snapshot: SystemMetricsSnapshot) => void) {
        let snapshot = makeInitialSnapshot(this.pointCount);
        onSnapshot(snapshot);

        const intervalId = window.setInterval(() => {
            snapshot = (Object.keys(snapshot) as ResourceKey[]).reduce<SystemMetricsSnapshot>((nextSnapshot, resourceKey) => {
                const resourceMetrics = snapshot[resourceKey];
                const nextResourceMetrics = Object.keys(resourceMetrics).reduce<NonNullable<SystemMetricsSnapshot[ResourceKey]>>(
                    (nextResource, metricName) => {
                        const metricKey = metricName as MetricKey;
                        const series = resourceMetrics[metricKey] ?? [];
                        const lastValue = series[series.length - 1]?.value ?? 0;
                        const nextSeries = [...series.slice(1), { index: series[series.length - 1].index + 1, value: nextValueForMetric(metricKey, lastValue) }];
                        nextResource[metricKey] = nextSeries;
                        return nextResource;
                    },
                    {},
                );

                nextSnapshot[resourceKey] = nextResourceMetrics;
                return nextSnapshot;
            }, { cpu: {}, memory: {}, disk: {}, network: {} });

            onSnapshot(snapshot);
        }, 1000);

        return () => window.clearInterval(intervalId);
    }
}
