# Indicator Library Strategy

## Overview
The application now uses a hybrid approach for technical indicators:
1. **Prefer** technicalindicators library (when available)
2. **Fallback** to custom implementations (when library fails or indicator not available)

## Implementation Strategy

### Priority Order
```
1. Try technicalindicators library
   ↓ (if fails or not available)
2. Use custom implementation
   ↓ (if fails)
3. Log error and skip indicator
```

### Code Pattern
```javascript
// Prefer library implementation, fallback to custom
let values;
try {
    values = LibraryIndicator.calculate({ values: closes, period });
} catch (error) {
    console.warn('Using custom implementation:', error);
    values = customIndicator(closes, period);
}
```

## Indicator Availability Matrix

| Indicator | Library | Custom | Status |
|-----------|---------|--------|--------|
| SMA | ✅ | ✅ | Prefer library |
| EMA | ✅ | ✅ | Prefer library |
| WMA | ✅ | ✅ | Prefer library |
| HMA | ❌ | ✅ | Custom only |
| HEMA | ❌ | ✅ | Custom only |
| Bollinger Bands | ✅ | ✅ | Prefer library |
| RSI | ✅ | ✅ | Prefer library |
| MACD | ✅ | ❌ | Library only |
| Stochastic | ✅ | ❌ | Library only |
| Stochastic RSI | ❌ | ✅ | Custom only |
| CCI | ✅ | ❌ | Library only |
| MFI | ✅ | ❌ | Library only |
| ADX | ✅ | ✅ | Prefer library |
| ATR | ✅ | ✅ | Prefer library |
| ROC | ✅ | ❌ | Library only |
| Williams %R | ✅ | ❌ | Library only |
| VWAP | ✅ | ✅ | Prefer library |

## Custom-Only Indicators

### Hull Moving Average (HMA)
**Why Custom:** Not exported by technicalindicators library

**Implementation:**
```javascript
HMA = WMA(2 × WMA(n/2) − WMA(n), sqrt(n))
```

**Usage:**
```javascript
import { calculateHMA } from '../utils/customIndicators';

const hma = calculateHMA(closes, 20);
```

**Calculation Steps:**
1. Calculate WMA with half period (n/2)
2. Calculate WMA with full period (n)
3. Calculate difference: 2 × WMA(n/2) - WMA(n)
4. Apply WMA with sqrt(n) to the difference

**Data Alignment:**
HMA reduces data points due to multiple WMA calculations. Always align with candle data:
```javascript
const offset = candleData.length - hmaValues.length;
const data = hmaValues.map((value, idx) => ({
    time: candleData[offset + idx].time,
    value: value
}));
```

### Hull EMA (HEMA)
**Why Custom:** Custom variant for strategies

**Implementation:**
```javascript
HEMA = EMA(2 × EMA(n/2) − EMA(n), sqrt(n))
```

**Usage:**
Used in HemaTrendLevelStrategy for faster response than HMA.

### Stochastic RSI
**Why Custom:** Not available in library

**Implementation:**
Applies Stochastic oscillator formula to RSI values instead of price.

## Updated Files

### 1. IndicatorPlotter.js
**Changes:**
- Import both library and custom implementations
- Add try-catch blocks for library calls
- Fallback to custom on error
- Enhanced logging for HMA

**Example:**
```javascript
import { SMA } from 'technicalindicators';
import { calculateSMA as customSMA } from '../utils/customIndicators';

static plotSMA(indicator, candleData, closes, chart, seriesRegistry) {
    let values;
    try {
        values = SMA.calculate({ values: closes, period });
    } catch (error) {
        console.warn('Using custom SMA:', error);
        values = customSMA(closes, period);
    }
    // ... plot values
}
```

### 2. customIndicators.js
**Changes:**
- Added validation and error logging
- Improved HMA calculation
- Better WMA implementation
- Added JSDoc comments

**Improvements:**
```javascript
export function calculateHMA(values, period) {
    // Validation
    if (!values || values.length < period) {
        console.warn(`HMA: Insufficient data`);
        return [];
    }
    
    // Calculation with error checking
    const wmaHalf = calculateWMA(values, halfPeriod);
    if (wmaHalf.length === 0) {
        console.warn('HMA: WMA half failed');
        return [];
    }
    
    // ... rest of calculation
}
```

### 3. HullMovingAverageStrategy.js
**Changes:**
- Uses custom HMA implementation
- No dependency on library

## Testing

### Browser Console Tests
```javascript
// Import test utilities
import { testHMA, testWMA, testAllMovingAverages } from './utils/testIndicators';

// Test HMA
testHMA();

// Test WMA
testWMA();

// Test all moving averages
testAllMovingAverages();
```

### Expected Output
```
=== Testing HMA Calculation ===
Test data length: 100
Calculating HMA with period 20...
HMA result length: 75
✅ HMA calculation successful!
```

## Debugging HMA Issues

### Check Console Logs
When HMA is added to chart, you should see:
```
Plotting HMA with period 20, data length: 500
HMA calculated 475 values from 500 closes
HMA data points: 475, first: 12.34, last: 56.78
HMA series added to chart
```

### Common Issues

#### 1. No Values Returned
**Symptom:** `HMA calculation returned no values`

**Causes:**
- Insufficient data (need at least `period` candles)
- WMA calculation failed
- Invalid period parameter

**Solution:**
```javascript
// Check data length
console.log('Candles:', candleData.length, 'Period:', period);

// Verify period is valid
if (period < 2 || period > candleData.length) {
    console.error('Invalid period');
}
```

#### 2. Wrong Alignment
**Symptom:** HMA line doesn't match price action

**Causes:**
- Incorrect offset calculation
- Time alignment issues

**Solution:**
```javascript
// Verify offset
const offset = candleData.length - hmaValues.length;
console.log('Offset:', offset, 'should be positive');

// Check time alignment
console.log('First HMA time:', data[0].time);
console.log('Expected time:', candleData[offset].time);
```

#### 3. Values Out of Range
**Symptom:** HMA values are too high/low

**Causes:**
- Calculation error in WMA
- Wrong weight calculation

**Solution:**
```javascript
// Test with simple data
const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const hma = calculateHMA(testData, 5);
console.log('HMA values should be close to input range:', hma);
```

## Performance Considerations

### Library vs Custom
- **Library:** Optimized, battle-tested, faster
- **Custom:** More control, can optimize for specific use cases

### Optimization Tips
1. **Cache Results:** Don't recalculate on every render
2. **Incremental Updates:** Only calculate new values
3. **Web Workers:** Move calculations to background
4. **Memoization:** Cache for same inputs

### Benchmarks
```javascript
// Test with 1000 candles
const closes = Array(1000).fill(0).map((_, i) => i);

console.time('Library SMA');
SMA.calculate({ values: closes, period: 20 });
console.timeEnd('Library SMA');

console.time('Custom SMA');
customSMA(closes, 20);
console.timeEnd('Custom SMA');

console.time('Custom HMA');
calculateHMA(closes, 20);
console.timeEnd('Custom HMA');
```

**Expected Results:**
- Library SMA: ~1-2ms
- Custom SMA: ~2-3ms
- Custom HMA: ~5-8ms (multiple WMA calculations)

## Future Improvements

### 1. Incremental Calculation
Instead of recalculating entire array:
```javascript
function updateHMA(previousHMA, newCandle, period) {
    // Only calculate new value
    // Much faster for real-time updates
}
```

### 2. TypeScript Definitions
Add type safety:
```typescript
export function calculateHMA(
    values: number[], 
    period: number
): number[];
```

### 3. Unit Tests
Add comprehensive tests:
```javascript
describe('HMA Calculation', () => {
    it('should return correct length', () => {
        const data = Array(100).fill(0).map((_, i) => i);
        const hma = calculateHMA(data, 20);
        expect(hma.length).toBeGreaterThan(0);
    });
});
```

### 4. Performance Monitoring
Track calculation times:
```javascript
const startTime = performance.now();
const hma = calculateHMA(closes, period);
const duration = performance.now() - startTime;
console.log(`HMA calculated in ${duration}ms`);
```

## Summary

✅ **Hybrid approach** - Best of both worlds
✅ **HMA working** - Custom implementation with proper alignment
✅ **Fallback strategy** - Graceful degradation
✅ **Enhanced logging** - Easy debugging
✅ **Test utilities** - Verify calculations
✅ **Documentation** - Clear usage patterns

The indicator system is now robust, maintainable, and extensible!
