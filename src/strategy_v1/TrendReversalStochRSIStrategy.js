import { StrategyBase } from './StrategyBase';
import { RSI, StochasticRSI } from 'technicalindicators';

/**
 * Trend Reversal Stochastic RSI Strategy
 * Identifies trend reversals using RSI and Stochastic RSI crossovers
 */
export class TrendReversalStochRSIStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.rsiPeriod = config.rsiPeriod || 14;
        this.stochPeriod = config.stochPeriod || 14;
        this.buyAboveRSI = config.buyAboveRSI || 55;
        this.sellBelowRSI = config.sellBelowRSI || 45;
    }

    /**
     * Analyze candle data
     */
    analyze(candleData) {
        if (candleData.length < Math.max(this.rsiPeriod, this.stochPeriod) + 20) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const closes = candleData.map(c => c.close);

        // Calculate RSI
        const rsiValues = RSI.calculate({
            values: closes,
            period: this.rsiPeriod
        });

        // Calculate Stochastic RSI
        const stochRSI = StochasticRSI.calculate({
            values: closes,
            rsiPeriod: this.rsiPeriod,
            stochasticPeriod: this.stochPeriod,
            kPeriod: 3,
            dPeriod: 3
        });

        if (!rsiValues.length || !stochRSI.length || stochRSI.length < 2) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const lastIdx = stochRSI.length - 1;
        const currentRSI = rsiValues[rsiValues.length - 1];
        const prevRSI = rsiValues[rsiValues.length - 2];

        const currentStochK = stochRSI[lastIdx].k;
        const currentStochD = stochRSI[lastIdx].d;
        const prevStochK = stochRSI[lastIdx - 1].k;
        const prevStochD = stochRSI[lastIdx - 1].d;

        // SELL Signal: RSI > 50, declining, Stoch K crosses below D
        if (
            currentRSI > 50 && currentRSI < 70 &&
            currentRSI > prevRSI &&
            currentStochK < currentStochD &&
            prevStochK > prevStochD
        ) {
            return this.createSignal(
                candleData,
                'SELL',
                `Trend reversal sell: RSI ${currentRSI.toFixed(2)} > 50, Stoch K ${currentStochK.toFixed(2)} crossed below D ${currentStochD.toFixed(2)}`,
                0.75
            );
        }

        // BUY Signal: RSI < 50, rising, Stoch K crosses above D
        if (
            currentRSI < 50 && currentRSI > 30 &&
            currentRSI < prevRSI &&
            currentStochK < currentStochD &&
            prevStochK > prevStochD
        ) {
            return this.createSignal(
                candleData,
                'BUY',
                `Trend reversal buy: RSI ${currentRSI.toFixed(2)} < 50, Stoch K ${currentStochK.toFixed(2)} crossed below D ${currentStochD.toFixed(2)}`,
                0.75
            );
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
