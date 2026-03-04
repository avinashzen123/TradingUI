/**
 * Custom Technical Indicators
 * Implementations for indicators not available in technicalindicators library
 */

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(values, period) {
    if (values.length < period) return [];
    
    const k = 2 / (period + 1);
    const emaArray = [values[0]];
    
    for (let i = 1; i < values.length; i++) {
        emaArray.push(values[i] * k + emaArray[i - 1] * (1 - k));
    }
    
    return emaArray;
}

/**
 * Calculate Weighted Moving Average (WMA)
 */
export function calculateWMA(values, period) {
    console.log(`[WMA] Input: ${values?.length} values, period: ${period}`);
    
    if (!values || values.length < period) {
        console.warn(`[WMA] Insufficient data. Need ${period}, got ${values?.length || 0}`);
        return [];
    }
    
    // Calculate weights: 1, 2, 3, ..., period
    const weights = [];
    let weightSum = 0;
    for (let i = 1; i <= period; i++) {
        weights.push(i);
        weightSum += i;
    }
    
    console.log(`[WMA] Weights sum: ${weightSum}, weights: [${weights.slice(0, 5).join(', ')}...]`);
    
    const wmaArray = [];
    
    // Calculate WMA for each position
    for (let i = period - 1; i < values.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += values[i - period + 1 + j] * weights[j];
        }
        wmaArray.push(sum / weightSum);
    }
    
    console.log(`[WMA] Output: ${wmaArray.length} values, first: ${wmaArray[0]?.toFixed(2)}, last: ${wmaArray[wmaArray.length - 1]?.toFixed(2)}`);
    
    return wmaArray;
}

/**
 * Calculate Hull Moving Average (HMA)
 * HMA = WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
 */
export function calculateHMA(values, period) {
    console.log(`[HMA] Starting calculation with ${values?.length} values, period: ${period}`);
    
    if (!values || values.length < period) {
        console.error(`[HMA] Insufficient data. Need ${period}, got ${values?.length || 0}`);
        return [];
    }
    
    const halfPeriod = Math.floor(period / 2);
    const sqrtPeriod = Math.floor(Math.sqrt(period));
    
    console.log(`[HMA] Calculated periods - half: ${halfPeriod}, sqrt: ${sqrtPeriod}`);
    
    // Calculate WMA with half period
    console.log(`[HMA] Step 1: Calculating WMA with half period (${halfPeriod})`);
    const wmaHalf = calculateWMA(values, halfPeriod);
    if (wmaHalf.length === 0) {
        console.error('[HMA] WMA half calculation failed');
        return [];
    }
    console.log(`[HMA] WMA half result: ${wmaHalf.length} values`);
    
    // Calculate WMA with full period
    console.log(`[HMA] Step 2: Calculating WMA with full period (${period})`);
    const wmaFull = calculateWMA(values, period);
    if (wmaFull.length === 0) {
        console.error('[HMA] WMA full calculation failed');
        return [];
    }
    console.log(`[HMA] WMA full result: ${wmaFull.length} values`);
    
    // Calculate 2 * WMA(n/2) - WMA(n)
    console.log(`[HMA] Step 3: Calculating difference (2 * WMA_half - WMA_full)`);
    const diff = [];
    const startIdx = wmaHalf.length - wmaFull.length;
    
    console.log(`[HMA] Start index for alignment: ${startIdx}`);
    
    for (let i = 0; i < wmaFull.length; i++) {
        const diffValue = 2 * wmaHalf[startIdx + i] - wmaFull[i];
        diff.push(diffValue);
    }
    
    console.log(`[HMA] Diff array: ${diff.length} values, first: ${diff[0]?.toFixed(2)}, last: ${diff[diff.length - 1]?.toFixed(2)}`);
    
    // Calculate WMA of the difference with sqrt period
    console.log(`[HMA] Step 4: Calculating final WMA with sqrt period (${sqrtPeriod})`);
    const hma = calculateWMA(diff, sqrtPeriod);
    
    console.log(`[HMA] ✅ Final result: ${hma.length} values`);
    if (hma.length > 0) {
        console.log(`[HMA] First value: ${hma[0]?.toFixed(2)}, Last value: ${hma[hma.length - 1]?.toFixed(2)}`);
        console.log(`[HMA] Sample values (first 5):`, hma.slice(0, 5).map(v => v.toFixed(2)));
    }
    
    return hma;
}

/**
 * Calculate Hull EMA (HEMA) - Custom variant using EMA instead of WMA
 * HEMA = EMA(2 * EMA(n/2) - EMA(n), sqrt(n))
 */
export function calculateHEMA(values, period) {
    if (values.length < period) return [];
    
    const halfPeriod = Math.max(1, Math.round(period / 2));
    const sqrtPeriod = Math.max(1, Math.round(Math.sqrt(period)));
    
    // Calculate EMA with half period
    const emaHalf = calculateEMA(values, halfPeriod);
    
    // Calculate EMA with full period
    const emaFull = calculateEMA(values, period);
    
    // Calculate 2 * EMA(n/2) - EMA(n)
    const diff = [];
    for (let i = 0; i < values.length; i++) {
        diff.push(2 * emaHalf[i] - emaFull[i]);
    }
    
    // Calculate EMA of the difference with sqrt period
    const hema = calculateEMA(diff, sqrtPeriod);
    
    return hema;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(values, period) {
    if (values.length < period) return [];
    
    const smaArray = [];
    for (let i = period - 1; i < values.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += values[i - j];
        }
        smaArray.push(sum / period);
    }
    
    return smaArray;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(values, period, stdDev = 2) {
    if (values.length < period) return [];
    
    const sma = calculateSMA(values, period);
    const bands = [];
    
    for (let i = period - 1; i < values.length; i++) {
        const slice = values.slice(i - period + 1, i + 1);
        const mean = sma[i - period + 1];
        
        // Calculate standard deviation
        const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const std = Math.sqrt(variance);
        
        bands.push({
            upper: mean + (stdDev * std),
            middle: mean,
            lower: mean - (stdDev * std)
        });
    }
    
    return bands;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(values, period = 14) {
    if (values.length < period + 1) return [];
    
    const changes = [];
    for (let i = 1; i < values.length; i++) {
        changes.push(values[i] - values[i - 1]);
    }
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsiArray = [];
    
    // First RSI value
    const rs = avgGain / avgLoss;
    rsiArray.push(100 - (100 / (1 + rs)));
    
    // Subsequent RSI values using smoothed averages
    for (let i = period; i < changes.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
        
        const rs = avgGain / avgLoss;
        rsiArray.push(100 - (100 / (1 + rs)));
    }
    
    return rsiArray;
}

/**
 * Calculate Stochastic RSI
 */
export function calculateStochasticRSI(values, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
    const rsi = calculateRSI(values, rsiPeriod);
    
    if (rsi.length < stochPeriod) return [];
    
    const stochRSI = [];
    
    for (let i = stochPeriod - 1; i < rsi.length; i++) {
        const rsiSlice = rsi.slice(i - stochPeriod + 1, i + 1);
        const minRSI = Math.min(...rsiSlice);
        const maxRSI = Math.max(...rsiSlice);
        
        const stoch = maxRSI === minRSI ? 0 : ((rsi[i] - minRSI) / (maxRSI - minRSI)) * 100;
        stochRSI.push(stoch);
    }
    
    // Calculate %K (SMA of Stochastic RSI)
    const k = calculateSMA(stochRSI, kPeriod);
    
    // Calculate %D (SMA of %K)
    const d = calculateSMA(k, dPeriod);
    
    // Align arrays
    const result = [];
    const offset = kPeriod + dPeriod - 2;
    for (let i = 0; i < d.length; i++) {
        result.push({
            k: k[i + dPeriod - 1],
            d: d[i]
        });
    }
    
    return result;
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(highs, lows, closes, volumes) {
    if (highs.length !== lows.length || lows.length !== closes.length || closes.length !== volumes.length) {
        throw new Error('All arrays must have the same length');
    }
    
    const vwap = [];
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;
    
    for (let i = 0; i < closes.length; i++) {
        const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
        cumulativeTPV += typicalPrice * volumes[i];
        cumulativeVolume += volumes[i];
        
        vwap.push(cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume);
    }
    
    return vwap;
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < 2) return [];
    
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
        const high = highs[i];
        const low = lows[i];
        const prevClose = closes[i - 1];
        
        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        
        trueRanges.push(tr);
    }
    
    // Calculate ATR using EMA
    const atr = calculateEMA(trueRanges, period);
    
    return atr;
}

/**
 * Calculate ADX (Average Directional Index)
 */
export function calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return [];
    
    const tr = [];
    const plusDM = [];
    const minusDM = [];
    
    // Calculate True Range and Directional Movement
    for (let i = 1; i < highs.length; i++) {
        const high = highs[i];
        const low = lows[i];
        const prevHigh = highs[i - 1];
        const prevLow = lows[i - 1];
        const prevClose = closes[i - 1];
        
        // True Range
        const trValue = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );
        tr.push(trValue);
        
        // Directional Movement
        const upMove = high - prevHigh;
        const downMove = prevLow - low;
        
        plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
        minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }
    
    // Smooth the values
    const smoothedTR = calculateEMA(tr, period);
    const smoothedPlusDM = calculateEMA(plusDM, period);
    const smoothedMinusDM = calculateEMA(minusDM, period);
    
    // Calculate DI+ and DI-
    const plusDI = [];
    const minusDI = [];
    
    for (let i = 0; i < smoothedTR.length; i++) {
        plusDI.push(smoothedTR[i] === 0 ? 0 : (smoothedPlusDM[i] / smoothedTR[i]) * 100);
        minusDI.push(smoothedTR[i] === 0 ? 0 : (smoothedMinusDM[i] / smoothedTR[i]) * 100);
    }
    
    // Calculate DX
    const dx = [];
    for (let i = 0; i < plusDI.length; i++) {
        const sum = plusDI[i] + minusDI[i];
        const diff = Math.abs(plusDI[i] - minusDI[i]);
        dx.push(sum === 0 ? 0 : (diff / sum) * 100);
    }
    
    // Calculate ADX
    const adx = calculateEMA(dx, period);
    
    // Return with DI values
    const result = [];
    for (let i = 0; i < adx.length; i++) {
        result.push({
            adx: adx[i],
            plusDI: plusDI[i + dx.length - adx.length],
            minusDI: minusDI[i + dx.length - adx.length]
        });
    }
    
    return result;
}
