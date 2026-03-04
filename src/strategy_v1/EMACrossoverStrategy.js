import { EMA } from 'technicalindicators';
import { StrategyBase } from './StrategyBase';

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
