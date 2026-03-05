import { useState } from 'react';
import { useAuth } from '../../service/AuthContext';
import './index.css';

const LoginScreen = () => {
    const { login, error } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(username, password);
    };

    return (
        <div className="loginContainer">
            <div className="loginWindow">
                <h1>Login</h1>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
