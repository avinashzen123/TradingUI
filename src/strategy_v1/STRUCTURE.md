# Strategy V1 Structure

This package contains the JavaScript implementation of the Python strategy system.

## File Organization

```
src/strategy_v1/
├── index.js                        # Main exports
├── StrategyBase.js                 # Base class for all strategies
├── RSISwingStrategy.js             # RSI Swing strategy implementation
├── EMACrossoverStrategy.js         # EMA Crossover strategy implementation
├── InstrumentStrategyConfig.js     # Instrument-specific configurations
├── StrategyService.js              # DEPRECATED - kept for reference
├── package.json                    # Package metadata
├── README.md                       # Usage documentation
└── STRUCTURE.md                    # This file
```

## Architecture

### StrategyBase.js
Base class providing common functionality:
- ADX and ATR indicator calculations
- Trend detection logic
- Stop loss and target calculation
- Price rounding utilities
- Signal creation

### RSISwingStrategy.js
Implements RSI-based swing trading:
- RSI indicator
- Stochastic oscillator (on RSI or close)
- Short and long EMA
- Buy/Sell signal generation based on EMA alignment and oscillator conditions

### EMACrossoverStrategy.js
Implements EMA crossover trading:
- Short and long EMA
- Crossover detection
- ADX trend confirmation
- ATR-based candle range filtering

### InstrumentStrategyConfig.js
Configuration and facade:
- `InstrumentStrategyConfig` - Strategy instances per instrument
- `getStrategiesForInstrument()` - Get strategies for an instrument
- `analyzeWithStrategies()` - Main analysis function

## Usage

```javascript
import { analyzeWithStrategies } from '../strategy_v1';

const signal = analyzeWithStrategies('GOLDM', candleData);
if (signal && signal.signal !== 'NONE') {
    console.log('Signal:', signal);
}
```

## Migration Notes

The original `StrategyService.js` has been split into smaller, focused files:
- Better maintainability
- Easier testing
- Clearer separation of concerns
- Follows single responsibility principle

All exports remain the same through `index.js`, so existing code continues to work without changes.
