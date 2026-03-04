import { SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ADX, ATR } from 'technicalindicators';

/**
 * Base Strategy Class
 * Matches Python StrategyBase.py
 */
export class StrategyBase {
    constructor(config = {}) {
        this.adxPeriod = config.adxPeriod || 14;
        this.adxThreshold = config.adxThreshold || 20;
        this.atrPeriod = config.atrPeriod || 14;
        this.slTarget = config.slTarget || { sl: 0.5, target: 1.0 }; // Stop loss and target multipliers
    }

    /**
     * Apply indicators to candle data
     * Override in child classes to add specific indicators
     */
    applyIndicators(candleData) {
        const closes = candleData.map(c => c.close);
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);

        // Calculate ADX
        const adxResult = ADX.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: this.adxPeriod
        });

        // Calculate ATR
        const atrResult = ATR.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: this.atrPeriod
        });

        return { adx: adxResult, atr: atrResult };
    }

    /**
     * Check if market is trending based on ADX
     */
    isTrending(currentADX, previousADX) {
        return currentADX >= this.adxThreshold && currentADX >= previousADX;
    }

    /**
     * Calculate stop loss and target
     */
    calculateSLTarget(currentPrice, atr, eventType) {
        if (eventType === 'BUY') {
            return {
                stopLoss: currentPrice - (this.slTarget.sl * atr),
                target: currentPrice + (this.slTarget.target * atr)
            };
        } else if (eventType === 'SELL') {
            return {
                stopLoss: currentPrice + (this.slTarget.sl * atr),
                target: currentPrice - (this.slTarget.target * atr)
            };
        }
        return { stopLoss: 0, target: 0 };
    }

    /**
     * Round prices based on value
     */
    roundPrice(price) {
        if (price < 100) return parseFloat(price.toFixed(2));
        if (price < 1000) return parseFloat(price.toFixed(1));
        return Math.round(price);
    }

    /**
     * Main analyze method - override in child classes
     */
    analyze(candleData) {
        return { signal: 'NONE', message: '', confidence: 0 };
    }

    /**
     * Create trade signal
     */
    createSignal(candleData, eventType, message, confidence = 0.75) {
        const currentCandle = candleData[candleData.length - 1];
        const baseIndicators = this.applyIndicators(candleData);
        const atr = baseIndicators.atr[baseIndicators.atr.length - 1];
        
        const { stopLoss, target } = this.calculateSLTarget(currentCandle.close, atr, eventType);

        return {
            type: eventType,
            price: this.roundPrice(currentCandle.close),
            stopLoss: this.roundPrice(stopLoss),
            target: this.roundPrice(target),
            trailingSL: this.roundPrice(Math.abs(stopLoss - currentCandle.close)),
            message,
            confidence,
            timestamp: currentCandle.time,
            strategy: this.constructor.name
        };
    }
}

/**
 * RSI Swing Strategy
 * Matches Python RSISwingStrategy.py
 */
export class RSISwingStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.rsiPeriod = config.rsiPeriod || 14;
        this.stochPeriod = config.stochPeriod || 14;
        this.stochInput = config.stochInput || 'rsi'; // 'rsi' or 'close'
        this.shortEmaPeriod = config.shortEmaPeriod || 11;
        this.longEmaPeriod = config.longEmaPeriod || 26;
        this.rsiOversold = config.rsiOversold || 40;
        this.rsiOverbought = config.rsiOverbought || 60;
        this.stochDiffMin = 2;
        this.stochDiffMax = 4;
    }

    applyIndicators(candleData) {
        const base = super.applyIndicators(candleData);
        const closes = candleData.map(c => c.close);
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);

        // RSI
        const rsiValues = RSI.calculate({ values: closes, period: this.rsiPeriod });

        // Stochastic (on RSI or close)
        let stochK, stochD;
        if (this.stochInput === 'rsi') {
            const stochRSI = Stochastic.calculate({
                high: rsiValues,
                low: rsiValues,
                close: rsiValues,
                period: this.stochPeriod,
                signalPeriod: 3
            });
            stochK = stochRSI.map(s => s.k);
            stochD = stochRSI.map(s => s.d);
        } else {
            const stoch = Stochastic.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: this.stochPeriod,
                signalPeriod: 3
            });
            stochK = stoch.map(s => s.k);
            stochD = stoch.map(s => s.d);
        }

        // EMAs
        const shortEma = EMA.calculate({ values: closes, period: this.shortEmaPeriod });
        const longEma = EMA.calculate({ values: closes, period: this.longEmaPeriod });

        return { ...base, rsi: rsiValues, stochK, stochD, shortEma, longEma };
    }

    analyze(candleData) {
        if (candleData.length < 50) {
            return { signal: 'NONE', message: 'Insufficient data', confidence: 0 };
        }

        const indicators = this.applyIndicators(candleData);
        const currentIdx = indicators.rsi.length - 1;
        const prevIdx = currentIdx - 1;

        const current = {
            rsi: indicators.rsi[currentIdx],
            stochK: indicators.stochK[currentIdx],
            stochD: indicators.stochD[currentIdx],
            shortEma: indicators.shortEma[currentIdx],
            longEma: indicators.longEma[currentIdx],
            adx: indicators.adx[currentIdx]
        };

        const previous = {
            rsi: indicators.rsi[prevIdx],
            stochK: indicators.stochK[prevIdx],
            stochD: indicators.stochD[prevIdx],
            shortEma: indicators.shortEma[prevIdx],
            longEma: indicators.longEma[prevIdx],
            adx: indicators.adx[prevIdx]
        };

        // Check if short EMA is consistently above/below long EMA (last 5 candles)
        const last5Short = indicators.shortEma.slice(-5);
        const last5Long = indicators.longEma.slice(-5);
        const shortAboveLong = last5Short.every((val, idx) => val > last5Long[idx]);
        const shortBelowLong = last5Short.every((val, idx) => val < last5Long[idx]);

        const isTrending = current.adx >= previous.adx && previous.adx >= this.adxThreshold;

        // BUY Signal
        if (shortAboveLong && isTrending) {
            const isRsiOverbought = current.rsi > previous.rsi && previous.rsi > this.rsiOverbought;
            const stochDiff = Math.abs(current.stochD - current.stochK);
            const isStochBullish = (
                current.stochK > current.stochD &&
                current.stochD > 20 &&
                current.stochK > 20 &&
                stochDiff > this.stochDiffMin &&
                stochDiff < this.stochDiffMax
            );

            if (isRsiOverbought && isStochBullish) {
                const message = `RSI Swing BUY: EMA(${this.shortEmaPeriod}) > EMA(${this.longEmaPeriod}), ADX ${current.adx.toFixed(1)}, RSI ${current.rsi.toFixed(1)}, Stoch K/D ${current.stochK.toFixed(1)}/${current.stochD.toFixed(1)}`;
                return this.createSignal(candleData, 'BUY', message, 0.8);
            }
        }

        // SELL Signal
        if (shortBelowLong && isTrending) {
            const isRsiOversold = current.rsi < previous.rsi && previous.rsi < this.rsiOversold;
            const stochDiff = Math.abs(current.stochD - current.stochK);
            const isStochBearish = (
                current.stochK < current.stochD &&
                current.stochD < 80 &&
                current.stochK < 80 &&
                stochDiff > this.stochDiffMin &&
                stochDiff < this.stochDiffMax
            );

            if (isRsiOversold && isStochBearish) {
                const message = `RSI Swing SELL: EMA(${this.shortEmaPeriod}) < EMA(${this.longEmaPeriod}), ADX ${current.adx.toFixed(1)}, RSI ${current.rsi.toFixed(1)}, Stoch K/D ${current.stochK.toFixed(1)}/${current.stochD.toFixed(1)}`;
                return this.createSignal(candleData, 'SELL', message, 0.8);
            }
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}

/**
 * EMA Crossover Strategy
 * Matches Python EMACrossOverStrategy.py
 */
export class EMACrossoverStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.shortPeriod = config.shortPeriod || 11;
        this.longPeriod = config.longPeriod || 21;
        this.requireConfirmation = config.requireConfirmation !== false;
        this.atrMultiplier = config.atrMultiplier || 1.0;
    }

    applyIndicators(candleData) {
        const base = super.applyIndicators(candleData);
        const closes = candleData.map(c => c.close);

        const shortEma = EMA.calculate({ values: closes, period: this.shortPeriod });
        const longEma = EMA.calculate({ values: closes, period: this.longPeriod });

        return { ...base, shortEma, longEma };
    }

    analyze(candleData) {
        if (candleData.length < 50) {
            return { signal: 'NONE', message: 'Insufficient data', confidence: 0 };
        }

        const indicators = this.applyIndicators(candleData);
        const currentIdx = indicators.shortEma.length - 1;
        const prevIdx = currentIdx - 1;

        const currentCandle = candleData[candleData.length - 1];
        const current = {
            shortEma: indicators.shortEma[currentIdx],
            longEma: indicators.longEma[currentIdx],
            adx: indicators.adx[currentIdx],
            atr: indicators.atr[currentIdx]
        };

        const previous = {
            shortEma: indicators.shortEma[prevIdx],
            longEma: indicators.longEma[prevIdx]
        };

        const candleRange = Math.abs(currentCandle.high - currentCandle.low);
        const atrThreshold = current.atr * this.atrMultiplier;

        // BUY Signal: Short EMA crosses above Long EMA
        const bullishCrossover = current.shortEma > current.longEma && previous.shortEma <= previous.longEma;
        if (bullishCrossover) {
            if (current.adx < this.adxThreshold) return { signal: 'NONE', message: 'ADX too low', confidence: 0 };
            if (candleRange > atrThreshold) return { signal: 'NONE', message: 'Candle range too large', confidence: 0 };
            if (this.requireConfirmation && currentCandle.close < current.shortEma) {
                return { signal: 'NONE', message: 'No confirmation', confidence: 0 };
            }

            const message = `EMA Crossover BUY: EMA(${this.shortPeriod}) crossed above EMA(${this.longPeriod}), ADX ${current.adx.toFixed(1)}`;
            return this.createSignal(candleData, 'BUY', message, 0.85);
        }

        // SELL Signal: Short EMA crosses below Long EMA
        const bearishCrossover = current.shortEma < current.longEma && previous.shortEma >= previous.longEma;
        if (bearishCrossover) {
            if (current.adx < this.adxThreshold) return { signal: 'NONE', message: 'ADX too low', confidence: 0 };
            if (candleRange > atrThreshold) return { signal: 'NONE', message: 'Candle range too large', confidence: 0 };
            if (this.requireConfirmation && currentCandle.close > current.shortEma) {
                return { signal: 'NONE', message: 'No confirmation', confidence: 0 };
            }

            const message = `EMA Crossover SELL: EMA(${this.shortPeriod}) crossed below EMA(${this.longPeriod}), ADX ${current.adx.toFixed(1)}`;
            return this.createSignal(candleData, 'SELL', message, 0.85);
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}

/**
 * Strategy Configuration per Instrument
 * Matches Python InstrumentStrategEnum.py
 */
export const InstrumentStrategyConfig = {
    DEFAULT: [
        new RSISwingStrategy(),
        new EMACrossoverStrategy()
    ],
    
    GOLDM: [
        new RSISwingStrategy({ 
            rsiPeriod: 14, 
            stochPeriod: 14, 
            stochInput: 'rsi',
            slTarget: { sl: 1.0, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 21,
            slTarget: { sl: 0.5, target: 2.0 }
        })
    ],

    NIFTY: [
        new RSISwingStrategy({ 
            rsiPeriod: 28, 
            stochPeriod: 28,
            slTarget: { sl: 0.5, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 21,
            slTarget: { sl: 1.0, target: 2.0 }
        })
    ],

    BANKNIFTY: [
        new RSISwingStrategy({ 
            rsiPeriod: 14, 
            stochPeriod: 14, 
            stochInput: 'rsi',
            slTarget: { sl: 0.5, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 31,
            slTarget: { sl: 1.0, target: 2.0 }
        })
    ],

    // Add more instrument configurations as needed
};

/**
 * Get strategies for an instrument
 */
export function getStrategiesForInstrument(instrumentName) {
    return InstrumentStrategyConfig[instrumentName] || InstrumentStrategyConfig.DEFAULT;
}

/**
 * Analyze candle data with all strategies for an instrument
 * Returns the first valid signal found
 */
export function analyzeWithStrategies(instrumentName, candleData) {
    if (!candleData || candleData.length < 50) {
        return null;
    }

    const strategies = getStrategiesForInstrument(instrumentName);

    for (const strategy of strategies) {
        try {
            const result = strategy.analyze(candleData);
            if (result.signal !== 'NONE') {
                console.log(`[${strategy.constructor.name}] Signal: ${result.signal} - ${result.message}`);
                return result;
            }
        } catch (error) {
            console.error(`Error in strategy ${strategy.constructor.name}:`, error);
        }
    }

    return null;
}
