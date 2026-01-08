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

export const ChartService = {
    getHistoricalCandles: async (token, instrumentKey, unit, interval, toDate, fromDate) => {
        try {
            validateCandleParams(unit, interval);
            const url = `/api/upstox/v3/historical-candle/${instrumentKey}/${unit}/${interval}/${toDate}/${fromDate}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch Historical Candles Error:', error);
            throw error;
        }
    },

    getIntradayCandles: async (token, instrumentKey, unit, interval) => {
        try {
            validateCandleParams(unit, interval);
            const url = `/api/upstox/v3/historical-candle/intraday/${instrumentKey}/${unit}/${interval}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch Intraday Candles Error:', error);
            throw error;
        }
    },

    // Merge and format candle data for charting
    formatCandleData: (apiResponse) => {
        try {
            if (!apiResponse || !apiResponse.data || !apiResponse.data.candles) {
                console.warn('Invalid API response structure:', apiResponse);
                return [];
            }

            const candles = apiResponse.data.candles;
            if (!Array.isArray(candles) || candles.length === 0) {
                console.warn('No candles data available');
                return [];
            }

            // Upstox format: [timestamp, open, high, low, close, volume, oi]
            const formatted = candles
                .filter(candle => Array.isArray(candle) && candle.length >= 5)
                .map(candle => {
                    // Parse timestamp - could be ISO string or Unix timestamp
                    let timestamp;
                    if (typeof candle[0] === 'string') {
                        timestamp = Math.floor(new Date(candle[0]).getTime() / 1000);
                    } else {
                        // Already a Unix timestamp (in seconds or milliseconds)
                        timestamp = candle[0] > 10000000000 ? Math.floor(candle[0] / 1000) : candle[0];
                    }

                    return {
                        time: timestamp,
                        open: parseFloat(candle[1]),
                        high: parseFloat(candle[2]),
                        low: parseFloat(candle[3]),
                        close: parseFloat(candle[4]),
                        volume: candle[5] ? parseFloat(candle[5]) : 0
                    };
                })
                .filter(candle => !isNaN(candle.time) && !isNaN(candle.open))
                .sort((a, b) => a.time - b.time);

            console.log(`Formatted ${formatted.length} candles`);
            return formatted;
        } catch (error) {
            console.error('Error formatting candle data:', error);
            return [];
        }
    }
};
