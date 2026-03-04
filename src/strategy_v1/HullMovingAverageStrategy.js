import { StrategyBase } from './StrategyBase';
import { calculateHMA } from '../utils/customIndicators';

/**
 * Hull Moving Average Strategy
 * Uses HMA crossovers with ADX trend confirmation
 */
export class HullMovingAverageStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.fastPeriod = config.fastPeriod || 9;
        this.slowPeriod = config.slowPeriod || 21;
    }

    /**
     * Analyze candle data
     */
    analyze(candleData) {
        if (candleData.length < this.slowPeriod + 20) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const closes = candleData.map(c => c.close);
        const baseIndicators = this.applyIndicators(candleData);

        // Calculate HMA using custom implementation
        const hmaFast = calculateHMA(closes, this.fastPeriod);
        const hmaSlow = calculateHMA(closes, this.slowPeriod);

        if (!hmaFast.length || !hmaSlow.length) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const lastIdx = hmaFast.length - 1;
        const adxIdx = baseIndicators.adx.length - 1;

        const currentHmaFast = hmaFast[lastIdx];
        const currentHmaSlow = hmaSlow[lastIdx];
        const prevHmaFast = hmaFast[lastIdx - 1];
        const prevHmaSlow = hmaSlow[lastIdx - 1];

        const currentADX = baseIndicators.adx[adxIdx]?.adx || 0;
        const previousADX = baseIndicators.adx[adxIdx - 1]?.adx || 0;

        // Buy signal: HMA fast crosses above slow with trending ADX
        if (
            currentHmaFast > currentHmaSlow &&
            prevHmaFast <= prevHmaSlow &&
            this.isTrending(currentADX, previousADX)
        ) {
            return this.createSignal(
                candleData,
                'BUY',
                `Hull Moving Average Crossover Buy Signal: Fast(${this.fastPeriod}) > Slow(${this.slowPeriod})`,
                0.8
            );
        }

        // Sell signal: HMA fast crosses below slow with trending ADX
        if (
            currentHmaFast < currentHmaSlow &&
            prevHmaFast >= prevHmaSlow &&
            this.isTrending(currentADX, previousADX)
        ) {
            return this.createSignal(
                candleData,
                'SELL',
                `Hull Moving Average Crossover Sell Signal: Fast(${this.fastPeriod}) < Slow(${this.slowPeriod})`,
                0.8
            );
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
