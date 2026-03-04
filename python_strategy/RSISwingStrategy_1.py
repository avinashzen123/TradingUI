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
    def __init__(self, adx_period=14, adx_threshold=20, rsi_period=14, short_ema_period: int = 11,
                 long_ema_period: int = 26, sl_target: StopTargetEnum = StopTargetEnum.SL_50_100,
                 stoch_period: int = 14, stoch_input='rsi', rsi_oversold=40, rsi_overbought=60, atr_period=14,
                 ema_lookback: int = 3, stoch_diff_min: int = 2, stoch_diff_max: int = 10,
                 rsi_divergence_lookback: int = 5):
        super().__init__(adx_period=adx_period, adx_threshold=adx_threshold, sl_target=sl_target, atr_period=atr_period)
        self.rsi_period = rsi_period
        self.sl_target = sl_target
        self.stoch_period = stoch_period
        self.stoch_input = stoch_input
        self.short_ema_period = short_ema_period
        self.long_ema_period = long_ema_period
        self.rsi_oversold: int = rsi_oversold
        self.rsi_overbought: int = rsi_overbought
        self.stoch_diff_min: int = stoch_diff_min
        self.stoch_diff_max: int = stoch_diff_max
        self.ema_lookback: int = ema_lookback
        self.rsi_divergence_lookback: int = rsi_divergence_lookback
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
            candle_data[self.stoch_k_column], candle_data[self.stoch_d_column] = stoch_rsi(candle_data[self.rsi_column],
                                                                                           period=self.stoch_period)
        else:
            candle_data[self.stoch_k_column], candle_data[self.stoch_d_column] = stochastic(candle_data,
                                                                                            self.stoch_period)
        if self.short_ema_column not in candle_data.columns:
            candle_data[self.short_ema_column] = ema(candle_data[CLOSE], self.short_ema_period)
        if self.long_ema_column not in candle_data.columns:
            candle_data[self.long_ema_column] = ema(candle_data[CLOSE], self.long_ema_period)

        super().apply_indicator(candle_data)

    def _check_rsi_divergence(self, df: DataFrame, lookback: int) -> tuple[bool, bool]:
        """
        Check for RSI divergence (bullish or bearish)

        Returns:
            (bullish_divergence, bearish_divergence)
        """
        if len(df) < lookback:
            return False, False

        recent_data = df.tail(lookback)
        prices = recent_data[CLOSE].values
        rsi_values = recent_data[self.rsi_column].values

        # Bullish divergence: Price making lower lows, RSI making higher lows
        price_lower_low = prices[-1] < prices[0] and prices[-1] == min(prices)
        rsi_higher_low = rsi_values[-1] > rsi_values[0] and rsi_values[-1] > min(rsi_values)
        bullish_divergence = price_lower_low and rsi_higher_low

        # Bearish divergence: Price making higher highs, RSI making lower highs
        price_higher_high = prices[-1] > prices[0] and prices[-1] == max(prices)
        rsi_lower_high = rsi_values[-1] < rsi_values[0] and rsi_values[-1] < max(rsi_values)
        bearish_divergence = price_higher_high and rsi_lower_high

        return bullish_divergence, bearish_divergence

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

        # Relaxed EMA condition - use configurable lookback (default 3 bars instead of 5)
        ema_last_n_short = df[self.short_ema_column].tail(self.ema_lookback)
        ema_last_n_long = df[self.long_ema_column].tail(self.ema_lookback)
        short_above_long = (ema_last_n_short > ema_last_n_long).all()
        short_below_long = (ema_last_n_short < ema_last_n_long).all()

        # Check for RSI divergence
        bullish_divergence, bearish_divergence = self._check_rsi_divergence(df, self.rsi_divergence_lookback)

        logger.info(
            f"RSISwingStrategy: cur_row: {cur_row[[self.short_ema_column, self.long_ema_column, self.adx_column, self.rsi_column, self.stoch_k_column, self.stoch_d_column]].to_dict()}, "
            f"prev row : {prev_row[[self.short_ema_column, self.long_ema_column, self.adx_column, self.rsi_column, self.stoch_k_column, self.stoch_d_column]].to_dict()}")
        is_trending = cur_row[self.adx_column] >= prev_row[self.adx_column] >= self.adx_threshold
        atr_range = prev_row[self.atr_column] <= abs(cur_row[HIGH] - cur_row[LOW]) <= 3 * prev_row[self.atr_column]

        if short_above_long and is_trending and atr_range:
            is_rsi_overbought = cur_row[self.rsi_column] > prev_row[self.rsi_column] > self.rsi_overbought
            stoch_buy_threshold = 20
            stoch_diff = abs(cur_row[self.stoch_d_column] - cur_row[self.stoch_k_column])
            # Widened stochastic difference range (2-10 instead of 2-4)
            is_stoch_bullish = (cur_row[self.stoch_k_column] > cur_row[self.stoch_d_column] > stoch_buy_threshold
                                and cur_row[self.stoch_k_column] > stoch_buy_threshold
                                and self.stoch_diff_min < stoch_diff < self.stoch_diff_max)

            # Entry with or without divergence (divergence adds confirmation)
            if is_rsi_overbought and is_stoch_bullish:
                divergence_msg = " with bullish divergence" if bullish_divergence else ""
                msg = (
                    f"RSISwingStrategy{divergence_msg}: S: {cur_row[self.short_ema_column]:.2f} > L {cur_row[self.long_ema_column]:.2f}, "
                    f"ADX {cur_row[self.adx_column]:.2f} > {prev_row[self.adx_column]:.2f} > {self.adx_threshold}, "
                    f"RSI {cur_row[self.rsi_column]:.2f} > {prev_row[self.rsi_column]:.2f} > {self.rsi_overbought}, "
                    f"SK {cur_row[self.stoch_k_column]:.2f} > SD {cur_row[self.stoch_d_column]:.2f} > {stoch_buy_threshold}, "
                    f"Stoch diff: {stoch_diff:.2f}")
                logger.info(f"BUY {msg}")
                return EventType.BUY, msg
        elif short_below_long and is_trending and atr_range:
            is_rsi_oversold = cur_row[self.rsi_column] < prev_row[self.rsi_column] < self.rsi_oversold
            stoch_sell_threshold = 80
            stoch_diff = abs(cur_row[self.stoch_d_column] - cur_row[self.stoch_k_column])
            # Widened stochastic difference range (2-10 instead of 2-4)
            is_stoch_bearish = (cur_row[self.stoch_k_column] < cur_row[self.stoch_d_column] < stoch_sell_threshold
                                and cur_row[self.stoch_k_column] < stoch_sell_threshold
                                and self.stoch_diff_min < stoch_diff < self.stoch_diff_max)

            # Entry with or without divergence (divergence adds confirmation)
            if is_rsi_oversold and is_stoch_bearish:
                divergence_msg = " with bearish divergence" if bearish_divergence else ""
                msg = (
                    f"RSISwingStrategy{divergence_msg}: S: {cur_row[self.short_ema_column]:.2f} < L {cur_row[self.long_ema_column]:.2f}, "
                    f"ADX {cur_row[self.adx_column]:.2f} > {prev_row[self.adx_column]:.2f} > {self.adx_threshold}, "
                    f"RSI {cur_row[self.rsi_column]:.2f} < {prev_row[self.rsi_column]:.2f} < {self.rsi_oversold}, "
                    f"SK {cur_row[self.stoch_k_column]:.2f} < SD {cur_row[self.stoch_d_column]:.2f} < {stoch_sell_threshold}, "
                    f"Stoch diff: {stoch_diff:.2f}")
                logger.info(f"SELL {msg}")
                return EventType.SELL, msg

        return EventType.NONE, ""

    def __str__(self):
        return f"RSISwingStrategy: {self.rsi_period}, {self.sl_target} {StrategyBase.__str__(self)}"

    def __repr__(self):
        return self.__str__()
