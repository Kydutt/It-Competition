import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync state and bootstrap authentication
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('auth_user', JSON.stringify(res.data));
          }
        } catch (err) {
          // Token is invalid/expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    };

    verifyAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success && res.data) {
      const { user: userData, token: tokenString } = res.data;
      setUser(userData);
      setToken(tokenString);
      localStorage.setItem('auth_token', tokenString);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    if (res.success && res.data) {
      const { user: userData, token: tokenString } = res.data;
      setUser(userData);
      setToken(tokenString);
      localStorage.setItem('auth_token', tokenString);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    role,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
