import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ChartPoint, MetricKey, SystemMetricsSnapshot } from './SystemMetricsTypes';
import { BackendSystemMetricsUpdater } from './BackendSystemMetricsUpdater';
import type { SystemMetricsUpdater } from './SystemMetricsUpdater';

interface SystemMetricsContextValue {
    snapshot: SystemMetricsSnapshot;
    getSeries: (resourceId: string, metricKey?: MetricKey) => ChartPoint[];
    getCurrent: (resourceId: string, metricKey?: MetricKey) => number;
}

const emptySnapshot: SystemMetricsSnapshot = {};

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

    const dedupeSeries = useCallback((series: ChartPoint[] = []) => {
        const map = new Map<number, ChartPoint>();
        series.forEach((pt) => map.set(pt.index, pt));
        return Array.from(map.values()).sort((a, b) => a.index - b.index);
    }, []);

    const getSeries = useCallback(
        (resourceId: string, metricKey: MetricKey = 'usage') => {
            const raw = snapshot[resourceId]?.[metricKey] ?? [];
            return dedupeSeries(raw);
        },
        [snapshot, dedupeSeries],
    );

    const getCurrent = useCallback(
        (resourceId: string, metricKey: MetricKey = 'usage') => {
            const series = dedupeSeries(snapshot[resourceId]?.[metricKey] ?? []);
            return series[series.length - 1]?.value ?? 0;
        },
        [snapshot, dedupeSeries],
    );

    return (
        <SystemMetricsContext.Provider value={{ snapshot, getSeries, getCurrent }}>
            {children}
        </SystemMetricsContext.Provider>
    );
};

export const useSystemMetrics = () => {
    const ctx = useContext(SystemMetricsContext);
    if (!ctx) {
        // Fallback: avoid hard crash when a component accidentally consumes the hook
        // outside the provider (helps robustness during rendering transitions).
        // Return a minimal, safe stub matching the context shape.
        // eslint-disable-next-line no-console
        console.warn('useSystemMetrics called outside SystemMetricsProvider — returning stub');
        return {
            snapshot: emptySnapshot,
            getSeries: () => [],
            getCurrent: () => 0,
        } as SystemMetricsContextValue;
    }
    return ctx;
};

export type { ChartPoint, MetricKey, ResourceKey, SystemMetricsSnapshot } from './SystemMetricsTypes';
