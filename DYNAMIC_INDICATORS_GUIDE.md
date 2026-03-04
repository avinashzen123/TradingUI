# Dynamic Indicators System - Implementation Guide

## Overview

I've implemented a dynamic indicator system that allows you to:
1. ✅ Add indicators dynamically per instrument
2. ✅ Configure indicator parameters (period, stdDev, etc.)
3. ✅ Persist indicator configuration with instrument data
4. ✅ Remove indicators
5. ✅ Edit indicator parameters on the fly

## Architecture

### Redux Store Structure

Each instrument now has an `indicators` object:

```javascript
{
  instrumentKey: "NSE_EQ|INE002A01018",
  indicators: {
    enabled: [
      {
        id: 'sma',
        name: 'SMA',
        params: { period: 20 },
        color: '#3b82f6',
        addedAt: '2026-03-03T...'
      },
      {
        id: 'ema',
        name: 'EMA',
        params: { period: 12 },
        color: '#8b5cf6',
        addedAt: '2026-03-03T...'
      }
    ],
    available: [
      // Predefined indicator templates
      { id: 'sma', name: 'SMA', params: { period: 20 }, color: '#3b82f6' },
      { id: 'ema', name: 'EMA', params: { period: 12 }, color: '#8b5cf6' },
      { id: 'bb', name: 'Bollinger Bands', params: { period: 20, stdDev: 2 }, color: '#ec4899' },
      { id: 'rsi', name: 'RSI', params: { period: 14 }, color: '#10b981' },
      { id: 'macd', name: 'MACD', params: { fast: 12, slow: 26, signal: 9 }, color: '#f59e0b' }
    ]
  }
}
```

### New Redux Actions

```javascript
// Add an indicator
dispatch(addIndicator({
    instrumentKey: 'NSE_EQ|INE002A01018',
    indicator: {
        id: 'sma',
        name: 'SMA',
        params: { period: 50 },
        color: '#3b82f6'
    }
}));

// Remove an indicator
dispatch(removeIndicator({
    instrumentKey: 'NSE_EQ|INE002A01018',
    indicatorId: 'sma',
    params: { period: 50 }
}));

// Update indicator parameters
dispatch(updateIndicatorParams({
    instrumentKey: 'NSE_EQ|INE002A01018',
    indicatorId: 'sma',
    oldParams: { period: 20 },
    newParams: { period: 50 }
}));
```

### New Components

#### 1. IndicatorManager Component
- Displays active indicators as chips
- "Add Indicator" button opens modal
- Edit button (⚙️) to modify parameters
- Remove button (×) to delete indicator
- Shows indicator color, name, and parameters

#### 2. Dynamic Chart Plotting
- Reads enabled indicators from Redux
- Plots indicators dynamically based on configuration
- Supports multiple instances of same indicator with different params
- Example: SMA(20), SMA(50), SMA(100) all at once

## Features

### 1. Add Indicators
- Click "Add Indicator" button
- Select from available indicators
- Indicator is added with default parameters
- Automatically plotted on chart
- Configuration saved to localStorage

### 2. Edit Parameters
- Click ⚙️ icon on any indicator chip
- Modal opens with parameter inputs
- Modify values (e.g., change SMA period from 20 to 50)
- Click "Save Changes"
- Chart updates immediately
- Changes persisted

### 3. Remove Indicators
- Click × icon on indicator chip
- Indicator removed from chart
- Configuration updated in Redux
- Changes persisted

### 4. Multiple Instances
You can add the same indicator multiple times with different parameters:
- SMA (20) - Blue
- SMA (50) - Blue
- SMA (100) - Blue

Each instance is tracked separately.

## Supported Indicators

### Currently Implemented:
1. **SMA (Simple Moving Average)**
   - Parameters: period
   - Example: SMA(20), SMA(50)

2. **EMA (Exponential Moving Average)**
   - Parameters: period
   - Example: EMA(12), EMA(26)

3. **Bollinger Bands**
   - Parameters: period, stdDev
   - Plots: Upper, Middle, Lower bands
   - Example: BB(20, 2)

### Ready to Add (in available list):
4. **RSI (Relative Strength Index)**
   - Parameters: period
   - Needs: Separate panel below main chart

5. **MACD**
   - Parameters: fast, slow, signal
   - Needs: Separate panel below main chart

## Persistence

All indicator configurations are:
- ✅ Saved to Redux store
- ✅ Persisted to localStorage
- ✅ Restored on app restart
- ✅ Unique per instrument

## Strategy System (Prepared)

The Redux store also includes a `strategy` object for each instrument:

```javascript
{
  strategy: {
    name: 'default',
    enabled: false,
    rules: [
      {
        type: 'entry',
        conditions: [
          { indicator: 'sma', period: 20, operator: 'crosses_above', value: 'price' },
          { indicator: 'rsi', period: 14, operator: '<', value: 30 }
        ],
        action: 'BUY'
      }
    ]
  }
}
```

This is ready for future implementation of strategy builder.

## Adding New Indicators

To add a new indicator:

### 1. Add to available list in Redux:
```javascript
// In instrumentAnalysisSlice.js
available: [
  // ... existing
  { 
    id: 'stochastic', 
    name: 'Stochastic', 
    params: { kPeriod: 14, dPeriod: 3 }, 
    color: '#06b6d4' 
  }
]
```

### 2. Add plotting logic in InstrumentAnalysisView:
```javascript
else if (indicator.id === 'stochastic') {
    const { kPeriod, dPeriod } = indicator.params;
    const values = Stochastic.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: kPeriod,
        signalPeriod: dPeriod
    });
    // ... plot logic
}
```

## Integration with Python Strategy

To integrate with your Python strategy code:

1. **Export indicator configuration:**
```javascript
const config = {
    instrumentKey: 'NSE_EQ|INE002A01018',
    timeframe: '5m',
    indicators: instrument.indicators.enabled,
    strategy: instrument.strategy
};
// Send to Python backend
```

2. **Python can read:**
```python
config = {
    'indicators': [
        {'id': 'sma', 'params': {'period': 20}},
        {'id': 'ema', 'params': {'period': 12}}
    ]
}
# Calculate indicators based on config
```

## Next Steps

1. **Add RSI & MACD with separate panels**
2. **Implement Strategy Builder UI**
3. **Add more indicators (Stochastic, ATR, ADX, etc.)**
4. **Backtest strategies**
5. **Export/Import indicator configurations**

## Usage Example

```javascript
// User workflow:
1. Add instrument to analysis
2. Click "Add Indicator"
3. Select "SMA" → Added with period=20
4. Click "Add Indicator" again
5. Select "SMA" → Added with period=50
6. Click ⚙️ on first SMA
7. Change period to 30
8. Chart now shows SMA(30) and SMA(50)
9. All saved automatically
10. Refresh page → indicators still there!
```

## Benefits

✅ **Flexible**: Add any indicator with any parameters
✅ **Persistent**: Survives app restarts
✅ **Per-Instrument**: Each instrument has its own config
✅ **Editable**: Change parameters on the fly
✅ **Scalable**: Easy to add new indicators
✅ **Strategy-Ready**: Foundation for strategy builder

---

**Note:** If you can share your Python strategy code, I can create a more specific integration that matches your exact approach!
