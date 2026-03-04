import numpy as np
import pandas as pd
from pandas import DataFrame
from typing import Tuple

from entity import EventType
from strategy_v1.StopTargetEnum import StopTargetEnum
from strategy_v1.StrategyBase import StrategyBase

from common import get_logger
logger = get_logger(__name__)

class HEMATrendAnalyzer(StrategyBase):
    def __init__(self, fast_len: int = 20, slow_len: int = 40, sl_target: StopTargetEnum = StopTargetEnum.SL_100_100):
        super().__init__(sl_target=sl_target)
        self.fast_len = fast_len
        self.slow_len = slow_len

    # ==============================
    # Helpers
    # ==============================

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

    @staticmethod
    def atr(df: DataFrame, length: int = 14) -> pd.Series:
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()

        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return tr.rolling(length).mean()

    # ==============================
    # Core Indicator Logic
    # ==============================

    def apply_indicator(self, df: DataFrame) -> DataFrame:
        super().apply_indicator(df)
        df = df.copy()

        df['hema_fast'] = self.hema(df['close'], self.fast_len)
        df['hema_slow'] = self.hema(df['close'], self.slow_len)

        df['atr_14'] = self.atr(df, 14)
        df['vola'] = df['atr_14'] / 2

        df['trend'] = np.where(
            df['hema_fast'] > df['hema_slow'], 1, -1
        )

        df['bullish_cross'] = (
            (df['hema_fast'] > df['hema_slow']) &
            (df['hema_fast'].shift() <= df['hema_slow'].shift())
        )

        df['bearish_cross'] = (
            (df['hema_fast'] < df['hema_slow']) &
            (df['hema_fast'].shift() >= df['hema_slow'].shift())
        )

        # Support / Resistance Tracking
        df['bull_support'] = np.nan
        df['bear_resistance'] = np.nan

        last_bull_support = np.nan
        last_bear_resistance = np.nan

        for i in range(len(df)):
            if df['bullish_cross'].iloc[i]:
                last_bull_support = df['low'].iloc[i]

            if df['bearish_cross'].iloc[i]:
                last_bear_resistance = df['high'].iloc[i]

            df.iloc[i, df.columns.get_loc('bull_support')] = last_bull_support
            df.iloc[i, df.columns.get_loc('bear_resistance')] = last_bear_resistance

        df['bull_test'] = (
            df['bull_support'].notna() &
            (df['low'] < df['bull_support']) &
            (df['close'] > df['bull_support'])
        )

        df['bear_test'] = (
            df['bear_resistance'].notna() &
            (df['high'] > df['bear_resistance']) &
            (df['close'] < df['bear_resistance'])
        )

        return df

    # ==============================
    # 🔥 ANALYZE METHOD
    # ==============================

    def analyze(self, df: DataFrame) -> Tuple[EventType, str]:
        """
        Analyze the last row of the DataFrame and return an action:
        BUY, SELL, BUY_PULLBACK, SELL_PULLBACK, or HOLD
        """

        if len(df) < max(self.fast_len, self.slow_len):
            return EventType.NONE, ""

        df_feat = self.apply_indicator(df)
        last = df_feat.iloc[-1]

        # Priority-based decision tree
        if last['bullish_cross'] and super().is_valid_buy(last, df_feat.iloc[-2]):
            return EventType.BUY, ""

        if last['bearish_cross'] and super().is_valid_sell(last, df_feat.iloc[-2]):
            return EventType.SELL, ""

        # if last['trend'] == 1 and last['bull_test']:
        #     return EventType.BUY, ""
        #
        # if last['trend'] == -1 and last['bear_test']:
        #     return EventType.SELL, ""

        return EventType.NONE, ""
