import { useDispatch, useSelector } from 'react-redux';
import { updateHistoricalDays, selectInstrument } from '../store/instrumentAnalysisSlice';

export default function DaysSelector({ instrumentKey }) {
    const dispatch = useDispatch();
    const instrument = useSelector(selectInstrument(instrumentKey));
    const historicalDays = instrument?.historicalDays || 30;
    
    // Detect exchange type for display purposes
    const isMCX = instrumentKey?.includes('MCX');

    const handleDaysChange = (e) => {
        const days = parseInt(e.target.value);
        dispatch(updateHistoricalDays({ instrumentKey, days }));
    };

    // Show all options - backend will auto-adjust if needed
    const daysOptions = [
        { value: 1, label: '1 Day' },
        { value: 3, label: '3 Days' },
        { value: 7, label: '7 Days' },
        { value: 15, label: '15 Days' },
        { value: 30, label: '30 Days' },
        { value: 60, label: '60 Days' },
        { value: 90, label: '90 Days' },
        { value: 180, label: '6 Months' },
        { value: 365, label: '1 Year' },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Historical Data:
            </label>
            <select
                value={historicalDays}
                onChange={handleDaysChange}
                style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                }}
            >
                {daysOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {isMCX && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    (MCX: auto-limited by API)
                </span>
            )}
        </div>
    );
}
