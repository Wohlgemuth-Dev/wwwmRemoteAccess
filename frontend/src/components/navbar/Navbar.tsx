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
    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        logout();
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <a href="/" onClick={(e) => handleNavClick(e, 'home')}>Home</a>
                </div>
                <ul className="navbar-links">
                    <li><a href="/console" onClick={(e) => handleNavClick(e, 'console')}>Console</a></li>
                <li><a href="/file-explorer" onClick={(e) => handleNavClick(e, 'file-explorer')}>File Explorer</a></li>
                <li><a href="/system-monitor" onClick={(e) => handleNavClick(e, 'system-monitor')}>System Monitor</a></li>
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
