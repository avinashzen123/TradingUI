from pandas import DataFrame

from entity import EventType, Candle
from strategy_v1.StopTargetEnum import StopTargetEnum
from strategy_v1.StrategyBase import StrategyBase


class DojiCandleStrategy(StrategyBase):
    def __init__(self, sl_target: StopTargetEnum):
        super().__init__(sl_target=sl_target)

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)

        candles  = Candle.get_candles(df, 3)
        cur_candle = candles[-1]
        prev_candle = candles[-2]
        pprev_candle = candles[-3]

        if prev_candle.is_doji(0.05):
            cur_row = df.iloc[-1]
            if cur_candle.is_bullish() and cur_row[self.atr_column] > (cur_candle.close - cur_candle.open) > cur_row[self.atr_column] * .5:
                return EventType.BUY, "Doji Candle"
            if cur_candle.is_bearish() and cur_row[self.atr_column] > (cur_candle.open - cur_candle.close) > cur_row[self.atr_column] * .5:
                return EventType.SELL, "Doji Candle"
        return EventType.NONE, ""

    def apply_indicator(self, candle_data: DataFrame):
        super().apply_indicator(candle_data)

