import os
import logging
from pandas import DataFrame

from entity import EventType
from strategy_v1.StopTargetEnum import StopTargetEnum
from strategy_v1.StrategyBase import StrategyBase
from ta import rsi, stoch_rsi
from common import CLOSE

if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
else:
    from lambda_logger import setup_logger
    logger = setup_logger()

class CounterTrendStochRSIStrategy(StrategyBase):
    """
    Counter-trend strategy that trades against prevailing momentum.
    Waits for momentum exhaustion and divergence before entering.
    Uses multiple confirmations to avoid catching falling knives.
    """
    def __init__(self, rsi_period=14, stoch_period=14, atr_period=14,
                 oversold_threshold=30, overbought_threshold=70,
                 stoch_oversold=30, stoch_overbought=70,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_25_100):
        super().__init__(sl_target=sl_target, atr_period=atr_period)
        self.rsi_period = rsi_period
        self.stoch_period = stoch_period
        self.oversold_threshold = oversold_threshold
        self.overbought_threshold = overbought_threshold
        self.stoch_oversold = stoch_oversold
        self.stoch_overbought = stoch_overbought
        
        self.stoch_k_column = f"STOCH_RSI_K_{stoch_period}"
        self.stoch_d_column = f"STOCH_RSI_D_{stoch_period}"
        self.rsi_column = f"RSI_{rsi_period}"

    def apply_indicator(self, df: DataFrame):
        super().apply_indicator(df)
        if self.rsi_column not in df.columns:
            df[self.rsi_column] = rsi(close=df[CLOSE], period=self.rsi_period)
        if self.stoch_k_column not in df.columns:
            df[self.stoch_k_column], df[self.stoch_d_column] = stoch_rsi(
                rsi_series=df[self.rsi_column], 
                period=self.stoch_period
            )

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        
        if len(df) < 3:
            return EventType.NONE, ""
            
        cur_row, prev_row, prev2_row = df.iloc[-1], df.iloc[-2], df.iloc[-3]

        # BUY Signal: Oversold reversal with momentum confirmation
        # 1. RSI was oversold and is now recovering (rising)
        # 2. Stoch K has crossed above D and both are moving up from oversold
        # 3. RSI is showing momentum recovery (rising for 2 bars)
        if (self.oversold_threshold < cur_row[self.rsi_column] < 45
                and cur_row[self.rsi_column] > prev_row[self.rsi_column] > prev2_row[self.rsi_column]
                and self.stoch_oversold < cur_row[self.stoch_k_column] < 60
                and cur_row[self.stoch_k_column] > cur_row[self.stoch_d_column]
                and prev_row[self.stoch_k_column] <= prev_row[self.stoch_d_column]
                and cur_row[self.stoch_k_column] > prev_row[self.stoch_k_column]):
            msg = (f"CounterTrendStochRSIStrategy: BUY - Oversold recovery confirmed. "
                   f"RSI recovering {cur_row[self.rsi_column]:.2f} (was {prev2_row[self.rsi_column]:.2f}), "
                   f"Stoch K {cur_row[self.stoch_k_column]:.2f} crossed above "
                   f"Stoch D {cur_row[self.stoch_d_column]:.2f} with momentum")
            logger.info(f"BUY {msg}")
            return EventType.BUY, msg

        # SELL Signal: Overbought reversal with momentum confirmation
        # 1. RSI was overbought and is now declining
        # 2. Stoch K has crossed below D and both are moving down from overbought
        # 3. RSI is showing momentum decline (falling for 2 bars)
        if (55 < cur_row[self.rsi_column] < self.overbought_threshold
                and cur_row[self.rsi_column] < prev_row[self.rsi_column] < prev2_row[self.rsi_column]
                and 40 < cur_row[self.stoch_k_column] < self.stoch_overbought
                and cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column]
                and prev_row[self.stoch_k_column] >= prev_row[self.stoch_d_column]
                and cur_row[self.stoch_k_column] < prev_row[self.stoch_k_column]):
            msg = (f"CounterTrendStochRSIStrategy: SELL - Overbought decline confirmed. "
                   f"RSI declining {cur_row[self.rsi_column]:.2f} (was {prev2_row[self.rsi_column]:.2f}), "
                   f"Stoch K {cur_row[self.stoch_k_column]:.2f} crossed below "
                   f"Stoch D {cur_row[self.stoch_d_column]:.2f} with momentum")
            logger.info(f"SELL {msg}")
            return EventType.SELL, msg

        return EventType.NONE, ""
