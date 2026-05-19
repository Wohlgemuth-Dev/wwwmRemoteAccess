import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ChartPoint, MetricKey, ResourceKey, SystemMetricsSnapshot } from './SystemMetricsTypes';
import { BackendSystemMetricsUpdater } from './BackendSystemMetricsUpdater';
import { SimulatedSystemMetricsUpdater, type SystemMetricsUpdater } from './SystemMetricsUpdater';

interface SystemMetricsContextValue {
    snapshot: SystemMetricsSnapshot;
    getSeries: (resourceKey: ResourceKey, metricKey?: MetricKey) => ChartPoint[];
    getCurrent: (resourceKey: ResourceKey, metricKey?: MetricKey) => number;
}

const emptySnapshot: SystemMetricsSnapshot = {
    cpu: {},
    memory: {},
    disk: {},
    network: {},
    gpu: {},
};

const SystemMetricsContext = createContext<SystemMetricsContextValue | null>(null);

interface SystemMetricsProviderProps {
    children?: React.ReactNode;
    updater?: SystemMetricsUpdater;
}

export const SystemMetricsProvider: React.FC<SystemMetricsProviderProps> = ({ children, updater }) => {
    const [snapshot, setSnapshot] = useState<SystemMetricsSnapshot>(emptySnapshot);

    const source = useMemo(() => updater ?? new BackendSystemMetricsUpdater(), [updater]);

    useEffect(() => {
        return source.start(setSnapshot);
    }, [source]);

    const getSeries = useCallback(
        (resourceKey: ResourceKey, metricKey: MetricKey = 'usage') => {
            return snapshot[resourceKey][metricKey] ?? [];
        },
        [snapshot],
    );

    const getCurrent = useCallback(
        (resourceKey: ResourceKey, metricKey: MetricKey = 'usage') => {
            const series = snapshot[resourceKey][metricKey] ?? [];
            return series[series.length - 1]?.value ?? 0;
        },
        [snapshot],
    );

    return (
        <SystemMetricsContext.Provider value={{ snapshot, getSeries, getCurrent }}>
            {children}
        </SystemMetricsContext.Provider>
    );
};

export const useSystemMetrics = () => {
    const ctx = useContext(SystemMetricsContext);
    if (!ctx) throw new Error('useSystemMetrics must be used inside SystemMetricsProvider');
    return ctx;
};

export type { ChartPoint, MetricKey, ResourceKey, SystemMetricsSnapshot } from './SystemMetricsTypes';
