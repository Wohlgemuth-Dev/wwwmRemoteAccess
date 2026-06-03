import { systemManagerApi } from '../../../service/api/systemmanager';
import type { ChartPoint, SystemMetricsSnapshot } from './SystemMetricsTypes';
import type { SystemMetricsUpdater } from './SystemMetricsUpdater';

const DEFAULT_POINT_COUNT = 24;
const DEFAULT_POLL_INTERVAL_MS = 5000;

const emptySnapshot = (): SystemMetricsSnapshot => ({
	memory: {},
});

const buildSeries = (value: number, pointCount: number): ChartPoint[] => {
	return Array.from({ length: pointCount }, (_, index) => ({ index, value }));
};

const updateSeries = (series: ChartPoint[] | undefined, value: number, pointCount: number): ChartPoint[] => {
	if (!series || series.length === 0) {
		return buildSeries(value, pointCount);
	}

	const nextIndex = series[series.length - 1].index + 1;
	return [...series.slice(-Math.max(pointCount - 1, 0)), { index: nextIndex, value }];
};

const average = (values: number[]) => {
	if (values.length === 0) {
		return 0;
	}

	return values.reduce((sum, value) => sum + value, 0) / values.length;
};

// NOTE: weightedAverage and sumNetworkBytes were removed — they were unused helper functions.

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class BackendSystemMetricsUpdater implements SystemMetricsUpdater {
	constructor(
		private readonly pointCount = DEFAULT_POINT_COUNT,
		private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
	) {}

	start(onSnapshot: (snapshot: SystemMetricsSnapshot) => void) {
		let snapshot = emptySnapshot();
		let previousNetworkSamples: Array<{ recvBytes: number; sentBytes: number; timestamp: number }> = [];
		let previousDiskIOSamples: Array<{ readBytes: number; writeBytes: number; timestamp: number }> = [];
		let isDisposed = false;

		const refresh = async () => {
			try {
				const [cpu, memory, disk, network, gpu] = await Promise.all([
					systemManagerApi.getCpu(),
					systemManagerApi.getMemory(),
					systemManagerApi.getDisk(),
					systemManagerApi.getNetwork(),
					systemManagerApi.getGpu(),
				]);

				if (isDisposed) {
					return;
				}

				const now = Date.now();

				const apiCurrentMhz = (cpu as any)?.current_mhz ?? (cpu as any)?.currentMhz;
				const cpuSpeed = apiCurrentMhz ?? average(cpu.info.map((info) => info.mhz ?? 0));
				const cpuThreads = cpu.info.length;
				const cpuCores = cpu.info.length;

				const memoryUsage = clamp(memory.virtual?.usedPercent ?? 0, 0, 100);
				const memoryAvailable = clamp(100 - memoryUsage, 0, 100);
				const memoryTotal = memory.virtual?.total ?? 0;
				const memoryUsed = memory.virtual?.used ?? 0;
	                const memorySwapPercent = clamp(memory.swap?.usedPercent ?? 0, 0, 100);
	                const memorySwapUsed = memory.swap?.used ?? 0;

				const nextSnapshot: SystemMetricsSnapshot = {
					memory: {
						usage: updateSeries(snapshot.memory.usage, memoryUsage, this.pointCount),
						available: updateSeries(snapshot.memory.available, memoryAvailable, this.pointCount),
						total: updateSeries(snapshot.memory.total, memoryTotal, this.pointCount),
						used: updateSeries(snapshot.memory.used, memoryUsed, this.pointCount),
						swap: updateSeries(snapshot.memory.swap, memorySwapPercent, this.pointCount),
						swapUsed: updateSeries(snapshot.memory.swapUsed, memorySwapUsed, this.pointCount),
					},
				};

				// Aggregate CPU percentages into a single device-level entry instead of per-logical-core.
				const cpuPercentages = cpu.percentages?.length
					? cpu.percentages
					: cpu.info.length > 0
						? Array.from({ length: cpu.info.length }, () => cpu.percentage)
						: [cpu.percentage];

				const aggregatedCpuUsage = average(cpuPercentages);
				const resourceId = `cpu:0`;
				const primaryCpuInfo = cpu.info[0] ?? { mhz: cpuSpeed, cores: cpuThreads } as any;
				const totalCores = (cpu.info || []).reduce((sum, info) => sum + (info.cores ?? 0), 0) || cpuCores;

				// prefer the API-provided current MHz if available
				const speedValue = (cpu as any)?.current_mhz ?? primaryCpuInfo?.mhz ?? cpuSpeed;

				nextSnapshot[resourceId] = {
					usage: updateSeries(snapshot[resourceId]?.usage, clamp(aggregatedCpuUsage, 0, 100), this.pointCount),
					speed: updateSeries(snapshot[resourceId]?.speed, speedValue, this.pointCount),
					threads: updateSeries(snapshot[resourceId]?.threads, primaryCpuInfo?.cores ?? cpuThreads, this.pointCount),
					cores: updateSeries(snapshot[resourceId]?.cores, totalCores, this.pointCount),
				};

				// Disk devices may be returned as aggregated `devices` (with IO counters)
				// or the older `usages` array (per-partition). Support both shapes.
				const rawDisk = disk as any;
				let diskDevices: Array<{ name?: string; total?: number; usedPercent?: number; readBytes?: number; writeBytes?: number }> = [];
				if (Array.isArray(rawDisk?.devices)) {
					diskDevices = rawDisk.devices;
				} else if (Array.isArray(rawDisk?.usages)) {
					diskDevices = rawDisk.usages.map((u: any, idx: number) => ({ name: `disk${idx}`, total: u.total ?? 0, usedPercent: u.usedPercent ?? 0, readBytes: 0, writeBytes: 0 }));
				}

				if (diskDevices.length > 0) {
					const nowDisk = now;
					const nextDiskSamples = diskDevices.map((dev, index) => {
						const previous = previousDiskIOSamples[index];
						const readSpeed = previous
							? Math.max(( (dev.readBytes ?? 0) - previous.readBytes) / Math.max((nowDisk - previous.timestamp) / 1000, 1), 0)
							: 0;
						const writeSpeed = previous
							? Math.max(( (dev.writeBytes ?? 0) - previous.writeBytes) / Math.max((nowDisk - previous.timestamp) / 1000, 1), 0)
							: 0;

						return { readSpeed, writeSpeed };
					});

					previousDiskIOSamples = diskDevices.map((dev) => ({ readBytes: dev.readBytes ?? 0, writeBytes: dev.writeBytes ?? 0, timestamp: nowDisk }));

					diskDevices.forEach((dev, index) => {
						const resourceId = `disk:${index}`;
						nextSnapshot[resourceId] = {
							usage: updateSeries(snapshot[resourceId]?.usage, clamp(dev.usedPercent ?? 0, 0, 100), this.pointCount),
							total: updateSeries(snapshot[resourceId]?.total, dev.total ?? 0, this.pointCount),
							readSpeed: updateSeries(snapshot[resourceId]?.readSpeed, nextDiskSamples[index].readSpeed, this.pointCount),
							writeSpeed: updateSeries(snapshot[resourceId]?.writeSpeed, nextDiskSamples[index].writeSpeed, this.pointCount),
							readBytes: updateSeries(snapshot[resourceId]?.readBytes, dev.readBytes ?? 0, this.pointCount),
							writeBytes: updateSeries(snapshot[resourceId]?.writeBytes, dev.writeBytes ?? 0, this.pointCount),
							cores: updateSeries(snapshot[resourceId]?.cores, diskDevices.length, this.pointCount),
						};
					});
				}

				const nextNetworkSamples = Array.isArray(network?.counters)
					? network.counters.map((counter: any, index: number) => {
					const previous = previousNetworkSamples[index];
					const elapsedSeconds = Math.max((now - (previous?.timestamp ?? now)) / 1000, 1);
					const receivedMbps = previous
						? clamp(((Math.max((counter.bytesRecv ?? 0) - previous.recvBytes, 0) * 8) / elapsedSeconds) / 1_000_000, 0, 100)
						: 0;
					const sentMbps = previous
						? clamp(((Math.max((counter.bytesSent ?? 0) - previous.sentBytes, 0) * 8) / elapsedSeconds) / 1_000_000, 0, 100)
						: 0;
					const usage = clamp(receivedMbps + sentMbps, 0, 100);
						return {
							recvBytes: counter.bytesRecv ?? 0,
							sentBytes: counter.bytesSent ?? 0,
							timestamp: now,
							receivedMbps,
							sentMbps,
							usage,
						};
					})
					: [];
				previousNetworkSamples = nextNetworkSamples.map(({ recvBytes, sentBytes, timestamp }) => ({ recvBytes, sentBytes, timestamp }));

				nextNetworkSamples.forEach((sample, index) => {
					const resourceId = `network:${index}`;
					const counter = (Array.isArray(network?.counters) && network.counters[index]) || {};
					nextSnapshot[resourceId] = {
						usage: updateSeries(snapshot[resourceId]?.usage, sample.usage, this.pointCount),
						cores: updateSeries(snapshot[resourceId]?.cores, network.interfaces?.length ?? 0, this.pointCount),
						bytesRecv: updateSeries(snapshot[resourceId]?.bytesRecv, counter.bytesRecv ?? 0, this.pointCount),
						bytesSent: updateSeries(snapshot[resourceId]?.bytesSent, counter.bytesSent ?? 0, this.pointCount),
						receivedMbps: updateSeries(snapshot[resourceId]?.receivedMbps, sample.receivedMbps, this.pointCount),
						sentMbps: updateSeries(snapshot[resourceId]?.sentMbps, sample.sentMbps, this.pointCount),
					};
				});

				if (Array.isArray(gpu?.gpus)) {
					gpu.gpus.forEach((gpuStat: any, index: number) => {
						const resourceId = `gpu:${index}`;
						nextSnapshot[resourceId] = {
							usage: updateSeries(snapshot[resourceId]?.usage, clamp(gpuStat.utilization, 0, 100), this.pointCount),
							temperature: updateSeries(snapshot[resourceId]?.temperature, gpuStat.temperature, this.pointCount),
							memoryUsed: updateSeries(snapshot[resourceId]?.memoryUsed, gpuStat.memoryUsed, this.pointCount),
							memoryTotal: updateSeries(snapshot[resourceId]?.memoryTotal, gpuStat.memoryTotal, this.pointCount),
							memoryFree: updateSeries(snapshot[resourceId]?.memoryFree, gpuStat.memoryFree, this.pointCount),
						};
					});
				}

				snapshot = nextSnapshot;

				onSnapshot(snapshot);
			} catch (error) {
				console.error('Failed to load backend system metrics:', error);
			}
		};

		void refresh();
		const intervalId = window.setInterval(() => {
			void refresh();
		}, this.pollIntervalMs);

		return () => {
			isDisposed = true;
			window.clearInterval(intervalId);
		};
	}
}