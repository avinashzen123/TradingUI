﻿import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { selectInstrument, selectInstrumentCandleData, selectInstrumentAnalysis, selectInstrumentIndicators } from '../store/instrumentAnalysisSlice';
import TimeframeSelector from './TimeframeSelector';
import DaysSelector from './DaysSelector';
import CandleDataUpdater from './CandleDataUpdater';
import AnalysisEngine from './AnalysisEngine';
import IndicatorManager from './indicators/IndicatorManager';
import AnalysisResults from './analysis/AnalysisResults';
import { IndicatorPlotter } from './indicators/IndicatorPlotter';

export default function InstrumentAnalysisView({ instrumentKey }) {
    const instrument = useSelector(selectInstrument(instrumentKey));
    const candleData = useSelector(selectInstrumentCandleData(instrumentKey));
    const analysis = useSelector(selectInstrumentAnalysis(instrumentKey));
    const indicatorConfig = useSelector(selectInstrumentIndicators(instrumentKey));
    const mainChartContainerRef = useRef(null);
    const mainChartRef = useRef(null);
    const candlestickSeriesRef = useRef(null);
    const indicatorSeriesRef = useRef({});
    const separateChartsRef = useRef({});
    const separateChartContainersRef = useRef({});

    useEffect(() => {
        if (!mainChartContainerRef.current || mainChartRef.current) return;
        const chart = createChart(mainChartContainerRef.current, {
            width: mainChartContainerRef.current.clientWidth,
            height: 400,
            layout: { background: { color: '#1e293b' }, textColor: '#94a3b8' },
            grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
            timeScale: { timeVisible: true, secondsVisible: false },
        });
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
        });
        mainChartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        const handleResize = () => {
            if (mainChartContainerRef.current && mainChartRef.current) {
                mainChartRef.current.applyOptions({ width: mainChartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (mainChartRef.current) {
                mainChartRef.current.remove();
                mainChartRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!candlestickSeriesRef.current || !candleData || candleData.length === 0) return;
        
        console.log('[InstrumentAnalysisView] ========== Candle Data Update ==========');
        console.log('[InstrumentAnalysisView] Candle data length:', candleData.length);
        console.log('[InstrumentAnalysisView] First candle:', candleData[0]);
        console.log('[InstrumentAnalysisView] Last candle:', candleData[candleData.length - 1]);
        console.log('[InstrumentAnalysisView] Sample candle structure:', {
            time: candleData[0]?.time,
            timeType: typeof candleData[0]?.time,
            open: candleData[0]?.open,
            high: candleData[0]?.high,
            low: candleData[0]?.low,
            close: candleData[0]?.close,
            volume: candleData[0]?.volume
        });
        
        const formattedData = candleData.map(candle => ({
            time: candle.time, 
            open: candle.open, 
            high: candle.high, 
            low: candle.low, 
            close: candle.close,
        }));
        
        console.log('[InstrumentAnalysisView] Formatted data length:', formattedData.length);
        console.log('[InstrumentAnalysisView] First formatted:', formattedData[0]);
        console.log('[InstrumentAnalysisView] Last formatted:', formattedData[formattedData.length - 1]);
        
        candlestickSeriesRef.current.setData(formattedData);
        console.log('[InstrumentAnalysisView] ✅ Candlestick data set');
    }, [candleData]);

    useEffect(() => {
        if (!mainChartRef.current || !candleData || candleData.length < 50 || !indicatorConfig) return;
        
        console.log('[InstrumentAnalysisView] ========== Indicator Update ==========');
        console.log('[InstrumentAnalysisView] Enabled indicators:', indicatorConfig.enabled.map(i => `${i.id} (${i.chartType})`));
        
        // Validate candle data structure
        const firstCandle = candleData[0];
        const isValidData = firstCandle && 
            typeof firstCandle.time === 'number' &&
            typeof firstCandle.open === 'number' &&
            typeof firstCandle.high === 'number' &&
            typeof firstCandle.low === 'number' &&
            typeof firstCandle.close === 'number';
        
        if (!isValidData) {
            console.error('[InstrumentAnalysisView] ❌ Invalid candle data structure:', firstCandle);
            return;
        }
        
        console.log('[InstrumentAnalysisView] ✅ Candle data validation passed');
        console.log('[InstrumentAnalysisView] Candle data range:', {
            count: candleData.length,
            timeRange: `${new Date(candleData[0].time * 1000).toLocaleString()} - ${new Date(candleData[candleData.length - 1].time * 1000).toLocaleString()}`,
            priceRange: `${Math.min(...candleData.map(c => c.low)).toFixed(2)} - ${Math.max(...candleData.map(c => c.high)).toFixed(2)}`
        });
        
        // Clear existing overlay indicators
        Object.entries(indicatorSeriesRef.current).forEach(([key, series]) => {
            if (series) {
                try { 
                    mainChartRef.current.removeSeries(series);
                    console.log('[InstrumentAnalysisView] Removed overlay series:', key);
                } catch (e) {
                    console.warn('[InstrumentAnalysisView] Error removing overlay series:', key, e);
                }
            }
        });
        indicatorSeriesRef.current = {};
        
        // Get list of needed separate charts
        const neededSeparateCharts = new Set(
            indicatorConfig.enabled
                .filter(ind => ind.visible !== false && ind.chartType === 'separate')
                .map(ind => ind.id)
        );
        
        console.log('[InstrumentAnalysisView] Needed separate charts:', Array.from(neededSeparateCharts));
        console.log('[InstrumentAnalysisView] Existing separate charts:', Object.keys(separateChartsRef.current));
        
        // Remove charts that are no longer needed
        Object.keys(separateChartsRef.current).forEach(chartId => {
            if (!neededSeparateCharts.has(chartId)) {
                console.log('[InstrumentAnalysisView] Removing unused chart:', chartId);
                const chartObj = separateChartsRef.current[chartId];
                if (chartObj && chartObj.chart) {
                    try {
                        chartObj.chart.remove();
                        console.log('[InstrumentAnalysisView] ✅ Chart removed:', chartId);
                    } catch (e) {
                        console.warn('[InstrumentAnalysisView] Error removing chart:', chartId, e);
                    }
                }
                delete separateChartsRef.current[chartId];
            }
        });
        
        // Clear series from charts that still exist
        Object.entries(separateChartsRef.current).forEach(([chartId, chartObj]) => {
            if (chartObj && chartObj.series) {
                console.log('[InstrumentAnalysisView] Clearing series from chart:', chartId);
                Object.entries(chartObj.series).forEach(([seriesKey, series]) => {
                    if (series) {
                        try { 
                            chartObj.chart.removeSeries(series);
                            console.log('[InstrumentAnalysisView] Removed series:', seriesKey, 'from chart:', chartId);
                        } catch (e) {
                            console.warn('[InstrumentAnalysisView] Error removing series:', seriesKey, e);
                        }
                    }
                });
                chartObj.series = {};
            }
        });
        
        // Plot enabled indicators
        indicatorConfig.enabled.forEach((indicator) => {
            if (indicator.visible === false) {
                console.log('[InstrumentAnalysisView] Skipping invisible indicator:', indicator.id);
                return;
            }
            
            try {
                const chartType = indicator.chartType || 'overlay';
                console.log('[InstrumentAnalysisView] Plotting indicator:', indicator.id, 'type:', chartType);
                
                if (chartType === 'overlay') {
                    IndicatorPlotter.plotOverlay(indicator, candleData, mainChartRef.current, indicatorSeriesRef.current);
                    console.log('[InstrumentAnalysisView] ✅ Overlay indicator plotted:', indicator.id);
                } else if (chartType === 'separate') {
                    const container = separateChartContainersRef.current[indicator.id];
                    if (!container) {
                        console.warn('[InstrumentAnalysisView] ⚠️ No container found for:', indicator.id);
                        return;
                    }
                    
                    // Create chart if it doesn't exist
                    if (!separateChartsRef.current[indicator.id]) {
                        console.log('[InstrumentAnalysisView] Creating new chart for:', indicator.id);
                        console.log('[InstrumentAnalysisView] Container dimensions:', {
                            width: container.clientWidth,
                            height: container.clientHeight
                        });
                        
                        const chart = createChart(container, {
                            width: container.clientWidth,
                            height: 150,
                            layout: { background: { color: '#1e293b' }, textColor: '#94a3b8' },
                            grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
                            timeScale: { timeVisible: true, secondsVisible: false },
                        });
                        
                        separateChartsRef.current[indicator.id] = { chart, series: {} };
                        console.log('[InstrumentAnalysisView] ✅ Chart created for:', indicator.id);
                    } else {
                        console.log('[InstrumentAnalysisView] Reusing existing chart for:', indicator.id);
                    }
                    
                    const chartObj = separateChartsRef.current[indicator.id];
                    console.log('[InstrumentAnalysisView] Calling plotSeparate for:', indicator.id);
                    IndicatorPlotter.plotSeparate(indicator, candleData, chartObj.chart, chartObj.series);
                    console.log('[InstrumentAnalysisView] ✅ Separate indicator plotted:', indicator.id);
                }
            } catch (error) {
                console.error('[InstrumentAnalysisView] ❌ Error plotting indicator:', indicator.id, error);
                console.error('[InstrumentAnalysisView] Error stack:', error.stack);
            }
        });
        
        console.log('[InstrumentAnalysisView] ========== Update Complete ==========');
    }, [candleData, indicatorConfig]);

    const separateChartIndicators = indicatorConfig?.enabled.filter(ind => ind.visible !== false && ind.chartType === 'separate') || [];
    if (!instrument) return <div>Instrument not found</div>;
    return (<div className="instrument-analysis-view"><CandleDataUpdater instrumentKey={instrumentKey} /><AnalysisEngine instrumentKey={instrumentKey} analysisInterval={30000} /><div className="analysis-header"><h2>{instrument.name || instrument.symbol}</h2><div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><DaysSelector instrumentKey={instrumentKey} /><TimeframeSelector instrumentKey={instrumentKey} /></div></div><IndicatorManager instrumentKey={instrumentKey} /><div ref={mainChartContainerRef} className="chart-container" />{separateChartIndicators.map((indicator) => (<div key={indicator.id} className="separate-chart-container"><div className="separate-chart-header"><span className="chart-title">{indicator.name}</span></div><div ref={el => { if (el) separateChartContainersRef.current[indicator.id] = el; }} className="chart-container separate-chart" /></div>))}<AnalysisResults analysis={analysis} /></div>);
}
