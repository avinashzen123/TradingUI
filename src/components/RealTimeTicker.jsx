import React, { useState } from 'react';
import { useSubscription } from '../hooks/useWebSocket';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const RealTimeTicker = () => {
    const [ticker, setTicker] = useState(null);
    const [prevPrice, setPrevPrice] = useState(null);

    useSubscription('ticker', (data) => {
        setPrevPrice(prev => ticker ? ticker.price : data.price);
        setTicker(data);
    });

    if (!ticker) {
        return (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                <Activity className="text-secondary animate-pulse" />
                <span className="text-secondary">Connecting to feed...</span>
            </div>
        );
    }

    const isUp = !prevPrice || ticker.price >= prevPrice;
    const colorClass = isUp ? 'text-success' : 'text-danger';

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>{ticker.symbol}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-500/10 text-success' : 'bg-red-500/10 text-danger'}`}>
                    Live
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${ticker.price.toFixed(2)}
                </span>
                {isUp ? <TrendingUp size={20} className={colorClass} /> : <TrendingDown size={20} className={colorClass} />}
            </div>
        </div>
    );
};

export default RealTimeTicker;
