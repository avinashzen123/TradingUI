import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            marginTop: 'auto',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
        }}>
            <p>&copy; {new Date().getFullYear()} TradePro. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
