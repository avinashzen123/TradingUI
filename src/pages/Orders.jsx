import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectDailyData } from '../store/dailyDataSlice';
import { UpstoxService } from '../services/UpstoxService';
import { useSubscription } from '../hooks/useWebSocket';
import { Clock, CheckCircle, XCircle } from 'lucide-react';


const OrderManagement = () => {
    // Redux for Token
    const dailyData = useSelector(selectDailyData);
    const token = dailyData['UPSTOX_TOKEN'];

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Positions
    const fetchPositions = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const result = await UpstoxService.getShortTermPositions(token);
            if (result.status === 'success') {
                setPositions(result.data);
            } else {
                setError('Failed to fetch positions.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchPositions();
    }, [token]);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Order placement logic would go here (sending to API/WebSocket)');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Short Term Positions</h3>
                    {token && (
                        <button onClick={fetchPositions} className="btn" disabled={loading} style={{ border: '1px solid var(--border-color)' }}>
                            Refresh
                        </button>
                    )}
                </div>

                {!token && (
                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                        Token not found. Please upload UPSTOX_TOKEN in Settings to view positions.
                    </div>
                )}

                {error && (
                    <div className="text-danger" style={{ marginBottom: '1rem' }}>{error}</div>
                )}

                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem' }}>Symbol</th>
                                <th style={{ padding: '0.75rem' }}>Qty</th>
                                <th style={{ padding: '0.75rem' }}>Avg Price</th>
                                <th style={{ padding: '0.75rem' }}>Last Price</th>
                                <th style={{ padding: '0.75rem' }}>Realised</th>
                                <th style={{ padding: '0.75rem' }}>Unrealized</th>
                                <th style={{ padding: '0.75rem' }}>Total P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.length === 0 && token && !loading && (
                                <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center' }} className="text-secondary">No positions found.</td></tr>
                            )}
                            {positions.map((pos, idx) => {
                                const isPos = pos.pnl >= 0;
                                return (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500' }}>{pos.trading_symbol}</div>
                                            <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{pos.exchange}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{pos.quantity}</td>
                                        <td style={{ padding: '0.75rem' }}>{pos.average_price ? pos.average_price.toFixed(2) : '0.00'}</td>
                                        <td style={{ padding: '0.75rem' }}>{pos.last_price.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>{pos.realised.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>{pos.unrealised.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ color: isPos ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                                                {pos.pnl.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Place Order</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }} className="text-secondary">Symbol</label>
                        <select style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)' }}>
                            <option>BTC-USD</option>
                            <option>ETH-USD</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button type="button" className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>BUY</button>
                        <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>SELL</button>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }} className="text-secondary">Price (USD)</label>
                        <input type="number" defaultValue={45000} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }} className="text-secondary">Amount</label>
                        <input type="number" defaultValue={0.1} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'white', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Order</button>
                </form>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    let icon = <Clock size={14} />;
    let color = 'var(--text-secondary)';

    if (status === 'FILLED') {
        icon = <CheckCircle size={14} />;
        color = 'var(--success-color)';
    } else if (status === 'CANCELLED') {
        icon = <XCircle size={14} />;
        color = 'var(--danger-color)';
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: color, fontSize: '0.875rem' }}>
            {icon} {status}
        </div>
    );
}

export default OrderManagement;
