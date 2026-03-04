import { ADX, ATR } from 'technicalindicators';

/**
 * Base Strategy Class
 * Provides common functionality for all strategies
 */
export class StrategyBase {
    constructor(config = {}) {
        this.adxPeriod = config.adxPeriod || 14;
        this.adxThreshold = config.adxThreshold || 20;
        this.atrPeriod = config.atrPeriod || 14;
        this.slTarget = config.slTarget || { sl: 0.5, target: 1.0 };
    }

    /**
     * Apply base indicators (ADX, ATR)
     */
    applyIndicators(candleData) {
        const closes = candleData.map(c => c.close);
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);

        const adxResult = ADX.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: this.adxPeriod
        });

        const atrResult = ATR.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: this.atrPeriod
        });

        return { adx: adxResult, atr: atrResult };
    }

    /**
     * Check if market is trending
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
