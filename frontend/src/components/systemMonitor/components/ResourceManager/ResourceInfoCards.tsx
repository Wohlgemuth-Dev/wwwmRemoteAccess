import React, { useEffect, useState } from 'react';
import { systemManagerApi } from '../../../../service/api/systemmanager';
import MetricCards, { type MetricCardItem } from './MetricCards';
import { formatBytes } from '../../utils';

interface Props {
    resourceId: string;
}

const ResourceInfoCards: React.FC<Props> = ({ resourceId }) => {
    const [info, setInfo] = useState<MetricCardItem[]>([]);

    useEffect(() => {

        const load = async () => {
            try {
                if (resourceId.startsWith('cpu')) {
                    const res = await systemManagerApi.getCpu();
                    const model = res.info?.[0]?.modelName ?? '';
                    const mhz = res.info?.[0]?.mhz ?? undefined;
                    setInfo([
                        { key: 'model', label: 'Model', value: model || 'Unknown' },
                        { key: 'base-mhz', label: 'Base MHz', value: mhz !== undefined && mhz !== null ? `${mhz}` : 'n/a' },
                    ]);
                } else if (resourceId === 'memory') {
                    const res = await systemManagerApi.getMemory();
                    const swap = res.swap;
                    // prefer explicit used value, otherwise compute from total and percent when possible
                    const swapTotalAvailable = swap?.total !== undefined && swap?.total !== null;
                    const swapPercentAvailable = swap?.usedPercent !== undefined && swap?.usedPercent !== null;
                    const swapUsedAvailable = swap?.used !== undefined && swap?.used !== null;
                    let swapUsedComputed: number | undefined = undefined;
                    if (swapUsedAvailable) {
                        swapUsedComputed = swap!.used as number;
                    } else if (swapTotalAvailable && swapPercentAvailable) {
                        swapUsedComputed = Math.round((swap!.total as number) * (swap!.usedPercent as number) / 100);
                    }

                    setInfo([
                        { key: 'swap-total', label: 'Swap Total', value: swapTotalAvailable ? formatBytes(swap!.total as number) : 'n/a' },
                        { key: 'swap-used', label: 'Swap Used', value: swapUsedComputed !== undefined ? formatBytes(swapUsedComputed) : 'n/a' },
                        { key: 'swap-percent', label: 'Swap %', value: swapPercentAvailable ? `${Math.round(swap!.usedPercent as number)}%` : 'n/a' },
                    ]);
                } else if (resourceId.startsWith('disk')) {
                    const res = await systemManagerApi.getDisk();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const dev = (res as any)?.devices?.[idx] ?? (res as any)?.usages?.[idx];
                    if (dev) {
                        setInfo([
                            { key: 'device', label: 'Device', value: dev.name ?? `disk:${idx}` },
                            { key: 'total', label: 'Total', value: dev.total !== undefined && dev.total !== null ? formatBytes(dev.total) : 'n/a' },
                            { key: 'read', label: 'Read', value: dev.readBytes !== undefined && dev.readBytes !== null ? formatBytes(dev.readBytes) : 'n/a' },
                            { key: 'write', label: 'Write', value: dev.writeBytes !== undefined && dev.writeBytes !== null ? formatBytes(dev.writeBytes) : 'n/a' },
                        ]);
                    } else {
                        setInfo([{ key: 'device', label: 'Device', value: `disk:${idx}` }]);
                    }
                } else if (resourceId.startsWith('network')) {
                    const res = await systemManagerApi.getNetwork();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const iface = (res as any)?.interfaces?.[idx];
                    const counter = (res as any)?.counters?.[idx];
                    const items: MetricCardItem[] = [];
                    if (iface) {
                        items.push({ key: 'interface', label: 'Interface', value: iface.name ?? iface.iface ?? `network:${idx}` });
                        const addrs = (iface.addrs || []).map((a: any) => a.addr || a.ip || '').filter(Boolean).join(', ');
                        if (addrs) items.push({ key: 'addresses', label: 'Addresses', value: addrs });
                    }
                    if (counter) {
                        items.push({ key: 'packets-received', label: 'Packets Received', value: `${counter.packetsRecv ?? 0}` });
                        items.push({ key: 'packets-sent', label: 'Packets Sent', value: `${counter.packetsSent ?? 0}` });
                    }
                    setInfo(items);
                } else if (resourceId.startsWith('gpu')) {
                    const res = await systemManagerApi.getGpu();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const gpu = (res as any)?.gpus?.[idx];
                    const error = (res as any)?.error;
                    const items: MetricCardItem[] = [];
                    if (error) items.push({ key: 'gpu-error', label: 'GPU Error', value: error });
                    if (gpu) {
                        items.push({ key: 'name', label: 'Name', value: gpu.name ?? `gpu:${idx}` });
                        items.push({ key: 'memory-total', label: 'Memory Total', value: gpu.memoryTotal !== undefined && gpu.memoryTotal !== null ? formatBytes(gpu.memoryTotal) : 'n/a' });
                        items.push({ key: 'memory-used', label: 'Memory Used', value: gpu.memoryUsed !== undefined && gpu.memoryUsed !== null ? formatBytes(gpu.memoryUsed) : 'n/a' });
                        items.push({ key: 'temperature', label: 'Temperature', value: gpu.temperature !== undefined ? `${gpu.temperature} °C` : 'n/a' });
                    }
                    setInfo(items);
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('ResourceInfoCards failed to load details', err);
            }
        };

        void load();
        const id = window.setInterval(() => {
            void load();
        }, 5000);

        return () => {
            window.clearInterval(id);
        };
    }, [resourceId]);

    if (info.length === 0) return null;

    return <MetricCards className="ResourceInfoCards" items={info} />;
};

export default ResourceInfoCards;
