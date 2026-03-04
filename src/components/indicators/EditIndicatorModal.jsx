import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal for editing indicator parameters
 */
export default function EditIndicatorModal({ indicator, onSave, onClose }) {
    const [params, setParams] = useState({ ...indicator.params });

    const handleParamChange = (key, value) => {
        setParams(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0,
        }));
    };

    const handleSave = () => {
        onSave(params);
    };

    return (
        <div className="indicator-modal-overlay" onClick={onClose}>
            <div className="indicator-modal" onClick={(e) => e.stopPropagation()}>
                <div className="indicator-modal-header">
                    <h3>Edit {indicator.name}</h3>
                    <button onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="indicator-modal-body">
                    <div className="param-editor">
                        {Object.entries(params).map(([key, value]) => (
                            <div key={key} className="param-field">
                                <label>{key}:</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                    min="1"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="btn-save" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
