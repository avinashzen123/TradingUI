import os
import logging
from pandas import DataFrame

from entity import EventType
from common import CLOSE
from .HemaTrendLevelStrategyV2 import HemaTrendLevelStrategy
from .StopTargetEnum import StopTargetEnum

from common import get_logger
logger = get_logger(__name__)

class HemaTrendLevelConfirmationStrategy(HemaTrendLevelStrategy):
    def __init__(self, fast_len: int = 11, slow_len: int = 21, adx_period: int = 14,
                 adx_threshold: int = 20, atr_period: int = 14,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_50_200,
                 confirmation_bars: int = 2):
        super().__init__(fast_len, slow_len, adx_period, adx_threshold, atr_period, sl_target)
        self.confirmation_bars = confirmation_bars

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        if len(df) < max(self.fast_ema, self.slow_ema) + self.confirmation_bars:
            return EventType.NONE, ""

        self.apply_indicator(df)
        last = df.iloc[-1]
        prev = df.iloc[-2]

        # Bullish cross with confirmation
        if last['bullish_cross']:
            if self._confirm_bullish_trend(df):
                msg = f"HEMA bullish cross with confirmation: Fast({self.fast_ema}) > Slow({self.slow_ema})"
                logger.info(msg)
                return EventType.BUY, msg

        # Bearish cross with confirmation
        if last['bearish_cross']:
            if self._confirm_bearish_trend(df):
                msg = f"HEMA bearish cross with confirmation: Fast({self.fast_ema}) < Slow({self.slow_ema})"
                logger.info(msg)
                return EventType.SELL, msg

        # Bull support test with confirmation
        if last['trend'] == 1 and last['bull_test']:
            if self._confirm_bullish_trend(df) and prev['trend'] == 1 and last[CLOSE] > prev[CLOSE]:
                msg = f"Bull support test with confirmation in uptrend"
                logger.info(msg)
                return EventType.BUY, msg

        # Bear resistance test with confirmation
        if last['trend'] == -1 and last['bear_test']:
            if self._confirm_bearish_trend(df) and prev['trend'] == -1 and last[CLOSE] < prev[CLOSE]:
                msg = f"Bear resistance test with confirmation in downtrend"
                logger.info(msg)
                return EventType.SELL, msg

        return EventType.NONE, ""

    def _confirm_bullish_trend(self, df: DataFrame) -> bool:
        """Confirm bullish signal with price action and momentum"""
        last = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Price confirmation: Close above fast HEMA
        price_confirm = last[CLOSE] > last[self.hema_fast_column]
        
        # Momentum confirmation: Fast HEMA rising
        momentum_confirm = last[self.hema_fast_column] > prev[self.hema_fast_column]
        
        return price_confirm and momentum_confirm

    def _confirm_bearish_trend(self, df: DataFrame) -> bool:
        """Confirm bearish signal with price action and momentum"""
        last = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Price confirmation: Close below fast HEMA
        price_confirm = last[CLOSE] < last[self.hema_fast_column]
        
        # Momentum confirmation: Fast HEMA falling
        momentum_confirm = last[self.hema_fast_column] < prev[self.hema_fast_column]
        
        return price_confirm and momentum_confirm
