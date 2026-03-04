import { StrategyBase } from './StrategyBase';
import { RSI, Stochastic, EMA } from 'technicalindicators';

/**
 * Trend Reversal Strategy
 * Uses EMA trend, RSI, and Stochastic to identify trend reversals
 */
export class TrendReversalStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.shortEmaPeriod = config.shortEmaPeriod || 11;
        this.longEmaPeriod = config.longEmaPeriod || 26;
        this.rsiPeriod = config.rsiPeriod || 14;
        this.stochPeriod = config.stochPeriod || 14;
        this.stochDiffMin = config.stochDiffMin || 2;
        this.stochDiffMax = config.stochDiffMax || 4;
        this.rsiBuyBelow = config.rsiBuyBelow || 60;
        this.rsiSellAbove = config.rsiSellAbove || 40;
        this.stochSellBelow = config.stochSellBelow || 80;
        this.stochBuyAbove = config.stochBuyAbove || 20;
    }

    /**
     * Analyze candle data
     */
    analyze(candleData) {
        const minLength = Math.max(this.shortEmaPeriod, this.longEmaPeriod, this.rsiPeriod, this.stochPeriod) + 20;
        
        if (candleData.length < minLength) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const closes = candleData.map(c => c.close);
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);

        // Calculate EMAs
        const shortEma = EMA.calculate({
            values: closes,
            period: this.shortEmaPeriod
        });

        const longEma = EMA.calculate({
            values: closes,
            period: this.longEmaPeriod
        });

        // Calculate RSI
        const rsiValues = RSI.calculate({
            values: closes,
            period: this.rsiPeriod
        });

        // Calculate Stochastic
        const stochValues = Stochastic.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: this.stochPeriod,
            signalPeriod: 3
        });

        if (!shortEma.length || !longEma.length || !rsiValues.length || !stochValues.length) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        // Check last 5 EMA values for trend
        const last5Short = shortEma.slice(-5);
        const last5Long = longEma.slice(-5);
        
        const shortAboveLong = last5Short.every((val, i) => val > last5Long[i]);
        const shortBelowLong = last5Short.every((val, i) => val < last5Long[i]);

        const lastIdx = stochValues.length - 1;
        const currentRSI = rsiValues[rsiValues.length - 1];
        const currentStochK = stochValues[lastIdx].k;
        const currentStochD = stochValues[lastIdx].d;

        const stochDiff = Math.abs(currentStochD - currentStochK);

        // SELL Signal: Short EMA above Long, RSI > threshold, Stoch K < D
        if (
            shortAboveLong &&
            currentRSI > this.rsiSellAbove &&
            currentStochK < currentStochD &&
            currentStochD < this.stochSellBelow &&
            currentStochK < this.stochSellBelow &&
            stochDiff >= this.stochDiffMin &&
            stochDiff <= this.stochDiffMax
        ) {
            return this.createSignal(
                candleData,
                'SELL',
                `Trend reversal sell: Short EMA < Long, RSI ${currentRSI.toFixed(2)} > ${this.rsiSellAbove}, Stoch K ${currentStochK.toFixed(2)} < D ${currentStochD.toFixed(2)}`,
                0.8
            );
        }

        // BUY Signal: Short EMA below Long, RSI < threshold, Stoch K > D
        if (
            shortBelowLong &&
            currentRSI < this.rsiBuyBelow &&
            currentStochK > currentStochD &&
            currentStochD > this.stochBuyAbove &&
            currentStochK > this.stochBuyAbove &&
            stochDiff >= this.stochDiffMin &&
            stochDiff <= this.stochDiffMax
        ) {
            return this.createSignal(
                candleData,
                'BUY',
                `Trend reversal buy: Short EMA > Long, RSI ${currentRSI.toFixed(2)} < ${this.rsiBuyBelow}, Stoch K ${currentStochK.toFixed(2)} > D ${currentStochD.toFixed(2)}`,
                0.8
            );
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
