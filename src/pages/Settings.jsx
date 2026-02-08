import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectDailyData, setDailyData } from '../store/dailyDataSlice';
import DataUploader from '../components/DataUploader';
import { Key, Save, Shield } from 'lucide-react';

const Settings = () => {
    const dispatch = useDispatch();
    const dailyData = useSelector(selectDailyData);

    const [token, setToken] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (dailyData['UPSTOX_TOKEN']) {
            setToken(dailyData['UPSTOX_TOKEN']);
        }
    }, [dailyData]);

    const handleTokenChange = (e) => {
        setToken(e.target.value);
        setIsDirty(true);
        setSaveStatus('');
    };

    const saveToken = () => {
        if (!token.trim()) {
            setSaveStatus('Token cannot be empty');
            return;
        }

        // Save to Redux (and localStorage via slice)
        dispatch(setDailyData({ 'UPSTOX_TOKEN': token }));
        setSaveStatus('Saved!');
        setIsDirty(false);

        // Clear status after 2 seconds
        setTimeout(() => setSaveStatus(''), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>

            {/* Page Header */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Settings</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your application configuration and data.</p>
            </div>

            {/* General Settings - API Tokens */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} className="text-secondary" /> General Configuration
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Upstox Access Token (UPSTOX_TOKEN)
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="password"
                                    value={token}
                                    onChange={handleTokenChange}
                                    placeholder="Enter your Upstox Access Token"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'white',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={saveToken}
                                disabled={!isDirty}
                                style={{ opacity: !isDirty ? 0.7 : 1 }}
                            >
                                <Save size={16} style={{ marginRight: '0.5rem' }} /> Save
                            </button>
                        </div>
                        {saveStatus && (
                            <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                color: saveStatus === 'Saved!' ? 'var(--success-color)' : 'var(--danger-color)'
                            }}>
                                {saveStatus}
                            </div>
                        )}
                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            This token is required for fetching historical data and real-time quotes. It resets daily.
                        </p>
                    </div>

                </div>
            </div>

            {/* Data Management */}
            <DataUploader />

        </div>
    );
};

export default Settings;
