import { HemaTrendLevelStrategyV2 } from './HemaTrendLevelStrategyV2';

/**
 * HEMA Trend Level Confirmation Strategy
 * Extends HemaTrendLevelStrategyV2 with additional confirmation requirements
 */
export class HemaTrendLevelConfirmationStrategy extends HemaTrendLevelStrategyV2 {
    constructor(config = {}) {
        super(config);
        this.confirmationBars = config.confirmationBars || 2;
    }

    /**
     * Confirm bullish trend with price action and momentum
     */
    confirmBullishTrend(candleData, hemaFast) {
        const lastIdx = candleData.length - 1;
        const lastClose = candleData[lastIdx].close;
        const prevClose = candleData[lastIdx - 1].close;
        
        const lastHemaFast = hemaFast[hemaFast.length - 1];
        const prevHemaFast = hemaFast[hemaFast.length - 2];

        // Price confirmation: Close above fast HEMA
        const priceConfirm = lastClose > lastHemaFast;
        
        // Momentum confirmation: Fast HEMA rising
        const momentumConfirm = lastHemaFast > prevHemaFast;
        
        return priceConfirm && momentumConfirm;
    }

    /**
     * Confirm bearish trend with price action and momentum
     */
    confirmBearishTrend(candleData, hemaFast) {
        const lastIdx = candleData.length - 1;
        const lastClose = candleData[lastIdx].close;
        const prevClose = candleData[lastIdx - 1].close;
        
        const lastHemaFast = hemaFast[hemaFast.length - 1];
        const prevHemaFast = hemaFast[hemaFast.length - 2];

        // Price confirmation: Close below fast HEMA
        const priceConfirm = lastClose < lastHemaFast;
        
        // Momentum confirmation: Fast HEMA falling
        const momentumConfirm = lastHemaFast < prevHemaFast;
        
        return priceConfirm && momentumConfirm;
    }

    /**
     * Analyze with confirmation
     */
    analyze(candleData) {
        if (candleData.length < Math.max(this.fastLen, this.slowLen) + this.confirmationBars + 20) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const hemaIndicators = this.applyHemaIndicators(candleData);
        const lastIdx = candleData.length - 1;
        const crossIdx = hemaIndicators.bullishCross.length - 1;
        const trendIdx = hemaIndicators.trend.length - 1;

        // Bullish cross with confirmation
        if (hemaIndicators.bullishCross[crossIdx]) {
            if (this.confirmBullishTrend(candleData, hemaIndicators.hemaFast)) {
                return this.createSignal(
                    candleData,
                    'BUY',
                    `HEMA bullish cross with confirmation: Fast(${this.fastLen}) > Slow(${this.slowLen})`,
                    0.85
                );
            }
        }

        // Bearish cross with confirmation
        if (hemaIndicators.bearishCross[crossIdx]) {
            if (this.confirmBearishTrend(candleData, hemaIndicators.hemaFast)) {
                return this.createSignal(
                    candleData,
                    'SELL',
                    `HEMA bearish cross with confirmation: Fast(${this.fastLen}) < Slow(${this.slowLen})`,
                    0.85
                );
            }
        }

        // Bull support test with confirmation
        if (hemaIndicators.trend[trendIdx] === 1 && hemaIndicators.bullTest[crossIdx]) {
            const prevClose = candleData[lastIdx - 1].close;
            const lastClose = candleData[lastIdx].close;
            
            if (this.confirmBullishTrend(candleData, hemaIndicators.hemaFast) && lastClose > prevClose) {
                return this.createSignal(
                    candleData,
                    'BUY',
                    'Bull support test with confirmation in uptrend',
                    0.8
                );
            }
        }

        // Bear resistance test with confirmation
        if (hemaIndicators.trend[trendIdx] === -1 && hemaIndicators.bearTest[crossIdx]) {
            const prevClose = candleData[lastIdx - 1].close;
            const lastClose = candleData[lastIdx].close;
            
            if (this.confirmBearishTrend(candleData, hemaIndicators.hemaFast) && lastClose < prevClose) {
                return this.createSignal(
                    candleData,
                    'SELL',
                    'Bear resistance test with confirmation in downtrend',
                    0.8
                );
            }
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
