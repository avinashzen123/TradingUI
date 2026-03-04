from pandas import DataFrame

from entity import EventType
from ta.momentum import stochastic, stoch_rsi
from ta import rsi
from common import STOCH_D, STOCH_K, RSI, CLOSE, DATE_TIME_FORMAT
from .StrategyBase import StrategyBase
from .StopTargetEnum import StopTargetEnum

from common import get_logger
logger = get_logger(__name__)

class TrendReversalStrategy(StrategyBase):
    def __init__(self, adx_period = 14, adx_threshold = 20, short_ema_period = 11, long_ema_period = 26, rsi_period = 14,
                 stoch_period = 14, stoch_diff_min = 2, stoch_diff_max = 4, rsi_buy_below = 60, rsi_sell_above = 40,
                 atr_period = 14, stoch_sell_below = 80, stoch_buy_above = 20,
                 sl_target: StopTargetEnum = StopTargetEnum.SL_25_100):
        super().__init__(adx_threshold=adx_threshold, adx_period=adx_period, sl_target=sl_target, atr_period=atr_period)
        self.short_period = short_ema_period
        self.long_period = long_ema_period
        self.rsi_period = rsi_period
        self.stoch_period = stoch_period

        self.stoch_diff_min: int = stoch_diff_min
        self.stoch_diff_max: int = stoch_diff_max
        self.rsi_buy_below: int = rsi_buy_below
        self.rsi_sell_above: int = rsi_sell_above
        self.stoch_sell_below = stoch_sell_below
        self.stoch_buy_above = stoch_buy_above

        self.stoch_k_column = f"{STOCH_K}_{stoch_period}"
        self.stoch_d_column = f"{STOCH_D}_{stoch_period}"
        self.rsi_column = f"{RSI}_{rsi_period}"
        self.short_ema_column = f"EMA_{short_ema_period}"
        self.long_ema_column = f"EMA_{long_ema_period}"

    def apply_indicator(self, df: DataFrame):
        df[self.stoch_k_column], df[self.stoch_d_column] = stochastic(df, self.stoch_period, 3, 3)
        if self.rsi_column not in df.columns:
            df[self.rsi_column] = rsi(close=df[CLOSE], period=self.rsi_period)
        if self.short_ema_column not in df.columns:
            df[self.short_ema_column] = df[CLOSE].ewm(span=self.short_period, adjust=False).mean()
        if self.long_ema_column not in df.columns:
            df[self.long_ema_column] = df[CLOSE].ewm(span=self.long_period, adjust=False).mean()
        super().apply_indicator(df)


    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)

        cur_row, prev_row = df.iloc[-1], df.iloc[-2]
        ema_last_5_short = df[self.short_ema_column].tail(5)
        ema_last_5_long = df[self.long_ema_column].tail(5)

        short_above_long = (ema_last_5_short > ema_last_5_long).all()
        short_below_long = (ema_last_5_short < ema_last_5_long).all()

        dif_stoch_k_d = abs(cur_row[self.stoch_d_column] - cur_row[self.stoch_k_column])
        if short_above_long \
                and cur_row[self.rsi_column] > self.rsi_sell_above \
                and cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column] < self.stoch_sell_below \
                and cur_row[self.stoch_k_column] < self.stoch_sell_below and self.stoch_diff_min < dif_stoch_k_d < self.stoch_diff_max:

            msg = (f"TrendReversalStrategy : Short < Long EMA, RSI {cur_row[self.rsi_column]} > {self.rsi_sell_above}, "
                   f"STOCH_K {cur_row[self.stoch_k_column]} < STOCH_D {cur_row[self.stoch_d_column]} < {self.stoch_sell_below},"
                   f"DIFF : {self.stoch_diff_min} < DIFF {dif_stoch_k_d} < {self.stoch_diff_max} ")
            logger.info(f"SELL : {msg}")
            return EventType.SELL, msg
        elif short_below_long \
                and cur_row[self.rsi_column] < self.rsi_buy_below \
                and cur_row[self.stoch_k_column] > cur_row[self.stoch_d_column] > self.stoch_buy_above \
                and cur_row[self.stoch_k_column] > self.stoch_buy_above and self.stoch_diff_min < dif_stoch_k_d < self.stoch_diff_max:

            msg = (f"TrendReversalStrategy : Short > Long EMA, {cur_row[self.rsi_column]} < {self.rsi_buy_below}, "
                   f"STOCH_K {cur_row[self.stoch_k_column]} > STOCH_D {cur_row[self.stoch_d_column]} > {self.stoch_buy_above}, "
                   f"{self.stoch_diff_min} < DIFF {dif_stoch_k_d} < {self.stoch_diff_max}")
            logger.info(f"BUY : {msg}")
            return EventType.BUY, msg
        return EventType.NONE, ""