import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../service/AuthContext';
import './SessionTimeoutManager.css';

// Session timeout: show dialog after 59 minutes, auto-logout after 60 seconds
const SESSION_DURATION_MS = 59 * 60 * 1000; // 59 minutes
const COUNTDOWN_SECONDS = 60; // 60 seconds to respond

const SessionTimeoutManager = () => {
    const { loginTimestamp, renewSession, logout } = useAuth();
    const [showDialog, setShowDialog] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearAllTimers = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    const startSessionTimer = useCallback(() => {
        clearAllTimers();
        setShowDialog(false);
        setCountdown(COUNTDOWN_SECONDS);

        // Check every second if session has expired
        timerRef.current = setInterval(() => {
            const timestamp = sessionStorage.getItem('loginTimestamp');
            if (!timestamp) return;

            const elapsed = Date.now() - parseInt(timestamp, 10);
            if (elapsed >= SESSION_DURATION_MS) {
                // Show dialog and start countdown
                setShowDialog(true);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                let remaining = COUNTDOWN_SECONDS;
                setCountdown(remaining);

                countdownRef.current = setInterval(() => {
                    remaining -= 1;
                    setCountdown(remaining);

                    if (remaining <= 0) {
                        if (countdownRef.current) {
                            clearInterval(countdownRef.current);
                            countdownRef.current = null;
                        }
                        logout();
                    }
                }, 1000);
            }
        }, 1000);
    }, [clearAllTimers, logout]);

    // Start timer when loginTimestamp changes (login or renew)
    useEffect(() => {
        if (loginTimestamp) {
            startSessionTimer();
        }
        return () => clearAllTimers();
    }, [loginTimestamp, startSessionTimer, clearAllTimers]);

    const handleStayLoggedIn = async () => {
        clearAllTimers();
        setShowDialog(false);
        setCountdown(COUNTDOWN_SECONDS);

        const success = await renewSession();
        if (!success) {
            // Renewal failed — force logout
            logout();
        }
        // If successful, the loginTimestamp change will trigger useEffect → startSessionTimer
    };

    const handleLogoutNow = () => {
        clearAllTimers();
        setShowDialog(false);
        logout();
    };

    if (!showDialog) return null;

    const progressPercent = (countdown / COUNTDOWN_SECONDS) * 100;

    return (
        <div className="session-timeout-overlay">
            <div className="session-timeout-modal">
                <h2>Sitzung läuft ab</h2>
                <p>Ihre Sitzung wird aus Sicherheitsgründen beendet. Möchten Sie eingeloggt bleiben?</p>
                <div className="session-timeout-countdown">{countdown}s</div>
                <div className="session-timeout-progress-bar">
                    <div
                        className="session-timeout-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="session-timeout-actions">
                    <button className="session-timeout-btn-primary" onClick={handleStayLoggedIn}>
                        Eingeloggt bleiben
                    </button>
                    <button className="session-timeout-btn-secondary" onClick={handleLogoutNow}>
                        Jetzt abmelden
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutManager;
