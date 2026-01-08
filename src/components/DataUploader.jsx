import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDailyData, clearDailyData, selectDailyData } from '../store/dailyDataSlice';
import { Upload, Trash2, FileText } from 'lucide-react';

const DataUploader = () => {
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const currentData = useSelector(selectDailyData);
    const [status, setStatus] = useState('');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            setStatus('Error: Please upload a .txt file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/);
            const parsedData = {};
            let count = 0;

            lines.forEach(line => {
                if (!line.trim()) return;
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    if (key) {
                        parsedData[key] = value;
                        count++;
                    }
                }
            });

            if (count > 0) {
                dispatch(setDailyData(parsedData));
                setStatus(`Success: Packed ${count} entries.`);
            } else {
                setStatus('Warning: No valid key=value pairs found.');
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset input
    };

    const handleClear = () => {
        dispatch(clearDailyData());
        setStatus('Data cleared.');
    };

    const dataCount = Object.keys(currentData).length;

    return (
        <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-secondary" /> Daily Data
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }} className="text-secondary">
                    Storage: {dataCount} entries
                    {dataCount > 0 && <span className="text-success" style={{ marginLeft: '0.5rem' }}>(Till midnight)</span>}
                </div>

                {status && (
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: status.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: status.startsWith('Error') ? 'var(--danger-color)' : 'var(--success-color)',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {status}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current.click()}
                >
                    <Upload size={18} style={{ marginRight: '0.5rem' }} />
                    Upload .txt
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".txt"
                    onChange={handleFileUpload}
                />

                {dataCount > 0 && (
                    <button
                        className="btn"
                        style={{ color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}
                        onClick={handleClear}
                    >
                        <Trash2 size={18} style={{ marginRight: '0.5rem' }} />
                        Clear
                    </button>
                )}
            </div>

            {dataCount > 0 && (
                <div style={{ marginTop: '1.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                        <tbody>
                            {Object.entries(currentData).slice(0, 50).map(([key, val]) => (
                                <tr key={key}>
                                    <td style={{ padding: '0.25rem', color: 'var(--text-secondary)' }}>{key}</td>
                                    <td style={{ padding: '0.25rem' }}>{val}</td>
                                </tr>
                            ))}
                            {dataCount > 50 && (
                                <tr>
                                    <td colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        ...and {dataCount - 50} more
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DataUploader;
