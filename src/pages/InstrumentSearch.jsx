import React, { useState, useEffect } from 'react';
import { InstrumentService } from '../services/InstrumentService';
import { Search as SearchIcon, Download, Database, Copy } from 'lucide-react';
import ChartModal from '../components/ChartModal';

const InstrumentSearch = () => {
    const [segment, setSegment] = useState('NSE');
    const [query, setQuery] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [instruments, setInstruments] = useState([]); // Full list
    const [results, setResults] = useState([]); // Filtered list
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [selectedInstrument, setSelectedInstrument] = useState(null);

    // Load instruments when segment changes
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setInstruments([]);
            setResults([]);
            setSelectedType('');
            setStatus(`Loading ${segment} instruments...`);

            try {
                const data = await InstrumentService.getInstruments(segment);
                setInstruments(data);
                setStatus(`Loaded ${data.length.toLocaleString()} instruments.`);
            } catch (err) {
                setStatus(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [segment]);

    // Extract unique types
    const instrumentTypes = React.useMemo(() => {
        return [...new Set(instruments.map(i => i.instrument_type))].filter(Boolean).sort();
    }, [instruments]);

    // Handle search
    useEffect(() => {
        if (!instruments.length) return;

        if (query.trim().length === 0 && selectedType === '') { // Modified condition to include selectedType
            setResults([]);
            return;
        }

        // Debounce slightly or just run
        const matched = InstrumentService.search(instruments, query, selectedType);
        setResults(matched);
    }, [query, selectedType, instruments]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // Optional: toast feedback
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={20} className="text-secondary" /> Instrument Search
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                        <button
                            className={`btn ${segment === 'NSE' ? 'btn-primary' : ''}`}
                            onClick={() => setSegment('NSE')}
                            style={{ border: segment !== 'NSE' ? '1px solid var(--border-color)' : 'none' }}
                        >
                            NSE
                        </button>
                        <button
                            className={`btn ${segment === 'MCX' ? 'btn-primary' : ''}`}
                            onClick={() => setSegment('MCX')}
                            style={{ border: segment !== 'MCX' ? '1px solid var(--border-color)' : 'none' }}
                        >
                            MCX
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <SearchIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by Trading Symbol (e.g. RELIANCE, GOLDPETAL)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            color: 'white',
                            borderRadius: 'var(--radius-sm)',
                            outline: 'none',
                            maxWidth: '150px'
                        }}
                    >
                        <option value="">All Types</option>
                        {instrumentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                    {loading ? <span className="animate-spin"><Download size={14} style={{ display: 'inline', marginRight: '0.5rem' }} /> Downloading...</span> : status}
                </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '400px' }}>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem' }}>Trading Symbol</th>
                                <th style={{ padding: '0.75rem' }}>Full Name</th>
                                <th style={{ padding: '0.75rem' }}>Instrument Key</th>
                                <th style={{ padding: '0.75rem' }}>Lot Size</th>
                                <th style={{ padding: '0.75rem' }}>Tick Size</th>
                                <th style={{ padding: '0.75rem' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {query ? 'No matching instruments found.' : 'Start typing to search...'}
                                    </td>
                                </tr>
                            )}
                            {results.map((inst, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedInstrument({
                                        key: inst.instrument_key,
                                        symbol: inst.trading_symbol
                                    })}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: '500', color: 'var(--accent-color)' }}>{inst.trading_symbol}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{inst.name || '-'}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.8em', fontFamily: 'monospace' }}>
                                        {inst.instrument_key}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(inst.instrument_key);
                                            }}
                                            style={{ background: 'none', border: 'none', marginLeft: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            title="Copy Key"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{inst.lot_size}</td>
                                    <td style={{ padding: '0.75rem' }}>{inst.tick_size}</td>
                                    <td style={{ padding: '0.75rem' }}>{inst.instrument_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedInstrument && (
                <ChartModal
                    instrumentKey={selectedInstrument.key}
                    tradingSymbol={selectedInstrument.symbol}
                    onClose={() => setSelectedInstrument(null)}
                />
            )}
        </div>
    );
};

export default InstrumentSearch;
