const validateCandleParams = (unit, interval) => {
    const validUnits = ['minutes', 'hours', 'days', 'weeks', 'months'];
    if (!validUnits.includes(unit)) {
        throw new Error(`Invalid unit: ${unit}. Must be one of ${validUnits.join(', ')}`);
    }

    if (unit === 'minutes') {
        if (interval < 1 || interval > 300) {
            throw new Error(`Invalid interval for minutes: ${interval}. Must be between 1 and 300.`);
        }
    } else if (unit === 'hours') {
        if (interval < 1 || interval > 5) {
            throw new Error(`Invalid interval for hours: ${interval}. Must be between 1 and 5.`);
        }
    } else {
        // days, weeks, months
        if (interval !== 1) {
            throw new Error(`Invalid interval for ${unit}: ${interval}. Must be 1.`);
        }
    }
};

// Validate and adjust date range based on Upstox API limits
const validateDateRange = (unit, interval, fromDate, toDate, instrumentKey = '') => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const now = new Date();
    
    // Ensure toDate is not in the future
    if (to > now) {
        console.warn('[validateDateRange] toDate is in the future, adjusting to today');
        to.setTime(now.getTime());
        toDate = to.toISOString().split('T')[0];
    }
    
    const daysDiff = Math.floor((to - from) / (1000 * 60 * 60 * 24));
    
    // Detect exchange and instrument type from instrument key
    // instrumentKey format examples:
    // - NSE_EQ|INE009A01021 (Equity)
    // - NSE_FO|12345 (Futures & Options)
    // - MCX_FO|12345 (MCX Futures)
    const isMCX = instrumentKey.includes('MCX');
    const isNSE = instrumentKey.includes('NSE');
    const isBSE = instrumentKey.includes('BSE');
    // Check for FUT, _FO, or NSE_FO/BSE_FO patterns
    const isFUT = instrumentKey.includes('FUT') || 
                  instrumentKey.includes('_FO') || 
                  instrumentKey.includes('NSE_FO') || 
                  instrumentKey.includes('BSE_FO') ||
                  instrumentKey.includes('MCX_FO');
    
    console.log('[validateDateRange] Instrument detection:', {
        instrumentKey,
        isMCX,
        isNSE,
        isBSE,
        isFUT,
        requestedDays: daysDiff,
        unit,
        interval
    });
    
    // Upstox API limits vary by exchange, instrument type, and timeframe
    let maxDays;
    
    if (isMCX) {
        // MCX has stricter limits
        if (unit === 'minutes' || unit === 'hours') {
            maxDays = 7; // MCX intraday: Max 7 days
        } else if (unit === 'days') {
            maxDays = 90; // MCX daily: Max 90 days
        } else {
            maxDays = 90; // MCX weekly/monthly: Max 90 days
        }
    } else if (isFUT) {
        // Futures have limited history (contracts expire)
        if (unit === 'minutes' || unit === 'hours') {
            maxDays = 30; // FUT intraday: Max 30 days
        } else if (unit === 'days') {
            maxDays = 90; // FUT daily: Max 90 days (contract life)
        } else {
            maxDays = 90; // FUT weekly/monthly: Max 90 days
        }
    } else {
        // NSE/BSE equity limits
        if (unit === 'minutes' || unit === 'hours') {
            maxDays = 30; // NSE intraday: Max 30 days
        } else if (unit === 'days') {
            maxDays = 365; // NSE daily: Max 1 year
        } else {
            maxDays = 365; // NSE weekly/monthly: Max 1 year
        }
    }
    
    console.log('[validateDateRange] Limits applied:', {
        maxDays,
        instrumentType: isMCX ? 'MCX' : (isFUT ? 'FUT' : 'EQ'),
        timeframeType: (unit === 'minutes' || unit === 'hours') ? 'intraday' : 'daily+'
    });
    
    if (daysDiff > maxDays) {
        console.warn(`[validateDateRange] Requested ${daysDiff} days exceeds limit of ${maxDays} for ${unit}. Adjusting...`);
        // Adjust fromDate to be within limits
        const adjustedFrom = new Date(to.getTime() - maxDays * 24 * 60 * 60 * 1000);
        return {
            fromDate: adjustedFrom.toISOString().split('T')[0],
            toDate: toDate,
            adjusted: true,
            originalDays: daysDiff,
            adjustedDays: maxDays,
            instrumentType: isMCX ? 'MCX' : (isFUT ? 'FUT' : 'EQ')
        };
    }
    
    // Ensure fromDate is not after toDate
    if (from > to) {
        console.error('[validateDateRange] fromDate is after toDate! Swapping...');
        return {
            fromDate: toDate,
            toDate: fromDate,
            adjusted: true,
            days: daysDiff,
            instrumentType: isMCX ? 'MCX' : (isFUT ? 'FUT' : 'EQ')
        };
    }
    
    return {
        fromDate,
        toDate,
        adjusted: false,
        days: daysDiff,
        instrumentType: isMCX ? 'MCX' : (isFUT ? 'FUT' : 'EQ')
    };
};

export const ChartService = {
    getHistoricalCandles: async (token, instrumentKey, unit, interval, toDate, fromDate) => {
        try {
            console.log('[ChartService.getHistoricalCandles] Request params:', {
                instrumentKey,
                unit,
                interval,
                toDate,
                fromDate,
                hasToken: !!token
            });
            
            validateCandleParams(unit, interval);
            
            // Validate and adjust date range if needed (pass instrumentKey for exchange detection)
            const dateRange = validateDateRange(unit, interval, fromDate, toDate, instrumentKey);
            if (dateRange.adjusted) {
                console.warn('[ChartService.getHistoricalCandles] Date range adjusted:', dateRange);
                fromDate = dateRange.fromDate;
                toDate = dateRange.toDate;
            }
            
            console.log('[ChartService.getHistoricalCandles] Instrument type:', dateRange.instrumentType);
            console.log('[ChartService.getHistoricalCandles] Final date range:', { 
                fromDate, 
                toDate, 
                days: dateRange.adjustedDays || dateRange.days,
                adjusted: dateRange.adjusted 
            });
            
            const url = `/api/upstox/v3/historical-candle/${instrumentKey}/${unit}/${interval}/${toDate}/${fromDate}`;
            console.log('[ChartService.getHistoricalCandles] Full API URL:', url);
            console.log('[ChartService.getHistoricalCandles] Date range being sent:', {
                from: fromDate,
                to: toDate,
                daysDiff: Math.floor((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24))
            });
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('[ChartService.getHistoricalCandles] Response status:', response.status);
            console.log('[ChartService.getHistoricalCandles] Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ChartService.getHistoricalCandles] Error response:', errorText);
                
                // Try to parse error as JSON for better error messages
                let errorMessage = `API Error: ${response.status} - ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.errors && errorJson.errors[0]) {
                        const error = errorJson.errors[0];
                        errorMessage = `API Error: ${response.status} - ${error.message || error.errorCode}`;
                        
                        // Add helpful context for common errors
                        if (error.errorCode === 'UDAPI1148' || error.message === 'Invalid date range') {
                            console.error('[ChartService.getHistoricalCandles] Date range error details:', {
                                instrumentKey,
                                instrumentType: dateRange.instrumentType,
                                requestedRange: { fromDate, toDate, days: dateRange.adjustedDays || dateRange.days },
                                wasAdjusted: dateRange.adjusted,
                                unit,
                                interval
                            });
                            errorMessage += `\n\nDate Range Details:\n- Instrument: ${dateRange.instrumentType}\n- Requested: ${fromDate} to ${toDate} (${dateRange.adjustedDays || dateRange.days} days)\n- Timeframe: ${interval}${unit}\n- Was adjusted: ${dateRange.adjusted ? 'Yes' : 'No'}`;
                        }
                    }
                } catch (parseError) {
                    // Error text is not JSON, use as-is
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('[ChartService.getHistoricalCandles] Response data:', data);
            return data;
        } catch (error) {
            console.error('[ChartService.getHistoricalCandles] Fetch Historical Candles Error:', error);
            throw error;
        }
    },

    getIntradayCandles: async (token, instrumentKey, unit, interval) => {
        try {
            console.log('[ChartService.getIntradayCandles] Request params:', {
                instrumentKey,
                unit,
                interval,
                hasToken: !!token
            });
            
            validateCandleParams(unit, interval);
            const url = `/api/upstox/v3/historical-candle/intraday/${instrumentKey}/${unit}/${interval}`;
            console.log('[ChartService.getIntradayCandles] URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('[ChartService.getIntradayCandles] Response status:', response.status);
            console.log('[ChartService.getIntradayCandles] Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ChartService.getIntradayCandles] Error response:', errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[ChartService.getIntradayCandles] Response data:', data);
            return data;
        } catch (error) {
            console.error('[ChartService.getIntradayCandles] Fetch Intraday Candles Error:', error);
            throw error;
        }
    },

    // Merge and format candle data for charting
    formatCandleData: (apiResponse) => {
        try {
            console.log('[ChartService.formatCandleData] Input:', {
                hasResponse: !!apiResponse,
                hasData: !!apiResponse?.data,
                hasCandles: !!apiResponse?.data?.candles,
                responseKeys: apiResponse ? Object.keys(apiResponse) : [],
                dataKeys: apiResponse?.data ? Object.keys(apiResponse.data) : []
            });
            
            if (!apiResponse || !apiResponse.data || !apiResponse.data.candles) {
                console.warn('[ChartService.formatCandleData] Invalid API response structure:', apiResponse);
                return [];
            }

            const candles = apiResponse.data.candles;
            console.log('[ChartService.formatCandleData] Candles array:', {
                isArray: Array.isArray(candles),
                length: candles?.length,
                firstCandle: candles?.[0],
                lastCandle: candles?.[candles?.length - 1]
            });
            
            if (!Array.isArray(candles) || candles.length === 0) {
                console.warn('[ChartService.formatCandleData] No candles data available');
                return [];
            }

            // IST offset: +5 hours 30 minutes = 19800 seconds
            const IST_OFFSET = 19800;

            // Upstox format: [timestamp, open, high, low, close, volume, oi]
            const formatted = candles
                .filter(candle => Array.isArray(candle) && candle.length >= 5)
                .map(candle => {
                    // Parse timestamp - could be ISO string or Unix timestamp
                    let timestamp;
                    if (typeof candle[0] === 'string') {
                        // ISO string - convert to Unix timestamp in seconds
                        timestamp = Math.floor(new Date(candle[0]).getTime() / 1000);
                    } else {
                        // Already a Unix timestamp (in seconds or milliseconds)
                        timestamp = candle[0] > 10000000000 ? Math.floor(candle[0] / 1000) : candle[0];
                    }

                    // Convert UTC to IST by adding offset
                    const istTimestamp = timestamp + IST_OFFSET;

                    return {
                        time: istTimestamp,
                        open: parseFloat(candle[1]),
                        high: parseFloat(candle[2]),
                        low: parseFloat(candle[3]),
                        close: parseFloat(candle[4]),
                        volume: candle[5] ? parseFloat(candle[5]) : 0
                    };
                })
                .filter(candle => !isNaN(candle.time) && !isNaN(candle.open))
                .sort((a, b) => a.time - b.time);

            console.log(`[ChartService.formatCandleData] Formatted ${formatted.length} candles (UTC → IST)`);
            console.log('[ChartService.formatCandleData] First formatted (IST):', {
                ...formatted[0],
                timeIST: new Date(formatted[0]?.time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            });
            console.log('[ChartService.formatCandleData] Last formatted (IST):', {
                ...formatted[formatted.length - 1],
                timeIST: new Date(formatted[formatted.length - 1]?.time * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            });
            return formatted;
        } catch (error) {
            console.error('[ChartService.formatCandleData] Error formatting candle data:', error);
            console.error('[ChartService.formatCandleData] Error stack:', error.stack);
            return [];
        }
    }
};
