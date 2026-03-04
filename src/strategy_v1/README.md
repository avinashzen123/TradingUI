# Strategy V1 Package

JavaScript implementation of the Python strategy system.

## Overview

This package provides a complete strategy analysis system matching the Python implementation. The code has been refactored into smaller, focused files for better maintainability.

## File Structure

```
src/strategy_v1/
├── index.js                        # Main exports
├── StrategyBase.js                 # Base class for all strategies
├── RSISwingStrategy.js             # RSI Swing strategy implementation
├── EMACrossoverStrategy.js         # EMA Crossover strategy implementation
├── InstrumentStrategyConfig.js     # Instrument-specific configurations & facade
├── StrategyService.js              # DEPRECATED - kept for reference only
├── package.json                    # Package metadata
├── README.md                       # This file
└── STRUCTURE.md                    # Detailed architecture documentation
```

## Architecture

### Python → JavaScript Mapping

| Python File | JavaScript File | Purpose |
|------------|----------------|---------|
| `StrategyBase.py` | `StrategyBase.js` | Base strategy with ADX, ATR, SL/Target calculation |
| `RSISwingStrategy.py` | `RSISwingStrategy.js` | RSI + Stochastic + EMA strategy |
| `EMACrossOverStrategy.py` | `EMACrossoverStrategy.js` | EMA crossover with ADX/ATR filters |
| `InstrumentStrategEnum.py` | `InstrumentStrategyConfig.js` | Per-instrument strategy configuration |
| `StrategyFacade.py` | `InstrumentStrategyConfig.js` (analyzeWithStrategies) | Strategy execution facade |

### Components

#### StrategyBase.js
Provides common functionality for all strategies:
- ADX and ATR indicator calculations
- Trend detection (`isTrending()`)
- Stop loss and target calculation (`calculateSLTarget()`)
- Price rounding utilities (`roundPrice()`)
- Signal creation (`createSignal()`)

#### RSISwingStrategy.js
Implements RSI-based swing trading:
- Uses RSI, Stochastic oscillator, and EMAs
- Detects trend alignment (short EMA vs long EMA)
- Generates BUY signals when:
  - Short EMA > Long EMA (last 5 candles)
  - ADX trending
  - RSI overbought and rising
  - Stochastic K > D with specific conditions
- Generates SELL signals with opposite conditions

#### EMACrossoverStrategy.js
Implements EMA crossover trading:
- Uses short and long EMAs
- Detects crossover events
- Confirms with ADX trend strength
- Filters by ATR-based candle range
- Optional close price confirmation

#### InstrumentStrategyConfig.js
Maps instruments to their specific strategies and provides facade functions:
- `InstrumentStrategyConfig`: Strategy instances per instrument
  - DEFAULT: Standard RSI and EMA strategies
  - GOLDM: Customized for gold futures
  - NIFTY: Customized for Nifty index
  - BANKNIFTY: Customized for Bank Nifty
- `getStrategiesForInstrument()`: Get strategies for an instrument
- `analyzeWithStrategies()`: Main analysis function

## Usage

```javascript
import { analyzeWithStrategies } from '../strategy_v1';

// Analyze candle data for an instrument
const signal = analyzeWithStrategies('GOLDM', candleData);

if (signal && signal.signal !== 'NONE') {
    console.log('Signal:', signal);
    // signal = {
    //     type: 'BUY' | 'SELL',
    //     price: 1234.5,
    //     stopLoss: 1230.0,
    //     target: 1240.0,
    //     trailingSL: 4.5,
    //     message: 'Strategy description',
    //     confidence: 0.85,
    //     timestamp: '2024-01-01T10:00:00',
    //     strategy: 'RSISwingStrategy'
    // }
}
```

## Configuration Examples

### NIFTY Configuration
```javascript
NIFTY: [
    new RSISwingStrategy({ 
        rsiPeriod: 28, 
        stochPeriod: 28,
        slTarget: { sl: 0.5, target: 2.0 }
    }),
    new EMACrossoverStrategy({ 
        shortPeriod: 11, 
        longPeriod: 21,
        slTarget: { sl: 1.0, target: 2.0 }
    })
]
```

### GOLDM Configuration
```javascript
GOLDM: [
    new RSISwingStrategy({ 
        rsiPeriod: 14, 
        stochPeriod: 14, 
        stochInput: 'rsi',
        slTarget: { sl: 1.0, target: 2.0 }
    }),
    new EMACrossoverStrategy({ 
        shortPeriod: 11, 
        longPeriod: 21,
        slTarget: { sl: 0.5, target: 2.0 }
    })
]
```

## Adding New Strategies

To add a new strategy:

### Step 1: Create Strategy Class
```javascript
// src/strategy_v1/MyNewStrategy.js
import { StrategyBase } from './StrategyBase';

export class MyNewStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.myParam = config.myParam || 20;
    }

    applyIndicators(candleData) {
        const base = super.applyIndicators(candleData);
        // Calculate your indicators
        return { ...base, myIndicator };
    }

    analyze(candleData) {
        const indicators = this.applyIndicators(candleData);
        // Implement your logic
        // Return signal using this.createSignal()
    }
}
```

### Step 2: Export from index.js
```javascript
export { MyNewStrategy } from './MyNewStrategy';
```

### Step 3: Add to Instrument Config
```javascript
// InstrumentStrategyConfig.js
import { MyNewStrategy } from './MyNewStrategy';

NIFTY: [
    new MyNewStrategy({ myParam: 25 }),
    new RSISwingStrategy(),
    new EMACrossoverStrategy()
]
```

## Integration

The strategy system is integrated into the application through:

1. **AnalysisEngine.jsx**: Runs strategies every 30 seconds for each instrument
2. **Watchlist.jsx**: Shows strategy signals in watchlist view
3. **ChartModal.jsx**: Displays strategy analysis in chart modal

See `STRATEGY_V1_FLOW.md` for detailed call flow documentation.

## Stop Loss & Target Calculation

Matches Python logic:

```javascript
// BUY
stopLoss = price - (slMultiplier * ATR)
target = price + (targetMultiplier * ATR)

// SELL
stopLoss = price + (slMultiplier * ATR)
target = price - (targetMultiplier * ATR)

// Price rounding
if (price < 100) → 2 decimals
if (price < 1000) → 1 decimal
else → 0 decimals
```

## Migration Notes

The original monolithic `StrategyService.js` has been refactored into smaller files:
- **Better maintainability**: Each strategy in its own file
- **Easier testing**: Test individual components in isolation
- **Clearer separation**: Base class, strategies, and config are separate
- **Single responsibility**: Each file has one clear purpose

All exports remain the same through `index.js`, so existing code continues to work without any changes.

## Next Steps

### Add More Strategies
- HullMovingAverageStrategy
- HemaTrendLevelStrategy
- TrendReversalStrategy
- DojiCandleStrategy

### Add More Instruments
- Copy configurations from Python InstrumentStrategEnum
- Test with real data

### Backtesting
- Create backtesting module
- Test strategies on historical data
- Optimize parameters

---

**Your Python strategy logic is fully integrated and refactored for maintainability!** 🎉
