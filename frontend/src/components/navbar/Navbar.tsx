import './Navbar.css';
import { useAuth } from '../../service/AuthContext';

interface NavbarProps {
    setActiveApp?: (app: string) => void;
}

const Navbar = ({ setActiveApp }: NavbarProps) => {
    const { logout } = useAuth();

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        logout();
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, app: string) => {
        e.preventDefault();
        if (setActiveApp) {
            setActiveApp(app);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <a href="/" onClick={(e) => handleNavClick(e, 'home')}>Home</a>
            </div>
            <ul className="navbar-links">
                <li><a href="/console" onClick={(e) => handleNavClick(e, 'console')}>Console</a></li>
                <li><a href="/file-explorer" onClick={(e) => handleNavClick(e, 'file-explorer')}>File Explorer</a></li>
                <li><a href="/system-monitor" onClick={(e) => handleNavClick(e, 'system-monitor')}>System Monitor</a></li>
            </ul>
            <div className="navbar-actions">
                <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
