import React from 'react';

export interface MetricCardItem {
	key: string;
	label: React.ReactNode;
	value: React.ReactNode;
}

interface MetricCardsProps {
	className: string;
	items: MetricCardItem[];
}

const MetricCards: React.FC<MetricCardsProps> = ({ className, items }) => {
	if (items.length === 0) {
		return null;
	}

	return (
		<div className={className}>
			{items.map((item) => (
				<div key={item.key} className="DetailMetricItem">
					<div className="DetailMetricLabel">{item.label}</div>
					<div className="DetailMetricValue">{item.value}</div>
				</div>
			))}
		</div>
	);
};

export default MetricCards;