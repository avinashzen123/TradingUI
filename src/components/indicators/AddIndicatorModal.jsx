import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal for adding new indicators
 */
export default function AddIndicatorModal({ 
    availableIndicators, 
    enabledIndicators,
    onAdd, 
    onClose 
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredIndicators = availableIndicators.filter(indicator =>
        indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isIndicatorEnabled = (indicatorId, params) => {
        return enabledIndicators.some(
            ind => ind.id === indicatorId && JSON.stringify(ind.params) === JSON.stringify(params)
        );
    };

    const handleAdd = (indicator) => {
        if (!isIndicatorEnabled(indicator.id, indicator.params)) {
            onAdd(indicator);
        }
    };

    return (
        <div className="indicator-modal-overlay" onClick={onClose}>
            <div className="indicator-modal" onClick={(e) => e.stopPropagation()}>
                <div className="indicator-modal-header">
                    <h3>Add Indicator</h3>
                    <button onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="indicator-modal-body">
                    {/* Search Input */}
                    <div className="indicator-search">
                        <input
                            type="text"
                            placeholder="Search indicators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="indicator-search-input"
                            autoFocus
                        />
                    </div>

                    {/* Indicator List */}
                    {filteredIndicators.length === 0 ? (
                        <div className="no-results">
                            No indicators found matching "{searchQuery}"
                        </div>
                    ) : (
                        filteredIndicators.map((indicator) => {
                            const isEnabled = isIndicatorEnabled(indicator.id, indicator.params);
                            
                            return (
                                <div 
                                    key={indicator.id}
                                    className={`indicator-option ${isEnabled ? 'disabled' : ''}`}
                                    onClick={() => handleAdd(indicator)}
                                >
                                    <div className="indicator-option-info">
                                        <div 
                                            className="indicator-color-dot" 
                                            style={{ backgroundColor: indicator.color }}
                                        />
                                        <div>
                                            <div className="indicator-option-name">
                                                {indicator.name}
                                            </div>
                                            <div className="indicator-option-params">
                                                {Object.entries(indicator.params).length > 0 
                                                    ? Object.entries(indicator.params).map(([key, value]) => (
                                                        <span key={key}>{key}: {value}</span>
                                                    )).reduce((prev, curr) => [prev, ', ', curr])
                                                    : <span>No parameters</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    {isEnabled && (
                                        <span className="indicator-check">Already added</span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
