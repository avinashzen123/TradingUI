export const ChartService = {
    getHistoricalCandles: async (token, instrumentKey, toDate, fromDate) => {
        try {
            const url = `/api/upstox/v3/historical-candle/${instrumentKey}/hours/1/${toDate}/${fromDate}`;
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
