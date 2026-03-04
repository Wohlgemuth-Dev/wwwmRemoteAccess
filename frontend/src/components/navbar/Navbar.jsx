import React from 'react';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <a href="/">Home</a>
            </div>
            <ul className="navbar-links">
                <li><a href="/console">Console</a></li>
                <li><a href="/file-explorer">File Explorer</a></li>
                <li><a href="/system-monitor">System Monitor</a></li>
            </ul>
            <div className="navbar-actions">
                <button className="btn-secondary" onClick={() => console.log('Logout clicked')}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
