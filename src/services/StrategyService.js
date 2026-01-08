import { EMA, RSI, Stochastic, ADX, ATR } from 'technicalindicators';

const sl_target_map_oversold = {
    'SILVERM': [1.0, 2.0], 'GOLDM': [0.25, 1.0], 'NATURALGAS': [0, 0],
    'ALUMINI': [0.5, 2.0], 'NIFTY': [0, 0], 'BANKNIFTY': [0, 0], 'MIDCPNIFTY': [0, 0],
    'INFY': [0.5, 2.0], 'BSE': [0, 0], 'TCS': [0, 0], 'NIFTYNXT50': [0.25, 1.0], 'FINNIFTY': [0.25, 1.0]
};

const sl_target_map_reversal = {
    'SILVERM': [0.25, 1.0], 'GOLDM': [0.25, 1.0], 'NATURALGAS': [0.25, 1.0],
    'ALUMINI': [0.25, 1.0], 'NIFTY': [1.0, 2.0], 'BANKNIFTY': [0.25, 1.0], 'MIDCPNIFTY': [0.5, 2.0],
    'INFY': [1.0, 2.0], 'BSE': [0.25, 2.0], 'TCS': [.25, 2.0], 'NIFTYNXT50': [0.25, 1.0], 'FINNIFTY': [1, 2]
};

const sl_target_map_ema = {
    'SILVERM': [0.5, 2.0], 'GOLDM': [0.5, 1.0], 'NATURALGAS': [0.25, 1.0],
    'ALUMINI': [0.25, 1.0], 'NIFTY': [0.25, 1.0], 'BANKNIFTY': [0.5, 1.0], 'MIDCPNIFTY': [0.5, 2.0],
    'INFY': [1.0, 2.0], 'BSE': [0.25, 1.0], 'TCS': [0.25, 1.0], 'NIFTYNXT50': [0.25, 1.0], 'FINNIFTY': [1, 2]
};

const over_bought_rsi = {
    'SILVERM': 70, 'GOLDM': 60, 'NATURALGAS': 70, 'ALUMINI': 60, 'NIFTY': 60, 'BANKNIFTY': 60, 'MIDCPNIFTY': 60,
    'INFY': 60, 'BSE': 60, 'TCS': 60, 'NIFTYNXT50': 60, 'FINNIFTY': 60
};

const over_sold_rsi = {
    'SILVERM': 30, 'GOLDM': 40, 'NATURALGAS': 30, 'ALUMINI': 40, 'NIFTY': 40, 'BANKNIFTY': 40, 'MIDCPNIFTY': 40,
    'INFY': 40, 'BSE': 40, 'TCS': 40, 'NIFTYNXT50': 40, 'FINNIFTY': 40
};

const trending_adx = {
    'SILVERM': 25, 'GOLDM': 20, 'NATURALGAS': 25, 'ALUMINI': 25, 'NIFTY': 25, 'BANKNIFTY': 20, 'MIDCPNIFTY': 25,
    'INFY': 25, 'BSE': 25, 'TCS': 25, 'NIFTYNXT50': 25, 'FINNIFTY': 25
};

const RSI_EXTREME = [30, 70];

const createTrade = (symbol, action, curRow, slTargetMap, message) => {
    const slTarget = slTargetMap[symbol];
    if (!slTarget) {
        return { action, reason: message, price: curRow.close, stopLoss: 0, target: 0 };
    }

    let stopLoss, targetPrice;
    if (action === 'BUY') {
        stopLoss = curRow.close - (slTarget[0] * curRow.atr);
        targetPrice = curRow.close + (slTarget[1] * curRow.atr);
    } else { // SELL
        stopLoss = curRow.close + (slTarget[0] * curRow.atr);
        targetPrice = curRow.close - (slTarget[1] * curRow.atr);
    }

    // Formatting logic from Python: int if > 100 else round 1
    const formatPrice = (p) => p > 100 ? Math.round(p) : parseFloat(p.toFixed(1));

    const formattedStopLoss = formatPrice(stopLoss);
    const formattedTarget = formatPrice(targetPrice);
    const formattedPrice = formatPrice(curRow.close);
    const trailingSl = Math.abs(formattedStopLoss - formattedPrice);

    const fullMessage = `${message}. Stop loss = ${formattedStopLoss} and Target ${formattedTarget}`;

    return {
        symbol: symbol,
        time: curRow.time, // Assuming timestamp is available elsewhere or added to curRow
        type: action,
        price: formattedPrice,
        stopLoss: formattedStopLoss,
        trailingSl: Math.round(trailingSl),
        target: formattedTarget,
        message: fullMessage,
        action: action, // Keep for UI compatibility
        reason: fullMessage // Keep for UI compatibility
    };
};

export const StrategyService = {
    analyzeNewOrder: (candles, symbol) => {
        try {
            if (!candles || candles.length < 50) return null;

            // Prepare data arrays
            const closes = candles.map(c => c.close);
            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);

            // Calculate Indicators
            const ema11 = EMA.calculate({ period: 9, values: closes });
            const ema26 = EMA.calculate({ period: 26, values: closes });
            const rsi = RSI.calculate({ period: 14, values: closes });
            const stoch = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });
            const adx = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
            const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
            const ema9 = EMA.calculate({ period: 9, values: closes }); // For EMA following

            // Helper to get value at index (handling different lengths due to lookback periods)
            const getValue = (arr, indexFromEnd) => {
                if (!arr || arr.length === 0) return null;
                return arr[arr.length - 1 - indexFromEnd];
            };

            // Indices: 0 = current/last, 1 = previous
            const curVal = (arr) => getValue(arr, 0);
            const prevVal = (arr) => getValue(arr, 1);

            // Align indices:
            // candles are typically sorted by time ascending (last is newest).
            // Indicators output aligns with input end.

            const curRow = {
                time: candles[candles.length - 1].time,
                close: closes[closes.length - 1],
                high: highs[highs.length - 1],
                low: lows[lows.length - 1],
                atr: curVal(atr),
                rsi: curVal(rsi),
                stochK: curVal(stoch).k,
                stochD: curVal(stoch).d,
                adx: curVal(adx).adx,
                emaShort: curVal(ema9), // Using 9 for EMA following check
                emaLong: prevVal(ema26) // Just need something to compare, but logic uses 9 vs 26 specific check later
            };

            const prevRow = {
                rsi: prevVal(rsi),
                stochK: prevVal(stoch).k,
                stochD: prevVal(stoch).d,
                adx: prevVal(adx).adx,
                emaShort: prevVal(ema9),
                emaLong: prevVal(ema26) // Warning: this might be misaligned if we strictly follow python 26
            };

            // Re-eval EMA 9 vs 26 specific logic for 'ema_following'
            // In python: ema(candle_data[CLOSE], 9) -> this is EMA 9
            // is_ema_bullish_cross: cur EMA9 > cur EMA26 AND prev EMA9 < prev EMA26
            const curEma9 = curVal(ema9);
            const curEma26 = curVal(ema26);
            const prevEma9 = prevVal(ema9);
            const prevEma26 = prevVal(ema26);


            // EMA 11 vs 26 Trend check (Last 5 candles)
            const ema11Last5 = ema11.slice(-5);
            const ema26Last5 = ema26.slice(-5);

            const allEma11GtEma26 = ema11Last5.every((v, i) => v > ema26Last5[i]);
            const allEma11LtEma26 = ema11Last5.every((v, i) => v < ema26Last5[i]);

            const instName = symbol; // simplified, assumes strictly name matches keys

            // Default threshold lookups
            const getThresh = (map, def) => map[instName] !== undefined ? map[instName] : def;
            const rsiOB = getThresh(over_bought_rsi, 60);
            const rsiOS = getThresh(over_sold_rsi, 40);
            const adxTrend = getThresh(trending_adx, 25);


            // Conditions
            const is_rsi_overbought = curRow.rsi > prevRow.rsi && prevRow.rsi > rsiOB; // Python: cur > prev > OB
            const is_rsi_oversold = curRow.rsi < prevRow.rsi && prevRow.rsi < rsiOS;   // Python: cur < prev < OS
            const is_adx_trending = curRow.adx >= prevRow.adx && prevRow.adx >= adxTrend;

            const is_stoch_bullish = curRow.stochK > curRow.stochD && curRow.stochK > 20 && curRow.stochD > 20 &&
                Math.abs(curRow.stochD - curRow.stochK) > 2 && Math.abs(curRow.stochD - curRow.stochK) < 4;

            const is_stoch_bearish = curRow.stochK < curRow.stochD && curRow.stochK < 60 && curRow.stochD < 60 &&
                Math.abs(curRow.stochD - curRow.stochK) > 2 && Math.abs(curRow.stochD - curRow.stochK) < 4;


            const is_rsi_within_extreme_bullish = curRow.rsi < RSI_EXTREME[0]; // oversold=False in python call means < 30
            const is_rsi_within_extreme_bearish = curRow.rsi > RSI_EXTREME[1]; // oversold=True in python call means > 70


            // Logic Flow
            if (allEma11GtEma26) {
                // Bullish Trend
                // 1. Trend Following
                if (sl_target_map_oversold[instName] && sl_target_map_oversold[instName][0] > 0
                    && is_rsi_overbought && is_stoch_bullish && is_adx_trending) {
                    return createTrade(instName, 'BUY', curRow, sl_target_map_oversold, 'Bullish trend following overbought RSI');
                }

                // 2. Trend Reversal
                // Python: is_rsi_within_extreme(cur_row, True) -> oversold=True -> rsi > 70
                if (sl_target_map_reversal[instName] && sl_target_map_reversal[instName][0] > 0
                    && is_rsi_within_extreme_bearish && is_stoch_bearish) {
                    return createTrade(instName, 'SELL', curRow, sl_target_map_reversal, 'Bearish Trend reversal');
                }

            } else if (allEma11LtEma26) {
                // Bearish Trend
                // 1. Trend Following
                if (sl_target_map_oversold[instName] && sl_target_map_oversold[instName][0] > 0
                    && is_rsi_oversold && is_stoch_bearish && is_adx_trending) {
                    return createTrade(instName, 'SELL', curRow, sl_target_map_oversold, 'Bearish trend following oversold RSI');
                }

                // 2. Trend Reversal
                // Python: is_rsi_within_extreme(cur_row, False) -> oversold=False -> rsi < 30
                if (sl_target_map_reversal[instName] && sl_target_map_reversal[instName][0] > 0
                    && is_rsi_within_extreme_bullish && is_stoch_bullish) {
                    return createTrade(instName, 'BUY', curRow, sl_target_map_reversal, 'Bullish reversal');
                }
            }

            // EMA Following (EMA 9 vs 26 cross)
            if (sl_target_map_ema[instName] && sl_target_map_ema[instName][0] > 0) {
                const is_ema_bullish_cross = curEma9 > curEma26 && prevEma9 < prevEma26;
                const is_ema_bearish_cross = curEma9 < curEma26 && prevEma9 > prevEma26;

                // ATR Check: abs(High - Low) < ATR
                const is_candle_small_enough = Math.abs(curRow.high - curRow.low) < curRow.atr;

                if (is_ema_bullish_cross && is_candle_small_enough) {
                    return createTrade(instName, 'BUY', curRow, sl_target_map_ema, 'Bullish 9,26 EMA cross');
                } else if (is_ema_bearish_cross && is_candle_small_enough) {
                    return createTrade(instName, 'SELL', curRow, sl_target_map_ema, 'Bearish 9,26 EMA cross');
                }
            }

            return { action: 'NONE', reason: 'No signal' };

        } catch (error) {
            console.error("Strategy Analysis Error:", error);
            return { action: 'ERROR', reason: error.message };
        }
    }
};
