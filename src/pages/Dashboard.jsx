import React from 'react';
import RealTimeTicker from '../components/RealTimeTicker';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const data = [
    { name: 'BTC', value: 45000 },
    { name: 'ETH', value: 32000 },
    { name: 'USDT', value: 23000 },
    { name: 'SOL', value: 12000 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const Dashboard = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
                <h2 style={{ marginBottom: '1rem' }}>Market Overview</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <RealTimeTicker />
                    {/* Placeholders for other tickers */}
                </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Wallet size={20} className="text-secondary" /> Portfolio Allocation
                    </h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {data.map((entry, index) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Total Balance</span>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>$112,000.00</div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div>
                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>24h P&L</span>
                                <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                                    <ArrowUpRight size={16} /> +$1,240.50 (1.2%)
                                </div>
                            </div>
                            <div>
                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>All Time P&L</span>
                                <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                                    <ArrowUpRight size={16} /> +$45,320.00 (65%)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
