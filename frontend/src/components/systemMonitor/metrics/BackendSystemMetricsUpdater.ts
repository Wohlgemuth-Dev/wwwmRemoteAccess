import { systemManagerApi } from '../../../service/api/systemmanager';
import type { ChartPoint, SystemMetricsSnapshot } from './SystemMetricsTypes';
import type { SystemMetricsUpdater } from './SystemMetricsUpdater';

const DEFAULT_POINT_COUNT = 24;
const DEFAULT_POLL_INTERVAL_MS = 5000;

const emptySnapshot = (): SystemMetricsSnapshot => ({
	cpu: {},
	memory: {},
	disk: {},
	network: {},
	gpu: {},
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

const weightedAverage = (values: Array<{ total?: number; usedPercent?: number }>) => {
	let totalWeight = 0;
	let weightedSum = 0;

	values.forEach((value) => {
		const weight = value.total ?? 0;
		const usedPercent = value.usedPercent ?? 0;
		totalWeight += weight;
		weightedSum += usedPercent * weight;
	});

	return totalWeight > 0 ? weightedSum / totalWeight : average(values.map((value) => value.usedPercent ?? 0));
};

const sumNetworkBytes = (counters: Array<{ bytesRecv?: number; bytesSent?: number }>) => {
	return counters.reduce((sum, counter) => sum + (counter.bytesRecv ?? 0) + (counter.bytesSent ?? 0), 0);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface ResourceSample {
	cpuUsage: number;
	cpuSpeed: number;
	cpuThreads: number;
	cpuCores: number;
	memoryUsage: number;
	memoryAvailable: number;
	memoryTotal: number;
	memoryUsed: number;
	diskUsage: number;
	diskTotal: number;
	diskPartitions: number;
	networkUsage: number;
	networkInterfaces: number;
	gpuUsage: number;
	gpuTemperature: number;
	gpuCount: number;
}

const applySample = (snapshot: SystemMetricsSnapshot, sample: ResourceSample, pointCount: number): SystemMetricsSnapshot => ({
	cpu: {
		usage: updateSeries(snapshot.cpu.usage, sample.cpuUsage, pointCount),
		speed: updateSeries(snapshot.cpu.speed, sample.cpuSpeed, pointCount),
		threads: updateSeries(snapshot.cpu.threads, sample.cpuThreads, pointCount),
		cores: updateSeries(snapshot.cpu.cores, sample.cpuCores, pointCount),
	},
	memory: {
		usage: updateSeries(snapshot.memory.usage, sample.memoryUsage, pointCount),
		available: updateSeries(snapshot.memory.available, sample.memoryAvailable, pointCount),
		total: updateSeries(snapshot.memory.total, sample.memoryTotal, pointCount),
		used: updateSeries(snapshot.memory.used, sample.memoryUsed, pointCount),
	},
	disk: {
		usage: updateSeries(snapshot.disk.usage, sample.diskUsage, pointCount),
		total: updateSeries(snapshot.disk.total, sample.diskTotal, pointCount),
		cores: updateSeries(snapshot.disk.cores, sample.diskPartitions, pointCount),
	},
	network: {
		usage: updateSeries(snapshot.network.usage, sample.networkUsage, pointCount),
		cores: updateSeries(snapshot.network.cores, sample.networkInterfaces, pointCount),
	},
	gpu: {
		usage: updateSeries(snapshot.gpu.usage, sample.gpuUsage, pointCount),
		temperature: updateSeries(snapshot.gpu.temperature, sample.gpuTemperature, pointCount),
		cores: updateSeries(snapshot.gpu.cores, sample.gpuCount, pointCount),
	},
});

export class BackendSystemMetricsUpdater implements SystemMetricsUpdater {
	constructor(
		private readonly pointCount = DEFAULT_POINT_COUNT,
		private readonly pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
	) {}

	start(onSnapshot: (snapshot: SystemMetricsSnapshot) => void) {
		let snapshot = emptySnapshot();
		let previousNetworkSample: { totalBytes: number; timestamp: number } | null = null;
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
				const networkTotalBytes = sumNetworkBytes(network.counters);
				const networkUsage = previousNetworkSample
					? clamp(
						((Math.max(networkTotalBytes - previousNetworkSample.totalBytes, 0) * 8) /
							Math.max((now - previousNetworkSample.timestamp) / 1000, 1)) /
						1_000_000,
						0,
						100,
					)
					: 0;

				previousNetworkSample = { totalBytes: networkTotalBytes, timestamp: now };

				const cpuSpeed = average(cpu.info.map((info) => info.mhz ?? 0));
				const cpuThreads = cpu.info.length;
				const cpuCores = cpu.info.length;

				const memoryUsage = clamp(memory.virtual?.usedPercent ?? 0, 0, 100);
				const memoryAvailable = clamp(100 - memoryUsage, 0, 100);
				const memoryTotal = memory.virtual?.total ?? 0;
				const memoryUsed = memory.virtual?.used ?? 0;

				const diskUsage = clamp(weightedAverage(disk.usages), 0, 100);
				const diskTotal = disk.usages.reduce((sum, usage) => sum + (usage.total ?? 0), 0);
				const diskPartitions = disk.usages.length;

				const networkInterfaces = network.interfaces.length;

				const gpuUsage = gpu.gpus.length > 0 ? average(gpu.gpus.map((g) => g.utilization)) : 0;
				const gpuTemperature = gpu.gpus.length > 0 ? average(gpu.gpus.map((g) => g.temperature)) : 0;
				const gpuCount = gpu.gpus.length;

				snapshot = applySample(snapshot, {
					cpuUsage: clamp(cpu.percentage, 0, 100),
					cpuSpeed,
					cpuThreads,
					cpuCores,
					memoryUsage,
					memoryAvailable,
					memoryTotal,
					memoryUsed,
					diskUsage,
					diskTotal,
					diskPartitions,
					networkUsage,
					networkInterfaces,
					gpuUsage: clamp(gpuUsage, 0, 100),
					gpuTemperature,
					gpuCount,
				}, this.pointCount);

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