from common.TradeException import TradeException
from entity import EventType
from .StrategyBase import StrategyBase
from common import RSI, STOCH_K, STOCH_D, CLOSE, EMA, HIGH, LOW
from pandas import DataFrame
from ta.momentum import rsi, stoch_rsi, stochastic
from .StopTargetEnum import StopTargetEnum
from ta.statistics import ema

from common import get_logger
logger = get_logger(__name__)

class RSISwingStrategy(StrategyBase):
    def __init__(self, adx_period = 14, adx_threshold = 20, rsi_period = 14, short_ema_period:int = 11,
                 long_ema_period:int= 26, sl_target: StopTargetEnum = StopTargetEnum.SL_50_100,
                 stoch_period: int = 14, stoch_input ='rsi', rsi_oversold= 40, rsi_overbought=60, atr_period=14):
        super().__init__(adx_period=adx_period, adx_threshold=adx_threshold, sl_target=sl_target, atr_period=atr_period)
        self.rsi_period = rsi_period
        self.sl_target = sl_target
        self.stoch_period = stoch_period
        self.stoch_input = stoch_input
        self.short_ema_period = short_ema_period
        self.long_ema_period = long_ema_period
        self.rsi_oversold: int = rsi_oversold
        self.rsi_overbought: int = rsi_overbought
        self.stoch_diff_min: int = 2
        self.stoch_diff_max: int = 4
        self.rsi_column = f"{RSI}_{self.rsi_period}"
        self.short_ema_column = f"{EMA}_{self.short_ema_period}"
        self.long_ema_column = f"{EMA}_{self.long_ema_period}"
        if stoch_input == 'rsi':
            self.stoch_k_column = f"{STOCH_K}_{self.stoch_period}_rsi"
            self.stoch_d_column = f"{STOCH_D}_{self.stoch_period}_rsi"
        else:
            self.stoch_k_column = f"{STOCH_K}_{self.stoch_period}"
            self.stoch_d_column = f"{STOCH_D}_{self.stoch_period}"

    def apply_indicator(self, candle_data: DataFrame):
        if self.rsi_column not in candle_data.columns:
            candle_data[self.rsi_column] = rsi(candle_data[CLOSE], self.rsi_period)
        # if self.stoch_period is not None and self.stoch_period and self.stoch_k_column not in candle_data.columns:
        if self.stoch_input == 'rsi':
            candle_data[self.stoch_k_column], candle_data[self.stoch_d_column] = stoch_rsi(candle_data[self.rsi_column], period=self.stoch_period)
        else:
            candle_data[self.stoch_k_column], candle_data[self.stoch_d_column] = stochastic(candle_data, self.stoch_period)
        if self.short_ema_column not in candle_data.columns:
            candle_data[self.short_ema_column] = ema(candle_data[CLOSE], self.short_ema_period)
        if self.long_ema_column not in candle_data.columns:
            candle_data[self.long_ema_column] = ema(candle_data[CLOSE], self.long_ema_period)

        super().apply_indicator(candle_data)


    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        if len(df) < 5:
            return EventType.NONE, ""
        required_columns = [
            self.short_ema_column,
            self.long_ema_column,
            self.adx_column,
            self.atr_column,
            self.rsi_column,
            self.stoch_k_column,
            self.stoch_d_column,
            HIGH,
            LOW,
        ]
        missing_columns = [column for column in required_columns if column not in df.columns]
        if missing_columns:
            raise TradeException(f"Missing required columns for RSISwingStrategy: {missing_columns}")

        cur_row, prev_row = df.iloc[-1], df.iloc[-2]
        ema_last_5_short = df[self.short_ema_column].tail(5)
        ema_last_5_long = df[self.long_ema_column].tail(5)
        short_above_long = (ema_last_5_short > ema_last_5_long).all()
        short_below_long = (ema_last_5_short < ema_last_5_long).all()
        logger.info(f"RSISwingStrategy: cur_row: {cur_row[[self.short_ema_column, self.long_ema_column, self.adx_column, self.rsi_column, self.stoch_k_column, self.stoch_d_column]].to_dict()}, "
                    f"prev row : {prev_row[[self.short_ema_column, self.long_ema_column, self.adx_column, self.rsi_column, self.stoch_k_column, self.stoch_d_column]].to_dict()}")
        is_trending = cur_row[self.adx_column] >= prev_row[self.adx_column] >= self.adx_threshold
        atr_range = prev_row[self.atr_column] <= abs(cur_row[HIGH] - cur_row[LOW]) <= 3 * prev_row[self.atr_column]

        if short_above_long and is_trending and atr_range:
            is_rsi_overbought = cur_row[self.rsi_column] > prev_row[self.rsi_column] > self.rsi_overbought
            stoch_buy_threshold = 20
            stoch_diff = abs(cur_row[self.stoch_d_column] - cur_row[self.stoch_k_column])
            is_stoch_bullish = (cur_row[self.stoch_k_column] > cur_row[self.stoch_d_column] > stoch_buy_threshold
                                and cur_row[self.stoch_k_column] > stoch_buy_threshold
                                and self.stoch_diff_min < stoch_diff < self.stoch_diff_max)
            if is_rsi_overbought and is_stoch_bullish:
                msg = (f"RSISwingStrategy : S: {cur_row[self.short_ema_column]} > L {cur_row[self.long_ema_column]}, ADX {cur_row[self.adx_column]} > {prev_row[self.adx_column]} > {self.adx_threshold}, "
                       f"RSI {cur_row[self.rsi_column]} > {prev_row[self.rsi_column]} > {self.rsi_overbought}, SK {cur_row[self.stoch_k_column]} > SD {cur_row[self.stoch_d_column]} > 20")
                logger.info(f"BUY {msg}")
                return EventType.BUY, msg
        elif short_below_long and is_trending and atr_range:
            is_rsi_oversold = cur_row[self.rsi_column] < prev_row[self.rsi_column] < self.rsi_oversold
            stoch_sell_threshold = 80
            stoch_diff = abs(cur_row[self.stoch_d_column] - cur_row[self.stoch_k_column])
            is_stoch_bearish = (cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column] < stoch_sell_threshold
                                and cur_row[self.stoch_k_column] < stoch_sell_threshold
                                and self.stoch_diff_min < stoch_diff < self.stoch_diff_max)
            if is_rsi_oversold and is_stoch_bearish:
                msg = (
                    f"RSISwingStrategy : S: {cur_row[self.short_ema_column]} < L {cur_row[self.long_ema_column]}, ADX {cur_row[self.adx_column]} > {prev_row[self.adx_column]} > {self.adx_threshold}, "
                    f"RSI {cur_row[self.rsi_column]} < {prev_row[self.rsi_column]} < {self.rsi_oversold}, SK {cur_row[self.stoch_k_column]} < SD {cur_row[self.stoch_d_column]} < {stoch_sell_threshold}")
                logger.info(f"SELL {msg}")
                return EventType.SELL, msg

        return EventType.NONE, ""


    def __str__(self):
        return f"RSISwingStrategy: {self.rsi_period}, {self.sl_target} {StrategyBase.__str__(self)}"
    def __repr__(self):
        return self.__str__()
