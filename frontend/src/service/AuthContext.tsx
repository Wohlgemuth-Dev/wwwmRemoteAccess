import React, { createContext, useContext, useState } from 'react';
import { authApi } from './api/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    login: (u: string, p: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setAuth] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const login = async (username: string, password: string) => {
        setError(null);
        try {
            const response = await authApi.login(username, password);
            console.log(response);
            setToken(response.token);
            setAuth(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        }
    };

    const logout = async () => {
        setToken(null);
        try {
            await authApi.logout();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            token,
            login,
            logout,
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
