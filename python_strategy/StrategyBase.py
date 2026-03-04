from typing import Callable, Any, Literal
from entity import EventType, Symbol, Trade
from pandas import DataFrame, Series, Timestamp
from ta.trend import adx
from ta.volatility import atr
from ta.statistics import ema
from .StopTargetEnum import StopTargetEnum
from ta.momentum import rsi, stochastic, stoch_rsi
from common import ADX, ATR, EMA, RSI, STOCH_K, STOCH_D, HIGH, LOW, CLOSE, OPEN


def round_sl_target(close, stop_loss, target) -> tuple[Any, Any, Any, Any]:
    if close < 100:
        stop_loss = round(stop_loss, 2)
        trailing_sl = round(abs(stop_loss - close), 2)
        targe = round(target, 2)
        price = round(close, 2)
    elif close < 1000:
        stop_loss = round(stop_loss, 1)
        trailing_sl = round(abs(stop_loss - close), 1)
        target = round(target, 1)
        price = round(close, 1)
    else:

        stop_loss = round(stop_loss, 0)
        trailing_sl = round(abs(stop_loss - close), 0)
        target = round(target, 0)
        price = round(close, 0)
    return price, stop_loss, target, trailing_sl


class StrategyBase:
    def __init__(self, adx_period:int = 14, adx_threshold:int = 20, atr_period:int=14, sl_target: StopTargetEnum = StopTargetEnum.SL_25_100):
        self.adx_threshold = adx_threshold
        self.sl_target = sl_target
        self.adx_period: int = adx_period
        self.atr_period: int = atr_period
        self.adx_column = f"{ADX}_{self.adx_period}"
        self.atr_column = f"{ATR}_{self.atr_period}"

    def _message_(self, cur_row):
        return  (f"StrategyBase: ADX-{self.adx_period}: ADX_TH-{self.adx_threshold}: ATR-{self.atr_period}, "
                 f"values are {cur_row[self.adx_column]}, atr: {cur_row[self.atr_column]}")

    def apply_indicator(self, candle_data: DataFrame):
        if self.adx_column not in candle_data.columns:
            candle_data[self.adx_column], _, _ = adx(candle_data, self.adx_period)
        if self.atr_column not in candle_data.columns:
            candle_data[self.atr_column] = atr(candle_data, self.atr_period)


    def adx_trending(self, cur_row, prev_row):
        return cur_row[self.adx_column] >= self.adx_threshold

    def is_tr_less_atr(self, cur_row):
        return abs(cur_row[HIGH] - cur_row[LOW]) < cur_row[self.atr_column]

    def is_valid_buy(self, cur_row, prev_row):
        # return self.adx_trending(cur_row=cur_row, prev_row=prev_row) and cur_row[CLOSE] > cur_row[OPEN] # and self.is_tr_less_atr(cur_row)
        # sl = cur_row[CLOSE] - (self.sl_target.value[0] * cur_row[self.atr_column])
        # return (cur_row[CLOSE] * .0025) < sl
        return True # cur_row[self.adx_column] > 20
    def is_valid_sell(self, cur_row, prev_row):
        # return self.adx_trending(cur_row=cur_row, prev_row=prev_row) and cur_row[CLOSE] < cur_row[OPEN] # and self.is_tr_less_atr(cur_row)
        # sl = self.sl_target.value[0] * cur_row[self.atr_column]
        # return ( cur_row[CLOSE] *.0025 ) < sl
        return True #cur_row[self.adx_column] > 20

    def buy_sl_target(self, row):
        return row[CLOSE] - self.sl_target.value[0] * row[self.atr_column], row[CLOSE] + self.sl_target.value[1] * row[self.atr_column]

    def sell_sl_target(self, row):
        return  row[CLOSE] + (self.sl_target.value[0] * row[self.atr_column]), row[CLOSE] - (self.sl_target.value[1] * row[self.atr_column])

    def calculate_sl_target(self, row, event_type: EventType):
        return self.sell_sl_target(row) if event_type == EventType.SELL else self.buy_sl_target(row)

    def analyze(self, df: DataFrame) -> tuple[EventType, str]:
        self.apply_indicator(df)
        return EventType.NONE,  ""

    def create_trade(self, symbol: Symbol, event_type: EventType, cur_row: Series, message: str):
        close = cur_row[CLOSE].item()
        stop_loss, target = self.calculate_sl_target(cur_row, event_type)
        message += f". Stop loss = {stop_loss} and Target {target}"
        price, stop_loss, target, trailing_sl = round_sl_target(close, stop_loss, target)
        return Trade(symbol=symbol, time=cur_row.name if cur_row.name is not None else Timestamp.now(),
                     type=event_type,
                     price= price,
                     stop_loss=stop_loss,
                     trailing_sl=trailing_sl,
                     target=target,
                     message=message)

    def __str__(self):
        return f"StrategyBase(adx_period={self.adx_period}, adx_threshold={self.adx_threshold}, sl_target={self.sl_target})"
        # prev_df = df.shift(1)
        # df['adx_trending'] = df.apply(lambda x: self.adx_trending(x, prev_df.loc[x.name] if x.name != df.index[0] else x), axis=1)
        # df['atr_expanding'] = df.apply(lambda x: self.is_tr_less_atr(x), axis=1)
        # df['valid_buy'] = df.apply(lambda x: self.is_valid_buy(x, prev_df.loc[x.name] if x.name != df.index[0] else x), axis=1)
        # df['valid_sell'] = df.apply(lambda x: self.is_valid_sell(x, prev_df.loc[x.name] if x.name != df.index[0] else x), axis=1)

        # df['adx_trending'] = df.apply(lambda x: self.adx_trending(x, df.shift(1).loc[x.name] if x.name > 0 else x), axis=1)