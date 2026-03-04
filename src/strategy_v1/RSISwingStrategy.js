import { RSI, EMA, Stochastic } from 'technicalindicators';
import { StrategyBase } from './StrategyBase';

/**
 * RSI Swing Strategy
 * Matches Python RSISwingStrategy.py
 */
export class RSISwingStrategy extends StrategyBase {
    constructor(config = {}) {
        super(config);
        this.rsiPeriod = config.rsiPeriod || 14;
        this.stochPeriod = config.stochPeriod || 14;
        this.stochInput = config.stochInput || 'rsi';
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
