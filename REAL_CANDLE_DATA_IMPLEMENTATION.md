# Real Candle Data Implementation

## Summary
Updated `CandleDataUpdater` component to fetch and merge both historical and intraday candle data from Upstox API. Historical data range is automatically determined based on instrument type (FUT: 30 days, EQ: 1 year).

## Changes Made

### 1. CandleDataUpdater.jsx - Enhanced Data Fetching

**Previous Behavior:**
- Fetched either intraday OR historical data
- Fixed 100-day historical range
- No data merging

**New Behavior:**
- Fetches BOTH historical AND intraday data
- Merges and deduplicates data by timestamp
- Smart historical range: 30 days for FUT, 1 year for EQ
- Intraday data overrides historical for same timestamps (more accurate)
- Graceful degradation if one API fails

### 2. Key Features

#### Dual Data Source Strategy
```javascript
// Step 1: Fetch historical data (30 days for FUT, 1 year for EQ)
const historicalCandles = await ChartService.getHistoricalCandles(...)

// Step 2: Fetch intraday data (for minute/hour timeframes)
const intradayCandles = await ChartService.getIntradayCandles(...)

// Step 3: Merge and deduplicate by timestamp
const allCandles = mergeAndDeduplicate(historicalCandles, intradayCandles)
```

#### Instrument Type Detection
- Automatically detects FUT (futures) vs EQ (equity) from instrument key
- FUT instruments: Fetch 30 days of historical data
- EQ instruments: Fetch 1 year of historical data
- Detection logic: Checks if instrumentKey contains 'FUT' or '_FUT'

#### Data Merging Strategy
1. Fetch historical data first (longer time range)
2. Fetch intraday data (today's data, more accurate)
3. Create timestamp-based map to deduplicate
4. Intraday data overrides historical for same timestamps
5. Sort final array by timestamp
6. Log duplicate count for debugging

#### Timeframe Parsing
- `1m` → minutes, interval 1
- `5m` → minutes, interval 5
- `15m` → minutes, interval 15
- `30m` → minutes, interval 30
- `1h` → hours, interval 1
- `1d` → days, interval 1
- `1w` → weeks, interval 1
- `1M` → months, interval 1

#### Smart API Selection
- **Historical API**: Always fetched first for base data
  - FUT instruments: Last 30 days
  - EQ instruments: Last 1 year (365 days)
- **Intraday API**: Fetched additionally for minute/hour timeframes
  - Provides today's most recent data
  - Overrides historical data for same timestamps

#### Error Handling
- Catches API errors gracefully for each data source
- If historical fails: Tries intraday only
- If intraday fails: Uses historical only
- If both fail: Shows alert popup with error details
- Provides troubleshooting steps to user
- Logs detailed error information
- Does NOT fall back to mock data (user must fix the issue)

#### Data Validation
- Checks for required dependencies (token, instrument, timeframe)
- Validates API response structure
- Ensures formatted data is not empty
- Logs all steps for debugging

### 3. Dependencies

**Redux Selectors:**
- `selectInstrumentTimeframe(instrumentKey)` - Get current timeframe
- `selectInstrument(instrumentKey)` - Get instrument details
- `selectDailyData` - Get daily data including auth token

**Services:**
- `ChartService.getIntradayCandles()` - Fetch intraday candles
- `ChartService.getHistoricalCandles()` - Fetch historical candles
- `ChartService.formatCandleData()` - Format API response to chart format

**Redux Actions:**
- `updateCandleData()` - Update candle data in store

### 4. Data Flow

```
1. Component mounts with instrumentKey
2. Reads timeframe, instrument, and token from Redux
3. Validates all required data is present
4. Detects instrument type (FUT or EQ)
5. Determines historical data range (30 days or 1 year)
6. Fetches historical data from Upstox API
7. Fetches intraday data (if applicable for timeframe)
8. Merges data using timestamp-based deduplication
9. Sorts merged data by timestamp
10. Formats data using ChartService
11. Dispatches to Redux store
12. Sets up periodic refresh interval
13. On unmount, cleans up interval
```

### 5. Logging

Comprehensive console logging at every step:
- `[CandleDataUpdater]` prefix for all logs
- Missing data warnings
- Instrument type detection (FUT vs EQ)
- Historical data range calculation
- API call details for both sources
- Response validation for each source
- Merge statistics (total, duplicates removed)
- Final data summary with time range
- Error details with stack traces
- Fallback notifications

### 6. Refresh Intervals

Auto-refresh based on timeframe:
- 1m: Every 1 minute
- 5m: Every 5 minutes
- 15m: Every 15 minutes
- 30m: Every 30 minutes
- 1h: Every 1 hour
- 1d: Every 24 hours

### 7. Requirements

**To use real data:**
1. User must set `UPSTOX_TOKEN` in Settings page
2. Token is stored in Redux (`dailyData['UPSTOX_TOKEN']`)
3. Token is persisted in localStorage
4. Token expires daily (handled by dailyDataSlice)

**Without token:**
- Component logs warning about missing token
- Does not attempt API calls
- Can still use mock data fallback

### 8. Testing

**Console logs to check:**
```
[CandleDataUpdater] Fetching candle data: {...}
[CandleDataUpdater] Parsed timeframe: {...}
[CandleDataUpdater] Instrument type: { isFuture: false, historicalDays: 365 }
[CandleDataUpdater] Fetching historical data...
[CandleDataUpdater] Historical date range: { fromDate: '2025-03-04', toDate: '2026-03-04' }
[CandleDataUpdater] Historical candles formatted: 250
[CandleDataUpdater] Fetching intraday data...
[CandleDataUpdater] Intraday candles formatted: 75
[CandleDataUpdater] Merged candles: { total: 300, duplicatesRemoved: 25 }
[CandleDataUpdater] Final candle data: { count: 300, timeRange: {...} }
[CandleDataUpdater] ✅ Candle data updated in Redux
```

**On partial failure:**
```
[CandleDataUpdater] ⚠️ Historical data fetch failed: Error...
[CandleDataUpdater] Intraday candles formatted: 75
[CandleDataUpdater] Final candle data: { count: 75, ... }
```

**On complete failure:**
```
[CandleDataUpdater] ⚠️ Historical data fetch failed: Error...
[CandleDataUpdater] ⚠️ Intraday data fetch failed: Error...
[CandleDataUpdater] ❌ No candles available
Alert popup shown to user
```

### 9. Integration with Chart

The candle data flows to `InstrumentAnalysisView`:
1. `CandleDataUpdater` fetches and stores in Redux
2. `InstrumentAnalysisView` reads from Redux via `selectInstrumentCandleData`
3. Chart validates data structure
4. Candlestick series displays data
5. Indicators calculate from candle data

### 10. Benefits

✅ Maximum data coverage (historical + intraday)
✅ Smart historical range based on instrument type
✅ Automatic data merging and deduplication
✅ Intraday data provides most recent/accurate prices
✅ Graceful degradation if one API fails
✅ Clear error messages with troubleshooting steps
✅ Comprehensive logging for debugging
✅ Automatic refresh based on timeframe
✅ Token-based authentication
✅ Works with existing chart infrastructure
✅ No changes needed to other components
✅ Forces users to fix API issues (no silent failures)

### 11. Data Coverage Examples

**FUT Instrument (NSE_FO|12345):**
- Historical: Last 30 days
- Intraday: Today's data
- Total: ~30 days of complete data

**EQ Instrument (NSE_EQ|67890):**
- Historical: Last 1 year (365 days)
- Intraday: Today's data
- Total: ~1 year of complete data

**5-minute timeframe:**
- Historical: All 5-min candles from date range
- Intraday: Today's 5-min candles (more accurate)
- Merged: Complete dataset with today's data prioritized

## Files Modified

1. `src/components/CandleDataUpdater.jsx` - Complete rewrite with API integration

## Files Using This Data

1. `src/components/InstrumentAnalysisView.jsx` - Displays candles and indicators
2. `src/components/indicators/IndicatorPlotter.js` - Calculates indicators from candles
3. `src/components/AnalysisEngine.jsx` - Analyzes candle patterns
4. `src/strategy_v1/StrategyService.js` - Executes strategies on candles

## Next Steps

1. Test with real Upstox token
2. Verify data format matches chart requirements
3. Check indicator calculations with real data
4. Monitor API rate limits
5. Add error notifications to UI (optional)
6. Add loading states (optional)
