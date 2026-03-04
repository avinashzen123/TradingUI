import { useState, useEffect } from 'react';
import './ErrorAlert.css';

export default function ErrorAlert({ error, onClose }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);
    }, [error]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300); // Wait for fade animation
    };

    if (!error || !isVisible) return null;

    const isRateLimit = error.type === 'rate_limit';
    const alertClass = isRateLimit ? 'alert-warning' : 'alert-danger';

    return (
        <div className={`error-alert alert ${alertClass} alert-dismissible fade show`} role="alert">
            <div className="alert-body">
                <p><strong>{error.title}:</strong> {error.message}</p>
                {error.solutions && error.solutions.length > 0 && (
                    <div className="alert-solutions">
                        <strong>Solutions:</strong>
                        <ol>
                            {error.solutions.map((solution, index) => (
                                <li key={index}>{solution}</li>
                            ))}
                        </ol>
                    </div>
                )}
                {error.note && (
                    <div className="alert-note">
                        {error.note}
                    </div>
                )}
            </div>
            <button 
                type="button" 
                className="btn-close" 
                onClick={handleClose}
                aria-label="Close"
            >
                ×
            </button>
        </div>
    );
}
