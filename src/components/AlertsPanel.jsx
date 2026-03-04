import { useSelector, useDispatch } from 'react-redux';
import { selectAllUnreadAlerts, markAlertAsRead, clearAlerts } from '../store/instrumentAnalysisSlice';
import { Bell, X, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

/**
 * Component that shows alerts for all instruments
 * Displays notifications when there are actions on any instrument
 */
export default function AlertsPanel() {
    const dispatch = useDispatch();
    const unreadAlerts = useSelector(selectAllUnreadAlerts);
    const [isOpen, setIsOpen] = useState(false);

    const handleMarkAsRead = (instrumentKey, alertId) => {
        dispatch(markAlertAsRead({ instrumentKey, alertId }));
    };

    const handleClearAll = () => {
        // Clear alerts for all instruments
        const instrumentKeys = [...new Set(unreadAlerts.map(a => a.instrumentKey))];
        instrumentKeys.forEach(key => {
            dispatch(clearAlerts(key));
        });
    };

    const getAlertIcon = (type, severity) => {
        if (type === 'signal') {
            return severity === 'success' ? <TrendingUp size={20} /> : <TrendingDown size={20} />;
        }
        if (type === 'pattern') {
            return <AlertTriangle size={20} />;
        }
        return <Info size={20} />;
    };

    const getSeverityClass = (severity) => {
        return `alert-${severity}`;
    };

    return (
        <div className="alerts-panel">
            {/* Alert Bell Icon */}
            <button
                className="alerts-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle alerts"
            >
                <Bell size={24} />
                {unreadAlerts.length > 0 && (
                    <span className="alert-badge">{unreadAlerts.length}</span>
                )}
            </button>

            {/* Alerts Dropdown */}
            {isOpen && (
                <div className="alerts-dropdown">
                    <div className="alerts-header">
                        <h3>Alerts ({unreadAlerts.length})</h3>
                        {unreadAlerts.length > 0 && (
                            <button onClick={handleClearAll} className="clear-all-btn">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="alerts-list">
                        {unreadAlerts.length === 0 ? (
                            <div className="no-alerts">
                                <Info size={48} />
                                <p>No new alerts</p>
                            </div>
                        ) : (
                            unreadAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`alert-item ${getSeverityClass(alert.severity)}`}
                                >
                                    <div className="alert-icon">
                                        {getAlertIcon(alert.type, alert.severity)}
                                    </div>
                                    <div className="alert-content">
                                        <div className="alert-instrument">
                                            {alert.instrumentName}
                                        </div>
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-time">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        className="alert-close"
                                        onClick={() => handleMarkAsRead(alert.instrumentKey, alert.id)}
                                        aria-label="Mark as read"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
