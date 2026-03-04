import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    addIndicator, 
    removeIndicator, 
    toggleIndicatorVisibility,
    updateIndicatorParams,
    selectInstrumentIndicators 
} from '../../store/instrumentAnalysisSlice';
import { Plus } from 'lucide-react';
import IndicatorChip from './IndicatorChip';
import AddIndicatorModal from './AddIndicatorModal';
import EditIndicatorModal from './EditIndicatorModal';

/**
 * Component to manage indicators dynamically
 * Refactored into smaller, reusable components
 */
export default function IndicatorManager({ instrumentKey }) {
    const dispatch = useDispatch();
    const indicatorConfig = useSelector(selectInstrumentIndicators(instrumentKey));
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIndicator, setEditingIndicator] = useState(null);

    if (!indicatorConfig) return null;

    const { enabled, available } = indicatorConfig;

    const handleAddIndicator = (indicator) => {
        dispatch(addIndicator({
            instrumentKey,
            indicator: {
                id: indicator.id,
                name: indicator.name,
                params: { ...indicator.params },
                color: indicator.color,
                chartType: indicator.chartType,
            }
        }));
        setShowAddModal(false);
    };

    const handleToggleVisibility = (indicator) => {
        dispatch(toggleIndicatorVisibility({
            instrumentKey,
            indicatorId: indicator.id,
            params: indicator.params,
        }));
    };

    const handleRemoveIndicator = (indicator) => {
        dispatch(removeIndicator({
            instrumentKey,
            indicatorId: indicator.id,
            params: indicator.params,
        }));
    };

    const handleUpdateParams = (indicator, newParams) => {
        dispatch(updateIndicatorParams({
            instrumentKey,
            indicatorId: indicator.id,
            oldParams: indicator.params,
            newParams,
        }));
        setEditingIndicator(null);
    };

    return (
        <div className="indicator-manager">
            <div className="indicator-manager-header">
                <span className="manager-label">Active Indicators:</span>
                <button 
                    className="add-indicator-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <Plus size={16} /> Add Indicator
                </button>
            </div>

            <div className="active-indicators">
                {enabled.length === 0 ? (
                    <div className="no-indicators">
                        No indicators added. Click "Add Indicator" to get started.
                    </div>
                ) : (
                    enabled.map((indicator, idx) => (
                        <IndicatorChip
                            key={idx}
                            indicator={indicator}
                            onToggleVisibility={() => handleToggleVisibility(indicator)}
                            onEdit={() => setEditingIndicator(indicator)}
                            onRemove={() => handleRemoveIndicator(indicator)}
                        />
                    ))
                )}
            </div>

            {showAddModal && (
                <AddIndicatorModal
                    availableIndicators={available}
                    enabledIndicators={enabled}
                    onAdd={handleAddIndicator}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {editingIndicator && (
                <EditIndicatorModal
                    indicator={editingIndicator}
                    onSave={(newParams) => handleUpdateParams(editingIndicator, newParams)}
                    onClose={() => setEditingIndicator(null)}
                />
            )}
        </div>
    );
}
