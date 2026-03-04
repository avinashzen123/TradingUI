import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

/**
 * Reusable chart container component
 * Creates and manages a lightweight-charts instance
 */
export default function ChartContainer({ 
    height = 400, 
    onChartReady,
    className = 'chart-container'
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || chartRef.current) return; // Don't recreate if chart exists

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: { 
                background: { color: '#1e293b' }, 
                textColor: '#94a3b8' 
            },
            grid: { 
                vertLines: { color: '#334155' }, 
                horzLines: { color: '#334155' } 
            },
            timeScale: { 
                timeVisible: true, 
                secondsVisible: false 
            },
        });

        chartRef.current = chart;

        // Notify parent that chart is ready
        if (onChartReady) {
            onChartReady(chart);
        }

        // Handle resize
        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ 
                    width: containerRef.current.clientWidth 
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []); // Empty dependency array - only run once

    return <div ref={containerRef} className={className} />;
}
