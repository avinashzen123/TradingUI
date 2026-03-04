import os
import logging

import numpy as np
import pandas as pd
from pandas import DataFrame

from entity import EventType
from common import CLOSE, HIGH, LOW
from .StrategyBase import StrategyBase
from .StopTargetEnum import StopTargetEnum


from common import get_logger
logger = get_logger(__name__)

class HemaTrendLevelStrategy(StrategyBase):
    def __init__(self, fast_len: int = 11, slow_len: int = 21, adx_period: int = 14,
                 adx_threshold: int = 20, atr_period: int = 14,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_50_200):
        super().__init__(adx_threshold=adx_threshold, adx_period=adx_period, 
                        sl_target=sl_target, atr_period=atr_period)
        self.fast_ema = fast_len
        self.slow_ema = slow_len
        
        self.hema_fast_column = f"HEMA_FAST_{fast_len}"
        self.hema_slow_column = f"HEMA_SLOW_{slow_len}"

    @staticmethod
    def ema(series: pd.Series, length: int) -> pd.Series:
        return series.ewm(span=length, adjust=False).mean()

    def hema(self, series: pd.Series, length: int) -> pd.Series:
        half_length = max(1, int(round(length / 2)))
        sqrt_length = max(1, int(round(np.sqrt(length))))

        ema_half = self.ema(series, half_length)
        ema_full = self.ema(series, length)

        diff = 2 * ema_half - ema_full
        return self.ema(diff, sqrt_length)

    def apply_indicator(self, df: DataFrame):
        super().apply_indicator(df)
        if self.hema_fast_column not in df.columns:
            df[self.hema_fast_column] = self.hema(df[CLOSE], self.fast_ema)
        if self.hema_slow_column not in df.columns:
            df[self.hema_slow_column] = self.hema(df[CLOSE], self.slow_ema)

        df['trend'] = np.where(df[self.hema_fast_column] > df[self.hema_slow_column], 1, -1)

        df['bullish_cross'] = (
            (df[self.hema_fast_column] > df[self.hema_slow_column]) &
            (df[self.hema_fast_column].shift() <= df[self.hema_slow_column].shift())
        )

        df['bearish_cross'] = (
            (df[self.hema_fast_column] < df[self.hema_slow_column]) &
            (df[self.hema_fast_column].shift() >= df[self.hema_slow_column].shift())
        )

        # Support / Resistance Tracking
        df['bull_support'] = np.nan
        df['bear_resistance'] = np.nan

        last_bull_support = np.nan
        last_bear_resistance = np.nan

        for i in range(len(df)):
            if df['bullish_cross'].iloc[i]:
                last_bull_support = df[LOW].iloc[i]

            if df['bearish_cross'].iloc[i]:
                last_bear_resistance = df[HIGH].iloc[i]

            df.iloc[i, df.columns.get_loc('bull_support')] = last_bull_support
            df.iloc[i, df.columns.get_loc('bear_resistance')] = last_bear_resistance

        df['bull_test'] = (
            df['bull_support'].notna() &
            (df[LOW] < df['bull_support']) &
            (df[CLOSE] > df['bull_support'])
        )

        df['bear_test'] = (
            df['bear_resistance'].notna() &
            (df[HIGH] > df['bear_resistance']) &
            (df[CLOSE] < df['bear_resistance'])
        )


    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        if len(df) < max(self.fast_ema, self.slow_ema):
            return EventType.NONE, ""

        self.apply_indicator(df)
        last = df.iloc[-1]
        bull_cross = 'bullish_cross'
        bear_cross = 'bearish_cross'
        bull_test = 'bull_test'
        bear_test = 'bear_test'
        logger.info(f"HEMA Analysis values are : {last[[self.hema_fast_column, self.hema_slow_column, self.adx_column, bull_cross, bear_cross, bull_test, bear_test]].to_dict()}")

        is_trending = last[self.adx_column] > df.iloc[-2][self.adx_column] > self.adx_threshold

        if last[bull_cross] and is_trending:
            msg = f"HEMA bullish cross: Fast({self.fast_ema}) > Slow({self.slow_ema})"
            logger.info(msg)
            return EventType.BUY,msg

        if last[bear_cross] and is_trending:
            msg = f"HEMA bearish cross: Fast({self.fast_ema}) < Slow({self.slow_ema})"
            logger.info(msg)
            return EventType.SELL, msg

        if last['trend'] == 1 and last[bull_test] and is_trending:
            msg = f"Bull support test passed in uptrend"
            logger.info(msg)
            return EventType.BUY, msg

        if last['trend'] == -1 and last[bear_test] and is_trending:
            msg = f"Bear resistance test passed in downtrend"
            logger.info(msg)
            return EventType.SELL, msg

        return EventType.NONE, ""