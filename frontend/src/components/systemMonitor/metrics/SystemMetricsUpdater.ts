import type { SystemMetricsSnapshot } from './SystemMetricsTypes';

export interface SystemMetricsUpdater {
    start: (onSnapshot: (snapshot: SystemMetricsSnapshot) => void) => () => void;
}
