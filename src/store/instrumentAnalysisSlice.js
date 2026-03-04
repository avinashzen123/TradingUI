import { createSlice, createSelector } from '@reduxjs/toolkit';

// Load persisted state from localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('instrumentAnalysis');
        if (serializedState === null) {
            return { instruments: {} };
        }
        const state = JSON.parse(serializedState);
        
        // Migration: Add chartType to existing indicators
        Object.keys(state.instruments || {}).forEach(key => {
            const instrument = state.instruments[key];
            if (instrument.indicators && instrument.indicators.enabled) {
                instrument.indicators.enabled = instrument.indicators.enabled.map(ind => {
                    // Add chartType if missing
                    if (!ind.chartType) {
                        if (ind.id === 'rsi' || ind.id === 'macd') {
                            ind.chartType = 'separate';
                        } else {
                            ind.chartType = 'overlay';
                        }
                    }
                    return ind;
                });
            }
            // Update available indicators with chartType
            if (instrument.indicators && instrument.indicators.available) {
                instrument.indicators.available = [
                    // Overlay indicators
                    { id: 'sma', name: 'SMA', params: { period: 20 }, color: '#3b82f6', chartType: 'overlay' },
                    { id: 'ema', name: 'EMA', params: { period: 12 }, color: '#8b5cf6', chartType: 'overlay' },
                    { id: 'wma', name: 'WMA', params: { period: 20 }, color: '#06b6d4', chartType: 'overlay' },
                    { id: 'hma', name: 'HMA', params: { period: 20 }, color: '#14b8a6', chartType: 'overlay' },
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
        
        return state;
    } catch (err) {
        console.error('Failed to load instrument analysis state:', err);
        return { instruments: {} };
    }
};

// Save state to localStorage
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('instrumentAnalysis', serializedState);
    } catch (err) {
        console.error('Failed to save instrument analysis state:', err);
        // If localStorage is full, try to clean up old cache entries
        if (err.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, cleaning up old cache...');
            cleanupOldCache(state);
            try {
                const serializedState = JSON.stringify(state);
                localStorage.setItem('instrumentAnalysis', serializedState);
            } catch (retryErr) {
                console.error('Failed to save even after cleanup:', retryErr);
            }
        }
    }
};

// Clean up old cache entries - keep only today's cache
const cleanupOldCache = (state) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    Object.keys(state.instruments).forEach(instrumentKey => {
        const instrument = state.instruments[instrumentKey];
        if (instrument.historicalDataCache) {
            const cacheKeys = Object.keys(instrument.historicalDataCache);
            let removedCount = 0;
            
            cacheKeys.forEach(cacheKey => {
                // Cache key format: "YYYY-MM-DD_days_timeframe"
                const cacheDate = cacheKey.split('_')[0]; // Extract date part
                
                // Remove cache entries that are not from today
                if (cacheDate !== today) {
                    delete instrument.historicalDataCache[cacheKey];
                    removedCount++;
                }
            });
            
            if (removedCount > 0) {
                console.log(`[cleanupOldCache] Removed ${removedCount} old cache entries for ${instrumentKey} (keeping only ${today})`);
            }
        }
    });
};

const initialState = loadState();

export const instrumentAnalysisSlice = createSlice({
    name: 'instrumentAnalysis',
    initialState,
    reducers: {
        // Add a new instrument to analysis
        addInstrument: (state, action) => {
            const { instrumentKey, instrumentData } = action.payload;
            if (!state.instruments[instrumentKey]) {
                state.instruments[instrumentKey] = {
                    ...instrumentData,
                    addedAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    notes: '',
                    tags: [],
                    timeframe: '5m', // Default timeframe
                    historicalDays: 30, // Default historical data range
                    candleData: [],
                    historicalDataCache: {}, // Cache keyed by: "YYYY-MM-DD_days_timeframe"
                    // Dynamic indicators configuration
                    indicators: {
                        enabled: [], // Array of enabled indicator configs
                        available: [
                            // Overlay indicators (plot on main chart)
                            { id: 'sma', name: 'SMA', params: { period: 20 }, color: '#3b82f6', chartType: 'overlay' },
                            { id: 'ema', name: 'EMA', params: { period: 12 }, color: '#8b5cf6', chartType: 'overlay' },
                            { id: 'wma', name: 'WMA', params: { period: 20 }, color: '#06b6d4', chartType: 'overlay' },
                            { id: 'hma', name: 'HMA', params: { period: 20 }, color: '#14b8a6', chartType: 'overlay' },
                            { id: 'bb', name: 'Bollinger Bands', params: { period: 20, stdDev: 2 }, color: '#ec4899', chartType: 'overlay' },
                            { id: 'vwap', name: 'VWAP', params: {}, color: '#f59e0b', chartType: 'overlay' },
                            
                            // Oscillators (plot in separate chart)
                            { id: 'rsi', name: 'RSI', params: { period: 14 }, color: '#10b981', chartType: 'separate' },
                            { id: 'macd', name: 'MACD', params: { fast: 12, slow: 26, signal: 9 }, color: '#f59e0b', chartType: 'separate' },
                            { id: 'stochastic', name: 'Stochastic', params: { period: 14, signalPeriod: 3 }, color: '#8b5cf6', chartType: 'separate' },
                            { id: 'cci', name: 'CCI', params: { period: 20 }, color: '#06b6d4', chartType: 'separate' },
                            { id: 'mfi', name: 'MFI', params: { period: 14 }, color: '#ec4899', chartType: 'separate' },
                            { id: 'adx', name: 'ADX', params: { period: 14 }, color: '#f59e0b', chartType: 'separate' },
                            { id: 'atr', name: 'ATR', params: { period: 14 }, color: '#10b981', chartType: 'separate' },
                            { id: 'roc', name: 'ROC', params: { period: 12 }, color: '#3b82f6', chartType: 'separate' },
                            { id: 'willr', name: 'Williams %R', params: { period: 14 }, color: '#8b5cf6', chartType: 'separate' },
                        ],
                    },
                    // Strategy configuration
                    strategy: {
                        name: 'default',
                        enabled: false,
                        rules: [],
                    },
                    analysis: {
                        technicalIndicators: {},
                        patterns: [],
                        signals: [],
                        lastAnalyzedAt: null,
                    },
                    userActions: [],
                    alerts: [],
                };
                saveState(state);
            }
        },

        // Add/Enable an indicator for an instrument
        addIndicator: (state, action) => {
            const { instrumentKey, indicator } = action.payload;
            if (state.instruments[instrumentKey]) {
                const exists = state.instruments[instrumentKey].indicators.enabled.find(
                    ind => ind.id === indicator.id && JSON.stringify(ind.params) === JSON.stringify(indicator.params)
                );
                if (!exists) {
                    state.instruments[instrumentKey].indicators.enabled.push({
                        ...indicator,
                        visible: true, // Default to visible
                        addedAt: new Date().toISOString(),
                    });
                    saveState(state);
                }
            }
        },

        // Toggle indicator visibility
        toggleIndicatorVisibility: (state, action) => {
            const { instrumentKey, indicatorId, params } = action.payload;
            if (state.instruments[instrumentKey]) {
                const indicator = state.instruments[instrumentKey].indicators.enabled.find(
                    ind => ind.id === indicatorId && JSON.stringify(ind.params) === JSON.stringify(params)
                );
                if (indicator) {
                    indicator.visible = !indicator.visible;
                    saveState(state);
                }
            }
        },

        // Remove/Disable an indicator
        removeIndicator: (state, action) => {
            const { instrumentKey, indicatorId, params } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].indicators.enabled = 
                    state.instruments[instrumentKey].indicators.enabled.filter(
                        ind => !(ind.id === indicatorId && JSON.stringify(ind.params) === JSON.stringify(params))
                    );
                saveState(state);
            }
        },

        // Update indicator parameters
        updateIndicatorParams: (state, action) => {
            const { instrumentKey, indicatorId, oldParams, newParams } = action.payload;
            if (state.instruments[instrumentKey]) {
                const indicator = state.instruments[instrumentKey].indicators.enabled.find(
                    ind => ind.id === indicatorId && JSON.stringify(ind.params) === JSON.stringify(oldParams)
                );
                if (indicator) {
                    indicator.params = newParams;
                    saveState(state);
                }
            }
        },

        // Update strategy configuration
        updateStrategy: (state, action) => {
            const { instrumentKey, strategy } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].strategy = {
                    ...state.instruments[instrumentKey].strategy,
                    ...strategy,
                };
                saveState(state);
            }
        },

        // Update timeframe for an instrument
        updateTimeframe: (state, action) => {
            const { instrumentKey, timeframe } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].timeframe = timeframe;
                // Clear candle data when timeframe changes
                state.instruments[instrumentKey].candleData = [];
                saveState(state);
            }
        },

        // Update historical days for an instrument
        updateHistoricalDays: (state, action) => {
            const { instrumentKey, days } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].historicalDays = days;
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Update candle data for an instrument with smart caching
        updateCandleData: (state, action) => {
            const { instrumentKey, candleData, append = false, cacheKey = null } = action.payload;
            if (state.instruments[instrumentKey]) {
                if (cacheKey) {
                    // Store in cache with the specific key
                    if (!state.instruments[instrumentKey].historicalDataCache) {
                        state.instruments[instrumentKey].historicalDataCache = {};
                    }
                    state.instruments[instrumentKey].historicalDataCache[cacheKey] = {
                        data: candleData,
                        fetchedAt: new Date().toISOString()
                    };
                }
                
                if (append) {
                    // Append new candles (for real-time updates)
                    state.instruments[instrumentKey].candleData = [
                        ...state.instruments[instrumentKey].candleData,
                        ...candleData,
                    ];
                } else {
                    // Replace all candle data
                    state.instruments[instrumentKey].candleData = candleData;
                }
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Update last candle (for real-time tick updates)
        updateLastCandle: (state, action) => {
            const { instrumentKey, candle } = action.payload;
            if (state.instruments[instrumentKey]) {
                const candles = state.instruments[instrumentKey].candleData;
                if (candles.length > 0) {
                    candles[candles.length - 1] = candle;
                } else {
                    candles.push(candle);
                }
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                // Don't save to localStorage on every tick to avoid performance issues
            }
        },

        // Remove an instrument from analysis
        removeInstrument: (state, action) => {
            const instrumentKey = action.payload;
            delete state.instruments[instrumentKey];
            saveState(state);
        },

        // Update instrument analysis data
        updateAnalysis: (state, action) => {
            const { instrumentKey, analysis } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].analysis = {
                    ...state.instruments[instrumentKey].analysis,
                    ...analysis,
                    lastAnalyzedAt: new Date().toISOString(),
                };
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Add technical indicators
        updateTechnicalIndicators: (state, action) => {
            const { instrumentKey, indicators } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].analysis.technicalIndicators = {
                    ...state.instruments[instrumentKey].analysis.technicalIndicators,
                    ...indicators,
                };
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Add pattern detection results
        addPattern: (state, action) => {
            const { instrumentKey, pattern } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].analysis.patterns.push({
                    ...pattern,
                    detectedAt: new Date().toISOString(),
                });
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Add trading signal
        addSignal: (state, action) => {
            const { instrumentKey, signal } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].analysis.signals.push({
                    ...signal,
                    timestamp: new Date().toISOString(),
                });
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Add user notes
        updateNotes: (state, action) => {
            const { instrumentKey, notes } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].notes = notes;
                state.instruments[instrumentKey].lastUpdated = new Date().toISOString();
                saveState(state);
            }
        },

        // Add/remove tags
        addTag: (state, action) => {
            const { instrumentKey, tag } = action.payload;
            if (state.instruments[instrumentKey]) {
                if (!state.instruments[instrumentKey].tags.includes(tag)) {
                    state.instruments[instrumentKey].tags.push(tag);
                    saveState(state);
                }
            }
        },

        removeTag: (state, action) => {
            const { instrumentKey, tag } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].tags = state.instruments[instrumentKey].tags.filter(
                    t => t !== tag
                );
                saveState(state);
            }
        },

        // Track user actions (buy, sell, alerts, etc.)
        addUserAction: (state, action) => {
            const { instrumentKey, action: userAction } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].userActions.push({
                    ...userAction,
                    timestamp: new Date().toISOString(),
                });
                
                // Create alert for this action
                state.instruments[instrumentKey].alerts.push({
                    id: Date.now(),
                    type: 'action',
                    severity: 'info',
                    message: `${userAction.type} action recorded`,
                    instrumentKey,
                    timestamp: new Date().toISOString(),
                    read: false,
                });
                
                saveState(state);
            }
        },

        // Add alert
        addAlert: (state, action) => {
            const { instrumentKey, alert } = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].alerts.push({
                    id: Date.now(),
                    ...alert,
                    timestamp: new Date().toISOString(),
                    read: false,
                });
                saveState(state);
            }
        },

        // Mark alert as read
        markAlertAsRead: (state, action) => {
            const { instrumentKey, alertId } = action.payload;
            if (state.instruments[instrumentKey]) {
                const alert = state.instruments[instrumentKey].alerts.find(a => a.id === alertId);
                if (alert) {
                    alert.read = true;
                    saveState(state);
                }
            }
        },

        // Clear alerts for an instrument
        clearAlerts: (state, action) => {
            const instrumentKey = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].alerts = [];
                saveState(state);
            }
        },

        // Clear all analysis data (useful for reset)
        clearAllAnalysis: (state) => {
            state.instruments = {};
            saveState(state);
        },

        // Clear old cache entries for an instrument (keep only today's cache)
        clearOldCache: (state, action) => {
            const { instrumentKey } = action.payload;
            if (state.instruments[instrumentKey] && state.instruments[instrumentKey].historicalDataCache) {
                const today = new Date().toISOString().split('T')[0];
                const cache = state.instruments[instrumentKey].historicalDataCache;
                const cacheKeys = Object.keys(cache);
                let removedCount = 0;
                
                cacheKeys.forEach(cacheKey => {
                    // Cache key format: "YYYY-MM-DD_days_timeframe"
                    const cacheDate = cacheKey.split('_')[0];
                    
                    // Remove cache entries that are not from today
                    if (cacheDate !== today) {
                        delete cache[cacheKey];
                        removedCount++;
                    }
                });
                
                if (removedCount > 0) {
                    console.log(`[clearOldCache] Removed ${removedCount} old cache entries for ${instrumentKey} (keeping only ${today})`);
                    saveState(state);
                }
            }
        },

        // Clear all cache for an instrument
        clearInstrumentCache: (state, action) => {
            const instrumentKey = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].historicalDataCache = {};
                console.log(`[clearInstrumentCache] Cleared all cache for ${instrumentKey}`);
                saveState(state);
            }
        },

        // Clear analysis for specific instrument
        clearInstrumentAnalysis: (state, action) => {
            const instrumentKey = action.payload;
            if (state.instruments[instrumentKey]) {
                state.instruments[instrumentKey].analysis = {
                    technicalIndicators: {},
                    patterns: [],
                    signals: [],
                };
                state.instruments[instrumentKey].userActions = [];
                saveState(state);
            }
        },
    },
});

// Actions
export const {
    addInstrument,
    removeInstrument,
    updateTimeframe,
    updateHistoricalDays,
    updateCandleData,
    updateLastCandle,
    addIndicator,
    toggleIndicatorVisibility,
    removeIndicator,
    updateIndicatorParams,
    updateStrategy,
    updateAnalysis,
    updateTechnicalIndicators,
    addPattern,
    addSignal,
    updateNotes,
    addTag,
    removeTag,
    addUserAction,
    addAlert,
    markAlertAsRead,
    clearAlerts,
    clearAllAnalysis,
    clearInstrumentAnalysis,
    clearOldCache,
    clearInstrumentCache,
} = instrumentAnalysisSlice.actions;

// Selectors
export const selectAllInstruments = (state) => state.instrumentAnalysis.instruments;

export const selectInstrument = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey];

export const selectInstrumentAnalysis = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.analysis;

export const selectInstrumentCandleData = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.candleData || [];

export const selectInstrumentHistoricalDataCache = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.historicalDataCache || {};

export const selectInstrumentHistoricalDays = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.historicalDays || 30;

export const selectInstrumentTimeframe = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.timeframe;

export const selectInstrumentsByTag = (tag) => (state) =>
    Object.entries(state.instrumentAnalysis.instruments)
        .filter(([_, instrument]) => instrument.tags.includes(tag))
        .map(([key, instrument]) => ({ instrumentKey: key, ...instrument }));

export const selectInstrumentUserActions = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.userActions || [];

export const selectInstrumentIndicators = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.indicators;

export const selectInstrumentStrategy = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.strategy;

export const selectInstrumentAlerts = (instrumentKey) => (state) =>
    state.instrumentAnalysis.instruments[instrumentKey]?.alerts || [];

export const selectAllUnreadAlerts = createSelector(
    [(state) => state.instrumentAnalysis.instruments],
    (instruments) =>
        Object.entries(instruments)
            .flatMap(([key, instrument]) =>
                (instrument.alerts || [])
                    .filter(alert => !alert.read)
                    .map(alert => ({ ...alert, instrumentKey: key, instrumentName: instrument.name }))
            )
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
);

export default instrumentAnalysisSlice.reducer;
