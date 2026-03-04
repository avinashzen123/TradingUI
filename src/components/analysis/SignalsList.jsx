/**
 * List of trading signals
 */
export default function SignalsList({ signals }) {
    if (!signals || signals.length === 0) return null;

    return (
        <div className="signals-section">
            <h3>Recent Signals</h3>
            <div className="signals-list">
                {signals.slice(-5).reverse().map((signal, idx) => (
                    <div 
                        key={idx} 
                        className={`signal-item signal-${signal.type.toLowerCase()}`}
                    >
                        <span className="signal-type">{signal.type}</span>
                        <span className="signal-strength">{signal.strength}</span>
                        <span className="signal-reason">{signal.reason}</span>
                        <span className="signal-time">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
