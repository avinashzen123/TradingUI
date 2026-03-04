# Testing Guide - Infinite Loop and Date Range Fixes

## Quick Test Steps

### 1. Test NIFTY FUT (Main Issue)
1. Open browser console (F12)
2. Add NIFTY FUT instrument to analysis
3. Look for these console logs:

**Expected Logs:**
```
[validateDateRange] Instrument detection: {
  instrumentKey: "NSE_FO|...",
  isFUT: true,  ← Should be TRUE
  ...
}

[validateDateRange] Limits applied: {
  maxDays: 30,  ← Should be 30 for intraday
  instrumentType: "FUT",  ← Should be FUT
  ...
}
```

4. If you see `isFUT: false`, copy the full instrumentKey and share it
5. If you still get "Invalid date range" error, copy all console logs

### 2. Test Infinite Loop Fix (INFY EQ)
1. Add INFY EQ instrument
2. Select "1 Year" from Historical Data dropdown
3. Watch console - should see:
   - One fetch with cache key: "2026-03-04_365_5m"
   - Message: "Already processed cache key" on subsequent checks
   - NO repeated API calls

**Bad (Infinite Loop):**
```
[CandleDataUpdater] Fetching candle data...
[CandleDataUpdater] Fetching candle data...
[CandleDataUpdater] Fetching candle data...
... (repeats forever)
```

**Good (Fixed):**
```
[CandleDataUpdater] Fetching candle data...
[CandleDataUpdater] ✅ Historical data cached with key: 2026-03-04_365_5m
[CandleDataUpdater] Already processed cache key: 2026-03-04_365_5m - skipping
```

### 3. Test MCX Instruments
1. Add MCX GOLD instrument
2. Select "30 Days" from dropdown
3. Should see auto-adjustment:

```
[validateDateRange] Requested 30 days exceeds limit of 7 for minutes. Adjusting...
[ChartService.getHistoricalCandles] Date range adjusted: {
  adjusted: true,
  adjustedDays: 7
}
```

### 4. Test Cache Persistence
1. Add any instrument with 30 days
2. Wait for data to load
3. Refresh page (F5)
4. Should see: "Using cached historical data"
5. No API call should be made

### 5. Test Days Dropdown
1. Add any instrument
2. Try different day options: 1, 7, 30, 90, 365
3. Each should create a new cache entry
4. Check localStorage: `instrumentAnalysis` → `historicalDataCache`

## What to Share if Issues Persist

### For NIFTY FUT Error:
Copy these console logs:
- `[validateDateRange] Instrument detection:`
- `[validateDateRange] Limits applied:`
- `[ChartService.getHistoricalCandles] Final date range:`
- `[ChartService.getHistoricalCandles] Full API URL:`
- The error message

### For Infinite Loop:
- Screenshot of console showing repeated fetches
- The cache key being used
- Whether you see "Already processed cache key" message

### For Cache Issues:
- Open DevTools → Application → Local Storage
- Find `instrumentAnalysis` key
- Copy the `historicalDataCache` section

## Common Scenarios

### Scenario 1: First Time Load
```
[CandleDataUpdater] Cache key: 2026-03-04_30_5m
[CandleDataUpdater] Available cache keys: []
[CandleDataUpdater] Fetching fresh historical data...
[CandleDataUpdater] ✅ Historical data cached with key: 2026-03-04_30_5m
```

### Scenario 2: Using Cached Data
```
[CandleDataUpdater] Cache key: 2026-03-04_30_5m
[CandleDataUpdater] Available cache keys: ["2026-03-04_30_5m"]
[CandleDataUpdater] ✅ Using cached historical data
```

### Scenario 3: Changing Days
```
[CandleDataUpdater] Cache key: 2026-03-04_60_5m  ← New key
[CandleDataUpdater] Available cache keys: ["2026-03-04_30_5m"]  ← Old key
[CandleDataUpdater] Fetching fresh historical data...  ← New fetch
```

### Scenario 4: Rate Limit Hit
```
[CandleDataUpdater] ❌ Historical data fetch failed
[CandleDataUpdater] 🚫 RATE LIMIT HIT - Cloudflare blocking requests
[CandleDataUpdater] Using fallback cache: 2026-03-04_30_5m
```

### Scenario 5: Date Range Adjustment
```
[validateDateRange] Requested 365 days exceeds limit of 90 for days. Adjusting...
[ChartService.getHistoricalCandles] Date range adjusted: {
  fromDate: "2025-12-04",
  toDate: "2026-03-04",
  adjusted: true,
  originalDays: 365,
  adjustedDays: 90
}
```

## Browser Console Commands

### Check Cache
```javascript
// View all cached data
JSON.parse(localStorage.getItem('instrumentAnalysis'))

// View specific instrument cache
const state = JSON.parse(localStorage.getItem('instrumentAnalysis'));
console.log(state.instruments['NSE_FO|12345'].historicalDataCache);

// Clear all cache
localStorage.removeItem('instrumentAnalysis');
```

### Check Today's Date
```javascript
new Date().toISOString().split('T')[0]
// Should output: "2026-03-04"
```

### Simulate Next Day (for cache cleanup testing)
```javascript
// Change system date to tomorrow
// Then reload the app
// Old cache entries should be removed
```

## Expected Behavior Summary

| Instrument Type | Timeframe | Days Requested | Days Allowed | Adjustment |
|----------------|-----------|----------------|--------------|------------|
| MCX            | 5m        | 30             | 7            | Yes        |
| MCX            | 1d        | 365            | 90           | Yes        |
| NIFTY FUT      | 5m        | 30             | 30           | No         |
| NIFTY FUT      | 1d        | 365            | 90           | Yes        |
| INFY EQ        | 5m        | 30             | 30           | No         |
| INFY EQ        | 1d        | 365            | 365          | No         |

## Files to Monitor

1. **Console Logs**: All `[CandleDataUpdater]` and `[ChartService]` messages
2. **Network Tab**: Check for repeated API calls to `/api/upstox/v3/historical-candle/`
3. **Local Storage**: `instrumentAnalysis` key
4. **Error Alert**: Bootstrap-style alert at top of page

## Success Criteria

✅ No infinite loops (no repeated API calls)
✅ NIFTY FUT loads without "Invalid date range" error
✅ Cache works (data loads from cache on refresh)
✅ Date ranges auto-adjust when exceeding limits
✅ Old cache entries removed daily
✅ Rate limit errors show helpful message
✅ No duplicate error alerts
