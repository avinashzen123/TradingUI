from enum import Enum

from .HemaTrendLevelStrategyV2 import HemaTrendLevelStrategy
from .StrategyBase import StrategyBase
from .RSISwingStrategy import RSISwingStrategy
from .TrendReversalStochRSIStraregy import TrendReversalStochRSIStrategy
from .TrendReversalStrategy import TrendReversalStrategy
from .EMACrossOverStrategy import EMACrossOverStrategy
from .StopTargetEnum import StopTargetEnum
from .HullMovingAverageStrategy import HullMovingAverageStrategy

class InstrumentConfig(Enum):
    DEFAULT = [RSISwingStrategy(), TrendReversalStrategy(), EMACrossOverStrategy()]
    GOLDM = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=14, stoch_period=14, stoch_input='rsi', atr_period=14),
        HemaTrendLevelStrategy(slow_len=40, fast_len=20, sl_target=StopTargetEnum.SL_100_200),
        EMACrossOverStrategy(sl_target=StopTargetEnum.SL_50_200, short_period=11, long_period=21),
        # TrendReversalStochRSIStrategy(rsi_period=28, stoch_period=28, sl_target=StopTargetEnum.SL_100_100),
    ]
    SILVERMIC = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=14, stoch_period=14, stoch_input='rsi', atr_period=14),
        HemaTrendLevelStrategy(slow_len=40, fast_len=20, sl_target=StopTargetEnum.SL_100_200),
        EMACrossOverStrategy(sl_target=StopTargetEnum.SL_100_200, short_period=9, long_period=21),
        # TrendReversalStrategy(sl_target=StopTargetEnum.SL_100_200, adx_threshold=20, atr_period=28, adx_period=28),
    ]
    SILVERM = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=14, stoch_period=14, stoch_input='rsi',
                         atr_period=14),
        HemaTrendLevelStrategy(slow_len=40, fast_len=20, sl_target=StopTargetEnum.SL_100_200),
        EMACrossOverStrategy(sl_target=StopTargetEnum.SL_50_200, short_period=11, long_period=21),
        # TrendReversalStrategy(sl_target=StopTargetEnum.SL_100_200, adx_threshold=20, atr_period=28, adx_period=28),
    ]
    ZINC = [
        # HullMovingAverageStrategy(fast_period=31, slow_period=40, adx_period=14, atr_period=14,
        #                           sl_target=StopTargetEnum.SL_100_200),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200,  fast_len = 14, slow_len = 28, adx_period = 14, atr_period = 14),
        # RSISwingStrategy(sl_target=StopTargetEnum.SL_100_200, stoch_input='close',
        #                  rsi_period=28, stoch_period=28, atr_period=20, adx_threshold=28,
        #                  rsi_oversold=30, rsi_overbought=70),
    ]
    NATURALGAS = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        # RSISwingStrategy(sl_target=StopTargetEnum.SL_100_200, stoch_input='close', rsi_period=14, stoch_period=14),
        # EMACrossOverStrategy(sl_target=StopTargetEnum.SL_100_200, short_period=11, long_period=26),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, fast_len=20, slow_len=40, adx_period=14,atr_period=14),
    ]
    CRUDEOIL = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_100_100, stoch_input='close',
                         rsi_period=14, stoch_period=14),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, fast_len=20, slow_len=40, adx_period=14,
                               atr_period=14),
    ]
    ALUMINIUM = [
        # HullMovingAverageStrategy(fast_period=11, slow_period=21, adx_period=14, atr_period=14,
        #                           sl_target=StopTargetEnum.SL_100_100),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_100_100, stoch_input='close', rsi_period=14, stoch_period=14),
        TrendReversalStrategy(sl_target=StopTargetEnum.SL_100_100, rsi_period=28, stoch_period=28, adx_threshold = 20),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_100, fast_len=20, slow_len=40, adx_period=14,
                               atr_period=14),
    ],
    NIFTY = [
        # HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, slow_len=40, fast_len=20),

        RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=28, stoch_period=28),
        HullMovingAverageStrategy(fast_period=11, slow_period=21, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),

        # TrendReversalStrategy(sl_target=StopTargetEnum.SL_100_200, rsi_period=28, stoch_period=28),
    ]
    BANKNIFTY = [
        HullMovingAverageStrategy(fast_period=11, slow_period=31, adx_period=14, atr_period=14, sl_target=StopTargetEnum.SL_100_200),

        RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=14, stoch_period=14, stoch_input='rsi', atr_period=14),
        # TrendReversalStrategy(sl_target=StopTargetEnum.SL_100_200, rsi_period=28, stoch_period=28),

        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, slow_len=40, fast_len=20),
    ]
    MIDCPNIFTY = [
        HullMovingAverageStrategy(fast_period=9, slow_period=21, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_100_200, rsi_period=14, stoch_period=14),
    ]
    INFY = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        # TrendReversalStochRSIStrategy(rsi_period=28, stoch_period=28, sl_target=StopTargetEnum.SL_50_100),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_100, fast_len=20, slow_len=40),
        # RSISwingStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=28, stoch_period=28),
        # TrendReversalStrategy(sl_target=StopTargetEnum.SL_50_200, rsi_period=28, stoch_period=28),
    ]
    BSE = [
        RSISwingStrategy(sl_target=StopTargetEnum.SL_100_200, rsi_period=14, stoch_period=14),
        TrendReversalStrategy(sl_target=StopTargetEnum.SL_50_100, rsi_period=28, stoch_period=28),
        EMACrossOverStrategy(sl_target=StopTargetEnum.SL_50_200, short_period=9, long_period=21),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, fast_len=20, slow_len=40),
    ]
    RELIANCE = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=28, atr_period=28, sl_target=StopTargetEnum.SL_100_200),
        # EMACrossOverStrategy(sl_target=StopTargetEnum.SL_50_200, short_period=11, long_period=26),
        # RSISwingStrategy(sl_target=StopTargetEnum.SL_100_200, rsi_period=28, stoch_period=28),
    ]
    TCS = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=28, atr_period=28,
                                  sl_target=StopTargetEnum.SL_100_200),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_50_100, slow_len=28, fast_len=14),
    ]
    NIFTYNXT50 = [
        HullMovingAverageStrategy(fast_period=9, slow_period=26, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_25_200),
        TrendReversalStrategy(sl_target=StopTargetEnum.SL_25_200),
    ]
    FINNIFTY = [
        HullMovingAverageStrategy(fast_period=20, slow_period=40, adx_period=14, atr_period=14,
                                  sl_target=StopTargetEnum.SL_100_200),
        RSISwingStrategy(sl_target=StopTargetEnum.SL_25_100),
        TrendReversalStrategy(sl_target=StopTargetEnum.SL_25_100),
        EMACrossOverStrategy(sl_target=StopTargetEnum.SL_50_100),
        HemaTrendLevelStrategy(sl_target=StopTargetEnum.SL_100_200, fast_len=20, slow_len=40),
    ]

    def __init__(self, strategies: list[StrategyBase]):
        self.strategies = strategies
    def get_strategies(self) -> list[StrategyBase]:
        return self.strategies

    @staticmethod
    def get_config(instrument_name: str):
        try:
            return InstrumentConfig[instrument_name]
        except KeyError:
            return InstrumentConfig.DEFAULT

