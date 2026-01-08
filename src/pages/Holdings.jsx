import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectDailyData } from '../store/dailyDataSlice';
import { UpstoxService } from '../services/UpstoxService';
import { Briefcase, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChartModal from '../components/ChartModal';

const Holdings = () => {
    const dailyData = useSelector(selectDailyData);
    const token = dailyData['UPSTOX_TOKEN'];

    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedInstrument, setSelectedInstrument] = useState(null);

    const fetchHoldings = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const result = await UpstoxService.getHoldings(token);
            if (result.status === 'success') {
                setHoldings(result.data);
            } else {
                setError('Failed to fetch holdings data.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching holdings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchHoldings();
        }
    }, [token]);

    if (!token) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <AlertCircle size={48} className="text-secondary" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                <h3>Token Not Found</h3>
                <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
                    Please upload an <code>UPSTOX_TOKEN</code> key in the Settings page to access holdings.
                </p>
                <Link to="/settings" className="btn btn-primary">Go to Settings</Link>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                    <Briefcase className="text-secondary" /> Holdings
                </h2>
                <button onClick={fetchHoldings} className="btn" disabled={loading} style={{ border: '1px solid var(--border-color)' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ marginRight: '0.5rem' }} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: 'var(--radius-sm)' }}>
                    {error}
                </div>
            )}

            <div className="card">
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem' }}>Instrument</th>
                                <th style={{ padding: '0.75rem' }}>Qty</th>
                                <th style={{ padding: '0.75rem' }}>Avg. Price</th>
                                <th style={{ padding: '0.75rem' }}>LTP</th>
                                <th style={{ padding: '0.75rem' }}>Cur. Value</th>
                                <th style={{ padding: '0.75rem' }}>P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No holdings found.
                                    </td>

                                </tr>
                            )}
                            {holdings.map((stock) => {
                                const currentValue = stock.quantity * stock.last_price;
                                const isProfit = stock.pnl >= 0;

                                return (
                                    <tr
                                        key={stock.isin}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedInstrument({
                                            key: stock.instrument_token,
                                            symbol: stock.trading_symbol
                                        })}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500' }}>{stock.company_name}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{stock.trading_symbol}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{stock.quantity}</td>
                                        <td style={{ padding: '0.75rem' }}>{stock.average_price.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>{stock.last_price.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>{currentValue.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: isProfit ? 'var(--success-color)' : 'var(--danger-color)',
                                                fontWeight: '500'
                                            }}>
                                                {stock.pnl.toFixed(2)}
                                                {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </div>
                                        </td>
                                    </tr>
                                );
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

export default Holdings;
