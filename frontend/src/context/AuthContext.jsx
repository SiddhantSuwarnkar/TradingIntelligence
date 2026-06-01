import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8000/api/v1';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null); // access token kept strictly in-memory
    const [loading, setLoading] = useState(true);

    const refreshAccessToken = async (storedRefresh) => {
        const refreshVal = storedRefresh || localStorage.getItem('pt_refresh');
        if (!refreshVal) {
            logout();
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshVal }),
            });

            if (!response.ok) {
                throw new Error('Session has expired.');
            }

            const data = await response.json();
            setAccessToken(data.access); // load fresh access token in state
            return data.access;
        } catch (error) {
            logout();
            return null;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('pt_user');
            const storedRefresh = localStorage.getItem('pt_refresh');
            if (storedUser && storedRefresh) {
                setUser(JSON.parse(storedUser));
                await refreshAccessToken(storedRefresh);
            }
            setLoading(false);
        };
        initAuth();
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

            setUser(userData);
            setAccessToken(access); // set in-memory state

            localStorage.setItem('pt_user', JSON.stringify(userData));
            localStorage.setItem('pt_refresh', refresh); // Only write refresh token

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
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

    const logout = async () => {
        const refreshVal = localStorage.getItem('pt_refresh');
        if (refreshVal) {
            try {
                // Inform backend to blacklist the token server-side
                await fetch(`${API_BASE}/auth/logout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshVal })
                });
            } catch (error) {
                console.error('Failed to blacklist refresh token on server logout:', error);
            }
        }

        // Clean client credentials regardless of connection results to prevent lockouts
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_refresh');
    };

    const fetchWithAuth = async (url, options = {}) => {
        let currentAccess = accessToken;
        if (!currentAccess) {
            const storedRefresh = localStorage.getItem('pt_refresh');
            if (storedRefresh) {
                currentAccess = await refreshAccessToken(storedRefresh);
            }
        }

        if (!currentAccess) {
            logout();
            throw new Error('No valid session found. Please log in.');
        }

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${currentAccess}`,
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
        <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
