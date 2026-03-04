import { SMA, EMA, WMA, BollingerBands, RSI, MACD, Stochastic, CCI, MFI, ADX, ATR, ROC, WilliamsR, VWAP } from 'technicalindicators';
import { 
    calculateSMA as customSMA, 
    calculateEMA as customEMA, 
    calculateWMA as customWMA, 
    calculateBollingerBands as customBB, 
    calculateVWAP as customVWAP,
    calculateATR as customATR,
    calculateADX as customADX,
    calculateHMA as customHMA
} from '../../utils/customIndicators';

/**
 * Utility class for plotting indicators on charts
 * Separates indicator calculation and plotting logic
 */
export class IndicatorPlotter {
    /**
     * Plot overlay indicators (SMA, EMA, BB, etc.) on main chart
     */
    static plotOverlay(indicator, candleData, chart, seriesRegistry) {
        console.log(`[IndicatorPlotter] plotOverlay called for: ${indicator.id}`, {
            indicatorName: indicator.name,
            params: indicator.params,
            candleDataLength: candleData.length,
            chartType: indicator.chartType
        });
        
        const closes = candleData.map(c => c.close);
        console.log(`[IndicatorPlotter] Extracted ${closes.length} close prices, range: ${Math.min(...closes).toFixed(2)} - ${Math.max(...closes).toFixed(2)}`);

        switch (indicator.id) {
            case 'sma':
                return this.plotSMA(indicator, candleData, closes, chart, seriesRegistry);
            case 'ema':
                return this.plotEMA(indicator, candleData, closes, chart, seriesRegistry);
            case 'wma':
                return this.plotWMA(indicator, candleData, closes, chart, seriesRegistry);
            case 'hma':
                return this.plotHMA(indicator, candleData, closes, chart, seriesRegistry);
            case 'bb':
                return this.plotBollingerBands(indicator, candleData, closes, chart, seriesRegistry);
            case 'vwap':
                return this.plotVWAP(indicator, candleData, closes, chart, seriesRegistry);
            default:
                console.warn(`[IndicatorPlotter] Unknown overlay indicator: ${indicator.id}`);
        }
    }

    /**
     * Plot separate indicators (RSI, MACD, etc.) on their own chart
     */
    static plotSeparate(indicator, candleData, chart, seriesRegistry) {
        const closes = candleData.map(c => c.close);

        switch (indicator.id) {
            case 'rsi':
                return this.plotRSI(indicator, candleData, closes, chart, seriesRegistry);
            case 'macd':
                return this.plotMACD(indicator, candleData, closes, chart, seriesRegistry);
            case 'stochastic':
                return this.plotStochastic(indicator, candleData, closes, chart, seriesRegistry);
            case 'cci':
                return this.plotCCI(indicator, candleData, closes, chart, seriesRegistry);
            case 'mfi':
                return this.plotMFI(indicator, candleData, closes, chart, seriesRegistry);
            case 'adx':
                return this.plotADX(indicator, candleData, closes, chart, seriesRegistry);
            case 'atr':
                return this.plotATR(indicator, candleData, closes, chart, seriesRegistry);
            case 'roc':
                return this.plotROC(indicator, candleData, closes, chart, seriesRegistry);
            case 'willr':
                return this.plotWilliamsR(indicator, candleData, closes, chart, seriesRegistry);
            default:
                console.warn(`Unknown separate indicator: ${indicator.id}`);
        }
    }

    // === OVERLAY INDICATORS ===

    static plotSMA(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 20;
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = SMA.calculate({ values: closes, period });
        } catch (error) {
            console.warn('Using custom SMA implementation:', error);
            values = customSMA(closes, period);
        }
        
        const data = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry[`${indicator.id}_${period}`] = series;
    }

    static plotEMA(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 12;
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = EMA.calculate({ values: closes, period });
        } catch (error) {
            console.warn('Using custom EMA implementation:', error);
            values = customEMA(closes, period);
        }
        
        const data = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry[`${indicator.id}_${period}`] = series;
    }

    static plotWMA(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 20;
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = WMA.calculate({ values: closes, period });
        } catch (error) {
            console.warn('Using custom WMA implementation:', error);
            values = customWMA(closes, period);
        }
        
        const data = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry[`${indicator.id}_${period}`] = series;
    }

    static plotHMA(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 20;
        
        console.log(`[plotHMA] ========== Starting HMA Plot ==========`);
        console.log(`[plotHMA] Period: ${period}`);
        console.log(`[plotHMA] Candle data length: ${candleData.length}`);
        console.log(`[plotHMA] Close prices length: ${closes.length}`);
        console.log(`[plotHMA] First 5 closes:`, closes.slice(0, 5).map(c => c.toFixed(2)));
        console.log(`[plotHMA] Last 5 closes:`, closes.slice(-5).map(c => c.toFixed(2)));
        
        // HMA not available in library, use custom implementation
        console.log(`[plotHMA] Calling customHMA...`);
        const values = customHMA(closes, period);
        
        console.log(`[plotHMA] customHMA returned:`, {
            isArray: Array.isArray(values),
            length: values?.length,
            type: typeof values
        });
        
        if (!values || values.length === 0) {
            console.error('[plotHMA] ❌ HMA calculation returned no values');
            console.error('[plotHMA] This could be due to:');
            console.error('[plotHMA] 1. Insufficient data (need at least period candles)');
            console.error('[plotHMA] 2. Calculation error in WMA');
            console.error('[plotHMA] 3. Invalid period parameter');
            return;
        }
        
        console.log(`[plotHMA] ✅ HMA calculated ${values.length} values`);
        console.log(`[plotHMA] HMA value range: ${Math.min(...values).toFixed(2)} - ${Math.max(...values).toFixed(2)}`);
        console.log(`[plotHMA] First 5 HMA values:`, values.slice(0, 5).map(v => v.toFixed(2)));
        console.log(`[plotHMA] Last 5 HMA values:`, values.slice(-5).map(v => v.toFixed(2)));
        
        // HMA calculation reduces data points, need to align with candle data
        const offset = candleData.length - values.length;
        
        console.log(`[plotHMA] Alignment offset: ${offset}`);
        
        if (offset < 0) {
            console.error('[plotHMA] ❌ More HMA values than candles - something is wrong');
            console.error(`[plotHMA] Candles: ${candleData.length}, HMA values: ${values.length}`);
            return;
        }
        
        const data = values.map((value, idx) => ({
            time: candleData[offset + idx].time,
            value: value
        }));

        console.log(`[plotHMA] Created ${data.length} data points for chart`);
        console.log(`[plotHMA] First data point:`, {
            time: data[0]?.time,
            value: data[0]?.value?.toFixed(2)
        });
        console.log(`[plotHMA] Last data point:`, {
            time: data[data.length - 1]?.time,
            value: data[data.length - 1]?.value?.toFixed(2)
        });

        console.log(`[plotHMA] Creating line series with color: ${indicator.color}`);
        
        try {
            const series = chart.addLineSeries({
                color: indicator.color,
                lineWidth: 2,
                title: `${indicator.name} (${period})`
            });
            
            console.log(`[plotHMA] Line series created, setting data...`);
            series.setData(data);
            
            console.log(`[plotHMA] Data set on series`);
            seriesRegistry[`${indicator.id}_${period}`] = series;
            
            console.log(`[plotHMA] ✅ Series registered as: ${indicator.id}_${period}`);
            console.log(`[plotHMA] ========== HMA Plot Complete ==========`);
        } catch (error) {
            console.error('[plotHMA] ❌ Error creating or setting series:', error);
            console.error('[plotHMA] Error details:', {
                message: error.message,
                stack: error.stack
            });
        }
    }

    static plotBollingerBands(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 20;
        const stdDev = indicator.params.stdDev || 2;
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = BollingerBands.calculate({ values: closes, period, stdDev });
        } catch (error) {
            console.warn('Using custom Bollinger Bands implementation:', error);
            values = customBB(closes, period, stdDev);
        }

        const upperData = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx].upper
        }));
        const middleData = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx].middle
        }));
        const lowerData = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx].lower
        }));

        const upperSeries = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 1,
            lineStyle: 2,
            title: `BB Upper (${period}, ${stdDev})`
        });
        const middleSeries = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 1,
            title: `BB Middle (${period})`
        });
        const lowerSeries = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 1,
            lineStyle: 2,
            title: `BB Lower (${period}, ${stdDev})`
        });

        upperSeries.setData(upperData);
        middleSeries.setData(middleData);
        lowerSeries.setData(lowerData);

        seriesRegistry[`bb_upper_${period}`] = upperSeries;
        seriesRegistry[`bb_middle_${period}`] = middleSeries;
        seriesRegistry[`bb_lower_${period}`] = lowerSeries;
    }

    static plotVWAP(indicator, candleData, closes, chart, seriesRegistry) {
        if (!candleData[0].volume) {
            console.warn('VWAP requires volume data');
            return;
        }

        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        const volumes = candleData.map(c => c.volume || 0);
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = VWAP.calculate({ high: highs, low: lows, close: closes, volume: volumes });
        } catch (error) {
            console.warn('Using custom VWAP implementation:', error);
            values = customVWAP(highs, lows, closes, volumes);
        }

        const data = candleData.map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: indicator.name
        });
        series.setData(data);
        seriesRegistry['vwap'] = series;
    }

    // === SEPARATE INDICATORS ===

    static plotRSI(indicator, candleData, closes, chart, seriesRegistry) {
        console.log('[plotRSI] Starting RSI plot');
        const period = indicator.params.period || 14;
        console.log('[plotRSI] Period:', period, 'Data length:', closes.length);
        
        const values = RSI.calculate({ values: closes, period });
        console.log('[plotRSI] RSI values calculated:', values.length);
        
        const data = candleData.slice(period).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));
        console.log('[plotRSI] Data points created:', data.length);

        console.log('[plotRSI] Creating line series...');
        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        console.log('[plotRSI] Setting data on series...');
        series.setData(data);
        seriesRegistry['rsi'] = series;
        console.log('[plotRSI] ✅ RSI series created and registered');

        // Add overbought/oversold lines
        console.log('[plotRSI] Adding overbought/oversold lines...');
        const overboughtLine = chart.addLineSeries({
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: 2,
            title: 'Overbought (70)'
        });
        const oversoldLine = chart.addLineSeries({
            color: '#10b981',
            lineWidth: 1,
            lineStyle: 2,
            title: 'Oversold (30)'
        });

        overboughtLine.setData(candleData.slice(period).map(c => ({ time: c.time, value: 70 })));
        oversoldLine.setData(candleData.slice(period).map(c => ({ time: c.time, value: 30 })));

        seriesRegistry['overbought'] = overboughtLine;
        seriesRegistry['oversold'] = oversoldLine;
        console.log('[plotRSI] ✅ Overbought/oversold lines added');
    }

    static plotMACD(indicator, candleData, closes, chart, seriesRegistry) {
        console.log('[plotMACD] Starting MACD plot');
        const { fast, slow, signal } = indicator.params;
        console.log('[plotMACD] Params - Fast:', fast, 'Slow:', slow, 'Signal:', signal);
        console.log('[plotMACD] Data length:', closes.length);
        
        const values = MACD.calculate({
            values: closes,
            fastPeriod: fast || 12,
            slowPeriod: slow || 26,
            signalPeriod: signal || 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
        console.log('[plotMACD] MACD values calculated:', values.length);

        const macdData = candleData.slice(slow - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.MACD || 0
        }));
        const signalData = candleData.slice(slow - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.signal || 0
        }));
        const histogramData = candleData.slice(slow - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.histogram || 0,
            color: (values[idx]?.histogram || 0) >= 0 ? '#10b981' : '#ef4444'
        }));
        console.log('[plotMACD] Data points created - MACD:', macdData.length, 'Signal:', signalData.length, 'Histogram:', histogramData.length);

        console.log('[plotMACD] Creating series...');
        const macdSeries = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: 'MACD'
        });
        const signalSeries = chart.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            title: 'Signal'
        });
        const histogramSeries = chart.addHistogramSeries({ title: 'Histogram' });
        console.log('[plotMACD] Series created, setting data...');

        macdSeries.setData(macdData);
        signalSeries.setData(signalData);
        histogramSeries.setData(histogramData);

        seriesRegistry['macd'] = macdSeries;
        seriesRegistry['signal'] = signalSeries;
        seriesRegistry['histogram'] = histogramSeries;
        console.log('[plotMACD] ✅ All MACD series created and registered');
    }

    static plotStochastic(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 14;
        const signalPeriod = indicator.params.signalPeriod || 3;
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        const values = Stochastic.calculate({ high: highs, low: lows, close: closes, period, signalPeriod });

        const kData = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.k || 0
        }));
        const dData = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.d || 0
        }));

        const kSeries = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: '%K'
        });
        const dSeries = chart.addLineSeries({
            color: '#ec4899',
            lineWidth: 2,
            title: '%D'
        });

        kSeries.setData(kData);
        dSeries.setData(dData);

        seriesRegistry['k'] = kSeries;
        seriesRegistry['d'] = dSeries;
    }

    static plotCCI(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 20;
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        const values = CCI.calculate({ high: highs, low: lows, close: closes, period });

        const data = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['cci'] = series;
    }

    static plotMFI(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 14;
        if (!candleData[0].volume) {
            console.warn('MFI requires volume data');
            return;
        }

        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        const volumes = candleData.map(c => c.volume || 0);
        const values = MFI.calculate({ high: highs, low: lows, close: closes, volume: volumes, period });

        const data = candleData.slice(period).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['mfi'] = series;
    }

    static plotADX(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 14;
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = ADX.calculate({ high: highs, low: lows, close: closes, period });
        } catch (error) {
            console.warn('Using custom ADX implementation:', error);
            values = customADX(highs, lows, closes, period);
        }

        const data = candleData.slice(period * 2 - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]?.adx || 0
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['adx'] = series;
    }

    static plotATR(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 14;
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        
        // Prefer library implementation, fallback to custom
        let values;
        try {
            values = ATR.calculate({ high: highs, low: lows, close: closes, period });
        } catch (error) {
            console.warn('Using custom ATR implementation:', error);
            values = customATR(highs, lows, closes, period);
        }

        const data = candleData.slice(period).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['atr'] = series;
    }

    static plotROC(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 12;
        const values = ROC.calculate({ values: closes, period });

        const data = candleData.slice(period).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['roc'] = series;
    }

    static plotWilliamsR(indicator, candleData, closes, chart, seriesRegistry) {
        const period = indicator.params.period || 14;
        const highs = candleData.map(c => c.high);
        const lows = candleData.map(c => c.low);
        const values = WilliamsR.calculate({ high: highs, low: lows, close: closes, period });

        const data = candleData.slice(period - 1).map((candle, idx) => ({
            time: candle.time,
            value: values[idx]
        }));

        const series = chart.addLineSeries({
            color: indicator.color,
            lineWidth: 2,
            title: `${indicator.name} (${period})`
        });
        series.setData(data);
        seriesRegistry['willr'] = series;
    }
}
