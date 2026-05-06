import { useEffect, useMemo, useState } from 'react';
import {
	CartesianGrid,
	Line,
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

export interface ChartAxes {
	xLabel: string;
	yLabel: string;
}

interface DeviceMetricChartProps {
	color: string;
	axes: ChartAxes;
	compact?: boolean;
	pointCount?: number;
	min?: number;
	max?: number;
	initialValue?: number;
	unit?: string;
	data?: ChartPoint[];
}

interface ChartPoint {
	index: number;
	value: number;
}

const DEFAULT_POINT_COUNT = 24;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const buildInitialData = (pointCount: number, initialValue: number, min: number, max: number): ChartPoint[] => {
	return Array.from({ length: pointCount }, (_, index) => ({
		index,
		value: clamp(initialValue + Math.sin(index / 3) * 8 + (index % 4 - 1.5) * 2, min, max),
	}));
};

const DeviceMetricChart = ({
	color,
	axes,
	compact = false,
	pointCount = DEFAULT_POINT_COUNT,
	min = 0,
	max = 100,
	initialValue = 50,
	unit = '%',
	data,
}: DeviceMetricChartProps) => {
	const [internalData, setInternalData] = useState<ChartPoint[]>(() => buildInitialData(pointCount, initialValue, min, max));

	const gradId = useMemo(() => `grad-${Math.random().toString(36).slice(2, 9)}`, []);

	const hexToRgba = (hex: string, alpha = 1) => {
		const h = hex.replace('#', '');
		const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
		const bigint = parseInt(full, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const axisLabelStyle = useMemo(
		() => ({
			fill: 'var(--text-muted)',
			fontSize: 11,
		}),
		[],
	);

	useEffect(() => {
		setInternalData(buildInitialData(pointCount, initialValue, min, max));
	}, [pointCount, initialValue, min, max]);

	useEffect(() => {
		// only run internal generator when no external `data` is supplied
		if (data) return;

		const intervalId = window.setInterval(() => {
			setInternalData((currentData) => {
				const lastValue = currentData[currentData.length - 1]?.value ?? initialValue;
				const drift = (Math.random() - 0.5) * (compact ? 8 : 6);
				const nextValue = clamp(lastValue + drift, min, max);

				return [...currentData.slice(1), { index: currentData[currentData.length - 1].index + 1, value: nextValue }];
			});
		}, compact ? 1400 : 1000);

		return () => window.clearInterval(intervalId);
	}, [compact, initialValue, max, min, data]);

	return (
		<div className={`DeviceMetricChart${compact ? ' is-compact' : ''}`}>
			<ResponsiveContainer width="100%" height={compact ? 48 : '100%'}>
				<AreaChart data={data ?? internalData} margin={{ top: 8, right: 8, bottom: compact ? 0 : 12, left: compact ? 0 : 8 }}>
					<defs>
						<linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor={hexToRgba(color, 0.4)} />
							<stop offset="100%" stopColor={hexToRgba(color, 0.08)} />
						</linearGradient>
					</defs>
					<CartesianGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="index"
						hide={compact}
						axisLine={false}
						tickLine={false}
						tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
						label={!compact ? { value: axes.xLabel, position: 'insideBottom', offset: -2, ...axisLabelStyle } : undefined}
					/>
					<YAxis
						domain={[min, max]}
						hide={compact}
						axisLine={false}
						tickLine={false}
						tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
						label={!compact ? { value: axes.yLabel, angle: -90, position: 'insideLeft', offset: 0, ...axisLabelStyle } : undefined}
					/>
					<Tooltip
						cursor={{ stroke: color, strokeDasharray: '4 4' }}
						contentStyle={{
							background: 'var(--ra-surface-overlay)',
							border: '1px solid var(--border-soft)',
							borderRadius: '10px',
							color: 'var(--text-primary)',
							boxShadow: '0 12px 32px var(--ra-shadow-overlay)',
						}}
						labelStyle={{ color: 'var(--text-muted)' }}
						formatter={(value: any) => [`${Number(value ?? 0).toFixed(0)}${unit}`, axes.yLabel]}
					/>
					<Area
						type="monotone"
						dataKey="value"
						fill={`url(#${gradId})`}
						stroke="none"
						isAnimationActive={!compact}
					/>
					<Line
						type="monotone"
						dataKey="value"
						stroke={color}
						strokeWidth={compact ? 2 : 2.5}
						dot={false}
						activeDot={{ r: compact ? 2.5 : 4, stroke: color, strokeWidth: 2, fill: 'var(--ra-panel-bg)' }}
						isAnimationActive={!compact}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};

export default DeviceMetricChart;