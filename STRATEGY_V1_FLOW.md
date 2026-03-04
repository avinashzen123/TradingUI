# Strategy V1 - Call Flow Documentation

## Overview
The strategy_v1 code is automatically called every 30 seconds (configurable) to analyze candle data and generate trading signals.

## Call Flow Diagram

```
User adds instrument to Market Analysis
           ↓
InstrumentAnalysisView component renders
           ↓
AnalysisEngine component mounts (background component)
           ↓
Every 30 seconds (or when candle count changes):
           ↓
AnalysisEngine.runAnalysis()
           ↓
1. Calculate technical indicators (RSI, MACD, BB, SMA, EMA)
2. Detect patterns (Bullish/Bearish Engulfing)
3. ⭐ Call analyzeWithStrategies(instrumentName, candleData)
           ↓
Strategy V1 analyzes data
           ↓
Returns signal: { type, price, stopLoss, target, message, confidence, strategy }
           ↓
If signal !== 'NONE':
  - Dispatch addSignal() to Redux store
  - Dispatch addAlert() to show notification
           ↓
UI updates automatically (Redux subscription)
```

## File Locations

### 1. AnalysisEngine.jsx (Primary Caller)
**Location:** `src/components/AnalysisEngine.jsx`

**Purpose:** Periodic analysis component that runs in background

**Key Code:**
```javascript
import { analyzeWithStrategies } from '../strategy_v1';

// Inside useEffect (runs every 30 seconds)
const instrumentName = instrument?.instrument_type || 'DEFAULT';
const strategySignal = analyzeWithStrategies(instrumentName, candleData);

if (strategySignal && strategySignal.signal !== 'NONE') {
    dispatch(addSignal({
        instrumentKey,
        signal: {
            type: strategySignal.type,        // 'BUY' or 'SELL'
            strength: strategySignal.confidence > 0.8 ? 'STRONG' : 'MODERATE',
            reason: strategySignal.message,
            price: strategySignal.price,
            stopLoss: strategySignal.stopLoss,
            target: strategySignal.target,
            strategy: strategySignal.strategy,
        },
    }));
    
    dispatch(addAlert({
        instrumentKey,
        alert: {
            type: 'signal',
            severity: strategySignal.type === 'BUY' ? 'success' : 'warning',
            message: `${strategySignal.type} Signal: ${strategySignal.message}`,
        },
    }));
}
```

**Trigger Conditions:**
- Minimum 50 candles available
- Either:
  - Candle count changed (new candle received)
  - OR 30 seconds elapsed since last analysis

### 2. Watchlist.jsx (Manual Analysis)
**Location:** `src/pages/Watchlist.jsx`

**Purpose:** Analyze when user manually triggers from watchlist

**Key Code:**
```javascript
import { analyzeWithStrategies } from '../strategy_v1';

const handleAnalyze = (inst) => {
    const formatted = formatCandleData(inst);
    const result = analyzeWithStrategies(inst.trading_symbol, formatted);
    
    if (result && result.signal !== 'NONE') {
        // Show result to user
        console.log(`Signal: ${result.signal} at ${result.price}`);
    }
};
```

### 3. ChartModal.jsx (Chart Analysis)
**Location:** `src/components/ChartModal.jsx`

**Purpose:** Analyze when viewing chart modal

**Key Code:**
```javascript
import { analyzeWithStrategies } from '../strategy_v1';

const result = analyzeWithStrategies(tradingSymbol, candles);
// Display result in chart modal
```

## Strategy V1 Structure

### Entry Point: analyzeWithStrategies()
**Location:** `src/strategy_v1/StrategyService.js`

**Function Signature:**
```javascript
analyzeWithStrategies(instrumentName, candleData)
```

**Parameters:**
- `instrumentName`: String - Instrument type (e.g., 'NIFTY', 'BANKNIFTY', 'GOLDM', 'DEFAULT')
- `candleData`: Array - Candle objects with { time, open, high, low, close, volume }

**Returns:**
```javascript
{
    type: 'BUY' | 'SELL' | 'NONE',
    price: number,
    stopLoss: number,
    target: number,
    trailingSL: number,
    message: string,
    confidence: number (0-1),
    timestamp: number,
    strategy: string (strategy class name)
}
```

### Strategy Selection Logic

```javascript
// InstrumentStrategyConfig maps instruments to strategies
const strategies = {
    DEFAULT: [RSISwingStrategy, EMACrossoverStrategy],
    GOLDM: [RSISwingStrategy(custom params), EMACrossoverStrategy(custom params)],
    NIFTY: [RSISwingStrategy(custom params), EMACrossoverStrategy(custom params)],
    BANKNIFTY: [RSISwingStrategy(custom params), EMACrossoverStrategy(custom params)],
};

// Get strategies for instrument
const strategies = getStrategiesForInstrument(instrumentName);

// Try each strategy until one returns a signal
for (const strategy of strategies) {
    const result = strategy.analyze(candleData);
    if (result.signal !== 'NONE') {
        return result; // Return first valid signal
    }
}
```

### Available Strategies

#### 1. RSISwingStrategy
**Indicators Used:**
- RSI (14 period)
- Stochastic (14 period on RSI)
- EMA (11 and 26 period)
- ADX (14 period)
- ATR (14 period)

**Buy Conditions:**
- Short EMA > Long EMA (last 5 candles)
- ADX trending up
- RSI > 60 and rising
- Stochastic K > D, both > 20
- Stochastic K-D difference between 2-4

**Sell Conditions:**
- Short EMA < Long EMA (last 5 candles)
- ADX trending up
- RSI < 40 and falling
- Stochastic K < D, both < 80
- Stochastic K-D difference between 2-4

#### 2. EMACrossoverStrategy
**Indicators Used:**
- EMA (11 and 21 period)
- ADX (14 period)
- ATR (14 period)

**Buy Conditions:**
- Short EMA crosses above Long EMA
- ADX >= 20
- Candle range < ATR threshold
- Close > Short EMA (confirmation)

**Sell Conditions:**
- Short EMA crosses below Long EMA
- ADX >= 20
- Candle range < ATR threshold
- Close < Short EMA (confirmation)

## Configuration Per Instrument

### GOLDM
```javascript
RSISwingStrategy: { rsiPeriod: 14, stochPeriod: 14, stochInput: 'rsi', slTarget: { sl: 1.0, target: 2.0 } }
EMACrossoverStrategy: { shortPeriod: 11, longPeriod: 21, slTarget: { sl: 0.5, target: 2.0 } }
```

### NIFTY
```javascript
RSISwingStrategy: { rsiPeriod: 28, stochPeriod: 28, slTarget: { sl: 0.5, target: 2.0 } }
EMACrossoverStrategy: { shortPeriod: 11, longPeriod: 21, slTarget: { sl: 1.0, target: 2.0 } }
```

### BANKNIFTY
```javascript
RSISwingStrategy: { rsiPeriod: 14, stochPeriod: 14, stochInput: 'rsi', slTarget: { sl: 0.5, target: 2.0 } }
EMACrossoverStrategy: { shortPeriod: 11, longPeriod: 31, slTarget: { sl: 1.0, target: 2.0 } }
```

## Data Flow

### 1. Candle Data Input
```javascript
candleData = [
    { time: 1234567890, open: 100, high: 105, low: 99, close: 103, volume: 1000 },
    { time: 1234567950, open: 103, high: 106, low: 102, close: 105, volume: 1200 },
    // ... minimum 50 candles required
]
```

### 2. Strategy Processing
```javascript
// Each strategy calculates indicators
const indicators = strategy.applyIndicators(candleData);
// { rsi: [...], ema: [...], adx: [...], atr: [...] }

// Check conditions
const result = strategy.analyze(candleData);
```

### 3. Signal Output
```javascript
{
    type: 'BUY',
    price: 18500,
    stopLoss: 18450,
    target: 18600,
    trailingSL: 50,
    message: 'RSI Swing BUY: EMA(11) > EMA(26), ADX 25.3, RSI 65.2, Stoch K/D 45.2/42.1',
    confidence: 0.8,
    timestamp: 1234567890,
    strategy: 'RSISwingStrategy'
}
```

### 4. Redux Store Update
```javascript
// Signal stored in Redux
state.instrumentAnalysis.instruments[instrumentKey].analysis.signals.push(signal);

// Alert created
state.instrumentAnalysis.instruments[instrumentKey].alerts.push({
    type: 'signal',
    severity: 'success',
    message: 'BUY Signal: RSI Swing BUY...',
    timestamp: '2026-03-03T...',
    read: false
});
```

### 5. UI Display
- **InstrumentAnalysisView**: Shows recent signals in "Recent Signals" section
- **AlertsPanel**: Shows alert notification (fixed position, top-right)
- **Analysis Results**: Displays signal details with color coding

## Timing & Performance

### Analysis Frequency
- **Default**: Every 30 seconds
- **Configurable**: Pass `analysisInterval` prop to AnalysisEngine
- **Trigger**: Also runs immediately when new candle data arrives

### Performance Optimization
- Uses `useRef` to track last analysis time and candle count
- Prevents infinite loops by checking conditions before running
- Only analyzes when:
  - Candle count changes (new data)
  - OR interval time elapsed

### Example Usage
```javascript
<AnalysisEngine 
    instrumentKey={instrumentKey} 
    analysisInterval={30000}  // 30 seconds (default)
/>

// For faster analysis:
<AnalysisEngine 
    instrumentKey={instrumentKey} 
    analysisInterval={10000}  // 10 seconds
/>
```

## Adding New Strategies

### 1. Create Strategy Class
```javascript
// src/strategy_v1/StrategyService.js
export class MyNewStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        // Add custom parameters
    }

    analyze(candleData) {
        // Implement strategy logic
        if (buyCondition) {
            return this.createSignal(candleData, 'BUY', 'My reason', 0.85);
        }
        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
```

### 2. Add to Instrument Config
```javascript
export const InstrumentStrategyConfig = {
    NIFTY: [
        new RSISwingStrategy(),
        new EMACrossoverStrategy(),
        new MyNewStrategy(),  // Add here
    ],
};
```

### 3. Strategy Runs Automatically
No additional code needed - AnalysisEngine will use it automatically!

## Debugging

### Enable Console Logging
```javascript
// In AnalysisEngine.jsx, the strategy already logs:
console.log(`[${strategy.constructor.name}] Signal: ${result.signal} - ${result.message}`);
```

### Check Redux DevTools
- View `instrumentAnalysis.instruments[key].analysis.signals`
- View `instrumentAnalysis.instruments[key].alerts`

### Monitor Analysis Runs
```javascript
// In AnalysisEngine.jsx
console.log('Running analysis at:', new Date().toLocaleTimeString());
console.log('Candle count:', candleData.length);
console.log('Instrument:', instrumentName);
```

## Summary

**Automatic Analysis:**
- ✅ Runs every 30 seconds in background
- ✅ Analyzes all instruments in Market Analysis
- ✅ Generates BUY/SELL signals automatically
- ✅ Creates alerts for user notification
- ✅ Stores signals in Redux for display

**Manual Analysis:**
- ✅ Available in Watchlist page
- ✅ Available in Chart Modal
- ✅ Uses same strategy code

**Extensible:**
- ✅ Easy to add new strategies
- ✅ Per-instrument configuration
- ✅ Configurable parameters
- ✅ Multiple strategies per instrument
