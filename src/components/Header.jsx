import React from 'react';

const Header = () => {
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Trading Interface</h1>
            <div className="btn" style={{ border: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                User: Avinash Account
            </div>
        </header>
    );
};

export default Header;
