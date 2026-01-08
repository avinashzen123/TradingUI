import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectDailyData } from '../store/dailyDataSlice';
import { selectWatchlist, addToWatchlist, removeFromWatchlist, updateTimeframe } from '../store/watchlistSlice';
import { InstrumentService } from '../services/InstrumentService';
import { ChartService } from '../services/ChartService';
import { StrategyService } from '../services/StrategyService';
import { isMarketOpen } from '../utils/marketHours';
import { Trash2, Upload, FileText, BarChart2, TrendingUp, AlertCircle, Play, Pause, Clock } from 'lucide-react';
import ChartModal from '../components/ChartModal';

const Watchlist = () => {
    const watchlist = useSelector(selectWatchlist);
    const dailyData = useSelector(selectDailyData);
    const token = dailyData['UPSTOX_TOKEN'];
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);

    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [selectedInstrument, setSelectedInstrument] = useState(null);

    // Analysis State
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [analysisIntervalId, setAnalysisIntervalId] = useState(null);
    const [analysisResults, setAnalysisResults] = useState({}); // { instrument_key: { action, reason, time, status } }
    const [lastRunTime, setLastRunTime] = useState(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (analysisIntervalId) clearInterval(analysisIntervalId);
        };
    }, [analysisIntervalId]);

    const runAnalysisIteration = async () => {
        if (!token) {
            setUploadStatus("Error: UPSTOX_TOKEN missing in Settings. Cannot run analysis.");
            setAnalysisRunning(false);
            return;
        }

        const now = new Date();
        setLastRunTime(now.toLocaleTimeString());

        const newResults = { ...analysisResults };

        // We iterate sequentially to avoid overwhelming browser/network if list is large
        // But for UI responsiveness, we process in chunks or parallel.
        await Promise.all(watchlist.map(async (inst) => {
            const marketStatus = isMarketOpen(inst.exchange || (inst.instrument_key.includes('MCX') ? 'MCX' : 'NSE'));

            if (!marketStatus.isOpen) {
                newResults[inst.instrument_key] = {
                    status: 'Closed',
                    message: marketStatus.message,
                    timestamp: now
                };
                return;
            }

            try {
                // Use per-instrument timeframe or default if missing
                const unit = inst.analysisUnit || 'minutes';
                const interval = inst.analysisInterval || 5;

                // Get enough candles for strategy (Strategy needs ~50)
                const toDate = now.toISOString().split('T')[0];
                const fromDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // extended lookback for larger TFs

                const candles = await ChartService.getHistoricalCandles(token, inst.instrument_key, unit, interval, toDate, fromDate);
                const formatted = ChartService.formatCandleData(candles);

                const result = StrategyService.analyzeNewOrder(formatted, inst.trading_symbol);

                newResults[inst.instrument_key] = {
                    status: 'Active',
                    action: result ? result.action : 'NONE',
                    reason: result ? result.reason : 'No Signal',
                    tradeData: result, // Full trade object
                    timestamp: now
                };

            } catch (err) {
                console.error(`Analysis failed for ${inst.trading_symbol}:`, err);
                newResults[inst.instrument_key] = {
                    status: 'Error',
                    message: 'Fetch/Analysis Failed',
                    timestamp: now
                };
            }
        }));

        setAnalysisResults(newResults);
    };

    const toggleAnalysis = () => {
        if (analysisRunning) {
            // Stop
            if (analysisIntervalId) clearInterval(analysisIntervalId);
            setAnalysisIntervalId(null);
            setAnalysisRunning(false);
        } else {
            // Start
            if (!token) {
                alert("Please add UPSTOX_TOKEN in Settings first.");
                return;
            }
            setAnalysisRunning(true);
            runAnalysisIteration(); // Run immediately once
            // Poll every 1 minute
            const id = setInterval(runAnalysisIteration, 60 * 1000);
            setAnalysisIntervalId(id);
        }
    };


    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus('Reading file...');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

            setUploadStatus(`Processing ${lines.length} symbols...`);

            let addedCount = 0;
            let notFoundCount = 0;

            try {
                const nseInstruments = await InstrumentService.getInstruments('NSE');
                const mcxInstruments = await InstrumentService.getInstruments('MCX');
                const allInstruments = [...nseInstruments, ...mcxInstruments];

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                for (const symbol of lines) {
                    const normalizedSymbol = symbol.toUpperCase();

                    // 1. Find matches: Check if trading_symbol starts with user input or name matches
                    const matches = allInstruments.filter(inst => {
                        return (inst.name && inst.name.toUpperCase() === normalizedSymbol) ||
                            (inst.trading_symbol && inst.trading_symbol.toUpperCase().startsWith(normalizedSymbol));
                    });

                    // 2. Filter by Expiry (> tomorrow)
                    const validMatches = matches.filter(inst => {
                        // Keep instruments without expiry (like EQ)
                        if (!inst.expiry) return true;

                        // Parse expiry (handle ms timestamp or date string)
                        const expiryDate = new Date(Number(inst.expiry) || inst.expiry);
                        return expiryDate > tomorrow;
                    });

                    // 3. Sort by nearest Expiry
                    validMatches.sort((a, b) => {
                        const getExpiryTime = (inst) => {
                            if (!inst.expiry) return 8640000000000000; // Far future
                            return new Date(Number(inst.expiry) || inst.expiry).getTime();
                        };
                        return getExpiryTime(a) - getExpiryTime(b);
                    });

                    const bestMatch = validMatches[0];

                    if (bestMatch) {
                        dispatch(addToWatchlist(bestMatch));
                        addedCount++;
                    } else {
                        notFoundCount++;
                    }
                }
                setUploadStatus(`Processed: Added ${addedCount}, Not Found ${notFoundCount}`);
            } catch (err) {
                setUploadStatus(`Error: ${err.message}`);
                console.error(err);
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const triggerUpload = () => {
        fileInputRef.current.click();
    };

    const isInWatchlist = (key) => watchlist.some(item => item.instrument_key === key);

    const handleTimeframeChange = (key, field, value) => {
        // Find item to get current values to preserve the other field
        const item = watchlist.find(i => i.instrument_key === key);
        if (!item) return;

        const interval = field === 'interval' ? parseInt(value) : item.analysisInterval || 5;
        const unit = field === 'unit' ? value : item.analysisUnit || 'minutes';

        dispatch(updateTimeframe({ instrumentKey: key, interval, unit }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>

            {/* Header & Actions */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} className="text-secondary" /> Your Watchlist
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="file"
                            accept=".txt"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={triggerUpload}
                            disabled={uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {uploading ? <span className="animate-spin"><Upload size={16} /></span> : <Upload size={16} />}
                            Upload Symbols (.txt)
                        </button>
                    </div>
                </div>

                {/* Analysis Controls */}
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        className={`btn ${analysisRunning ? '' : 'btn-primary'}`}
                        onClick={toggleAnalysis}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: analysisRunning ? 'rgba(239, 68, 68, 0.2)' : undefined,
                            color: analysisRunning ? '#ef4444' : undefined,
                            border: analysisRunning ? '1px solid #ef4444' : undefined
                        }}
                    >
                        {analysisRunning ? <><Pause size={16} /> Stop Analysis</> : <><Play size={16} /> Run Analysis</>}
                    </button>

                    {analysisRunning && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
                            <span className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                            Running live check every 1 min
                        </div>
                    )}

                    {lastRunTime && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            Last update: {lastRunTime}
                        </span>
                    )}

                    {!lastRunTime && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Configure timeframes per instrument below. By default: 5 minutes.
                        </span>
                    )}
                </div>

                {uploadStatus && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={16} /> {uploadStatus}
                    </div>
                )}
            </div>

            {/* Watchlist Table */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem' }}>Trading Symbol</th>
                                <th style={{ padding: '0.75rem' }}>Exchange</th>
                                <th style={{ padding: '0.75rem' }}>Timeframe</th>
                                <th style={{ padding: '0.75rem' }}>Market Status</th>
                                <th style={{ padding: '0.75rem' }}>Signal</th>
                                <th style={{ padding: '0.75rem' }}>Details</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlist.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <FileText size={48} style={{ opacity: 0.2 }} />
                                            <p>Your watchlist is empty.</p>
                                            <p style={{ fontSize: '0.875rem' }}>Add from Search or upload a file.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {watchlist.map((inst) => {
                                const result = analysisResults[inst.instrument_key];
                                return (
                                    <tr
                                        key={inst.instrument_key}
                                        style={{ borderBottom: '1px solid var(--border-color)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--accent-color)' }}>{inst.trading_symbol}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inst.name}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: inst.exchange === 'NSE_EQ' || inst.instrument_key.includes('NSE') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: inst.exchange === 'NSE_EQ' || inst.instrument_key.includes('NSE') ? '#10b981' : '#ef4444',
                                                fontSize: '0.75rem'
                                            }}>
                                                {inst.exchange || (inst.instrument_key.includes('MCX') ? 'MCX' : 'NSE')}
                                            </span>
                                        </td>

                                        {/* Timeframe Config Column */}
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    value={inst.analysisInterval || 5}
                                                    onChange={(e) => handleTimeframeChange(inst.instrument_key, 'interval', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: '50px',
                                                        padding: '0.25rem',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem'
                                                    }}
                                                    min="1"
                                                />
                                                <select
                                                    value={inst.analysisUnit || 'minutes'}
                                                    onChange={(e) => handleTimeframeChange(inst.instrument_key, 'unit', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        padding: '0.25rem',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <option value="minutes">min</option>
                                                    <option value="hours">hr</option>
                                                    <option value="days">day</option>
                                                </select>
                                            </div>
                                        </td>

                                        {/* Market Status Column */}
                                        <td style={{ padding: '0.75rem' }}>
                                            {result ? (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: result.status === 'Closed' ? 'rgba(245, 158, 11, 0.1)' :
                                                        result.status === 'Error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: result.status === 'Closed' ? '#f59e0b' :
                                                        result.status === 'Error' ? '#ef4444' : '#10b981'
                                                }}>
                                                    {result.status === 'Closed' ? result.message : result.status}
                                                </span>
                                            ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>-</span>}
                                        </td>

                                        {/* Signal Column */}
                                        <td style={{ padding: '0.75rem' }}>
                                            {result && result.action ? (
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: result.action === 'BUY' ? '#10b981' :
                                                        result.action === 'SELL' ? '#ef4444' : 'var(--text-secondary)'
                                                }}>
                                                    {result.action}
                                                </span>
                                            ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>-</span>}
                                        </td>

                                        {/* Analysis Reason Column */}
                                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', maxWidth: '300px' }} title={result?.reason}>
                                            {result ? (
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {result.reason}
                                                </div>
                                            ) : <span style={{ color: 'var(--text-secondary)' }}>Waiting...</span>}
                                        </td>

                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: 'var(--text-primary)' }}
                                                    title="Open Chart"
                                                    onClick={() => setSelectedInstrument({ key: inst.instrument_key, symbol: inst.trading_symbol })}
                                                >
                                                    <BarChart2 size={18} />
                                                </button>
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: '#ef4444' }}
                                                    title="Remove"
                                                    onClick={() => dispatch(removeFromWatchlist(inst.instrument_key))}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
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

export default Watchlist;
