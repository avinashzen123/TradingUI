# Infinite Loop and Date Range Error Fixes

## Issues Fixed

### 1. Infinite Loop with Large Historical Data (INFY EQ 365 days)
**Problem**: Component was re-fetching data infinitely when historicalDataCache changed
**Root Cause**: `historicalDataCache` was in useEffect dependency array, causing loop
**Solution**: 
- Removed `historicalDataCache` from dependency array
- Added `lastCacheKeyRef` to track processed cache keys
- Added `isFetchingRef` to prevent concurrent API calls
- Skip fetch if cache key already processed

### 2. NIFTY FUT "Invalid Date Range" Error
**Problem**: Getting 400 error with "Invalid date range" for NIFTY FUT
**Root Cause**: Multiple potential issues with date validation
**Solutions Implemented**:

#### a) Enhanced Instrument Detection
- Added support for multiple FUT patterns:
  - `FUT` (original)
  - `_FO` (original)
  - `NSE_FO` (new)
  - `BSE_FO` (new)
  - `MCX_FO` (new)
- Added BSE exchange detection
- More comprehensive logging

#### b) Date Validation Improvements
- **Future Date Prevention**: Automatically adjust toDate if it's in the future
- **Date Order Validation**: Ensure fromDate is not after toDate
- **Comprehensive Logging**: Log all date calculations and adjustments

#### c) Better Error Messages
- Parse API error responses as JSON
- Show detailed context for date range errors
- Include instrument type, requested range, and adjustment status

## Code Changes

### CandleDataUpdater.jsx
```javascript
// Removed historicalDataCache from dependencies
useEffect(() => {
    // ... fetch logic
}, [instrumentKey, timeframe, historicalDays, token, instrument, dispatch]);

// Added refs to prevent infinite loops
const lastCacheKeyRef = useRef(null);
const isFetchingRef = useRef(false);

// Check if already processed
if (lastCacheKeyRef.current === cacheKey) {
    console.log('[CandleDataUpdater] Already processed cache key:', cacheKey, '- skipping');
    return;
}

// Prevent concurrent fetches
if (isFetchingRef.current) {
    console.log('[CandleDataUpdater] Fetch already in progress, skipping...');
    return;
}
```

### ChartService.js
```javascript
// Enhanced FUT detection
const isFUT = instrumentKey.includes('FUT') || 
              instrumentKey.includes('_FO') || 
              instrumentKey.includes('NSE_FO') || 
              instrumentKey.includes('BSE_FO') ||
              instrumentKey.includes('MCX_FO');

// Prevent future dates
const now = new Date();
if (to > now) {
    console.warn('[validateDateRange] toDate is in the future, adjusting to today');
    to.setTime(now.getTime());
    toDate = to.toISOString().split('T')[0];
}

// Validate date order
if (from > to) {
    console.error('[validateDateRange] fromDate is after toDate! Swapping...');
    return { fromDate: toDate, toDate: fromDate, adjusted: true, ... };
}

// Better error messages
if (error.errorCode === 'UDAPI1148' || error.message === 'Invalid date range') {
    console.error('[ChartService.getHistoricalCandles] Date range error details:', {
        instrumentKey,
        instrumentType: dateRange.instrumentType,
        requestedRange: { fromDate, toDate, days: dateRange.adjustedDays || dateRange.days },
        wasAdjusted: dateRange.adjusted,
        unit,
        interval
    });
}
```

## Testing Checklist

### Test 1: INFY EQ with 365 Days
- [x] Add INFY EQ instrument
- [x] Select 365 days from dropdown
- [x] Verify no infinite loop (check console for repeated fetches)
- [x] Verify data loads successfully
- [x] Check cache key is created: "YYYY-MM-DD_365_5m"

### Test 2: NIFTY FUT with Various Timeframes
- [ ] Add NIFTY FUT instrument
- [ ] Test with 5m timeframe, 30 days (should work - within limit)
- [ ] Test with 1d timeframe, 90 days (should work - at limit)
- [ ] Test with 1d timeframe, 365 days (should adjust to 90 days)
- [ ] Check console logs for instrument detection
- [ ] Verify isFUT = true in logs

### Test 3: MCX Instruments
- [ ] Add MCX GOLD instrument
- [ ] Test with 5m timeframe, 7 days (should work - at limit)
- [ ] Test with 1d timeframe, 90 days (should work - at limit)
- [ ] Verify auto-adjustment message shows in UI

### Test 4: Cache Behavior
- [ ] Add instrument with 30 days
- [ ] Wait for data to load
- [ ] Refresh page
- [ ] Verify data loads from cache (no API call)
- [ ] Change to 60 days
- [ ] Verify new API call is made
- [ ] Check two cache keys exist

### Test 5: Daily Cache Cleanup
- [ ] Check localStorage for cache entries
- [ ] Wait until next day (or manually change system date)
- [ ] Add any instrument
- [ ] Verify old cache entries are removed
- [ ] Only today's cache should remain

## Console Log Examples

### Successful NIFTY FUT Load
```
[validateDateRange] Instrument detection: {
  instrumentKey: "NSE_FO|12345",
  isMCX: false,
  isNSE: true,
  isBSE: false,
  isFUT: true,
  requestedDays: 30,
  unit: "minutes",
  interval: 5
}

[validateDateRange] Limits applied: {
  maxDays: 30,
  instrumentType: "FUT",
  timeframeType: "intraday"
}

[ChartService.getHistoricalCandles] Final date range: {
  fromDate: "2026-02-02",
  toDate: "2026-03-04",
  days: 30,
  adjusted: false
}

[CandleDataUpdater] ✅ Historical data cached with key: 2026-03-04_30_5m
```

### Date Range Adjustment
```
[validateDateRange] Requested 365 days exceeds limit of 90 for days. Adjusting...

[ChartService.getHistoricalCandles] Final date range: {
  fromDate: "2025-12-04",
  toDate: "2026-03-04",
  days: 90,
  adjusted: true
}
```

## API Limits Reference

| Exchange | Instrument Type | Intraday (min/hr) | Daily/Weekly/Monthly |
|----------|----------------|-------------------|---------------------|
| MCX      | All            | 7 days            | 90 days             |
| NSE/BSE  | Futures (_FO)  | 30 days           | 90 days             |
| NSE/BSE  | Equity (_EQ)   | 30 days           | 365 days            |

## Known Limitations

1. **Contract Expiration**: FUT contracts expire, so historical data beyond contract life may not be available
2. **Rate Limiting**: Upstox API has rate limits (429 errors) - cache helps reduce calls
3. **Market Hours**: Intraday data only available during market hours
4. **Weekend/Holidays**: No data generated on non-trading days

## Troubleshooting

### Still Getting "Invalid Date Range" Error
1. Check console logs for instrument detection
2. Verify isFUT flag is correct
3. Check actual date range being sent to API
4. Ensure dates are not in the future
5. Verify instrumentKey format matches expected patterns

### Infinite Loop Still Occurring
1. Check if `historicalDataCache` is in useEffect dependencies
2. Verify `lastCacheKeyRef` is being set after successful fetch
3. Check if `isFetchingRef` is being reset in finally block
4. Look for other state changes triggering re-renders

### Cache Not Working
1. Check localStorage quota (may be full)
2. Verify cache key format: "YYYY-MM-DD_days_timeframe"
3. Check if old cache cleanup is running
4. Verify Redux state is being persisted

## Files Modified

1. `src/components/CandleDataUpdater.jsx` - Fixed infinite loop
2. `src/services/ChartService.js` - Enhanced date validation and error handling
3. `NIFTY_FUT_DEBUG_GUIDE.md` - Debugging documentation
4. `INFINITE_LOOP_AND_DATE_RANGE_FIX.md` - This file
