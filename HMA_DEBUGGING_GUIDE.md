# HMA Debugging Guide

## Console Logs Added

Comprehensive logging has been added throughout the HMA calculation and plotting pipeline to help debug issues.

## Log Flow

### 1. InstrumentAnalysisView Level
```
[InstrumentAnalysisView] Indicator plotting effect triggered
[InstrumentAnalysisView] Conditions: { hasMainChart, candleDataLength, ... }
[InstrumentAnalysisView] Enabled indicators: [...]
[InstrumentAnalysisView] Processing indicator X/Y: hma
[InstrumentAnalysisView] Calling IndicatorPlotter.plotOverlay for hma
[InstrumentAnalysisView] ✅ Overlay plot complete for hma
```

### 2. IndicatorPlotter Level
```
[IndicatorPlotter] plotOverlay called for: hma
[IndicatorPlotter] Extracted N close prices, range: X - Y
[plotHMA] ========== Starting HMA Plot ==========
[plotHMA] Period: 20
[plotHMA] Candle data length: 500
[plotHMA] Close prices length: 500
[plotHMA] First 5 closes: [...]
[plotHMA] Last 5 closes: [...]
```

### 3. HMA Calculation Level
```
[HMA] Starting calculation with 500 values, period: 20
[HMA] Calculated periods - half: 10, sqrt: 4
[HMA] Step 1: Calculating WMA with half period (10)
[WMA] Input: 500 values, period: 10
[WMA] Output: 491 values, first: X, last: Y
[HMA] WMA half result: 491 values
[HMA] Step 2: Calculating WMA with full period (20)
[WMA] Input: 500 values, period: 20
[WMA] Output: 481 values, first: X, last: Y
[HMA] WMA full result: 481 values
[HMA] Step 3: Calculating difference (2 * WMA_half - WMA_full)
[HMA] Start index for alignment: 10
[HMA] Diff array: 481 values, first: X, last: Y
[HMA] Step 4: Calculating final WMA with sqrt period (4)
[WMA] Input: 481 values, period: 4
[WMA] Output: 478 values, first: X, last: Y
[HMA] ✅ Final result: 478 values
[HMA] First value: X, Last value: Y
[HMA] Sample values (first 5): [...]
```

### 4. Chart Plotting Level
```
[plotHMA] customHMA returned: { isArray: true, length: 478, type: 'object' }
[plotHMA] ✅ HMA calculated 478 values
[plotHMA] HMA value range: X - Y
[plotHMA] First 5 HMA values: [...]
[plotHMA] Last 5 HMA values: [...]
[plotHMA] Alignment offset: 22
[plotHMA] Created 478 data points for chart
[plotHMA] First data point: { time: ..., value: ... }
[plotHMA] Last data point: { time: ..., value: ... }
[plotHMA] Creating line series with color: #14b8a6
[plotHMA] Line series created, setting data...
[plotHMA] Data set on series
[plotHMA] ✅ Series registered as: hma_20
[plotHMA] ========== HMA Plot Complete ==========
```

## How to Debug

### Step 1: Open Browser Console
Press F12 or right-click → Inspect → Console tab

### Step 2: Add HMA Indicator
1. Click "Add Indicator" button
2. Search for "HMA"
3. Click to add it

### Step 3: Check Console Logs
Look for the log sequence above. Each step should complete successfully.

### Common Issues and Solutions

#### Issue 1: No Logs Appear
**Problem:** Nothing in console when adding HMA

**Possible Causes:**
- Indicator not being added to enabled list
- Chart not initialized
- Insufficient candle data

**Solution:**
```javascript
// Check in console:
console.log('Indicator config:', indicatorConfig);
console.log('Candle data length:', candleData?.length);
console.log('Main chart ref:', mainChartRef.current);
```

#### Issue 2: HMA Calculation Returns Empty
**Symptom:** `[HMA] ❌ Final result: 0 values`

**Possible Causes:**
- Insufficient data (need at least period candles)
- WMA calculation failed
- Invalid period parameter

**Solution:**
Check the WMA logs - if WMA returns 0 values, the issue is in WMA calculation.

#### Issue 3: HMA Values Out of Range
**Symptom:** HMA values are way too high/low compared to price

**Possible Causes:**
- Calculation error in WMA
- Wrong weight calculation
- Data alignment issue

**Solution:**
```javascript
// Test with simple data in console:
import { calculateHMA } from './utils/customIndicators';
const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const hma = calculateHMA(testData, 5);
console.log('HMA test:', hma);
// Should return values close to input range
```

#### Issue 4: Series Not Visible on Chart
**Symptom:** Logs show success but no line on chart

**Possible Causes:**
- Color same as background
- Line width too small
- Data points outside visible range
- Time alignment issue

**Solution:**
```javascript
// Check data points:
console.log('Data range:', {
    minValue: Math.min(...data.map(d => d.value)),
    maxValue: Math.max(...data.map(d => d.value)),
    minTime: data[0].time,
    maxTime: data[data.length - 1].time
});

// Check if values are in visible price range
console.log('Price range:', {
    minPrice: Math.min(...candleData.map(c => c.low)),
    maxPrice: Math.max(...candleData.map(c => c.high))
});
```

#### Issue 5: Error Creating Series
**Symptom:** `[plotHMA] ❌ Error creating or setting series`

**Possible Causes:**
- Invalid data format
- Chart not ready
- Duplicate series

**Solution:**
Check error details in console. Common fixes:
- Ensure all data points have valid time and value
- Verify chart ref is not null
- Check if series with same ID already exists

## Testing HMA Manually

### In Browser Console:
```javascript
// Import test utilities
import { testHMA } from './utils/testIndicators';

// Run test
testHMA();

// Should output:
// === Testing HMA Calculation ===
// Test data length: 100
// Calculating HMA with period 20...
// HMA result length: 75
// ✅ HMA calculation successful!
```

### Test with Real Data:
```javascript
// Get current candle data
const candleData = store.getState().instrumentAnalysis.instruments[instrumentKey].candleData;
const closes = candleData.map(c => c.close);

// Calculate HMA
import { calculateHMA } from './utils/customIndicators';
const hma = calculateHMA(closes, 20);

console.log('HMA result:', {
    length: hma.length,
    first: hma[0],
    last: hma[hma.length - 1],
    sample: hma.slice(0, 10)
});
```

## Expected Behavior

### Successful HMA Plot:
1. All log steps complete with ✅
2. HMA values are in reasonable range (close to price range)
3. Line appears on chart with teal color (#14b8a6)
4. Line follows price action with reduced lag
5. No errors in console

### HMA Characteristics:
- Smoother than SMA/EMA
- Less lag than traditional moving averages
- Values should be close to current price
- Should respond quickly to price changes
- Line should be continuous (no gaps)

## Performance Notes

### Expected Calculation Times:
- 100 candles: ~2-5ms
- 500 candles: ~5-10ms
- 1000 candles: ~10-20ms

If calculation takes longer, check:
- Browser performance
- Other indicators running simultaneously
- Data size

## Quick Checklist

- [ ] Console shows all log steps
- [ ] HMA calculation returns values
- [ ] Values are in reasonable range
- [ ] Data points created successfully
- [ ] Series added to chart
- [ ] No errors in console
- [ ] Line visible on chart
- [ ] Line color is teal (#14b8a6)
- [ ] Line follows price action
- [ ] Performance is acceptable

## Still Not Working?

If HMA still doesn't plot after checking all above:

1. **Clear browser cache** and reload
2. **Check Redux state** - is indicator in enabled list?
3. **Verify chart initialization** - is mainChartRef.current set?
4. **Test with other indicators** - do SMA/EMA work?
5. **Check for JavaScript errors** - any unrelated errors blocking execution?
6. **Try different period** - maybe period is too large for data size?

## Contact Points

If issue persists, provide:
1. Full console log output
2. Candle data length
3. HMA period used
4. Browser and version
5. Any error messages
