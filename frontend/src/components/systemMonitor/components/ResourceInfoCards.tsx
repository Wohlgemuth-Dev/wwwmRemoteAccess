import React, { useEffect, useState } from 'react';
import { systemManagerApi } from '../../../service/api/systemmanager';

interface Props {
    resourceId: string;
}

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i += 1;
    }
    return `${typeof v === 'number' ? v.toFixed(2) : v} ${units[i]}`;
};

const ResourceInfoCards: React.FC<Props> = ({ resourceId }) => {
    const [info, setInfo] = useState<Record<string, string>>({});

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                if (resourceId.startsWith('cpu')) {
                    const res = await systemManagerApi.getCpu();
                    const model = res.info?.[0]?.modelName ?? '';
                    const mhz = res.info?.[0]?.mhz ?? undefined;
                    setInfo({ 'Model': model || 'Unknown', 'Base MHz': mhz ? `${mhz}` : 'n/a' });
                } else if (resourceId === 'memory') {
                    const res = await systemManagerApi.getMemory();
                    const swap = res.swap;
                    setInfo({
                        'Swap Total': swap?.total ? formatBytes(swap.total) : 'n/a',
                        'Swap Used': swap?.used ? formatBytes(swap.used) : 'n/a',
                        'Swap %': swap?.usedPercent !== undefined ? `${Math.round(swap.usedPercent)}%` : 'n/a',
                    });
                } else if (resourceId.startsWith('disk')) {
                    const res = await systemManagerApi.getDisk();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const dev = (res as any)?.devices?.[idx] ?? (res as any)?.usages?.[idx];
                    if (dev) {
                        setInfo({
                            'Device': dev.name ?? `disk:${idx}`,
                            'Total': dev.total ? formatBytes(dev.total) : 'n/a',
                            'Read': dev.readBytes ? formatBytes(dev.readBytes) : 'n/a',
                            'Write': dev.writeBytes ? formatBytes(dev.writeBytes) : 'n/a',
                        });
                    } else {
                        setInfo({ 'Device': `disk:${idx}` });
                    }
                } else if (resourceId.startsWith('network')) {
                    const res = await systemManagerApi.getNetwork();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const iface = (res as any)?.interfaces?.[idx];
                    const counter = (res as any)?.counters?.[idx];
                    const items: Record<string, string> = {};
                    if (iface) {
                        items['Interface'] = iface.name ?? iface.iface ?? `network:${idx}`;
                        const addrs = (iface.addrs || []).map((a: any) => a.addr || a.ip || '').filter(Boolean).join(', ');
                        if (addrs) items['Addresses'] = addrs;
                    }
                    if (counter) {
                        items['Bytes Received'] = formatBytes(counter.bytesRecv ?? 0);
                        items['Bytes Sent'] = formatBytes(counter.bytesSent ?? 0);
                        items['Packets'] = `${counter.packetsRecv ?? 0} recv / ${counter.packetsSent ?? 0} sent`;
                    }
                    setInfo(items);
                } else if (resourceId.startsWith('gpu')) {
                    const res = await systemManagerApi.getGpu();
                    const idx = Number(resourceId.split(':')[1] ?? 0);
                    const gpu = (res as any)?.gpus?.[idx];
                    const error = (res as any)?.error;
                    const items: Record<string, string> = {};
                    if (error) items['GPU Error'] = error;
                    if (gpu) {
                        items['Name'] = gpu.name ?? `gpu:${idx}`;
                        items['Memory Total'] = gpu.memoryTotal ? formatBytes(gpu.memoryTotal) : 'n/a';
                        items['Memory Used'] = gpu.memoryUsed ? formatBytes(gpu.memoryUsed) : 'n/a';
                        items['Temperature'] = gpu.temperature !== undefined ? `${gpu.temperature} °C` : 'n/a';
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
            cancelled = true;
            window.clearInterval(id);
        };
    }, [resourceId]);

    if (!info || Object.keys(info).length === 0) return null;

    return (
        <div className="ResourceInfoCards">
            {Object.entries(info).map(([k, v]) => (
                <div key={k} className="DetailMetricItem">
                    <div className="DetailMetricLabel">{k}</div>
                    <div className="DetailMetricValue">{v}</div>
                </div>
            ))}
        </div>
    );
};

export default ResourceInfoCards;
