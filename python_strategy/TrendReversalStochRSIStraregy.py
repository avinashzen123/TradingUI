import os
import logging
from pandas import DataFrame

from entity import EventType
from strategy_v1.StopTargetEnum import StopTargetEnum
from strategy_v1.StrategyBase import StrategyBase
from ta import rsi, stoch_rsi
from common import CLOSE

from common import get_logger
logger = get_logger(__name__)

class TrendReversalStochRSIStrategy(StrategyBase):
    def __init__(self, rsi_period=14, stoch_period=14, atr_period = 14,
                 buy_above_rsi = 55, sell_below_rsi = 45,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_25_100):
        super().__init__(sl_target=sl_target, atr_period=atr_period)
        self.rsi_period = rsi_period
        self.stoch_period = stoch_period
        self.stoch_k_column = f"STOCH_RSI_K_{stoch_period}"
        self.stoch_d_column = f"STOCH_RSI_D_{stoch_period}"
        self.rsi_column = f"RSI_{rsi_period}"
        self.buy_above_rsi = buy_above_rsi
        self.sell_below_rsi = sell_below_rsi



    def apply_indicator(self, df: DataFrame):
        super().apply_indicator(df)
        if self.rsi_column not in df.columns:
            df[self.rsi_column] = rsi(close=df[CLOSE], period=self.rsi_period)
        if self.stoch_k_column not in df.columns:
            df[self.stoch_k_column], df[self.stoch_d_column] = stoch_rsi(rsi_series=df[self.rsi_column], period=self.stoch_period)

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        cur_row, prev_row = df.iloc[-1], df.iloc[-2]

        if (70 > cur_row[self.rsi_column] > 50 and cur_row[self.rsi_column] > prev_row[self.rsi_column]
                and cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column]
                and prev_row[self.stoch_k_column] > prev_row[self.stoch_d_column]):
            msg = f"TrendReversalStochRSIStrategy : RSI {cur_row[self.rsi_column]} > 50, Stoch K {cur_row[self.stoch_d_column]}, crossed Stoch D {cur_row[self.stoch_d_column]}"
            logger.info(f"SELL {msg}")
            return EventType.SELL, msg
        if (30 < cur_row[self.rsi_column] < 50 and cur_row[self.rsi_column] < prev_row[self.rsi_column]
                and cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column]
                and prev_row[self.stoch_k_column] > prev_row[self.stoch_d_column]):
            msg = f"TrendReversalStochRSIStrategy : RSI {cur_row[self.rsi_column]} <  50, Stoch {cur_row[self.stoch_k_column]}, K crossed below Stoch D{cur_row[self.stoch_d_column]}"
            logger.info(f"BUY {msg}")
            return EventType.BUY, msg
        return EventType.NONE, ""
