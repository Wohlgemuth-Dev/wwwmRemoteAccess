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

    useEffect(() => {
        const fetchTime = async () => {
            try {
                const response = await fetch('/api/clock');
                const data = await response.json();
                if (data.status === 'success') {
                    setSystemTime(data.time);
                }
            } catch (error) {
                console.error('Error fetching system time:', error);
            }
        };

        fetchTime();
        const interval = setInterval(fetchTime, 1000);
        return () => clearInterval(interval);
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
                    <span className="clock-value">⏱︎  {systemTime} </span>
                </div>
                <div className="navbar-actions">
                    <button className="btn-secondary" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
