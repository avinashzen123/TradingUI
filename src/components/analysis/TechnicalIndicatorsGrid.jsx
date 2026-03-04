/**
 * Grid display of technical indicators
 */
export default function TechnicalIndicatorsGrid({ technicalIndicators }) {
    if (!technicalIndicators) return null;

    const getRSIClass = (rsi) => {
        if (!rsi) return '';
        if (rsi < 30) return 'oversold';
        if (rsi > 70) return 'overbought';
        return 'neutral';
    };

    return (
        <div className="indicators-grid">
            <div className="indicator">
                <span className="label">Current Price:</span>
                <span className="value">
                    {technicalIndicators.currentPrice?.toFixed(2)}
                </span>
            </div>
            
            <div className="indicator">
                <span className="label">RSI (14):</span>
                <span className={`value ${getRSIClass(technicalIndicators.rsi)}`}>
                    {technicalIndicators.rsi?.toFixed(2)}
                </span>
            </div>
            
            <div className="indicator">
                <span className="label">SMA (20):</span>
                <span className="value">
                    {technicalIndicators.sma20?.toFixed(2)}
                </span>
            </div>
            
            <div className="indicator">
                <span className="label">SMA (50):</span>
                <span className="value">
                    {technicalIndicators.sma50?.toFixed(2)}
                </span>
            </div>
            
            {technicalIndicators.macd && (
                <>
                    <div className="indicator">
                        <span className="label">MACD:</span>
                        <span className="value">
                            {technicalIndicators.macd.MACD?.toFixed(2)}
                        </span>
                    </div>
                    <div className="indicator">
                        <span className="label">Signal:</span>
                        <span className="value">
                            {technicalIndicators.macd.signal?.toFixed(2)}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
