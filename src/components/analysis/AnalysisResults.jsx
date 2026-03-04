import TechnicalIndicatorsGrid from './TechnicalIndicatorsGrid';
import PatternsList from './PatternsList';
import SignalsList from './SignalsList';

/**
 * Container for all analysis results
 */
export default function AnalysisResults({ analysis }) {
    if (!analysis) return null;

    return (
        <div className="analysis-results">
            <h3>Technical Indicators</h3>
            <TechnicalIndicatorsGrid technicalIndicators={analysis.technicalIndicators} />
            <PatternsList patterns={analysis.patterns} />
            <SignalsList signals={analysis.signals} />
        </div>
    );
}
