import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { selectAllInstruments, addInstrument, removeInstrument } from '../store/instrumentAnalysisSlice';
import { InstrumentService } from '../services/InstrumentService';
import InstrumentAnalysisView from '../components/InstrumentAnalysisView';
import { Search, X, Plus, List } from 'lucide-react';
import '../components/InstrumentAnalysis.css';

/**
 * Main dashboard that brings everything together
 * Shows list of instruments and their analysis
 */
export default function AnalysisDashboard() {
    const dispatch = useDispatch();
    const instruments = useSelector(selectAllInstruments);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    
    // Search state
    const [segment, setSegment] = useState('NSE');
    const [query, setQuery] = useState('');
    const [allInstruments, setAllInstruments] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load instruments when segment changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setAllInstruments([]);
            setSearchResults([]);

            try {
                const data = await InstrumentService.getInstruments(segment);
                setAllInstruments(data);
            } catch (err) {
                console.error('Failed to load instruments:', err);
            } finally {
                setLoading(false);
            }
        };
        if (showSearch) {
            loadData();
        }
    }, [segment, showSearch]);

    // Handle search
    useEffect(() => {
        if (!allInstruments.length || !query.trim()) {
            setSearchResults([]);
            return;
        }

        const matched = InstrumentService.search(allInstruments, query, '');
        setSearchResults(matched);
    }, [query, allInstruments]);

    const handleAddInstrument = (inst) => {
        const instrumentKey = inst.instrument_key;
        dispatch(addInstrument({
            instrumentKey,
            instrumentData: {
                name: inst.name || inst.trading_symbol,
                symbol: inst.trading_symbol,
                exchange: inst.exchange || segment,
                lastPrice: 0,
                instrument_key: inst.instrument_key,
                lot_size: inst.lot_size,
                tick_size: inst.tick_size,
                instrument_type: inst.instrument_type,
            }
        }));
        setSelectedInstrument(instrumentKey);
        setShowSearch(false);
        setShowMobileSidebar(false);
        setQuery('');
        setSearchResults([]);
    };

    const handleRemoveInstrument = (instrumentKey) => {
        dispatch(removeInstrument(instrumentKey));
        if (selectedInstrument === instrumentKey) {
            setSelectedInstrument(null);
        }
    };

    const handleSelectInstrument = (key) => {
        setSelectedInstrument(key);
        setShowMobileSidebar(false);
    };

    const instrumentList = Object.entries(instruments);

    return (
        <div className="analysis-dashboard">
            {/* Mobile Overlay */}
            <div 
                className={`mobile-sidebar-overlay ${showMobileSidebar ? 'active' : ''}`}
                onClick={() => setShowMobileSidebar(false)}
            />

            {/* Mobile Floating Action Button */}
            <button 
                className={`mobile-instruments-fab ${instrumentList.length > 0 ? 'has-instruments' : ''}`}
                onClick={() => setShowMobileSidebar(true)}
                title="View Instruments"
            >
                <List size={24} />
                {instrumentList.length > 0 && (
                    <span className="fab-badge">{instrumentList.length}</span>
                )}
            </button>

            <div className="dashboard-layout">
                {/* Sidebar - Instrument List */}
                <div className={`instruments-sidebar ${showMobileSidebar ? 'mobile-open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Instruments</h2>
                        <button onClick={() => setShowSearch(true)} className="add-btn">
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    <div className="instruments-list">
                        {instrumentList.length === 0 ? (
                            <div className="empty-state">
                                <p>No instruments added</p>
                                <button onClick={() => setShowSearch(true)}>
                                    Add your first instrument
                                </button>
                            </div>
                        ) : (
                            instrumentList.map(([key, instrument]) => (
                                <div
                                    key={key}
                                    className={`instrument-card ${selectedInstrument === key ? 'active' : ''}`}
                                    onClick={() => handleSelectInstrument(key)}
                                >
                                    <div className="instrument-info">
                                        <div className="instrument-name">
                                            {instrument.name || instrument.symbol}
                                        </div>
                                        <div className="instrument-symbol">
                                            {instrument.symbol}
                                        </div>
                                        <div className="instrument-timeframe">
                                            {instrument.timeframe}
                                        </div>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveInstrument(key);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content - Analysis View */}
                <div className="main-content">
                    {selectedInstrument ? (
                        <InstrumentAnalysisView instrumentKey={selectedInstrument} />
                    ) : (
                        <div className="empty-analysis">
                            <h2>Select an instrument to view analysis</h2>
                            <p>Choose from the sidebar or add a new instrument</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Modal */}
            {showSearch && (
                <div className="search-modal-overlay" onClick={() => setShowSearch(false)}>
                    <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="search-modal-header">
                            <h2>Add Instrument</h2>
                            <button className="close-btn" onClick={() => setShowSearch(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="search-modal-body">
                            {/* Segment Selector */}
                            <div className="segment-selector">
                                <button
                                    className={`segment-btn ${segment === 'NSE' ? 'active' : ''}`}
                                    onClick={() => setSegment('NSE')}
                                >
                                    NSE
                                </button>
                                <button
                                    className={`segment-btn ${segment === 'MCX' ? 'active' : ''}`}
                                    onClick={() => setSegment('MCX')}
                                >
                                    MCX
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="search-input-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by Trading Symbol (e.g. RELIANCE, GOLDPETAL)"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="search-input"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results */}
                            <div className="search-results">
                                {loading && (
                                    <div className="search-loading">Loading instruments...</div>
                                )}
                                {!loading && searchResults.length === 0 && query && (
                                    <div className="search-empty">No matching instruments found</div>
                                )}
                                {!loading && searchResults.length === 0 && !query && (
                                    <div className="search-empty">Start typing to search...</div>
                                )}
                                {searchResults.map((inst, idx) => (
                                    <div
                                        key={idx}
                                        className="search-result-item"
                                        onClick={() => handleAddInstrument(inst)}
                                    >
                                        <div className="result-main">
                                            <div className="result-symbol">{inst.trading_symbol}</div>
                                            <div className="result-name">{inst.name || '-'}</div>
                                        </div>
                                        <div className="result-details">
                                            <span className="result-type">{inst.instrument_type}</span>
                                            <span className="result-key">{inst.instrument_key}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
