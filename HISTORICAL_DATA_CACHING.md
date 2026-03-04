# Historical Data Caching Implementation

## Problem
Getting 429 (Too Many Requests) errors from Upstox API due to rate limiting when fetching both historical and intraday data on every refresh.

## Solution
Cache historical data in Redux and only fetch it once per day. Fetch intraday data frequently for real-time updates.

## Changes Made

### 1. Redux Store Updates (instrumentAnalysisSlice.js)

#### New State Fields
```javascript
{
    historicalCandleData: [],  // Cached historical data
    historicalDataFetchedAt: null  // Timestamp when historical data was fetched
}
```

#### Updated Actions
- `updateCandleData`: Now accepts `isHistorical` flag to store historical data separately
- When `isHistorical: true`, data is stored in both `historicalCandleData` (cache) and `candleData` (display)

#### New Selectors
```javascript
selectInstrumentHistoricalCandleData(instrumentKey)  // Get cached historical data
selectInstrumentHistoricalDataFetchedAt(instrumentKey)  // Get cache timestamp
```

### 2. CandleDataUpdater Component Updates

#### Caching Strategy
```
First Load:
1. Fetch historical data (30 days for FUT, 1 year for EQ)
2. Cache in Redux with timestamp
3. Fetch intraday data
4. Merge and display

Subsequent Refreshes:
1. Check cache age (< 24 hours)
2. Use cached historical data
3. Fetch only intraday data
4. Merge and display

After 24 Hours:
1. Fetch fresh historical data
2. Update cache
3. Fetch intraday data
4. Merge and display
```

#### Benefits
- **Reduces API calls by ~50%**: Historical data fetched once per day instead of every refresh
- **Avoids rate limiting**: Only intraday endpoint called frequently
- **Faster load times**: Cached data loads instantly
- **Persistent across sessions**: Data stored in Redux with localStorage
- **Automatic cache invalidation**: Refreshes after 24 hours

### 3. Data Flow

```
Initial Load:
User clicks instrument
  ↓
Check cache (empty)
  ↓
Fetch historical data → Cache in Redux
  ↓
Fetch intraday data
  ↓
Merge & display

Refresh (within 24h):
User refreshes/changes timeframe
  ↓
Check cache (valid)
  ↓
Use cached historical data
  ↓
Fetch intraday data only
  ↓
Merge & display

Refresh (after 24h):
User opens app next day
  ↓
Check cache (expired)
  ↓
Fetch fresh historical data → Update cache
  ↓
Fetch intraday data
  ↓
Merge & display
```

### 4. Cache Invalidation Rules

Historical data is refetched when:
1. No cached data exists (first load)
2. Cache is older than 24 hours
3. `isFirstFetchRef` is true (component mount)

Historical data is reused when:
1. Cache exists and is less than 24 hours old
2. Historical API fails (fallback to cache)

### 5. Error Handling

**Historical API Fails:**
- If cache exists: Use cached data
- If no cache: Continue with intraday only
- Log error but don't show alert

**Intraday API Fails:**
- Use historical data only
- Log error but don't show alert

**Both APIs Fail:**
- Show alert popup with error details
- Provide troubleshooting steps

### 6. API Call Frequency

**Before Caching:**
- Historical API: Every refresh (5 min = 12 calls/hour)
- Intraday API: Every refresh (5 min = 12 calls/hour)
- Total: 24 calls/hour per instrument

**After Caching:**
- Historical API: Once per 24 hours (1 call/day)
- Intraday API: Every refresh (5 min = 12 calls/hour)
- Total: ~12 calls/hour per instrument (50% reduction)

### 7. Storage

**Redux State:**
- In-memory during session
- Persisted to localStorage via `saveState()`
- Survives page refreshes
- Cleared on browser cache clear

**Data Size Estimates:**
- 5-min candles for 1 year: ~105,000 candles
- Each candle: ~50 bytes
- Total per instrument: ~5 MB
- localStorage limit: 5-10 MB per domain
- Recommendation: Limit to 1-2 instruments in analysis

### 8. Console Logs

**First Load:**
```
[CandleDataUpdater] hasHistoricalCache: false
[CandleDataUpdater] isFirstFetch: true
[CandleDataUpdater] Fetching fresh historical data...
[CandleDataUpdater] Historical candles fetched: 105000
[CandleDataUpdater] ✅ Historical data cached in Redux
[CandleDataUpdater] Fetching intraday data...
[CandleDataUpdater] Intraday candles formatted: 75
[CandleDataUpdater] After merge: { total: 105050, duplicatesRemoved: 25 }
```

**Subsequent Refresh:**
```
[CandleDataUpdater] hasHistoricalCache: true
[CandleDataUpdater] historicalCacheFetchedAt: 2026-03-04T10:30:00Z
[CandleDataUpdater] Using cached historical data: 105000
[CandleDataUpdater] Fetching intraday data...
[CandleDataUpdater] Intraday candles formatted: 75
[CandleDataUpdater] After merge: { total: 105050, duplicatesRemoved: 25 }
```

**Cache Expired:**
```
[CandleDataUpdater] hasHistoricalCache: true
[CandleDataUpdater] historicalCacheFetchedAt: 2026-03-03T10:30:00Z (> 24h)
[CandleDataUpdater] Fetching fresh historical data...
[CandleDataUpdater] Historical candles fetched: 105000
[CandleDataUpdater] ✅ Historical data cached in Redux
```

### 9. Testing Checklist

- [ ] First load fetches historical data
- [ ] Historical data is cached in Redux
- [ ] Subsequent refreshes use cached data
- [ ] Intraday data is fetched on every refresh
- [ ] Data is merged correctly
- [ ] No duplicate timestamps
- [ ] Cache expires after 24 hours
- [ ] Historical API failure uses cache
- [ ] Both API failures show alert
- [ ] Data persists across page refreshes
- [ ] Multiple instruments don't interfere

### 10. Future Improvements

1. **Smart cache invalidation**: Invalidate only on market close
2. **Compression**: Compress historical data before storing
3. **IndexedDB**: Use IndexedDB for larger storage capacity
4. **Partial updates**: Fetch only missing candles instead of full range
5. **Background sync**: Prefetch data for watchlist instruments
6. **Cache size management**: Auto-clear old instrument data

## Files Modified

1. `src/store/instrumentAnalysisSlice.js` - Added caching fields and selectors
2. `src/components/CandleDataUpdater.jsx` - Implemented caching logic

## Migration Notes

Existing instruments in Redux will automatically get the new fields with default values:
- `historicalCandleData: []`
- `historicalDataFetchedAt: null`

No manual migration needed.
