import { useState } from 'react';
import './Navbar.css';
import { useAuth } from '../../service/AuthContext';
import { useServerTime } from '../../hooks/useServerTime';

export interface ClockResponse {
    status: string;
    time: string;
}

interface NavbarProps {
    setActiveApp?: (app: string) => void;
}

const Navbar = ({ setActiveApp }: NavbarProps) => {
    const { logout } = useAuth();
    const systemTime = useServerTime();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeApp, setActiveLocalApp] = useState('home');

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        logout();
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, app: string) => {
        e.preventDefault();
        setIsMenuOpen(false); // Close menu on navigation
        setActiveLocalApp(app);
        if (setActiveApp) {
            setActiveApp(app);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <a href="/" className={activeApp === 'home' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'home')}>Home</a>
                </div>
                <button className="hamburger-menu" onClick={toggleMenu} aria-label="Toggle menu">
                    {isMenuOpen ? '✕' : '☰'}
                </button>
                <ul className="navbar-links">
                    <li><a href="/console" className={activeApp === 'console' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'console')}>Console</a></li>
                    <li><a href="/file-explorer" className={activeApp === 'file-explorer' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'file-explorer')}>File Explorer</a></li>
                    <li><a href="/system-monitor" className={activeApp === 'system-monitor' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'system-monitor')}>System Monitor</a></li>
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

            {isMenuOpen && (
                <div className="mobile-menu">
                    <ul>
                        <li><a href="/console" className={activeApp === 'console' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'console')}>Console</a></li>
                        <li><a href="/file-explorer" className={activeApp === 'file-explorer' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'file-explorer')}>File Explorer</a></li>
                        <li><a href="/system-monitor" className={activeApp === 'system-monitor' ? 'active' : ''} onClick={(e) => handleNavClick(e, 'system-monitor')}>System Monitor</a></li>
                    </ul>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
