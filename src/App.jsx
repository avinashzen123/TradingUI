import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, Settings, Briefcase, Search } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/Orders';
import Holdings from './pages/Holdings';
import InstrumentSearch from './pages/InstrumentSearch';
import DataUploader from './components/DataUploader';
import Watchlist from './pages/Watchlist';
import './App.css';

function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 className="text-success" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>TradePro</h2>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink
              to="/watchlist"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <List size={18} /> Watchlist
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <List size={18} /> Orders
            </NavLink>
            <NavLink
              to="/holdings"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <Briefcase size={18} /> Holdings
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <Search size={18} /> Instruments
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <Settings size={18} /> Settings
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Trading Interface</h1>
            <div className="btn" style={{ border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
              User: Demo Account
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/search" element={<InstrumentSearch />} />
            <Route path="/settings" element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <DataUploader />
                <div className="card">Other settings coming soon...</div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
