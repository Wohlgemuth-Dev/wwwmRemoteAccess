import React from 'react';
import DeviceMetricChart from './DeviceMetricChart';
import ResourceDetailMetrics from './ResourceDetailMetrics';
import { useSystemMetrics } from '../metrics';
import { useResourceCatalog } from '../hooks';

const SystemResources: React.FC = () => {
    const { getSeries, getCurrent } = useSystemMetrics();
    const { resources, selectedResource, setSelectedResource, selectedDetail } = useResourceCatalog();

    return (
        <div className="SystemResources">
            <div className="SystemResourcesList" role="tablist" aria-label="System resources">
                {resources.map((resource) => {
                    const isSelected = selectedResource === resource.key;

                    return (
                        <button
                            key={resource.key}
                            type="button"
                            className={`SystemResourceTile${isSelected ? ' is-selected' : ''}`}
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedResource(resource.key)}
                        >
                                    <div className="ResourceTileGraph" aria-hidden="true">
                                        <DeviceMetricChart
                                            color={resource.color}
                                            axes={resource.axes}
                                            compact
                                            data={getSeries(resource.key)}
                                            unit={resource.unit}
                                        />
                                    </div>
                            <div className="ResourceTileContent">
                                <h2>{resource.title}</h2>
                                <p>{`${Math.round(getCurrent(resource.key))}${resource.unit}`}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div aria-hidden="true" className="SystemResourcesDivider" />
            <div className="SystemResourceDetails" role="tabpanel">
                <div className="SystemResourceDetailsHeader">
                    <h1>{selectedDetail.detailTitle}</h1>
                </div>
                <div className="SystemResourceDetailsChart">
                    <DeviceMetricChart
                        color={selectedDetail.color}
                        axes={selectedDetail.axes}
                        data={getSeries(selectedDetail.key)}
                        min={selectedDetail.min}
                        max={selectedDetail.max}
                        initialValue={selectedDetail.initialValue}
                        unit={selectedDetail.unit}
                    />
                </div>
                <ResourceDetailMetrics resourceKey={selectedDetail.key} />
            </div>
        </div>
    );
}

export default SystemResources;