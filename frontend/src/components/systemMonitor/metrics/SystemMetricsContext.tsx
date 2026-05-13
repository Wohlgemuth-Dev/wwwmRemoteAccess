import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ChartPoint, MetricKey, ResourceKey, SystemMetricsSnapshot } from './SystemMetricsTypes';
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
};

const SystemMetricsContext = createContext<SystemMetricsContextValue | null>(null);

interface SystemMetricsProviderProps {
    children?: React.ReactNode;
    updater?: SystemMetricsUpdater;
}

export const SystemMetricsProvider: React.FC<SystemMetricsProviderProps> = ({ children, updater }) => {
    const [snapshot, setSnapshot] = useState<SystemMetricsSnapshot>(emptySnapshot);

    const source = useMemo(() => updater ?? new SimulatedSystemMetricsUpdater(), [updater]);

    useEffect(() => {
        return source.start(setSnapshot);
    }, [source]);

    const getSeries = (resourceKey: ResourceKey, metricKey: MetricKey = 'usage') => {
        return snapshot[resourceKey][metricKey] ?? [];
    };

    const getCurrent = (resourceKey: ResourceKey, metricKey: MetricKey = 'usage') => {
        const series = snapshot[resourceKey][metricKey] ?? [];
        return series[series.length - 1]?.value ?? 0;
    };

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
