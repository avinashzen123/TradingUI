import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectDailyData } from '../store/dailyDataSlice';
import { ChartService } from '../services/ChartService';
import { StrategyService } from '../services/StrategyService';
import { createChart } from 'lightweight-charts';
import { EMA, RSI, Stochastic, ADX, ATR } from 'technicalindicators';
import { X, TrendingUp } from 'lucide-react';

const ChartModal = ({ instrumentKey, tradingSymbol, onClose }) => {
    const dailyData = useSelector(selectDailyData);
    const token = dailyData['UPSTOX_TOKEN'];

    const mainChartRef = useRef(null);
    const rsiChartRef = useRef(null);
    const stochChartRef = useRef(null);
    const adxChartRef = useRef(null);
    const atrChartRef = useRef(null);

    const [candles, setCandles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Indicator toggles
    const [showEMA, setShowEMA] = useState(true);
    const [showRSI, setShowRSI] = useState(false);
    const [showStoch, setShowStoch] = useState(false);
    const [showADX, setShowADX] = useState(false);
    const [showATR, setShowATR] = useState(false);

    // Store last 5 values for display
    const [indicatorValues, setIndicatorValues] = useState({
        rsi: [],
        stochK: [],
        stochD: [],
        adx: [],
        atr: []
    });

    useEffect(() => {
        if (!token || !instrumentKey) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const toDate = new Date().toISOString().split('T')[0];
                const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const response = await ChartService.getHistoricalCandles(token, instrumentKey, 'hours', 1, toDate, fromDate);
                const formattedData = ChartService.formatCandleData(response);

                if (formattedData.length === 0) {
                    setError('No chart data available for this instrument');
                } else {
                    setCandles(formattedData);
                }
            } catch (err) {
                setError(err.message || 'Failed to load chart data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, instrumentKey]);

    // Calculate all indicator values when candles load (always, regardless of toggle state)
    useEffect(() => {
        if (candles.length === 0) return;

        try {
            const closes = candles.map(c => c.close);
            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);

            // Calculate RSI
            const rsiValues = RSI.calculate({ period: 14, values: closes });

            // Calculate Stochastic
            const stochValues = Stochastic.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: 14,
                signalPeriod: 3
            });

            // Calculate ADX
            const adxValues = ADX.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: 14
            });

            // Calculate ATR
            const atrValues = ATR.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: 14
            });

            // Store last 5 values
            setIndicatorValues({
                rsi: rsiValues.slice(-5).map(v => v.toFixed(2)),
                stochK: stochValues.slice(-5).map(v => v.k.toFixed(2)),
                stochD: stochValues.slice(-5).map(v => v.d.toFixed(2)),
                adx: adxValues.slice(-5).map(v => v.adx.toFixed(2)),
                atr: atrValues.slice(-5).map(v => v.toFixed(2))
            });
        } catch (error) {
            console.error('Error calculating indicators:', error);
        }
    }, [candles]);

    // Strategy Analysis
    useEffect(() => {
        if (candles.length > 50 && tradingSymbol) {
            const result = StrategyService.analyzeNewOrder(candles, tradingSymbol);
            setAnalysisResult(result);
        }
    }, [candles, tradingSymbol]);

    // Main Chart with Candlesticks and EMA
    useEffect(() => {
        if (!mainChartRef.current || candles.length === 0) return;

        const chart = createChart(mainChartRef.current, {
            width: mainChartRef.current.clientWidth,
            height: 400,
            layout: {
                backgroundColor: '#0f172a',
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderUpColor: '#10b981',
            borderDownColor: '#ef4444',
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        candleSeries.setData(candles);

        if (showEMA && candles.length > 50) {
            const closes = candles.map(c => c.close);

            const ema9Values = EMA.calculate({ period: 9, values: closes });
            const ema9Data = ema9Values.map((value, i) => ({
                time: candles[i + (closes.length - ema9Values.length)].time,
                value
            }));
            const ema9Series = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
            ema9Series.setData(ema9Data);

            const ema21Values = EMA.calculate({ period: 21, values: closes });
            const ema21Data = ema21Values.map((value, i) => ({
                time: candles[i + (closes.length - ema21Values.length)].time,
                value
            }));
            const ema21Series = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
            ema21Series.setData(ema21Data);
        }

        const handleResize = () => {
            chart.applyOptions({ width: mainChartRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, showEMA]);

    // RSI Chart
    useEffect(() => {
        if (!showRSI || !rsiChartRef.current || candles.length === 0) return;

        const chart = createChart(rsiChartRef.current, {
            width: rsiChartRef.current.clientWidth,
            height: 150,
            layout: {
                backgroundColor: '#0f172a',
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const closes = candles.map(c => c.close);
        const rsiValues = RSI.calculate({ period: 14, values: closes });
        const rsiData = rsiValues.map((value, i) => ({
            time: candles[i + (closes.length - rsiValues.length)].time,
            value
        }));

        const rsiSeries = chart.addLineSeries({ color: '#a855f7', lineWidth: 2 });
        rsiSeries.setData(rsiData);

        // Add reference lines at 30 and 70
        const refLine70 = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, lineStyle: 2 });
        refLine70.setData(rsiData.map(d => ({ time: d.time, value: 70 })));

        const refLine30 = chart.addLineSeries({ color: '#10b981', lineWidth: 1, lineStyle: 2 });
        refLine30.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

        const handleResize = () => {
            chart.applyOptions({ width: rsiChartRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, showRSI]);

    // Stochastic Chart
    useEffect(() => {
        if (!showStoch || !stochChartRef.current || candles.length === 0) return;

        const chart = createChart(stochChartRef.current, {
            width: stochChartRef.current.clientWidth,
            height: 150,
            layout: {
                backgroundColor: '#0f172a',
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const stochInput = {
            high: candles.map(c => c.high),
            low: candles.map(c => c.low),
            close: candles.map(c => c.close),
            period: 14,
            signalPeriod: 3
        };

        const stochValues = Stochastic.calculate(stochInput);
        const kData = stochValues.map((value, i) => ({
            time: candles[i + (candles.length - stochValues.length)].time,
            value: value.k
        }));
        const dData = stochValues.map((value, i) => ({
            time: candles[i + (candles.length - stochValues.length)].time,
            value: value.d
        }));

        // Store last 5 Stochastic values
        setIndicatorValues(prev => ({
            ...prev,
            stochK: stochValues.slice(-5).map(v => v.k.toFixed(2)),
            stochD: stochValues.slice(-5).map(v => v.d.toFixed(2))
        }));

        const kSeries = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
        kSeries.setData(kData);

        const dSeries = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
        dSeries.setData(dData);

        const handleResize = () => {
            chart.applyOptions({ width: stochChartRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, showStoch]);

    // ADX Chart
    useEffect(() => {
        if (!showADX || !adxChartRef.current || candles.length === 0) return;

        const chart = createChart(adxChartRef.current, {
            width: adxChartRef.current.clientWidth,
            height: 150,
            layout: {
                backgroundColor: '#0f172a',
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const adxInput = {
            high: candles.map(c => c.high),
            low: candles.map(c => c.low),
            close: candles.map(c => c.close),
            period: 14
        };

        const adxValues = ADX.calculate(adxInput);
        const adxData = adxValues.map((value, i) => ({
            time: candles[i + (candles.length - adxValues.length)].time,
            value: value.adx
        }));

        // Store last 5 ADX values
        setIndicatorValues(prev => ({
            ...prev,
            adx: adxValues.slice(-5).map(v => v.adx.toFixed(2))
        }));

        const adxSeries = chart.addLineSeries({ color: '#ec4899', lineWidth: 2 });
        adxSeries.setData(adxData);

        const handleResize = () => {
            chart.applyOptions({ width: adxChartRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, showADX]);

    // ATR Chart
    useEffect(() => {
        if (!showATR || !atrChartRef.current || candles.length === 0) return;

        const chart = createChart(atrChartRef.current, {
            width: atrChartRef.current.clientWidth,
            height: 150,
            layout: {
                backgroundColor: '#0f172a',
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        const atrInput = {
            high: candles.map(c => c.high),
            low: candles.map(c => c.low),
            close: candles.map(c => c.close),
            period: 14
        };

        const atrValues = ATR.calculate(atrInput);
        const atrData = atrValues.map((value, i) => ({
            time: candles[i + (candles.length - atrValues.length)].time,
            value: value
        }));

        const atrSeries = chart.addLineSeries({ color: '#10b981', lineWidth: 2 });
        atrSeries.setData(atrData);

        const handleResize = () => {
            chart.applyOptions({ width: atrChartRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, showATR]);

    if (!token) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <p>Token not found. Please upload UPSTOX_TOKEN in Settings.</p>
                    <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '2rem'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    maxWidth: '1200px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} className="text-secondary" />
                        {tradingSymbol}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Strategy Analysis Result */}
                {analysisResult && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: analysisResult.action === 'BUY' ? 'rgba(16, 185, 129, 0.2)' :
                            analysisResult.action === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${analysisResult.action === 'BUY' ? '#10b981' :
                            analysisResult.action === 'SELL' ? '#ef4444' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <span style={{
                                fontWeight: 'bold', marginRight: '0.5rem',
                                color: analysisResult.action === 'BUY' ? '#10b981' :
                                    analysisResult.action === 'SELL' ? '#ef4444' : 'var(--text-secondary)'
                            }}>
                                {analysisResult.action}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {analysisResult.reason}
                            </span>
                        </div>
                    </div>
                )}

                {/* Indicator Toggles */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${showEMA ? 'btn-primary' : ''}`}
                        onClick={() => setShowEMA(!showEMA)}
                        style={{ border: !showEMA ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}
                    >
                        EMA (9, 21)
                    </button>
                    <button
                        className={`btn ${showRSI ? 'btn-primary' : ''}`}
                        onClick={() => setShowRSI(!showRSI)}
                        style={{ border: !showRSI ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}
                    >
                        RSI (14)
                    </button>
                    <button
                        className={`btn ${showStoch ? 'btn-primary' : ''}`}
                        onClick={() => setShowStoch(!showStoch)}
                        style={{ border: !showStoch ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}
                    >
                        Stochastic
                    </button>
                    <button
                        className={`btn ${showADX ? 'btn-primary' : ''}`}
                        onClick={() => setShowADX(!showADX)}
                        style={{ border: !showADX ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}
                    >
                        ADX (14)
                    </button>
                    <button
                        className={`btn ${showATR ? 'btn-primary' : ''}`}
                        onClick={() => setShowATR(!showATR)}
                        style={{ border: !showATR ? '1px solid var(--border-color)' : 'none', fontSize: '0.875rem' }}
                    >
                        ATR (14)
                    </button>
                </div>

                {/* Indicator Values Display - Always Visible */}
                {candles.length > 0 && (indicatorValues.rsi.length > 0 || indicatorValues.stochK.length > 0 || indicatorValues.adx.length > 0) && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-sm)'
                    }}>
                        {indicatorValues.rsi.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>RSI (Last 5)</div>
                                <div style={{ fontSize: '0.875rem', color: '#a855f7', fontFamily: 'monospace' }}>
                                    {indicatorValues.rsi.join(' | ')}
                                </div>
                            </div>
                        )}
                        {indicatorValues.stochK.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Stochastic %K (Last 5)</div>
                                <div style={{ fontSize: '0.875rem', color: '#3b82f6', fontFamily: 'monospace' }}>
                                    {indicatorValues.stochK.join(' | ')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '0.25rem' }}>Stochastic %D (Last 5)</div>
                                <div style={{ fontSize: '0.875rem', color: '#f59e0b', fontFamily: 'monospace' }}>
                                    {indicatorValues.stochD.join(' | ')}
                                </div>
                            </div>
                        )}
                        {indicatorValues.adx.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ADX (Last 5)</div>
                                <div style={{ fontSize: '0.875rem', color: '#ec4899', fontFamily: 'monospace' }}>
                                    {indicatorValues.adx.join(' | ')}
                                </div>
                            </div>
                        )}
                        {indicatorValues.atr.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ATR (Last 5)</div>
                                <div style={{ fontSize: '0.875rem', color: '#10b981', fontFamily: 'monospace' }}>
                                    {indicatorValues.atr.join(' | ')}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Loading/Error States */}
                {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading chart data...</div>}
                {error && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger-color)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                {/* Charts Container */}
                {!loading && !error && candles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Main Candlestick Chart */}
                        <div ref={mainChartRef} style={{ width: '100%', height: '400px' }} />

                        {/* RSI Chart */}
                        {showRSI && (
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>RSI (14)</div>
                                <div ref={rsiChartRef} style={{ width: '100%', height: '150px' }} />
                            </div>
                        )}

                        {/* Stochastic Chart */}
                        {showStoch && (
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Stochastic (%K, %D)</div>
                                <div ref={stochChartRef} style={{ width: '100%', height: '150px' }} />
                            </div>
                        )}

                        {/* ADX Chart */}
                        {showADX && (
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>ADX (14)</div>
                                <div ref={adxChartRef} style={{ width: '100%', height: '150px' }} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartModal;
