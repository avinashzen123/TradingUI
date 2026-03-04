import { Eye, EyeOff, Settings, X } from 'lucide-react';

/**
 * Individual indicator chip component
 * Shows indicator name, params, and action buttons
 */
export default function IndicatorChip({ 
    indicator, 
    onToggleVisibility, 
    onEdit, 
    onRemove 
}) {
    return (
        <div 
            className={`indicator-chip ${!indicator.visible ? 'hidden' : ''}`}
            style={{ borderColor: indicator.color }}
            onClick={onToggleVisibility}
            title={indicator.visible ? 'Click to hide' : 'Click to show'}
        >
            <div className="indicator-chip-content">
                <span className="indicator-chip-name">
                    {indicator.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    {indicator.name}
                </span>
                <span className="indicator-chip-params">
                    {Object.entries(indicator.params).length > 0
                        ? Object.entries(indicator.params).map(([key, value]) => (
                            <span key={key}>{key}: {value}</span>
                        )).reduce((prev, curr) => [prev, ', ', curr])
                        : <span>No parameters</span>
                    }
                </span>
            </div>
            <div className="indicator-chip-actions">
                <button
                    className="chip-action-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    title="Edit parameters"
                >
                    <Settings size={14} />
                </button>
                <button
                    className="chip-action-btn remove"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    title="Remove indicator"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
