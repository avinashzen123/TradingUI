import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectInstrumentCandleData,
    selectInstrument,
    updateTechnicalIndicators,
    addPattern,
    addSignal,
    addAlert,
} from '../store/instrumentAnalysisSlice';
import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';
import { analyzeWithStrategies } from '../strategy_v1';

/**
 * Component that periodically analyzes candle data and updates analysis results
 * Runs technical indicators, pattern detection, and generates signals using strategies
 */
export default function AnalysisEngine({ instrumentKey, analysisInterval = 30000 }) {
    const dispatch = useDispatch();
    const candleData = useSelector(selectInstrumentCandleData(instrumentKey));
    const instrument = useSelector(selectInstrument(instrumentKey));
    const lastAnalysisRef = useRef(0);
    const lastCandleCountRef = useRef(0);

    useEffect(() => {
        if (!instrumentKey || !candleData || candleData.length < 50) {
            return; // Need at least 50 candles for meaningful analysis
        }

        // Only run if candle count changed or enough time has passed
        const now = Date.now();
        const candleCount = candleData.length;
        const timeSinceLastAnalysis = now - lastAnalysisRef.current;
        const candleCountChanged = candleCount !== lastCandleCountRef.current;

        if (!candleCountChanged && timeSinceLastAnalysis < analysisInterval) {
            return; // Skip this run
        }

        const runAnalysis = () => {
            try {
                lastAnalysisRef.current = Date.now();
                lastCandleCountRef.current = candleData.length;

                const closes = candleData.map(c => c.close);

                // Calculate technical indicators
                const rsi = RSI.calculate({ values: closes, period: 14 });
                const sma20 = SMA.calculate({ values: closes, period: 20 });
                const sma50 = SMA.calculate({ values: closes, period: 50 });
                const ema12 = EMA.calculate({ values: closes, period: 12 });
                const macd = MACD.calculate({
                    values: closes,
                    fastPeriod: 12,
                    slowPeriod: 26,
                    signalPeriod: 9,
                    SimpleMAOscillator: false,
                    SimpleMASignal: false,
                });
                const bb = BollingerBands.calculate({
                    values: closes,
                    period: 20,
                    stdDev: 2,
                });

                // Get latest values
                const latestRSI = rsi[rsi.length - 1];
                const latestMACD = macd[macd.length - 1];
                const latestBB = bb[bb.length - 1];
                const latestSMA20 = sma20[sma20.length - 1];
                const latestSMA50 = sma50[sma50.length - 1];
                const latestEMA12 = ema12[ema12.length - 1];
                const currentPrice = closes[closes.length - 1];

                // Update technical indicators in store
                dispatch(updateTechnicalIndicators({
                    instrumentKey,
                    indicators: {
                        rsi: latestRSI,
                        macd: latestMACD,
                        bollingerBands: latestBB,
                        sma20: latestSMA20,
                        sma50: latestSMA50,
                        ema12: latestEMA12,
                        currentPrice,
                    },
                }));

                // Pattern detection
                detectPatterns(candleData, dispatch, instrumentKey);

                // Run strategy-based analysis
                const instrumentName = instrument?.instrument_type || 'DEFAULT';
                const strategySignal = analyzeWithStrategies(instrumentName, candleData);

                if (strategySignal && strategySignal.signal !== 'NONE') {
                    // Add signal from strategy
                    dispatch(addSignal({
                        instrumentKey,
                        signal: {
                            type: strategySignal.type,
                            strength: strategySignal.confidence > 0.8 ? 'STRONG' : 'MODERATE',
                            reason: strategySignal.message,
                            price: strategySignal.price,
                            stopLoss: strategySignal.stopLoss,
                            target: strategySignal.target,
                            strategy: strategySignal.strategy,
                        },
                    }));

                    // Create alert for strategy signal
                    dispatch(addAlert({
                        instrumentKey,
                        alert: {
                            type: 'signal',
                            severity: strategySignal.type === 'BUY' ? 'success' : 'warning',
                            message: `${strategySignal.type} Signal: ${strategySignal.message}`,
                        },
                    }));
                }

            } catch (error) {
                console.error('Analysis error:', error);
            }
        };

        runAnalysis();

        // Set up periodic analysis
        const interval = setInterval(runAnalysis, analysisInterval);

        return () => clearInterval(interval);
    }, [instrumentKey, candleData, analysisInterval, dispatch, instrument]);

    return null; // This component doesn't render anything
}

// Pattern detection logic
function detectPatterns(candleData, dispatch, instrumentKey) {
    if (candleData.length < 3) return;

    const last3 = candleData.slice(-3);
    const [, prev1, current] = last3;

    // Bullish Engulfing Pattern
    if (
        prev1.close < prev1.open && // Previous candle is bearish
        current.close > current.open && // Current candle is bullish
        current.open < prev1.close && // Current opens below previous close
        current.close > prev1.open // Current closes above previous open
    ) {
        dispatch(addPattern({
            instrumentKey,
            pattern: {
                type: 'bullish_engulfing',
                confidence: 0.75,
                description: 'Bullish reversal pattern detected',
            },
        }));

        dispatch(addAlert({
            instrumentKey,
            alert: {
                type: 'pattern',
                severity: 'info',
                message: 'Bullish Engulfing pattern detected',
            },
        }));
    }

    // Bearish Engulfing Pattern
    if (
        prev1.close > prev1.open && // Previous candle is bullish
        current.close < current.open && // Current candle is bearish
        current.open > prev1.close && // Current opens above previous close
        current.close < prev1.open // Current closes below previous open
    ) {
        dispatch(addPattern({
            instrumentKey,
            pattern: {
                type: 'bearish_engulfing',
                confidence: 0.75,
                description: 'Bearish reversal pattern detected',
            },
        }));

        dispatch(addAlert({
            instrumentKey,
            alert: {
                type: 'pattern',
                severity: 'warning',
                message: 'Bearish Engulfing pattern detected',
            },
        }));
    }
}
