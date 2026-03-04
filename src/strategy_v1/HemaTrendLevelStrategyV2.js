import { StrategyBase } from './StrategyBase';
import { ADX } from 'technicalindicators';

/**
 * HEMA Trend Level Strategy V2
 * Uses Hull EMA (HEMA) crossovers with support/resistance levels
 */
export class HemaTrendLevelStrategyV2 extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.fastLen = config.fastLen || 11;
        this.slowLen = config.slowLen || 21;
    }

    /**
     * Calculate EMA
     */
    ema(values, period) {
        const k = 2 / (period + 1);
        const emaArray = [values[0]];
        
        for (let i = 1; i < values.length; i++) {
            emaArray.push(values[i] * k + emaArray[i - 1] * (1 - k));
        }
        
        return emaArray;
    }

    /**
     * Calculate Hull EMA (HEMA)
     */
    hema(values, period) {
        const halfLength = Math.max(1, Math.round(period / 2));
        const sqrtLength = Math.max(1, Math.round(Math.sqrt(period)));

        const emaHalf = this.ema(values, halfLength);
        const emaFull = this.ema(values, period);

        const diff = emaHalf.map((val, i) => 2 * val - emaFull[i]);
        return this.ema(diff, sqrtLength);
    }

    /**
     * Apply HEMA indicators
     */
    applyHemaIndicators(candleData) {
        const closes = candleData.map(c => c.close);
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);

        const hemaFast = this.hema(closes, this.fastLen);
        const hemaSlow = this.hema(closes, this.slowLen);

        // Calculate trend
        const trend = hemaFast.map((fast, i) => fast > hemaSlow[i] ? 1 : -1);

        // Detect crossovers
        const bullishCross = [];
        const bearishCross = [];
        
        for (let i = 1; i < hemaFast.length; i++) {
            bullishCross.push(
                hemaFast[i] > hemaSlow[i] && hemaFast[i - 1] <= hemaSlow[i - 1]
            );
            bearishCross.push(
                hemaFast[i] < hemaSlow[i] && hemaFast[i - 1] >= hemaSlow[i - 1]
            );
        }

        // Track support/resistance levels
        let lastBullSupport = null;
        let lastBearResistance = null;
        const bullSupport = [];
        const bearResistance = [];
        const bullTest = [];
        const bearTest = [];

        for (let i = 0; i < bullishCross.length; i++) {
            if (bullishCross[i]) {
                lastBullSupport = lows[i + 1];
            }
            if (bearishCross[i]) {
                lastBearResistance = highs[i + 1];
            }

            bullSupport.push(lastBullSupport);
            bearResistance.push(lastBearResistance);

            // Test if price touched and bounced from support/resistance
            const idx = i + 1;
            bullTest.push(
                lastBullSupport !== null &&
                lows[idx] < lastBullSupport &&
                closes[idx] > lastBullSupport
            );
            bearTest.push(
                lastBearResistance !== null &&
                highs[idx] > lastBearResistance &&
                closes[idx] < lastBearResistance
            );
        }

        return {
            hemaFast,
            hemaSlow,
            trend,
            bullishCross,
            bearishCross,
            bullSupport,
            bearResistance,
            bullTest,
            bearTest
        };
    }

    /**
     * Analyze candle data
     */
    analyze(candleData) {
        if (candleData.length < Math.max(this.fastLen, this.slowLen) + 20) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const baseIndicators = this.applyIndicators(candleData);
        const hemaIndicators = this.applyHemaIndicators(candleData);

        const lastIdx = candleData.length - 1;
        const adxIdx = baseIndicators.adx.length - 1;

        const currentADX = baseIndicators.adx[adxIdx]?.adx || 0;
        const previousADX = baseIndicators.adx[adxIdx - 1]?.adx || 0;
        const isTrending = this.isTrending(currentADX, previousADX);

        const trendIdx = hemaIndicators.trend.length - 1;
        const crossIdx = hemaIndicators.bullishCross.length - 1;

        // Bullish cross signal
        if (hemaIndicators.bullishCross[crossIdx] && isTrending) {
            return this.createSignal(
                candleData,
                'BUY',
                `HEMA bullish cross: Fast(${this.fastLen}) > Slow(${this.slowLen})`,
                0.8
            );
        }

        // Bearish cross signal
        if (hemaIndicators.bearishCross[crossIdx] && isTrending) {
            return this.createSignal(
                candleData,
                'SELL',
                `HEMA bearish cross: Fast(${this.fastLen}) < Slow(${this.slowLen})`,
                0.8
            );
        }

        // Bull support test in uptrend
        if (hemaIndicators.trend[trendIdx] === 1 && hemaIndicators.bullTest[crossIdx] && isTrending) {
            return this.createSignal(
                candleData,
                'BUY',
                'Bull support test passed in uptrend',
                0.75
            );
        }

        // Bear resistance test in downtrend
        if (hemaIndicators.trend[trendIdx] === -1 && hemaIndicators.bearTest[crossIdx] && isTrending) {
            return this.createSignal(
                candleData,
                'SELL',
                'Bear resistance test passed in downtrend',
                0.75
            );
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
