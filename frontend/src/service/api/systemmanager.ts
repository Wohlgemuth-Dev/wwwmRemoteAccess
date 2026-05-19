import { apiClient } from './client';

export interface CpuInfoStat {
	mhz?: number;
	modelName?: string;
	cores?: number;
}

export interface CpuResponse {
	percentage: number;
	percentages?: number[];
	info: CpuInfoStat[];
}

export interface MemoryStat {
	usedPercent?: number;
	available?: number;
	total?: number;
	used?: number;
	free?: number;
}

export interface MemoryResponse {
	virtual: MemoryStat | null;
	swap: MemoryStat | null;
}

export interface DiskUsageStat {
	total?: number;
	usedPercent?: number;
}

export interface DiskDeviceStat {
	name: string;
	total: number;
	usedPercent: number;
	readBytes: number;
	writeBytes: number;
}

export interface DiskResponse {
	devices: DiskDeviceStat[];
}

export interface NetworkCounterStat {
	bytesRecv?: number;
	bytesSent?: number;
}

export interface NetworkResponse {
	counters: NetworkCounterStat[];
	interfaces: unknown[];
}

export interface GPUStat {
	name: string;
	utilization: number;
	memoryTotal: number;
	memoryUsed: number;
	memoryFree: number;
	temperature: number;
}

export interface GPUResponse {
	gpus: GPUStat[];
	error?: string;
}

export const systemManagerApi = {
	getCpu: () => apiClient.get<CpuResponse>('/api/systemmanager/cpu'),
	getMemory: () => apiClient.get<MemoryResponse>('/api/systemmanager/memory'),
	getDisk: () => apiClient.get<DiskResponse>('/api/systemmanager/disk'),
	getNetwork: () => apiClient.get<NetworkResponse>('/api/systemmanager/network'),
	getGpu: () => apiClient.get<GPUResponse>('/api/systemmanager/gpu'),
};