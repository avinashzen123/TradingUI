from pandas import DataFrame
from ta import hull_moving_average
from entity import EventType
from strategy_v1.StopTargetEnum import StopTargetEnum
from strategy_v1.StrategyBase import StrategyBase

from common import get_logger
logger = get_logger(__name__)

# from common import NoneLogger as logger

class HullMovingAverageStrategy (StrategyBase):
    def __init__(self, fast_period, slow_period, adx_period, atr_period, sl_target: StopTargetEnum = StopTargetEnum.SL_25_100):
        super().__init__(adx_period=adx_period, atr_period=atr_period, sl_target=sl_target, adx_threshold=20)
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.adx_period = adx_period
        self.atr_period = atr_period
        self.fast_period_column = f"HMA_{self.fast_period}"
        self.slow_period_column = f"HMA_{self.slow_period}"

    def apply_indicator(self, df: DataFrame):
        super().apply_indicator(df)
        df[self.fast_period_column] = hull_moving_average(df['close'], self.fast_period)
        df[self.slow_period_column] = hull_moving_average(df['close'], self.slow_period)

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        cur_row = df.iloc[-1]
        prev_row = df.iloc[-2]
        logger.info(f"Hull Moving average analysis current candle {cur_row[[self.fast_period_column, self.slow_period_column, self.adx_column]].to_dict()}"
                    f" previous candle {prev_row[[self.fast_period_column, self.slow_period_column, self.adx_column]].to_dict()}")
        if (cur_row[self.fast_period_column] > cur_row[self.slow_period_column]
                and prev_row[self.fast_period_column] <= prev_row[self.slow_period_column]
                and cur_row[self.adx_column] > prev_row[self.adx_column] > self.adx_threshold
                # and cur_row[self.atr_column] > prev_row[self.atr_column]
        ):
            logger.info(f"Hull Buy Signal: fast average> slow average, ")
            return EventType.BUY, "Hull Moving Average Crossover Buy Signal"
    
        elif (cur_row[self.fast_period_column] < cur_row[self.slow_period_column]
              and prev_row[self.fast_period_column] >= prev_row[self.slow_period_column]
              and cur_row[self.adx_column] > prev_row[self.adx_column] > self.adx_threshold
              # and cur_row[self.atr_column] > prev_row[self.atr_column]
        ):
            return EventType.SELL, "Hull Moving Average Crossover Sell Signal"
    
        else:
            return EventType.NONE, "No Signal"

