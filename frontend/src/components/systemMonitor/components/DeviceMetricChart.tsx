import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	CartesianGrid,
	Line,
	Area,
	AreaChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

const HEX_TO_RGBA = (hex: string, alpha = 1) => {
	const h = hex.replace('#', '');
	const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
	const bigint = parseInt(full, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface ChartAxes {
	xLabel: string;
	yLabel: string;
}

interface DeviceMetricChartProps {
	color: string;
	axes: ChartAxes;
	compact?: boolean;
	showArea?: boolean;
	valueDecimals?: number;
	interpolation?: 'monotone' | 'linear';
	pointCount?: number;
	min?: number;
	max?: number;
	initialValue?: number;
	unit?: string;
	primarySeriesLabel?: string;
	data?: ChartPoint[];
	series?: Array<{
		dataKey: string;
		label: string;
		color: string;
		unit?: string;
		strokeWidth?: number;
	}>;
}

interface ChartPoint {
	index: number;
	value: number;
	[key: string]: number;
}

const DEFAULT_POINT_COUNT = 24;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hasUsableColor = (value: unknown) => {
	return typeof value === 'string' && value.length > 0 && !value.startsWith('url(') && value !== 'none';
};

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
	showArea = true,
	valueDecimals = 0,
	interpolation = 'monotone',
	pointCount = DEFAULT_POINT_COUNT,
	min = 0,
	max = 100,
	initialValue = 50,
	unit = '%',
	primarySeriesLabel,
	data,
	series = [],
}: DeviceMetricChartProps) => {

	// no debug logging in production
	const [internalData, setInternalData] = useState<ChartPoint[]>(() => buildInitialData(pointCount, initialValue, min, max));
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
	const [isLayoutReady, setIsLayoutReady] = useState(false);

	const gradId = useMemo(() => `grad-${Math.random().toString(36).slice(2, 9)}`, []);

	const axisLabelStyle = useMemo(
		() => ({
			fill: 'var(--text-muted)',
			fontSize: 11,
		}),
		[],
	);

	const renderTooltip = (tooltipProps: any) => {
		const { active, label, payload } = tooltipProps ?? {};

		if (!active || !Array.isArray(payload) || payload.length === 0) {
			return null;
		}

		const uniqueItems = new Map<string, any>();

		payload.forEach((item: any) => {
			const key = String(item?.dataKey ?? item?.name ?? 'value');
			const existing = uniqueItems.get(key);
			const existingHasColor = hasUsableColor(existing?.color ?? existing?.stroke ?? existing?.fill);
			const incomingHasColor = hasUsableColor(item?.color ?? item?.stroke ?? item?.fill);

			if (!existing || (!existingHasColor && incomingHasColor)) {
				uniqueItems.set(key, item);
			}
		});

		return (
			<div
				style={{
					background: 'var(--ra-surface-overlay)',
					border: '1px solid var(--border-soft)',
					borderRadius: '10px',
					color: 'var(--text-primary)',
					boxShadow: '0 12px 32px var(--ra-shadow-overlay)',
					padding: '10px 12px',
				}}
			>
				<div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 12 }}>{label}</div>
				{Array.from(uniqueItems.values()).map((item: any) => {
					const dataKey = String(item?.dataKey ?? item?.name ?? 'value');
					const seriesDefinition = series.find((definition) => definition.dataKey === dataKey);
					const value = Number(item?.value ?? 0);
					const entryLabel = dataKey === 'value'
						? (primarySeriesLabel ?? axes.yLabel)
						: seriesDefinition?.label ?? String(item?.name ?? dataKey);
					const entryUnit = dataKey === 'value'
						? unit
						: seriesDefinition?.unit ?? '';
					const entryColor = dataKey === 'value'
						? color
						: item?.color ?? item?.stroke ?? item?.fill ?? seriesDefinition?.color ?? color;

					return (
						<div key={dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
							<span style={{ width: 8, height: 8, borderRadius: 999, background: entryColor, flex: '0 0 auto' }} />
							<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entryLabel}</span>
							<span style={{ fontSize: 12, marginLeft: 'auto' }}>{`${value.toFixed(valueDecimals)}${entryUnit}`}</span>
						</div>
					);
				})}
			</div>
		);
	};

	useEffect(() => {
		setInternalData(buildInitialData(pointCount, initialValue, min, max));
	}, [pointCount, initialValue, min, max]);

	useEffect(() => {
		// only run internal generator when no external `data` is supplied or
		// when the external data is an empty array (treat empty as no-data)
		if (data && Array.isArray(data) && data.length > 0) return;

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

	useLayoutEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			setIsLayoutReady(true);
		});

		return () => window.cancelAnimationFrame(frameId);
	}, []);

	useLayoutEffect(() => {
		const element = containerRef.current;
		if (!element) {
			return;
		}

		const updateSize = () => {
			const { width, height } = element.getBoundingClientRect();
			setContainerSize({ width, height });
		};

		updateSize();

		const observer = new ResizeObserver(updateSize);
		observer.observe(element);

		return () => observer.disconnect();
	}, [compact]);

	const hasRenderableSize = isLayoutReady && containerSize.width > 0 && containerSize.height > 0;
	const chartWidth = Math.max(Math.floor(containerSize.width), 1);
	// cap the chart height to the container height so the inner SVG never
	// exceeds the parent (previously used Math.max which caused overflow)
	const chartHeight = Math.min(Math.max(Math.floor(containerSize.height), 1), compact ? 72 : 240);

	const dataToRender = (data && Array.isArray(data) && data.length > 0) ? data : internalData;

	return (
		<div ref={containerRef} className={`DeviceMetricChart${compact ? ' is-compact' : ''}`}>
			{hasRenderableSize && (
				<AreaChart
					width={chartWidth}
					height={chartHeight}
					data={dataToRender}
					margin={{ top: compact ? 0 : 8, right: compact ? 0 : 8, bottom: compact ? 0 : 12, left: compact ? 0 : 8 }}
				>
					<defs>
						<linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor={HEX_TO_RGBA(color, 0.4)} />
							<stop offset="100%" stopColor={HEX_TO_RGBA(color, 0.08)} />
						</linearGradient>
					</defs>
					{!compact && <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" vertical={false} />}
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
						tickFormatter={(value) => Number(value).toFixed(valueDecimals)}
						label={!compact ? { value: axes.yLabel, angle: -90, position: 'insideLeft', offset: 0, ...axisLabelStyle } : undefined}
					/>
					<Tooltip
						cursor={{ stroke: color, strokeDasharray: '4 4' }}
						content={renderTooltip}
						isAnimationActive={false}
					/>
					{showArea && (
						<Area
							type={interpolation}
							dataKey="value"
							fill={`url(#${gradId})`}
							stroke="none"
							isAnimationActive={false}
						/>
					)}
					<Line
						type={interpolation}
						dataKey="value"
						stroke={color}
						strokeWidth={compact ? 2 : 2.5}
						dot={false}
						activeDot={{ r: compact ? 2.5 : 4, stroke: color, strokeWidth: 2, fill: 'var(--ra-panel-bg)' }}
						isAnimationActive={false}
					/>
					{series.map((line) => (
						<Line
							key={line.dataKey}
							type={interpolation}
							dataKey={line.dataKey}
							name={line.label}
							stroke={line.color}
							strokeWidth={line.strokeWidth ?? (compact ? 1.8 : 2.2)}
							dot={false}
							activeDot={{ r: compact ? 2.5 : 4, stroke: line.color, strokeWidth: 2, fill: 'var(--ra-panel-bg)' }}
							isAnimationActive={false}
						/>
					))}
				</AreaChart>
			)}
		</div>
	);
};

export default DeviceMetricChart;