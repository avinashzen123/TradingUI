import os
import logging
from entity import EventType
from .StrategyBase import StrategyBase
from common import EMA, CLOSE, OPEN, HIGH, LOW
from pandas import DataFrame
from ta import ema
from .StopTargetEnum import StopTargetEnum
from common import NoneLogger as logger

# from common import get_logger
#
# logger = get_logger(__name__)


class EMACrossOverStrategy(StrategyBase):
    def __init__(self, adx_threshold=20, short_period=11, long_period=21,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_50_100,
                 atr_period=14, require_confirmation=True, atr_multiplier=1.0):
        super().__init__(adx_threshold, sl_target=sl_target, atr_period=atr_period)
        self.short_period = short_period
        self.long_period = long_period
        self.sl_target = sl_target
        self.require_confirmation = require_confirmation
        self.atr_multiplier = atr_multiplier  # Adjust ATR filter sensitivity
        self.ema_short_column = f"{EMA}_{self.short_period}"
        self.ema_long_column = f"{EMA}_{self.long_period}"

    def _message_(self, cur_row):
        return (f"EMACrossOverStrategy: SEMA-{self.short_period}: LEMA-{self.long_period}: SLT{self.sl_target.value}, "
                f"ADX: {cur_row[self.adx_column]:.2f}, ATR: {cur_row[self.atr_column]:.2f}, "
                f"SEMA: {cur_row[self.ema_short_column]:.2f}, LEMA: {cur_row[self.ema_long_column]:.2f}")

    def apply_indicator(self, candle_data: DataFrame):
        if self.ema_short_column not in candle_data.columns:
            candle_data[self.ema_short_column] = ema(candle_data[CLOSE], self.short_period)
        if self.ema_long_column not in candle_data.columns:
            candle_data[self.ema_long_column] = ema(candle_data[CLOSE], self.long_period)
        super().apply_indicator(candle_data)

    def is_valid_buy(self, cur_row, prev_row):
        """
        Validate BUY signal with multiple filters:
        1. EMA crossover: short crosses above long
        2. ADX trend strength validation
        3. ATR-based volatility filter (adjustable)
        4. Confirmation: current candle closes above short EMA
        """
        # Check EMA crossover
        ema_crossover = (cur_row[self.ema_short_column] > cur_row[self.ema_long_column] and
                         prev_row[self.ema_short_column] <= prev_row[self.ema_long_column])

        if not ema_crossover:
            return False

        # ADX trend strength validation
        if cur_row[self.adx_column] < self.adx_threshold:
            logger.debug(f"Buy rejected: ADX {cur_row[self.adx_column]:.2f} < threshold {self.adx_threshold}")
            return False

        # ATR volatility filter - adjustable sensitivity
        candle_range = abs(cur_row[HIGH] - cur_row[LOW])
        atr_threshold = cur_row[self.atr_column] * self.atr_multiplier

        if candle_range > atr_threshold:
            logger.debug(f"Buy rejected: Candle range {candle_range:.2f} > ATR threshold {atr_threshold:.2f}")
            return False

        # Confirmation candle: close above short EMA
        if self.require_confirmation and cur_row[CLOSE] < cur_row[self.ema_short_column]:
            logger.debug(f"Buy rejected: Close {cur_row[CLOSE]:.2f} < SEMA {cur_row[self.ema_short_column]:.2f}")
            return False

        return True

    def is_valid_sell(self, cur_row, prev_row):
        """
        Validate SELL signal with multiple filters:
        1. EMA crossover: short crosses below long
        2. ADX trend strength validation
        3. ATR-based volatility filter (adjustable)
        4. Confirmation: current candle closes below short EMA
        """
        # Check EMA crossover
        ema_crossover = (cur_row[self.ema_short_column] < cur_row[self.ema_long_column] and
                         prev_row[self.ema_short_column] >= prev_row[self.ema_long_column])

        if not ema_crossover:
            return False

        # ADX trend strength validation
        if cur_row[self.adx_column] < self.adx_threshold:
            logger.info(f"Sell rejected: ADX {cur_row[self.adx_column]:.2f} < threshold {self.adx_threshold}")
            return False

        # ATR volatility filter - adjustable sensitivity
        candle_range = abs(cur_row[HIGH] - cur_row[LOW])
        atr_threshold = cur_row[self.atr_column] * self.atr_multiplier

        if candle_range > atr_threshold:
            logger.info(f"Sell rejected: Candle range {candle_range:.2f} > ATR threshold {atr_threshold:.2f}")
            return False

        # Confirmation candle: close below short EMA
        if self.require_confirmation and cur_row[CLOSE] > cur_row[self.ema_short_column]:
            logger.info(f"Sell rejected: Close {cur_row[CLOSE]:.2f} > SEMA {cur_row[self.ema_short_column]:.2f}")
            return False

        return True

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        cur_row, prev_row = df.iloc[-1], df.iloc[-2]

        analysis_columns = [self.ema_short_column, self.ema_long_column, self.adx_column, self.atr_column]
        logger.info(
            f"EMACrossOverStrategy: cur_row: {cur_row[analysis_columns].to_dict()}, " f"prev row : {prev_row[analysis_columns].to_dict()}")
        if self.is_valid_buy(cur_row, prev_row):
            msg = self._message_(cur_row)
            logger.info(f"Buy Signal: {msg}")
            return EventType.BUY, msg
        elif self.is_valid_sell(cur_row, prev_row):
            msg = self._message_(cur_row)
            logger.info(f"Sell signal: {msg}")
            return EventType.SELL, msg
        else:
            return EventType.NONE, ""

    def __str__(self):
        return (f"EMACrossOverStrategy(short={self.short_period}, long={self.long_period}, "
                f"adx_threshold={self.adx_threshold}, atr_mult={self.atr_multiplier}, "
                f"confirmation={self.require_confirmation}, sl_target={self.sl_target.value})")

    def __repr__(self):
        return self.__str__()