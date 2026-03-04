import { useEffect, useRef } from 'react';
import ChartContainer from './ChartContainer';

/**
 * Separate indicator chart (for RSI, MACD, etc.)
 */
export default function IndicatorChart({ 
    indicator, 
    candleData, 
    onChartReady 
}) {
    const chartRef = useRef(null);

    const handleChartReady = (chart) => {
        chartRef.current = chart;
        
        if (onChartReady) {
            onChartReady(chart, indicator);
        }
    };

    if (!indicator) return null;

    return (
        <div className="separate-chart-container">
            <div className="separate-chart-header">
                <span className="chart-title">{indicator.name}</span>
            </div>
            <ChartContainer 
                height={150} 
                onChartReady={handleChartReady}
                className="chart-container separate-chart"
            />
        </div>
    );
}
