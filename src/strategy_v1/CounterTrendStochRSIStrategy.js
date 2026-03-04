import { StrategyBase } from './StrategyBase';
import { RSI, StochasticRSI } from 'technicalindicators';

/**
 * Counter-Trend Stochastic RSI Strategy
 * Trades against prevailing momentum, waiting for exhaustion and reversal
 */
export class CounterTrendStochRSIStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.rsiPeriod = config.rsiPeriod || 14;
        this.stochPeriod = config.stochPeriod || 14;
        this.oversoldThreshold = config.oversoldThreshold || 30;
        this.overboughtThreshold = config.overboughtThreshold || 70;
        this.stochOversold = config.stochOversold || 30;
        this.stochOverbought = config.stochOverbought || 70;
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

        if (!rsiValues.length || !stochRSI.length || stochRSI.length < 3) {
            return { signal: 'NONE', message: '', confidence: 0 };
        }

        const lastIdx = stochRSI.length - 1;
        const currentRSI = rsiValues[rsiValues.length - 1];
        const prevRSI = rsiValues[rsiValues.length - 2];
        const prev2RSI = rsiValues[rsiValues.length - 3];

        const currentStochK = stochRSI[lastIdx].k;
        const currentStochD = stochRSI[lastIdx].d;
        const prevStochK = stochRSI[lastIdx - 1].k;
        const prevStochD = stochRSI[lastIdx - 1].d;

        // BUY Signal: Oversold recovery with momentum confirmation
        if (
            currentRSI > this.oversoldThreshold && currentRSI < 45 &&
            currentRSI > prevRSI && prevRSI > prev2RSI &&
            currentStochK > this.stochOversold && currentStochK < 60 &&
            currentStochK > currentStochD &&
            prevStochK <= prevStochD &&
            currentStochK > prevStochK
        ) {
            return this.createSignal(
                candleData,
                'BUY',
                `Oversold recovery confirmed. RSI: ${currentRSI.toFixed(2)}, Stoch K: ${currentStochK.toFixed(2)} crossed above D: ${currentStochD.toFixed(2)}`,
                0.75
            );
        }

        // SELL Signal: Overbought decline with momentum confirmation
        if (
            currentRSI < this.overboughtThreshold && currentRSI > 55 &&
            currentRSI < prevRSI && prevRSI < prev2RSI &&
            currentStochK < this.stochOverbought && currentStochK > 40 &&
            currentStochK < currentStochD &&
            prevStochK >= prevStochD &&
            currentStochK < prevStochK
        ) {
            return this.createSignal(
                candleData,
                'SELL',
                `Overbought decline confirmed. RSI: ${currentRSI.toFixed(2)}, Stoch K: ${currentStochK.toFixed(2)} crossed below D: ${currentStochD.toFixed(2)}`,
                0.75
            );
        }

        return { signal: 'NONE', message: '', confidence: 0 };
    }
}
