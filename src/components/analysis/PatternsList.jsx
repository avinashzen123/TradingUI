/**
 * List of detected patterns
 */
export default function PatternsList({ patterns }) {
    if (!patterns || patterns.length === 0) return null;

    return (
        <div className="patterns-section">
            <h3>Recent Patterns</h3>
            <div className="patterns-list">
                {patterns.slice(-5).reverse().map((pattern, idx) => (
                    <div key={idx} className="pattern-item">
                        <span className="pattern-type">{pattern.type}</span>
                        <span className="pattern-confidence">
                            Confidence: {(pattern.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="pattern-time">
                            {new Date(pattern.detectedAt).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
