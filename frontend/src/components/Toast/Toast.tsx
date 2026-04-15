import React, { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
    message: string;
    type: 'success' | 'info' | 'error';
    duration?: number; // milliseconds, 0 = no auto-dismiss
    onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onDismiss }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onDismiss, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    return (
        <div className={`toast toast-${type}`} role="alert">
            <span className="toast-message">{message}</span>
            <button
                type="button"
                className="toast-close"
                onClick={onDismiss}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
};
