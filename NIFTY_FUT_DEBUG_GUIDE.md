# NIFTY FUT Date Range Error - Debugging Guide

## Issue
Getting "Invalid date range" error (400) when trying to load NIFTY FUT data.

## Changes Made

### 1. Enhanced Instrument Detection
- Added support for multiple FUT patterns: `FUT`, `_FO`, `NSE_FO`, `BSE_FO`, `MCX_FO`
- Added BSE exchange detection
- More detailed logging of instrument type detection

### 2. Date Validation Improvements
- Added check to prevent requesting future dates (toDate > now)
- Added validation to ensure fromDate is not after toDate
- Added detailed logging of date ranges being sent to API

### 3. Enhanced Console Logging
Added comprehensive logging at multiple stages:
- Instrument detection with all flags (isMCX, isNSE, isBSE, isFUT)
- Timeframe type (intraday vs daily+)
- Max days allowed for the instrument type
- Date range adjustments
- Full API URL being called
- Actual days difference being requested

## How to Debug

### Step 1: Check Console Logs
When you add NIFTY FUT, look for these log entries:

```
[validateDateRange] Instrument detection: {
  instrumentKey: "NSE_FO|...",  // Check the actual format
  isMCX: false,
  isNSE: true,
  isBSE: false,
  isFUT: true,  // Should be true for NIFTY FUT
  requestedDays: 30,
  unit: "minutes",
  interval: 5
}
```

### Step 2: Check Limits Applied
```
[validateDateRange] Limits applied: {
  maxDays: 30,  // Should be 30 for FUT intraday, 90 for FUT daily
  instrumentType: "FUT",  // Should show FUT, not EQ
  timeframeType: "intraday"  // or "daily+"
}
```

### Step 3: Check Final Date Range
```
[ChartService.getHistoricalCandles] Final date range: {
  fromDate: "2026-02-02",
  toDate: "2026-03-04",
  days: 30,
  adjusted: false  // true if range was adjusted
}
```

### Step 4: Check API URL
```
[ChartService.getHistoricalCandles] Full API URL: 
/api/upstox/v3/historical-candle/NSE_FO|12345/minutes/5/2026-03-04/2026-02-02
```

## Common Issues and Solutions

### Issue 1: isFUT is false
**Problem**: Instrument key doesn't match any FUT patterns
**Solution**: Check the actual instrumentKey format in console and add the pattern to detection logic

### Issue 2: Wrong maxDays applied
**Problem**: FUT is being treated as EQ (365 days instead of 30/90)
**Solution**: Verify isFUT detection is working correctly

### Issue 3: Future dates
**Problem**: toDate is in the future
**Solution**: Code now automatically adjusts toDate to today

### Issue 4: fromDate > toDate
**Problem**: Date range is inverted
**Solution**: Code now automatically swaps the dates

### Issue 5: Exceeding API limits
**Problem**: Requesting more days than allowed
**Solution**: Code automatically adjusts to maxDays

## API Limits Reference

### MCX
- Intraday (minutes/hours): 7 days max
- Daily/Weekly/Monthly: 90 days max

### Futures (NSE_FO, BSE_FO, MCX_FO)
- Intraday (minutes/hours): 30 days max
- Daily/Weekly/Monthly: 90 days max

### Equity (NSE_EQ, BSE_EQ)
- Intraday (minutes/hours): 30 days max
- Daily/Weekly/Monthly: 365 days max

## Next Steps

1. Open browser console (F12)
2. Add NIFTY FUT instrument
3. Copy all console logs starting with `[validateDateRange]` and `[ChartService.getHistoricalCandles]`
4. Share the logs to identify the exact issue

## Expected Behavior

For NIFTY FUT with 5m timeframe and 30 days:
- Should detect as FUT instrument
- Should apply 30 days max limit for intraday
- Should NOT adjust date range (30 days is within limit)
- Should make API call with correct dates

For NIFTY FUT with 1d timeframe and 365 days:
- Should detect as FUT instrument
- Should apply 90 days max limit for daily
- Should ADJUST date range from 365 to 90 days
- Should make API call with adjusted dates
