/**
 * Strategy V1 Package
 * JavaScript implementation of Python strategy_v1
 */

export { StrategyBase } from './StrategyBase';
export { RSISwingStrategy } from './RSISwingStrategy';
export { EMACrossoverStrategy } from './EMACrossoverStrategy';
export { HemaTrendLevelStrategyV2 } from './HemaTrendLevelStrategyV2';
export { HemaTrendLevelConfirmationStrategy } from './HemaTrendLevelConfirmationStrategy';
export { HullMovingAverageStrategy } from './HullMovingAverageStrategy';
export { DojiCandleStrategy } from './DojiCandleStrategy';
export { CounterTrendStochRSIStrategy } from './CounterTrendStochRSIStrategy';
export { TrendReversalStochRSIStrategy } from './TrendReversalStochRSIStrategy';
export { TrendReversalStrategy } from './TrendReversalStrategy';
export { 
    InstrumentStrategyConfig, 
    getStrategiesForInstrument, 
    analyzeWithStrategies 
} from './InstrumentStrategyConfig';
