# Quick Integration Guide

## Setup Complete! ✅

Your Redux store for instrument analysis is ready with all features:

1. ✅ Add/Remove instruments
2. ✅ Timeframe selection with automatic candle data updates
3. ✅ Periodic analysis engine (technical indicators, patterns, signals)
4. ✅ Real-time chart display
5. ✅ Alert system for all instrument actions
6. ✅ LocalStorage persistence

## Files Created

### Redux Store
- `src/store/instrumentAnalysisSlice.js` - Main Redux slice
- `src/store/store.js` - Updated with new slice

### Components
- `src/components/TimeframeSelector.jsx` - Timeframe dropdown
- `src/components/CandleDataUpdater.jsx` - Background data fetcher
- `src/components/AnalysisEngine.jsx` - Periodic analysis runner
- `src/components/InstrumentAnalysisView.jsx` - Main analysis display
- `src/components/AlertsPanel.jsx` - Alerts notification panel
- `src/components/InstrumentAnalysis.css` - Styling

### Pages
- `src/pages/AnalysisDashboard.jsx` - Complete dashboard example

### Documentation
- `src/store/USAGE_EXAMPLE.md` - Detailed usage examples
- `src/store/INTEGRATION_GUIDE.md` - This file

## Quick Start (3 Steps)

### Step 1: Import the Dashboard

```javascript
// In your App.jsx or main routing file
import AnalysisDashboard from './pages/AnalysisDashboard';

function App() {
    return (
        <div>
            <AnalysisDashboard />
        </div>
    );
}
```

### Step 2: Add CSS Import

```javascript
// In your main.jsx or App.jsx
import './components/InstrumentAnalysis.css';
```

### Step 3: Test It!

The dashboard is ready to use with:
- Add instrument button
- Timeframe selector
- Live chart
- Technical indicators
- Pattern detection
- Signal generation
- Alert notifications

## How Components Work Together

```
┌─────────────────────────────────────────────────────────┐
│                   AnalysisDashboard                      │
│  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │   Sidebar      │  │   InstrumentAnalysisView     │  │
│  │                │  │  ┌────────────────────────┐  │  │
│  │ - Instrument 1 │  │  │  TimeframeSelector     │  │  │
│  │ - Instrument 2 │  │  └────────────────────────┘  │  │
│  │ - Instrument 3 │  │  ┌────────────────────────┐  │  │
│  │                │  │  │  Chart (Candles)       │  │  │
│  │ [+ Add]        │  │  └────────────────────────┘  │  │
│  └────────────────┘  │  ┌────────────────────────┐  │  │
│                      │  │  Technical Indicators  │  │  │
│  ┌────────────────┐  │  │  - RSI: 65.5          │  │  │
│  │  AlertsPanel   │  │  │  - MACD: 12.3         │  │  │
│  │  🔔 (3)        │  │  │  - SMA20: 2400        │  │  │
│  └────────────────┘  │  └────────────────────────┘  │  │
│                      │  ┌────────────────────────┐  │  │
│                      │  │  Patterns & Signals    │  │  │
│                      │  └────────────────────────┘  │  │
│                      └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Background Components (No UI):
- CandleDataUpdater: Fetches data when timeframe changes
- AnalysisEngine: Runs analysis every 30 seconds
```

## Data Flow

```
User selects timeframe
    ↓
Redux: updateTimeframe
    ↓
CandleDataUpdater detects change
    ↓
Fetches candle data from API
    ↓
Redux: updateCandleData
    ↓
Chart updates automatically
    ↓
AnalysisEngine runs (every 30s)
    ↓
Calculates indicators
    ↓
Redux: updateTechnicalIndicators, addPattern, addSignal, addAlert
    ↓
UI updates automatically
    ↓
AlertsPanel shows notification
```

## Customization Points

### 1. Change Analysis Frequency

```javascript
// In InstrumentAnalysisView.jsx
<AnalysisEngine 
    instrumentKey={instrumentKey} 
    analysisInterval={60000} // Change from 30s to 60s
/>
```

### 2. Add More Timeframes

```javascript
// In TimeframeSelector.jsx
const TIMEFRAMES = [
    { value: '1m', label: '1 Min' },
    { value: '3m', label: '3 Min' }, // Add this
    { value: '5m', label: '5 Min' },
    // ... more
];
```

### 3. Add Custom Indicators

```javascript
// In AnalysisEngine.jsx, inside runAnalysis()
const stochastic = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
    signalPeriod: 3
});

dispatch(updateTechnicalIndicators({
    instrumentKey,
    indicators: {
        // ... existing indicators
        stochastic: stochastic[stochastic.length - 1]
    }
}));
```

### 4. Add Custom Patterns

```javascript
// In AnalysisEngine.jsx, in detectPatterns()
// Add your pattern detection logic
if (/* your pattern condition */) {
    dispatch(addPattern({
        instrumentKey,
        pattern: {
            type: 'my_custom_pattern',
            confidence: 0.8,
            description: 'Custom pattern detected'
        }
    }));
}
```

### 5. Customize Alert Triggers

```javascript
// In AnalysisEngine.jsx, in generateSignals()
// Add custom alert conditions
if (rsi < 25) { // More aggressive oversold
    dispatch(addAlert({
        instrumentKey,
        alert: {
            type: 'signal',
            severity: 'success',
            message: 'Extreme oversold condition!'
        }
    }));
}
```

## API Integration

You need to implement the actual API calls in `ChartService.js`:

```javascript
// src/services/ChartService.js
export const ChartService = {
    async getHistoricalData(instrumentKey, timeframe) {
        // Replace with your actual API call
        const response = await fetch(`/api/candles/${instrumentKey}?timeframe=${timeframe}`);
        const data = await response.json();
        
        // Return format: [{ time, open, high, low, close, volume }, ...]
        return data.candles;
    }
};
```

## Testing Without API

For testing, you can use mock data:

```javascript
// In CandleDataUpdater.jsx, replace fetchCandleData with:
const fetchCandleData = async () => {
    // Mock data for testing
    const mockCandles = Array.from({ length: 100 }, (_, i) => ({
        time: Date.now() / 1000 - (100 - i) * 300, // 5 min intervals
        open: 2400 + Math.random() * 100,
        high: 2450 + Math.random() * 100,
        low: 2350 + Math.random() * 100,
        close: 2400 + Math.random() * 100,
        volume: 1000000 + Math.random() * 500000,
    }));

    dispatch(updateCandleData({
        instrumentKey,
        candleData: mockCandles,
        append: false,
    }));
};
```

## Troubleshooting

### Charts not showing?
- Check if `lightweight-charts` is installed: `npm install lightweight-charts`
- Verify candle data format matches: `{ time, open, high, low, close }`

### Analysis not running?
- Check browser console for errors
- Verify candle data has at least 50 candles
- Check if `technicalindicators` package is installed

### Alerts not appearing?
- Check if AlertsPanel is rendered in your app
- Verify Redux store is properly connected
- Check browser console for Redux errors

### Data not persisting?
- Check localStorage in browser DevTools
- Look for key: `instrumentAnalysis`
- Verify no localStorage quota errors

## Next Steps

1. Implement real API integration in `ChartService.js`
2. Add WebSocket support for real-time updates
3. Customize indicators and patterns for your strategy
4. Add more chart types (line, area, etc.)
5. Implement export/import functionality
6. Add backtesting capabilities

## Support

For detailed examples, see `USAGE_EXAMPLE.md`

For Redux store structure, see `instrumentAnalysisSlice.js`

Happy Trading! 📈
