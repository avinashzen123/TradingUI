import { useDispatch, useSelector } from 'react-redux';
import { updateTimeframe, selectInstrumentTimeframe } from '../store/instrumentAnalysisSlice';

const TIMEFRAMES = [
    { value: '1m', label: '1 Min' },
    { value: '5m', label: '5 Min' },
    { value: '15m', label: '15 Min' },
    { value: '30m', label: '30 Min' },
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: '1 Day' },
];

export default function TimeframeSelector({ instrumentKey }) {
    const dispatch = useDispatch();
    const currentTimeframe = useSelector(selectInstrumentTimeframe(instrumentKey));

    const handleTimeframeChange = (e) => {
        dispatch(updateTimeframe({
            instrumentKey,
            timeframe: e.target.value,
        }));
    };

    return (
        <div className="timeframe-selector">
            <label htmlFor="timeframe">Timeframe: </label>
            <select
                id="timeframe"
                value={currentTimeframe || '5m'}
                onChange={handleTimeframeChange}
            >
                {TIMEFRAMES.map(tf => (
                    <option key={tf.value} value={tf.value}>
                        {tf.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
