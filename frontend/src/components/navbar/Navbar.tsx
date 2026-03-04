import { useState, useEffect } from 'react';
import './Navbar.css';
import { useAuth } from '../../service/AuthContext';

const Navbar = () => {
    const { logout } = useAuth();
    const [systemTime, setSystemTime] = useState<string>('--:--:--');

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        logout();
    };

    const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        let currentLocalTime: Date | null = null;

        const fetchTime = async () => {
            try {
                const response = await fetch('/api/clock');
                const data = await response.json();
                if (data.status === 'success') {
                    // Parse "HH:mm:ss" from backend
                    const [h, m, s] = data.time.split(':').map(Number);
                    const now = new Date();
                    now.setHours(h, m, s, 0);
                    currentLocalTime = now;
                    setSystemTime(formatTime(now));
                }
            } catch (error) {
                console.error('Error fetching system time:', error);
            }
        };

        fetchTime();
        const syncInterval = setInterval(fetchTime, 30000);

        const tickInterval = setInterval(() => {
            if (currentLocalTime) {
                currentLocalTime = new Date(currentLocalTime.getTime() + 1000);
                setSystemTime(formatTime(currentLocalTime));
            }
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(tickInterval);
        };
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <a href="/">Home</a>
                </div>
                <ul className="navbar-links">
                    <li><a href="/console">Console</a></li>
                    <li><a href="/file-explorer">File Explorer</a></li>
                    <li><a href="/system-monitor">System Monitor</a></li>
                </ul>
            </div>

            <div className="navbar-center">
            </div>

            <div className="navbar-right">
                <div className="navbar-clock">
                    <span className="clock-value">{systemTime} </span>
                </div>
                <div className="navbar-actions">
                    <button className="btn-secondary" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
