import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, Settings as SettingsIcon, Briefcase, Search, Menu, X, TrendingUp } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import OrderManagement from './pages/Orders';
import Holdings from './pages/Holdings';
import InstrumentSearch from './pages/InstrumentSearch';
import AnalysisDashboard from './pages/AnalysisDashboard';
import DataUploader from './components/DataUploader';
import Header from './components/Header';
import './utils/migrateIndicators'; // Auto-migrate indicators on app load
import Footer from './components/Footer';
import Watchlist from './pages/Watchlist';
import Settings from './pages/Settings';
import AlertsPanel from './components/AlertsPanel';
import './App.css';

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <Router>
      <div className="layout">
        <aside className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 className="text-success" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>TradePro</h2>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/"
              onClick={() => setIsMobileNavOpen(false)}
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
              onClick={() => setIsMobileNavOpen(false)}
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
              onClick={() => setIsMobileNavOpen(false)}
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
              onClick={() => setIsMobileNavOpen(false)}
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
              onClick={() => setIsMobileNavOpen(false)}
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
              to="/market-analysis"
              onClick={() => setIsMobileNavOpen(false)}
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <TrendingUp size={18} /> Market Analysis
            </NavLink>
            <NavLink
              to="/settings"
              onClick={() => setIsMobileNavOpen(false)}
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : ''}`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                gap: '0.75rem',
                backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)'
              })}
            >
              <SettingsIcon size={18} /> Settings
            </NavLink>
          </nav>
        </aside>

        {/* Mobile Navigation Toggle (FAB) */}
        <button
          className="mobile-fab"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-label="Toggle Navigation"
        >
          {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Overlay for mobile when menu is open */}
        {isMobileNavOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        <main className="main-content">
          <Header />
          {/* Global Alerts Panel - Available in all views */}
          <AlertsPanel />
          <div style={{ flex: 1 }}>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/orders" element={<OrderManagement />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/search" element={<InstrumentSearch />} />
              <Route path="/market-analysis" element={<AnalysisDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </Router>
  );
}

export default App;
