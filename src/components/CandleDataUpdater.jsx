import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    updateCandleData, 
    selectInstrumentTimeframe, 
    selectInstrument,
    selectInstrumentHistoricalDataCache,
    selectInstrumentHistoricalDays,
    clearOldCache
} from '../store/instrumentAnalysisSlice';
import { selectDailyData } from '../store/dailyDataSlice';
import { ChartService } from '../services/ChartService';
import ErrorAlert from './ErrorAlert';

/**
 * Component that listens to timeframe changes and fetches candle data
 * This component doesn't render anything, it just manages data fetching
 */
export default function CandleDataUpdater({ instrumentKey }) {
    const dispatch = useDispatch();
    const timeframe = useSelector(selectInstrumentTimeframe(instrumentKey));
    const instrument = useSelector(selectInstrument(instrumentKey));
    const historicalDataCache = useSelector(selectInstrumentHistoricalDataCache(instrumentKey));
    const historicalDays = useSelector(selectInstrumentHistoricalDays(instrumentKey));
    const dailyData = useSelector(selectDailyData);
    const token = dailyData['UPSTOX_TOKEN'];
    const [error, setError] = useState(null);
    const lastErrorRef = useRef(null);
    const lastCacheKeyRef = useRef(null); // Track last processed cache key
    const isFetchingRef = useRef(false); // Prevent concurrent fetches

    useEffect(() => {
        if (!instrumentKey || !timeframe || !token || !instrument) {
            console.log('[CandleDataUpdater] Missing required data:', { 
                instrumentKey: !!instrumentKey, 
                timeframe: !!timeframe, 
                token: !!token,
                instrument: !!instrument 
            });
            return;
        }

        // Clean up old cache entries on mount (keep only today's cache)
        dispatch(clearOldCache({ instrumentKey }));

        const fetchCandleData = async () => {
            // Prevent concurrent fetches
            if (isFetchingRef.current) {
                console.log('[CandleDataUpdater] Fetch already in progress, skipping...');
                return;
            }
            
            try {
                console.log('[CandleDataUpdater] Fetching candle data:', {
                    instrumentKey,
                    timeframe,
                    historicalDays,
                    instrumentName: instrument.name || instrument.symbol
                });

                const { unit, interval } = parseTimeframe(timeframe);
                console.log('[CandleDataUpdater] Parsed timeframe:', { unit, interval });

                // Create cache key: "YYYY-MM-DD_days_timeframe"
                const today = new Date().toISOString().split('T')[0];
                const cacheKey = `${today}_${historicalDays}_${timeframe}`;
                
                // Check if we've already processed this cache key
                if (lastCacheKeyRef.current === cacheKey) {
                    console.log('[CandleDataUpdater] Already processed cache key:', cacheKey, '- skipping');
                    return;
                }
                
                console.log('[CandleDataUpdater] Cache key:', cacheKey);
                console.log('[CandleDataUpdater] Available cache keys:', Object.keys(historicalDataCache));

                let allCandles = [];
                let historicalCandles = [];
                
                // Step 1: Check cache for historical data
                const cachedData = historicalDataCache[cacheKey];
                
                if (cachedData && cachedData.data && cachedData.data.length > 0) {
                    // Use cached data
                    console.log('[CandleDataUpdater] ✅ Using cached historical data:', {
                        cacheKey,
                        fetchedAt: cachedData.fetchedAt,
                        candleCount: cachedData.data.length
                    });
                    historicalCandles = cachedData.data;
                    allCandles = [...historicalCandles];
                    lastCacheKeyRef.current = cacheKey; // Mark as processed
                } else {
                    // Fetch fresh historical data
                    isFetchingRef.current = true; // Set fetching flag
                    
                    try {
                        console.log('[CandleDataUpdater] Fetching fresh historical data...');
                        const now = new Date();
                        const toDate = now.toISOString().split('T')[0];
                        const fromDate = new Date(now.getTime() - historicalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        
                        console.log('[CandleDataUpdater] Historical date range:', { fromDate, toDate, days: historicalDays });
                        
                        const historicalResponse = await ChartService.getHistoricalCandles(
                            token, 
                            instrumentKey, 
                            unit, 
                            interval, 
                            toDate, 
                            fromDate
                        );
                        
                        historicalCandles = ChartService.formatCandleData(historicalResponse);
                        console.log('[CandleDataUpdater] Historical candles fetched:', historicalCandles.length);
                        
                        // Cache historical data with the specific key
                        if (historicalCandles.length > 0) {
                            dispatch(updateCandleData({
                                instrumentKey,
                                candleData: historicalCandles,
                                append: false,
                                cacheKey: cacheKey
                            }));
                            console.log('[CandleDataUpdater] ✅ Historical data cached with key:', cacheKey);
                            lastCacheKeyRef.current = cacheKey; // Mark as processed
                        }
                        
                        allCandles = [...historicalCandles];
                    } catch (historicalError) {
                        console.error('[CandleDataUpdater] ❌ Historical data fetch failed');
                        console.error('[CandleDataUpdater] Error message:', historicalError.message);
                        
                        // Check if it's a rate limit error
                        if (historicalError.message.includes('429')) {
                            console.error('[CandleDataUpdater] 🚫 RATE LIMIT HIT - Cloudflare blocking requests');
                        }
                        
                        // Try to use any cached data (even if from different day/range)
                        const availableCacheKeys = Object.keys(historicalDataCache);
                        if (availableCacheKeys.length > 0) {
                            const latestCacheKey = availableCacheKeys.sort().reverse()[0];
                            console.log('[CandleDataUpdater] Using fallback cache:', latestCacheKey);
                            historicalCandles = historicalDataCache[latestCacheKey].data;
                            allCandles = [...historicalCandles];
                            lastCacheKeyRef.current = cacheKey; // Mark as processed even with fallback
                        } else {
                            throw historicalError;
                        }
                    } finally {
                        isFetchingRef.current = false; // Clear fetching flag
                    }
                }
                
                // Step 2: Fetch intraday data (only for intraday timeframes)
                let intradayCandles = [];
                if (unit === 'minutes' || (unit === 'hours' && interval <= 5)) {
                    try {
                        console.log('[CandleDataUpdater] Fetching intraday data...');
                        
                        // Add delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                        
                        const intradayResponse = await ChartService.getIntradayCandles(
                            token, 
                            instrumentKey, 
                            unit, 
                            interval
                        );
                        
                        intradayCandles = ChartService.formatCandleData(intradayResponse);
                        console.log('[CandleDataUpdater] Intraday candles formatted:', {
                            count: intradayCandles.length,
                            first: intradayCandles[0],
                            last: intradayCandles[intradayCandles.length - 1]
                        });
                        
                        // Step 3: Merge and deduplicate candles
                        if (intradayCandles.length > 0 && historicalCandles.length > 0) {
                            console.log('[CandleDataUpdater] Merging historical and intraday data...');
                            console.log('[CandleDataUpdater] Before merge:', {
                                historicalCount: historicalCandles.length,
                                intradayCount: intradayCandles.length
                            });
                            
                            // Create a map to deduplicate by timestamp
                            const candleMap = new Map();
                            
                            // Add historical candles first
                            historicalCandles.forEach(candle => {
                                candleMap.set(candle.time, candle);
                            });
                            
                            // Add/override with intraday candles (more recent/accurate)
                            intradayCandles.forEach(candle => {
                                candleMap.set(candle.time, candle);
                            });
                            
                            // Convert back to array and sort by time
                            allCandles = Array.from(candleMap.values()).sort((a, b) => a.time - b.time);
                            
                            console.log('[CandleDataUpdater] After merge:', {
                                total: allCandles.length,
                                duplicatesRemoved: (historicalCandles.length + intradayCandles.length) - allCandles.length
                            });
                        }
                    } catch (intradayError) {
                        console.error('[CandleDataUpdater] ❌ Intraday data fetch failed');
                        console.error('[CandleDataUpdater] Error message:', intradayError.message);
                        
                        // Check if it's a rate limit error
                        if (intradayError.message.includes('429')) {
                            console.warn('[CandleDataUpdater] ⚠️ Rate limit hit - using historical data only');
                            console.warn('[CandleDataUpdater] Please wait 1 hour before trying again or reduce refresh frequency');
                        }
                        // Continue with historical data only
                    }
                } else {
                    console.log('[CandleDataUpdater] Skipping intraday fetch for non-intraday timeframe');
                }
                
                console.log('[CandleDataUpdater] Final candle data:', {
                    count: allCandles.length,
                    first: allCandles[0],
                    last: allCandles[allCandles.length - 1],
                    timeRange: allCandles.length > 0 ? {
                        from: new Date(allCandles[0].time * 1000).toLocaleString(),
                        to: new Date(allCandles[allCandles.length - 1].time * 1000).toLocaleString()
                    } : null
                });

                if (allCandles.length > 0) {
                    dispatch(updateCandleData({
                        instrumentKey,
                        candleData: allCandles,
                        append: false, // Replace existing data
                    }));
                    console.log('[CandleDataUpdater] ✅ Candle data updated in Redux');
                    // Clear any previous errors on success
                    setError(null);
                    lastErrorRef.current = null;
                } else {
                    const errorObj = {
                        type: 'no_data',
                        title: 'No Candle Data Available',
                        message: `Unable to load data for ${instrument.name || instrument.symbol}`,
                        solutions: [
                            'Rate limit hit (429 error) - Wait 1 hour',
                            'No cached data available',
                            'API is temporarily unavailable'
                        ],
                        note: 'Please wait for rate limit to reset or try again later'
                    };
                    
                    // Only show if different from last error
                    if (JSON.stringify(errorObj) !== lastErrorRef.current) {
                        setError(errorObj);
                        lastErrorRef.current = JSON.stringify(errorObj);
                    }
                    console.error('[CandleDataUpdater] ❌ No candles available');
                }
            } catch (error) {
                console.error('[CandleDataUpdater] ❌ Failed to fetch candle data:', error);
                
                let errorObj;
                
                // Check if it's a rate limit error
                if (error.message.includes('429')) {
                    errorObj = {
                        type: 'rate_limit',
                        title: 'Rate Limit Exceeded (429)',
                        message: 'Cloudflare is blocking requests to Upstox API due to too many requests in a short time.',
                        solutions: [
                            'Wait 1 hour for the rate limit to reset',
                            'Increase refresh interval to 15+ minutes',
                            'Reduce number of instruments being analyzed',
                            'The app will use cached data if available'
                        ],
                        note: 'Historical data is now cached for 24 hours to reduce API calls'
                    };
                } else {
                    errorObj = {
                        type: 'api_error',
                        title: 'Failed to Fetch Candle Data',
                        message: `Error loading data for ${instrument.name || instrument.symbol}: ${error.message}`,
                        solutions: [
                            'Check your UPSTOX_TOKEN is valid',
                            'Verify internet connection',
                            'Confirm the instrument key is correct'
                        ]
                    };
                }
                
                // Only show if different from last error
                if (JSON.stringify(errorObj) !== lastErrorRef.current) {
                    setError(errorObj);
                    lastErrorRef.current = JSON.stringify(errorObj);
                }
            }
        };

        fetchCandleData();

        // Set up interval to refresh data periodically
        const refreshInterval = getRefreshInterval(timeframe);
        console.log('[CandleDataUpdater] Setting up refresh interval:', refreshInterval, 'ms');
        const interval = setInterval(fetchCandleData, refreshInterval);

        return () => {
            console.log('[CandleDataUpdater] Cleaning up interval');
            clearInterval(interval);
            isFetchingRef.current = false; // Reset fetching flag on cleanup
        };
    }, [instrumentKey, timeframe, historicalDays, token, instrument, dispatch]); // Removed historicalDataCache from deps

    return <ErrorAlert error={error} onClose={() => setError(null)} />;
}

// Parse timeframe string to unit and interval
function parseTimeframe(timeframe) {
    const map = {
        '1m': { unit: 'minutes', interval: 1 },
        '5m': { unit: 'minutes', interval: 5 },
        '15m': { unit: 'minutes', interval: 15 },
        '30m': { unit: 'minutes', interval: 30 },
        '1h': { unit: 'hours', interval: 1 },
        '1d': { unit: 'days', interval: 1 },
        '1w': { unit: 'weeks', interval: 1 },
        '1M': { unit: 'months', interval: 1 },
    };
    return map[timeframe] || { unit: 'minutes', interval: 5 };
}

// Helper function to determine refresh interval based on timeframe
function getRefreshInterval(timeframe) {
    const intervals = {
        '1m': 60000,      // 1 minute
        '5m': 300000,     // 5 minutes
        '15m': 900000,    // 15 minutes
        '30m': 1800000,   // 30 minutes
        '1h': 3600000,    // 1 hour
        '1d': 86400000,   // 1 day
    };
    return intervals[timeframe] || 300000; // Default 5 minutes
}
