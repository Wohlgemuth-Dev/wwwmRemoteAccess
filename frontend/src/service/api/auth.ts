import { apiClient } from './client';


export interface User {
    username: string;
    permissions: string[];
}

export interface AuthResponse {
    token: string;
}

export const authApi = {
    // Session
    login: (username: string, password: string) =>
        apiClient.post<AuthResponse>('/auth/login', { username, password }),

    logout: () =>
        apiClient.post('/auth/logout', {}),
};