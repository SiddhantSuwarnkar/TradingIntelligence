import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8000/api/v1';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load session credentials from local storage
        const storedUser = localStorage.getItem('pt_user');
        const storedTokens = localStorage.getItem('pt_tokens');
        if (storedUser && storedTokens) {
            setUser(JSON.parse(storedUser));
            setTokens(JSON.parse(storedTokens));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Invalid username or password.');
            }

            const { access, refresh, role, email } = data;
            const userData = { username, role, email };
            const tokenData = { access, refresh };

            setUser(userData);
            setTokens(tokenData);

            localStorage.setItem('pt_user', JSON.stringify(userData));
            localStorage.setItem('pt_tokens', JSON.stringify(tokenData));

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password, role) => {
        try {
            const response = await fetch(`${API_BASE}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role }),
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, errors: data };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Registration failed. Server connection error.' };
        }
    };

    const logout = () => {
        setUser(null);
        setTokens(null);
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_tokens');
    };

    const refreshAccessToken = async () => {
        let currentTokens = tokens;
        if (!currentTokens) {
            const stored = localStorage.getItem('pt_tokens');
            if (stored) currentTokens = JSON.parse(stored);
        }

        if (!currentTokens || !currentTokens.refresh) {
            logout();
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: currentTokens.refresh }),
            });

            if (!response.ok) {
                throw new Error('Refresh token has expired');
            }

            const data = await response.json();
            const updatedTokens = {
                ...currentTokens,
                access: data.access,
            };

            setTokens(updatedTokens);
            localStorage.setItem('pt_tokens', JSON.stringify(updatedTokens));
            return data.access;
        } catch (error) {
            logout();
            return null;
        }
    };

    const fetchWithAuth = async (url, options = {}) => {
        let currentTokens = tokens;
        if (!currentTokens) {
            const stored = localStorage.getItem('pt_tokens');
            if (stored) currentTokens = JSON.parse(stored);
        }

        if (!currentTokens || !currentTokens.access) {
            logout();
            throw new Error('No access token found. Please log in.');
        }

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${currentTokens.access}`,
        };

        let response = await fetch(url, options);

        // If access token has expired (401), try refreshing it automatically
        if (response.status === 401) {
            const newAccess = await refreshAccessToken();
            if (newAccess) {
                options.headers['Authorization'] = `Bearer ${newAccess}`;
                response = await fetch(url, options);
            }
        }

        return response;
    };

    return (
        <AuthContext.Provider value={{ user, tokens, loading, login, register, logout, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
