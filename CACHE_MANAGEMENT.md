# Historical Data Cache Management

## Overview
Automatic cache cleanup system to prevent localStorage bloat and manage stale data.

## Cache Lifecycle

### Storage Duration
Historical data cache entries are stored with the following lifecycle:

1. **Active Cache**: Used for current day + timeframe combination
2. **Valid Cache**: Entries less than 7 days old
3. **Expired Cache**: Entries older than 7 days (auto-deleted)

### Cache Key Format
```
"YYYY-MM-DD_days_timeframe"
Example: "2026-03-04_30_5m"
```

### Automatic Cleanup

#### On Component Mount
When `CandleDataUpdater` mounts, it automatically:
- Scans all cache entries for the instrument
- Removes entries older than 7 days
- Logs cleanup activity

#### On localStorage Quota Exceeded
When saving to localStorage fails due to quota:
- Automatically triggers cleanup across all instruments
- Removes cache entries older than 7 days
- Retries save operation
- Logs cleanup activity

### Manual Cleanup Actions

#### Clear Old Cache
```javascript
dispatch(clearOldCache({ 
    instrumentKey, 
    maxAgeDays: 7  // Optional, defaults to 7
}));
```
Removes cache entries older than specified days for one instrument.

#### Clear All Cache for Instrument
```javascript
dispatch(clearInstrumentCache(instrumentKey));
```
Removes ALL cache entries for an instrument (useful for troubleshooting).

## Storage Limits

### localStorage Capacity
- **Limit**: 5-10 MB per domain (browser dependent)
- **Current Usage**: Varies by number of instruments and cache entries

### Data Size Estimates
Per cache entry (approximate):
- **5-min candles, 30 days**: ~8,640 candles × 50 bytes = ~432 KB
- **5-min candles, 365 days**: ~105,120 candles × 50 bytes = ~5 MB
- **Daily candles, 365 days**: ~365 candles × 50 bytes = ~18 KB

### Recommendations
- **Intraday (5m, 15m)**: Keep 2-3 instruments max with 30-day cache
- **Daily**: Can store 10+ instruments with 365-day cache
- **Mixed**: Monitor browser console for quota warnings

## Cache Behavior

### When Cache is Used
✅ Same day + same days + same timeframe → Use cache (no API call)

### When Cache is Refreshed
🔄 Different day → Fetch new data, create new cache entry
🔄 Different days selection → Fetch new data, create new cache entry
🔄 Different timeframe → Fetch new data, create new cache entry

### Cache Fallback
If API fails:
1. Try to use exact cache key
2. If not found, use most recent cache entry
3. If no cache exists, show error

## Monitoring

### Console Logs
```
[cleanupOldCache] Removed 3 old cache entries for NSE_EQ|INE009A01021
[clearOldCache] Removed 5 old cache entries for MCX_COM|123456
[clearInstrumentCache] Cleared all cache for NSE_EQ|INE009A01021
```

### localStorage Quota Warning
```
Failed to save instrument analysis state: QuotaExceededError
localStorage quota exceeded, cleaning up old cache...
[cleanupOldCache] Removed 10 old cache entries across all instruments
```

## Best Practices

### For Users
1. **Limit active instruments**: Keep 2-3 instruments in analysis at once
2. **Use appropriate days**: Don't request 365 days for 5-min charts
3. **Clear old instruments**: Remove instruments you're no longer analyzing
4. **Monitor storage**: Check browser console for quota warnings

### For Developers
1. **Test with large datasets**: Verify cleanup works with 365-day data
2. **Monitor localStorage size**: Use browser DevTools → Application → Storage
3. **Handle quota errors**: Always catch and handle QuotaExceededError
4. **Log cleanup activity**: Keep users informed of automatic cleanup

## Troubleshooting

### Issue: "localStorage quota exceeded"
**Solution**: 
1. Automatic cleanup will trigger
2. If persists, manually clear cache: `dispatch(clearInstrumentCache(instrumentKey))`
3. Or clear all: `localStorage.removeItem('instrumentAnalysis')`

### Issue: Stale data showing
**Solution**:
1. Cache auto-expires after 7 days
2. Change timeframe or days to force refresh
3. Or manually clear: `dispatch(clearInstrumentCache(instrumentKey))`

### Issue: Slow performance
**Solution**:
1. Reduce number of active instruments
2. Use shorter historical periods (7-30 days instead of 365)
3. Clear old cache entries

## Future Enhancements

1. **Configurable expiration**: Let users set cache expiration (1-30 days)
2. **Size-based cleanup**: Remove oldest entries when total size exceeds limit
3. **Compression**: Compress cache data before storing
4. **IndexedDB migration**: Use IndexedDB for larger storage capacity
5. **Cache statistics**: Show cache size and age in UI
6. **Selective cleanup**: Keep only most-used timeframes
7. **Background cleanup**: Periodic cleanup every hour

## Technical Details

### Cleanup Algorithm
```javascript
1. Get current timestamp
2. For each cache entry:
   a. Parse fetchedAt timestamp
   b. Calculate age = now - fetchedAt
   c. If age > maxAge (7 days):
      - Delete cache entry
      - Increment removed counter
3. Save updated state
4. Log cleanup results
```

### Storage Structure
```javascript
{
  instruments: {
    "NSE_EQ|INE009A01021": {
      historicalDataCache: {
        "2026-03-04_30_5m": {
          data: [...candles],
          fetchedAt: "2026-03-04T10:30:00Z"
        },
        "2026-03-03_30_5m": {  // Will be deleted after 7 days
          data: [...candles],
          fetchedAt: "2026-03-03T10:30:00Z"
        }
      }
    }
  }
}
```

## Summary

✅ **Automatic cleanup** after 7 days
✅ **Quota error handling** with auto-cleanup
✅ **Manual cleanup** actions available
✅ **Comprehensive logging** for monitoring
✅ **Fallback mechanisms** for reliability
✅ **Best practices** documented

The cache management system ensures:
- No indefinite storage bloat
- Automatic cleanup of stale data
- Graceful handling of storage limits
- User control over cache lifecycle
