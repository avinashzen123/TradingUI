# Instrument Analysis Redux Store - Usage Guide

## Overview
The `instrumentAnalysisSlice` provides a global state management solution for share market instrument-level analysis with automatic localStorage persistence.

## Features
- ✅ Add/Remove instruments
- ✅ Store technical indicators, patterns, and signals
- ✅ Track user actions (buy, sell, alerts)
- ✅ Add notes and tags to instruments
- ✅ Automatic localStorage persistence
- ✅ Survives app/OS restarts

## Usage Examples

### 1. Add an Instrument

```javascript
import { useDispatch } from 'react-redux';
import { addInstrument } from '../store/instrumentAnalysisSlice';

function MyComponent() {
    const dispatch = useDispatch();

    const handleAddInstrument = () => {
        dispatch(addInstrument({
            instrumentKey: 'NSE_EQ|INE002A01018',
            instrumentData: {
                name: 'Reliance Industries',
                symbol: 'RELIANCE',
                exchange: 'NSE',
                lastPrice: 2450.50,
            }
        }));
    };

    return <button onClick={handleAddInstrument}>Add to Analysis</button>;
}
```

### 2. Remove an Instrument

```javascript
import { removeInstrument } from '../store/instrumentAnalysisSlice';

const handleRemove = () => {
    dispatch(removeInstrument('NSE_EQ|INE002A01018'));
};
```

### 3. Update Technical Indicators

```javascript
import { updateTechnicalIndicators } from '../store/instrumentAnalysisSlice';

const handleUpdateIndicators = () => {
    dispatch(updateTechnicalIndicators({
        instrumentKey: 'NSE_EQ|INE002A01018',
        indicators: {
            rsi: 65.5,
            macd: { value: 12.3, signal: 10.5, histogram: 1.8 },
            sma_20: 2400,
            sma_50: 2350,
            ema_12: 2445,
            bollingerBands: { upper: 2500, middle: 2450, lower: 2400 }
        }
    }));
};
```

### 4. Add Pattern Detection

```javascript
import { addPattern } from '../store/instrumentAnalysisSlice';

const handleAddPattern = () => {
    dispatch(addPattern({
        instrumentKey: 'NSE_EQ|INE002A01018',
        pattern: {
            type: 'bullish_engulfing',
            confidence: 0.85,
            timeframe: '1D',
            description: 'Strong bullish reversal pattern detected'
        }
    }));
};
```

### 5. Add Trading Signal

```javascript
import { addSignal } from '../store/instrumentAnalysisSlice';

const handleAddSignal = () => {
    dispatch(addSignal({
        instrumentKey: 'NSE_EQ|INE002A01018',
        signal: {
            type: 'BUY',
            strength: 'STRONG',
            price: 2450.50,
            reason: 'RSI oversold + bullish pattern',
            targetPrice: 2550,
            stopLoss: 2400
        }
    }));
};
```

### 6. Track User Actions

```javascript
import { addUserAction } from '../store/instrumentAnalysisSlice';

const handleBuyAction = () => {
    dispatch(addUserAction({
        instrumentKey: 'NSE_EQ|INE002A01018',
        action: {
            type: 'BUY',
            quantity: 10,
            price: 2450.50,
            notes: 'Bought based on technical analysis'
        }
    }));
};
```

### 7. Add Notes and Tags

```javascript
import { updateNotes, addTag } from '../store/instrumentAnalysisSlice';

// Add notes
dispatch(updateNotes({
    instrumentKey: 'NSE_EQ|INE002A01018',
    notes: 'Strong support at 2400. Watch for breakout above 2500.'
}));

// Add tags
dispatch(addTag({
    instrumentKey: 'NSE_EQ|INE002A01018',
    tag: 'high-potential'
}));

dispatch(addTag({
    instrumentKey: 'NSE_EQ|INE002A01018',
    tag: 'energy-sector'
}));
```

### 8. Read Data with Selectors

```javascript
import { useSelector } from 'react-redux';
import {
    selectAllInstruments,
    selectInstrument,
    selectInstrumentAnalysis,
    selectInstrumentsByTag
} from '../store/instrumentAnalysisSlice';

function AnalysisView() {
    // Get all instruments
    const allInstruments = useSelector(selectAllInstruments);

    // Get specific instrument
    const instrument = useSelector(selectInstrument('NSE_EQ|INE002A01018'));

    // Get only analysis data
    const analysis = useSelector(selectInstrumentAnalysis('NSE_EQ|INE002A01018'));

    // Get instruments by tag
    const highPotentialStocks = useSelector(selectInstrumentsByTag('high-potential'));

    return (
        <div>
            <h2>Total Instruments: {Object.keys(allInstruments).length}</h2>
            {instrument && (
                <div>
                    <h3>{instrument.name}</h3>
                    <p>RSI: {analysis?.technicalIndicators?.rsi}</p>
                    <p>Notes: {instrument.notes}</p>
                    <p>Tags: {instrument.tags.join(', ')}</p>
                </div>
            )}
        </div>
    );
}
```

## Data Structure

Each instrument in the store has the following structure:

```javascript
{
    instrumentKey: "NSE_EQ|INE002A01018",
    name: "Reliance Industries",
    symbol: "RELIANCE",
    exchange: "NSE",
    lastPrice: 2450.50,
    addedAt: "2026-03-03T10:30:00.000Z",
    lastUpdated: "2026-03-03T14:45:00.000Z",
    notes: "Strong support at 2400",
    tags: ["high-potential", "energy-sector"],
    analysis: {
        technicalIndicators: {
            rsi: 65.5,
            macd: { value: 12.3, signal: 10.5, histogram: 1.8 },
            sma_20: 2400,
            sma_50: 2350
        },
        patterns: [
            {
                type: "bullish_engulfing",
                confidence: 0.85,
                detectedAt: "2026-03-03T14:00:00.000Z"
            }
        ],
        signals: [
            {
                type: "BUY",
                strength: "STRONG",
                price: 2450.50,
                timestamp: "2026-03-03T14:30:00.000Z"
            }
        ]
    },
    userActions: [
        {
            type: "BUY",
            quantity: 10,
            price: 2450.50,
            timestamp: "2026-03-03T14:45:00.000Z"
        }
    ]
}
```

## Persistence

All data is automatically saved to `localStorage` under the key `instrumentAnalysis`. The data persists across:
- Browser refreshes
- App restarts
- OS restarts

## Clear Data

```javascript
import { clearAllAnalysis, clearInstrumentAnalysis } from '../store/instrumentAnalysisSlice';

// Clear all instruments
dispatch(clearAllAnalysis());

// Clear specific instrument analysis (keeps the instrument but clears analysis data)
dispatch(clearInstrumentAnalysis('NSE_EQ|INE002A01018'));
```


---

## NEW FEATURES - Candle Data, Analysis & Alerts

### 9. Update Timeframe

```javascript
import { updateTimeframe } from '../store/instrumentAnalysisSlice';

const handleTimeframeChange = (timeframe) => {
    dispatch(updateTimeframe({
        instrumentKey: 'NSE_EQ|INE002A01018',
        timeframe: '5m' // Options: '1m', '5m', '15m', '30m', '1h', '1d'
    }));
};
```

### 10. Update Candle Data

```javascript
import { updateCandleData } from '../store/instrumentAnalysisSlice';

// Replace all candle data
dispatch(updateCandleData({
    instrumentKey: 'NSE_EQ|INE002A01018',
    candleData: [
        { time: 1234567890, open: 2400, high: 2450, low: 2390, close: 2445, volume: 1000000 },
        { time: 1234567950, open: 2445, high: 2460, low: 2440, close: 2455, volume: 1200000 },
    ],
    append: false
}));

// Append new candles (for real-time updates)
dispatch(updateCandleData({
    instrumentKey: 'NSE_EQ|INE002A01018',
    candleData: [
        { time: 1234568010, open: 2455, high: 2470, low: 2450, close: 2465, volume: 1100000 },
    ],
    append: true
}));
```

### 11. Add Alerts

```javascript
import { addAlert } from '../store/instrumentAnalysisSlice';

dispatch(addAlert({
    instrumentKey: 'NSE_EQ|INE002A01018',
    alert: {
        type: 'signal', // 'signal', 'pattern', 'action'
        severity: 'success', // 'success', 'warning', 'info'
        message: 'Strong buy signal detected'
    }
}));
```

### 12. Manage Alerts

```javascript
import { markAlertAsRead, clearAlerts, selectAllUnreadAlerts } from '../store/instrumentAnalysisSlice';

// Get all unread alerts
const unreadAlerts = useSelector(selectAllUnreadAlerts);

// Mark specific alert as read
dispatch(markAlertAsRead({
    instrumentKey: 'NSE_EQ|INE002A01018',
    alertId: 1234567890
}));

// Clear all alerts for an instrument
dispatch(clearAlerts('NSE_EQ|INE002A01018'));
```

## Component Architecture

### Component Flow

```
AnalysisDashboard (Main Page)
├── AlertsPanel (Fixed position, shows all alerts)
├── Instruments Sidebar (List of instruments)
└── InstrumentAnalysisView (Selected instrument)
    ├── TimeframeSelector (User selects timeframe)
    ├── CandleDataUpdater (Background: fetches candle data)
    ├── AnalysisEngine (Background: analyzes data periodically)
    ├── Chart (Displays candles)
    └── Analysis Results (Shows indicators, patterns, signals)
```

### How It Works

1. **TimeframeSelector**: User selects a timeframe (1m, 5m, 15m, etc.)
   - Dispatches `updateTimeframe` action
   - Clears existing candle data

2. **CandleDataUpdater**: Listens to timeframe changes
   - Fetches historical candle data from API
   - Dispatches `updateCandleData` action
   - Refreshes data periodically based on timeframe

3. **AnalysisEngine**: Runs periodically (default: 30 seconds)
   - Reads candle data from Redux store
   - Calculates technical indicators (RSI, MACD, SMA, etc.)
   - Detects patterns (bullish/bearish engulfing, etc.)
   - Generates trading signals
   - Dispatches updates to Redux store
   - Creates alerts for important events

4. **InstrumentAnalysisView**: Displays everything
   - Shows chart with candle data
   - Displays technical indicators
   - Lists recent patterns and signals
   - Updates in real-time as Redux store changes

5. **AlertsPanel**: Shows notifications
   - Displays unread alerts from all instruments
   - Shows bell icon with badge count
   - Allows marking alerts as read
   - Supports clearing all alerts

## Complete Integration Example

```javascript
import { Provider } from 'react-redux';
import { store } from './store/store';
import AnalysisDashboard from './pages/AnalysisDashboard';

function App() {
    return (
        <Provider store={store}>
            <AnalysisDashboard />
        </Provider>
    );
}

export default App;
```

## Data Flow Diagram

```
User Action (Select Timeframe)
    ↓
TimeframeSelector → updateTimeframe(Redux)
    ↓
CandleDataUpdater (listens to timeframe change)
    ↓
Fetch Candle Data from API
    ↓
updateCandleData(Redux)
    ↓
AnalysisEngine (listens to candle data change)
    ↓
Calculate Indicators & Detect Patterns
    ↓
updateTechnicalIndicators(Redux)
addPattern(Redux)
addSignal(Redux)
addAlert(Redux)
    ↓
InstrumentAnalysisView (displays data)
AlertsPanel (shows notifications)
```

## Persistence

All data including candle data, analysis results, and alerts are automatically saved to localStorage:
- Key: `instrumentAnalysis`
- Saved on every action (except real-time tick updates)
- Restored on app restart

## Performance Considerations

1. **Real-time Updates**: Use `updateLastCandle` for tick updates (doesn't save to localStorage)
2. **Analysis Interval**: Default 30 seconds, adjustable per instrument
3. **Candle Data Refresh**: Based on timeframe (1m = 1 min, 5m = 5 min, etc.)
4. **Alert Limit**: Consider limiting alerts to prevent memory issues

## Customization

### Change Analysis Interval

```javascript
<AnalysisEngine 
    instrumentKey={instrumentKey} 
    analysisInterval={60000} // 60 seconds
/>
```

### Add Custom Indicators

Edit `AnalysisEngine.jsx` and add your custom indicator calculations in the `runAnalysis` function.

### Add Custom Patterns

Edit the `detectPatterns` function in `AnalysisEngine.jsx` to add your pattern detection logic.
