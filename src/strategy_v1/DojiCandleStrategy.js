import { StrategyBase } from './StrategyBase';

/**
 * Doji Candle Strategy
 * Identifies doji candles followed by strong directional moves
 */
export class DojiCandleStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.dojiThreshold = config.dojiThreshold || 0.05; // 5% body to range ratio
    }

    /**
     * Check if candle is a doji
     */
    isDoji(candle, threshold = 0.05) {
        const body = Math.abs(candle.close - candle.open);
        const range = candle.high - candle.low;
        
        if (range === 0) return false;
        
        const bodyRatio = body / range;
        return bodyRatio <= threshold;
    }

    /**
     * Check if candle is bullish
     */
    isBullish(candle) {
        return candle.close > candle.open;
    }

    /**
     * Check if candle is bearish
     */
    isBearish(candle) {
        return candle.close < candle.open;
    }

    /**
     * Analyze candle data
     */
    analyze(candleData) {
        if (candleData.length < 3 + this.atrPeriod) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const baseIndicators = this.applyIndicators(candleData);
        const atrIdx = baseIndicators.atr.length - 1;
        const currentATR = baseIndicators.atr[atrIdx];

        const currentCandle = candleData[candleData.length - 1];
        const prevCandle = candleData[candleData.length - 2];
        const pprevCandle = candleData[candleData.length - 3];

        // Check if previous candle is a doji
        if (this.isDoji(prevCandle, this.dojiThreshold)) {
            const currentBody = Math.abs(currentCandle.close - currentCandle.open);

            // Bullish signal: Doji followed by bullish candle
            if (this.isBullish(currentCandle)) {
                const bodyInRange = currentBody > currentATR * 0.5 && currentBody < currentATR;
                
                if (bodyInRange) {
                    return this.createSignal(
                        candleData,
                        'BUY',
                        'Doji Candle followed by bullish move',
                        0.7
                    );
                }
            }

            // Bearish signal: Doji followed by bearish candle
            if (this.isBearish(currentCandle)) {
                const bodyInRange = currentBody > currentATR * 0.5 && currentBody < currentATR;
                
                if (bodyInRange) {
                    return this.createSignal(
                        candleData,
                        'SELL',
                        'Doji Candle followed by bearish move',
                        0.7
                    );
                }
            }
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
