from pandas import DataFrame
from entity import Symbol, Trade, EventType, TimeFrame
from .InstrumentStrategEnum import InstrumentConfig

from common import get_logger
logger = get_logger(__name__)

def analyze_new_order(symbol: Symbol, data: DataFrame = None) -> Trade | None:
    if data is None or data.empty:
        logger.error(f"No candle data available for {symbol.trading_symbol}")
        return None
        
    for st in InstrumentConfig.get_config(symbol.instrument_name).get_strategies():
        trade, msg = st.analyze(data)
        if trade == EventType.BUY:
            logger.info(f"BUY signal for {symbol.trading_symbol} ==> {msg}")
            return st.create_trade(symbol, EventType.BUY, data.iloc[-1], msg)
        elif trade == EventType.SELL:
            logger.info(f"SELL signal for {symbol.trading_symbol} ==> {msg}")
            return st.create_trade(symbol, EventType.SELL, data.iloc[-1], msg)
    return None
