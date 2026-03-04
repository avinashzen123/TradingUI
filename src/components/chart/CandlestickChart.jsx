import { useEffect, useRef } from 'react';
import ChartContainer from './ChartContainer';

/**
 * Candlestick chart with main price data
 */
export default function CandlestickChart({ candleData, onChartReady }) {
    const candlestickSeriesRef = useRef(null);
    const chartRef = useRef(null);
    const isInitializedRef = useRef(false);

    const handleChartReady = (chart) => {
        if (isInitializedRef.current) return; // Prevent re-initialization
        
        console.log('[CandlestickChart] Chart ready, creating candlestick series');
        chartRef.current = chart;
        
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        candlestickSeriesRef.current = candlestickSeries;
        isInitializedRef.current = true;

        if (onChartReady) {
            onChartReady(chart, candlestickSeries);
        }
    };

    useEffect(() => {
        if (!candlestickSeriesRef.current || !candleData || candleData.length === 0) {
            return;
        }

        const formattedData = candleData.map(candle => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));

        console.log('[CandlestickChart] Updating candle data:', formattedData.length, 'candles');
        candlestickSeriesRef.current.setData(formattedData);
    }, [candleData]);

    return <ChartContainer height={400} onChartReady={handleChartReady} />;
}
