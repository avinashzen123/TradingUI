import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectDailyData } from '../store/dailyDataSlice';
import { selectWatchlist, addToWatchlist, removeFromWatchlist, updateTimeframe } from '../store/watchlistSlice';
import { InstrumentService } from '../services/InstrumentService';
import { ChartService } from '../services/ChartService';
import { analyzeWithStrategies } from '../strategy_v1';
import { isMarketOpen, getMarketOpenTime } from '../utils/marketHours';
import { Trash2, Upload, FileText, BarChart2, TrendingUp, AlertCircle, Play, Pause, Clock, Bell } from 'lucide-react';
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
    const [nextAnalysisTimes, setNextAnalysisTimes] = useState({}); // { instrument_key: nextRunTimeStamp }
    const [analysisResults, setAnalysisResults] = useState({}); // { instrument_key: { action, reason, time, status } }
    const [lastRunTime, setLastRunTime] = useState(null);
    const workerRef = useRef(null);

    // Initialize Web Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../utils/timer.worker.js', import.meta.url));
        workerRef.current.onmessage = (e) => {
            if (e.data === 'tick') {
                checkAndRunAnalysis();
            }
        };

        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, [watchlist, analysisRunning]); // Re-bind if watchlist changes might be needed, or use ref for watchlist

    // Use ref to access latest state in worker callback without constant re-binding
    const watchlistRef = useRef(watchlist);
    const analysisRunningRef = useRef(analysisRunning);
    const nextAnalysisTimesRef = useRef({});
    const tokenRef = useRef(token);

    useEffect(() => {
        watchlistRef.current = watchlist;
        analysisRunningRef.current = analysisRunning;
        tokenRef.current = token;
        // Keep local ref in sync for checking
        // but nextAnalysisTimes state update triggers re-render, so we use state for UI, ref for logic if acceptable.
        // Better: use state in Effect dependency if cost is low, OR use functional updates.
        // Let's use Refs for the Check Logic to avoid re-creating the worker handler constantly.
    }, [watchlist, analysisRunning, token]);

    // Update ref when state changes
    useEffect(() => {
        nextAnalysisTimesRef.current = nextAnalysisTimes;
    }, [nextAnalysisTimes]);

    const calculateNextTriggerTime = (inst, now = new Date()) => {
        const exchange = inst.exchange || (inst.instrument_key.includes('MCX') ? 'MCX' : 'NSE');
        const openTime = getMarketOpenTime(exchange);

        // If Market Open is in future (e.g. tomorrow), start from there.
        // If today is weekend, getMarketOpenTime should probably handle "next market open" or we just skip.
        // For simplicity: assume purely intraday logic relative to Today's Open.

        const unit = inst.analysisUnit || 'minutes';
        const intervalVal = parseInt(inst.analysisInterval || 5);

        let intervalMs = 0;
        if (unit === 'hours') intervalMs = intervalVal * 60 * 60 * 1000;
        else if (unit === 'days') intervalMs = intervalVal * 24 * 60 * 60 * 1000;
        else intervalMs = intervalVal * 60 * 1000;

        // Logic: specific slots like 9:16, 9:21...
        // Start = OpenTime
        // First Slot = OpenTime + Interval + 1 minute (buffer? User said 9:15 open, 5 min frame -> 9:16 analysis??)
        // User request: "NSE ... 9:15AM ... 5 Minute ... analysis should start from 9:16, 9:21, 9:26"
        // Wait, 9:15 + 5 mins is 9:20. Why 9:16?
        // Maybe User means: Candle closes at 9:20, so analysis at 9:20:01.
        // USER EXAMPLE: "9:16, 9:21, 9:26".
        // This is 1 minute after Open? Or 1 minute into the candle?
        // 9:15->9:20 is the first 5 min candle. It closes at 9:20:00.
        // If analysis runs at 9:16, it's running on incomplete candle or previous data?
        // User said: "NSE instrument opening time 9:15AM if time frame is 5 Minute , analysis should start from 9:16, 9:21..."
        // This implies: Run at Open + 1 min, then every 5 mins.
        // It sounds like they want to check "Live" status early?
        // OR: Maybe they meant 9:21 (after first candle)?
        // BUT I MUST FOLLOW "9:16, 9:21" pattern strictly if explicitly requested.
        // Let's stick to the arithmetic:
        // Base = 9:15.
        // Series = 9:16, 9:21, 9:26....
        // This is: (OpenTime + 1 min) + (N * Interval_5_mins).

        // MCX: 9:00AM. 1Hr.
        // Series: 10:01AM, 11:01AM...
        // This is: (OpenTime + 1 min + 1 hour??) NO. 9:00 -> 10:00 is first hour.
        // 10:01 is (OpenTime + 1 HourInterval) + 1 min.

        // So the formula seems to be:
        // TriggerTime = OpenTime + (N * Interval) + 1 minute.
        // Where N >= 0?
        // NSE (5m): 9:15 + 0*5 + 1 = 9:16. (Yes matches user req)
        // MCX (1h): 9:00 + 0*1h + 1 = 9:01. (User said 10:01... hmm)
        // User said: "MCX ... 1Hrs analysis trigger at 10:01AM, 11:01AM..."
        // So for MCX 1h, they skip the first immediate check? Or maybe 9:00-10:00 is first candle.
        // "NSE 5 min ... starts from 9:16". 
        // 9:15-9:20 is first candle. 9:16 is inside first candle.
        // This suggests checking "incomplete" real-time status? Or just a pattern preference?

        // Generalized Pattern derived from USER EXAMPLES:
        // NSE 5m: Open(9:15) -> 9:16 (Open + 1m)
        // MCX 1h: Open(9:00) -> 10:01 (Open + 1h + 1m)

        // Hypothesis: User wants to run 1 minute after the "Candle Logic" starts?
        // But 9:16 is VERY early for a 5 min candle. 
        // Let's assume User knows what they want: "Start from 9:16...".
        // I will implement: 
        // NextTime = OpenTime + 1 minute + (K * Interval).
        // For matching specific examples:
        // NSE 5m: 9:15 + 1m + 0*5m = 9:16. CORRECT.
        // MCX 1h: 9:00 + 1m + 1*60m = 10:01. CORRECT. (Here K starts at 1?)

        // This implies K might depend on timeframe size or just arbitrary user preference.
        // Maybe for < 1 Hour, start immediately (K=0). For >= 1 Hour, wait (K=1)?
        // Or simply: Calculate candidates [Open+1m, Open+1m+Interval, ...] and pick the first one > NOW.

        // Algorithm:
        // 1. StartTime = OpenTime + 60s.
        // 2. T = StartTime + (N * Interval).
        // 3. Find smallest T > Now.

        const startOffset = 60 * 1000; // 1 minute
        const baseTime = openTime.getTime() + startOffset;

        // If current time is *before* baseTime, the first trigger is baseTime.
        if (now.getTime() < baseTime) {
            return baseTime;
        }

        // If now is past baseTime, find the most recent slot.
        const elapsed = now.getTime() - baseTime;
        const slotsPassed = Math.floor(elapsed / intervalMs);

        // Return the start of the current slot (or last missed slot)
        // If this time is <= now, it will trigger immediately in the check loop
        const nextTrigger = baseTime + (slotsPassed * intervalMs);

        console.log(`[Analysis] Calc: Inst ${inst.trading_symbol} Now:${now.toLocaleTimeString()} Base:${new Date(baseTime).toLocaleTimeString()} Next:${new Date(nextTrigger).toLocaleTimeString()}`);
        return nextTrigger;
    };

    const sendNotification = (title, body) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/vite.svg' });
        }
    };

    const checkAndRunAnalysis = async () => {
        if (!analysisRunningRef.current || !tokenRef.current) return;

        const now = new Date();
        const currentMs = now.getTime();

        // Iterate over watchlist to see if any instrument is due
        // We use the Ref version of nextAnalysisTimes to avoid stale closures in worker callback
        const nextTimes = { ...nextAnalysisTimesRef.current };
        const updatesNeeded = {}; // Collect updates to state

        // For watchlist items
        // Note: watchlistRef might change, so map over current ref
        for (const inst of watchlistRef.current) {
            const openStatus = isMarketOpen(inst.exchange || (inst.instrument_key.includes('MCX') ? 'MCX' : 'NSE'));
            if (!openStatus.isOpen) continue;

            let nextRun = nextTimes[inst.instrument_key];

            // If never scheduled or invalid, schedule it now (or calc next valid slot)
            if (!nextRun) {
                nextRun = calculateNextTriggerTime(inst, now);
                updatesNeeded[inst.instrument_key] = nextRun;
            }

            // Check if due
            if (currentMs >= nextRun) {
                // RUN ANALYSIS
                await runSingleAnalysis(inst);

                // SCHEDULE NEXT
                // Re-calc based on now or strictly next slot? 
                // Strictly next slot prevents drift, but simple calc is: current nextRun + interval
                const unit = inst.analysisUnit || 'minutes';
                const intervalVal = parseInt(inst.analysisInterval || 5);
                let intervalMs = 0;
                if (unit === 'hours') intervalMs = intervalVal * 60 * 60 * 1000;
                else if (unit === 'days') intervalMs = intervalVal * 24 * 60 * 60 * 1000;
                else intervalMs = intervalVal * 60 * 1000;

                const newNext = nextRun + intervalMs;
                updatesNeeded[inst.instrument_key] = newNext;
            } else {
                // ensure state has it
                if (!nextTimes[inst.instrument_key]) {
                    updatesNeeded[inst.instrument_key] = nextRun;
                }
            }
        }

        if (Object.keys(updatesNeeded).length > 0) {
            const merged = { ...nextTimes, ...updatesNeeded };
            setNextAnalysisTimes(merged);
            // Updating state will update ref via Effect
        }

        // Update generic last run for UI heartbeat
        setLastRunTime(now.toLocaleTimeString());
    };

    const runSingleAnalysis = async (inst) => {
        try {
            const token = tokenRef.current;
            if (!token) return;

            const unit = inst.analysisUnit || 'minutes';
            const interval = inst.analysisInterval || 5;
            const now = new Date();
            const toDate = now.toISOString().split('T')[0];
            const fromDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const candles = await ChartService.getHistoricalCandles(token, inst.instrument_key, unit, interval, toDate, fromDate);
            const formatted = ChartService.formatCandleData(candles);
            const result = analyzeWithStrategies(inst.trading_symbol, formatted);

            setAnalysisResults(prev => ({
                ...prev,
                [inst.instrument_key]: {
                    status: 'Active',
                    action: result ? result.signal : 'NONE',
                    reason: result ? result.message : 'No Signal',
                    tradeData: result,
                    timestamp: now
                }
            }));

            // NOTIFICATION LOGIC
            // Notify if Action is BUY or SELL
            if (result && (result.action === 'BUY' || result.action === 'SELL')) {
                sendNotification(
                    `Signal: ${inst.trading_symbol}`,
                    `${result.action} - ${result.reason}`
                );
            }

        } catch (err) {
            console.error(`Analysis failed for ${inst.trading_symbol}:`, err);
            setAnalysisResults(prev => ({
                ...prev,
                [inst.instrument_key]: {
                    status: 'Error',
                    message: 'Failed',
                    timestamp: new Date()
                }
            }));
        }
    };

    // Replace old runAnalysisIteration with a setup function
    // Old runAnalysisIteration removed or refactored? 
    // We don't need the bulk iteration anymore, we rely on per-instrument checks.

    const toggleAnalysis = () => {
        if (analysisRunning) {
            // Stop
            if (workerRef.current) workerRef.current.postMessage('stop');
            setAnalysisRunning(false);
        } else {
            // Start
            // if (!token) {
            //     alert("Please add UPSTOX_TOKEN in Settings first.");
            //     return;
            // }

            // Request Notification Permission
            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            setAnalysisRunning(true);
            if (workerRef.current) workerRef.current.postMessage('start');

            // Initialize times logic is handled in tick
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
                const allInstruments = [...mcxInstruments, ...nseInstruments];

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
                            Running live analysis in background
                        </div>
                    )}

                    {analysisRunning && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Bell size={14} />
                            Notifications Enabled
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
                                <th style={{ padding: '0.75rem' }}>Last Analysis</th>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                                                {analysisRunning && nextAnalysisTimes[inst.instrument_key] && (
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={10} /> Next: {new Date(nextAnalysisTimes[inst.instrument_key]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Last Analysis Time Column */}
                                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {result && result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '-'}
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
