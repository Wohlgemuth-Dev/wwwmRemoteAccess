import React, { createContext, useContext, useState } from 'react';
import { authApi } from './api/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    login: (u: string, p: string) => Promise<void>;
    logout: () => void;
    renewSession: () => Promise<boolean>;
    loginTimestamp: number | null;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
    const [loginTimestamp, setLoginTimestamp] = useState<number | null>(() => {
        const stored = sessionStorage.getItem('loginTimestamp');
        if (stored) return parseInt(stored, 10);

        // Fallback: token exists but no timestamp (e.g. after code update)
        const existingToken = sessionStorage.getItem('token');
        if (existingToken) {
            const now = Date.now();
            sessionStorage.setItem('loginTimestamp', now.toString());
            return now;
        }
        return null;
    });
    const [error, setError] = useState<string | null>(null);

    const login = async (username: string, password: string) => {
        setError(null);
        try {
            const response = await authApi.login(username, password);
            const now = Date.now();
            setToken(response.token);
            setLoginTimestamp(now);
            sessionStorage.setItem('token', response.token);
            sessionStorage.setItem('loginTimestamp', now.toString());
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
        }
    };

    const logout = async () => {
        setToken(null);
        setLoginTimestamp(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('loginTimestamp');
        try {
            await authApi.logout();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    };

    const renewSession = async (): Promise<boolean> => {
        try {
            const response = await authApi.renewSession();
            const now = Date.now();
            setToken(response.token);
            setLoginTimestamp(now);
            sessionStorage.setItem('token', response.token);
            sessionStorage.setItem('loginTimestamp', now.toString());
            return true;
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!token,
            token,
            login,
            logout,
            renewSession,
            loginTimestamp,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
