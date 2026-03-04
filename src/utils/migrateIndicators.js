/**
 * Utility to migrate indicators in localStorage to add chartType property
 * Run this once if RSI/MACD indicators are not showing in separate charts
 */
export function migrateIndicatorsInLocalStorage() {
    try {
        const serializedState = localStorage.getItem('instrumentAnalysis');
        if (!serializedState) {
            console.log('No data to migrate');
            return;
        }

        const state = JSON.parse(serializedState);
        let migrated = false;

        Object.keys(state.instruments || {}).forEach(key => {
            const instrument = state.instruments[key];
            
            if (instrument.indicators && instrument.indicators.enabled) {
                instrument.indicators.enabled = instrument.indicators.enabled.map(ind => {
                    if (!ind.chartType) {
                        migrated = true;
                        console.log(`Migrating indicator ${ind.id} for ${key}`);
                        
                        if (ind.id === 'rsi' || ind.id === 'macd') {
                            ind.chartType = 'separate';
                        } else {
                            ind.chartType = 'overlay';
                        }
                    }
                    return ind;
                });
            }

            // Update available indicators
            if (instrument.indicators) {
                instrument.indicators.available = [
                    // Overlay indicators
                    { id: 'sma', name: 'SMA', params: { period: 20 }, color: '#3b82f6', chartType: 'overlay' },
                    { id: 'ema', name: 'EMA', params: { period: 12 }, color: '#8b5cf6', chartType: 'overlay' },
                    { id: 'wma', name: 'WMA', params: { period: 20 }, color: '#06b6d4', chartType: 'overlay' },
                    { id: 'bb', name: 'Bollinger Bands', params: { period: 20, stdDev: 2 }, color: '#ec4899', chartType: 'overlay' },
                    { id: 'vwap', name: 'VWAP', params: {}, color: '#f59e0b', chartType: 'overlay' },
                    // Oscillators
                    { id: 'rsi', name: 'RSI', params: { period: 14 }, color: '#10b981', chartType: 'separate' },
                    { id: 'macd', name: 'MACD', params: { fast: 12, slow: 26, signal: 9 }, color: '#f59e0b', chartType: 'separate' },
                    { id: 'stochastic', name: 'Stochastic', params: { period: 14, signalPeriod: 3 }, color: '#8b5cf6', chartType: 'separate' },
                    { id: 'cci', name: 'CCI', params: { period: 20 }, color: '#06b6d4', chartType: 'separate' },
                    { id: 'mfi', name: 'MFI', params: { period: 14 }, color: '#ec4899', chartType: 'separate' },
                    { id: 'adx', name: 'ADX', params: { period: 14 }, color: '#f59e0b', chartType: 'separate' },
                    { id: 'atr', name: 'ATR', params: { period: 14 }, color: '#10b981', chartType: 'separate' },
                    { id: 'roc', name: 'ROC', params: { period: 12 }, color: '#3b82f6', chartType: 'separate' },
                    { id: 'willr', name: 'Williams %R', params: { period: 14 }, color: '#8b5cf6', chartType: 'separate' },
                ];
            }
        });

        if (migrated) {
            localStorage.setItem('instrumentAnalysis', JSON.stringify(state));
            console.log('✅ Migration complete! Please refresh the page.');
            return true;
        } else {
            console.log('No migration needed');
            return false;
        }
    } catch (err) {
        console.error('Migration failed:', err);
        return false;
    }
}

// Auto-run migration on import
if (typeof window !== 'undefined') {
    migrateIndicatorsInLocalStorage();
}
