import { RSISwingStrategy } from './RSISwingStrategy';
import { EMACrossoverStrategy } from './EMACrossoverStrategy';
import { HemaTrendLevelStrategyV2 } from './HemaTrendLevelStrategyV2';
import { HemaTrendLevelConfirmationStrategy } from './HemaTrendLevelConfirmationStrategy';
import { HullMovingAverageStrategy } from './HullMovingAverageStrategy';
import { DojiCandleStrategy } from './DojiCandleStrategy';
import { CounterTrendStochRSIStrategy } from './CounterTrendStochRSIStrategy';
import { TrendReversalStochRSIStrategy } from './TrendReversalStochRSIStrategy';
import { TrendReversalStrategy } from './TrendReversalStrategy';

/**
 * Strategy Configuration per Instrument
 * Matches Python InstrumentStrategEnum.py
 */
export const InstrumentStrategyConfig = {
    DEFAULT: [
        new RSISwingStrategy(),
        new EMACrossoverStrategy(),
        new HemaTrendLevelStrategyV2()
    ],
    
    GOLDM: [
        new RSISwingStrategy({ 
            rsiPeriod: 14, 
            stochPeriod: 14, 
            stochInput: 'rsi',
            slTarget: { sl: 1.0, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 21,
            slTarget: { sl: 0.5, target: 2.0 }
        }),
        new HemaTrendLevelStrategyV2({
            fastLen: 11,
            slowLen: 21,
            slTarget: { sl: 0.5, target: 2.0 }
        })
    ],

    NIFTY: [
        new RSISwingStrategy({ 
            rsiPeriod: 28, 
            stochPeriod: 28,
            slTarget: { sl: 0.5, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 21,
            slTarget: { sl: 1.0, target: 2.0 }
        }),
        new HullMovingAverageStrategy({
            fastPeriod: 9,
            slowPeriod: 21,
            slTarget: { sl: 0.25, target: 1.0 }
        })
    ],

    BANKNIFTY: [
        new RSISwingStrategy({ 
            rsiPeriod: 14, 
            stochPeriod: 14, 
            stochInput: 'rsi',
            slTarget: { sl: 0.5, target: 2.0 }
        }),
        new EMACrossoverStrategy({ 
            shortPeriod: 11, 
            longPeriod: 31,
            slTarget: { sl: 1.0, target: 2.0 }
        }),
        new CounterTrendStochRSIStrategy({
            slTarget: { sl: 0.25, target: 1.0 }
        })
    ],

    // Add more instrument configurations as needed
};

/**
 * Get strategies for an instrument
 */
export function getStrategiesForInstrument(instrumentName) {
    return InstrumentStrategyConfig[instrumentName] || InstrumentStrategyConfig.DEFAULT;
}

/**
 * Analyze candle data with all strategies for an instrument
 * Returns the first valid signal found
 */
export function analyzeWithStrategies(instrumentName, candleData) {
    if (!candleData || candleData.length < 50) {
        return null;
    }

    const strategies = getStrategiesForInstrument(instrumentName);

    for (const strategy of strategies) {
        try {
            const result = strategy.analyze(candleData);
            if (result.signal !== 'NONE') {
                console.log(`[${strategy.constructor.name}] Signal: ${result.signal} - ${result.message}`);
                return result;
            }
        } catch (error) {
            console.error(`Error in strategy ${strategy.constructor.name}:`, error);
        }
    }

    return null;
}
