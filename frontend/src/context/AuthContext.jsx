import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, setTokenGetter } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => sessionStorage.getItem('xenia_token'));
    const [loading, setLoading] = useState(!!sessionStorage.getItem('xenia_token'));

    // Register the token getter for the API client
    useEffect(() => {
        setTokenGetter(() => token);
    }, [token]);

    // Verify token on mount
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        authApi.me()
            .then((res) => setUser(res.data?.user || res.data || res.user))
            .catch(() => { setToken(null); sessionStorage.removeItem('xenia_token'); })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authApi.login(email, password);
        const payload = res.data || res;
        const authToken = payload.token || res.token;
        const authUser = payload.user || res.user;
        setToken(authToken);
        setUser(authUser);
        if (authToken) sessionStorage.setItem('xenia_token', authToken);
        return payload;
    }, []);

    const register = useCallback(async (email, name, password) => {
        const res = await authApi.register(email, name, password);
        const payload = res.data || res;
        const authToken = payload.token || res.token;
        const authUser = payload.user || res.user;
        setToken(authToken);
        setUser(authUser);
        if (authToken) sessionStorage.setItem('xenia_token', authToken);
        return payload;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('xenia_token');
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
