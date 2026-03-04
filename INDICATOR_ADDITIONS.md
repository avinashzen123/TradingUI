# New Indicators Added

## Summary
Added 9 new indicators to the system:
- 2 Overlay indicators: WMA, VWAP
- 7 Oscillators: Stochastic, CCI, MFI, ADX, ATR, ROC, Williams %R

## Changes Made

### 1. Redux Store (instrumentAnalysisSlice.js)
✅ Added all 14 indicators to the `available` array with proper `chartType`

### 2. Migration Script (migrateIndicators.js)
✅ Updated to include all new indicators

### 3. CSS (InstrumentAnalysis.css)
✅ Made separate charts dynamic with min/max height instead of fixed height

## Implementation Needed in InstrumentAnalysisView.jsx

### Import Required
Add to imports at top of file:
```javascript
import { SMA, EMA, WMA, BollingerBands, RSI, MACD, Stochastic, CCI, MFI, ADX, ATR, ROC, WilliamsR, VWAP } from 'technicalindicators';
```

### Overlay Indicators (add to plotOverlayIndicator function)

#### WMA (Weighted Moving Average)
```javascript
else if (indicator.id === 'wma') {
    const period = indicator.params.period || 20;
    const values = WMA.calculate({ values: closes, period });
    const data = candleData.slice(period - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    mainChartRef.current.indicatorSeries[`${indicator.id}_${period}`] = series;
}
```

#### VWAP (Volume Weighted Average Price)
```javascript
else if (indicator.id === 'vwap') {
    if (!candleData[0].volume) {
        console.warn('VWAP requires volume data');
        return;
    }
    const values = VWAP.calculate({
        high: candleData.map(c => c.high),
        low: candleData.map(c => c.low),
        close: closes,
        volume: candleData.map(c => c.volume || 0),
    });
    const data = candleData.map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: indicator.name,
    });
    series.setData(data);
    mainChartRef.current.indicatorSeries['vwap'] = series;
}
```

### Oscillators (add to plotSeparateIndicator function)

#### Stochastic
```javascript
else if (indicator.id === 'stochastic') {
    const period = indicator.params.period || 14;
    const signalPeriod = indicator.params.signalPeriod || 3;
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const values = Stochastic.calculate({
        high: highs, low: lows, close: closes,
        period, signalPeriod
    });
    const kData = candleData.slice(period - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx]?.k || 0,
    }));
    const dData = candleData.slice(period - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx]?.d || 0,
    }));
    const kSeries = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: '%K',
    });
    const dSeries = chart.addLineSeries({
        color: '#ec4899', lineWidth: 2, title: '%D',
    });
    kSeries.setData(kData);
    dSeries.setData(dData);
    chartObj.series['k'] = kSeries;
    chartObj.series['d'] = dSeries;
}
```

#### CCI (Commodity Channel Index)
```javascript
else if (indicator.id === 'cci') {
    const period = indicator.params.period || 20;
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const values = CCI.calculate({
        high: highs, low: lows, close: closes, period
    });
    const data = candleData.slice(period - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['cci'] = series;
}
```

#### MFI (Money Flow Index)
```javascript
else if (indicator.id === 'mfi') {
    const period = indicator.params.period || 14;
    if (!candleData[0].volume) {
        console.warn('MFI requires volume data');
        return;
    }
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const volumes = candleData.map(c => c.volume || 0);
    const values = MFI.calculate({
        high: highs, low: lows, close: closes, volume: volumes, period
    });
    const data = candleData.slice(period).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['mfi'] = series;
}
```

#### ADX (Average Directional Index)
```javascript
else if (indicator.id === 'adx') {
    const period = indicator.params.period || 14;
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const values = ADX.calculate({
        high: highs, low: lows, close: closes, period
    });
    const data = candleData.slice(period * 2 - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx]?.adx || 0,
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['adx'] = series;
}
```

#### ATR (Average True Range)
```javascript
else if (indicator.id === 'atr') {
    const period = indicator.params.period || 14;
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const values = ATR.calculate({
        high: highs, low: lows, close: closes, period
    });
    const data = candleData.slice(period).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['atr'] = series;
}
```

#### ROC (Rate of Change)
```javascript
else if (indicator.id === 'roc') {
    const period = indicator.params.period || 12;
    const values = ROC.calculate({ values: closes, period });
    const data = candleData.slice(period).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['roc'] = series;
}
```

#### Williams %R
```javascript
else if (indicator.id === 'willr') {
    const period = indicator.params.period || 14;
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const values = WilliamsR.calculate({
        high: highs, low: lows, close: closes, period
    });
    const data = candleData.slice(period - 1).map((candle, idx) => ({
        time: candle.time, value: values[idx],
    }));
    const series = chart.addLineSeries({
        color: indicator.color, lineWidth: 2, title: `${indicator.name} (${period})`,
    });
    series.setData(data);
    chartObj.series['willr'] = series;
}
```

## Testing
1. Refresh browser to load new indicators list
2. Add any new indicator from the "Add Indicator" modal
3. Verify it plots correctly (overlay on main chart, oscillators in separate charts)
4. Toggle visibility by clicking the indicator chip
5. Edit parameters using the settings icon

## Notes
- VWAP and MFI require volume data in candles
- Separate charts are now dynamic height (120px-180px)
- All indicators persist to localStorage
- Migration runs automatically on app load
