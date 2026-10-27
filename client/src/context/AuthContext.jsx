import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('hotelpro_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('hotelpro_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify'

  const { showToast, fetchNotifications } = useNotification();

  // Sync session on mount
  const syncSession = useCallback(async () => {
    const savedToken = localStorage.getItem('hotelpro_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('hotelpro_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      // Invalid/expired token
      localStorage.removeItem('hotelpro_token');
      localStorage.removeItem('hotelpro_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSession();

    const handleAuthChange = () => {
      setToken(localStorage.getItem('hotelpro_token'));
      const saved = localStorage.getItem('hotelpro_user');
      setUser(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener('hotelpro:auth-change', handleAuthChange);
    return () => window.removeEventListener('hotelpro:auth-change', handleAuthChange);
  }, [syncSession]);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('hotelpro_token', newToken);
        localStorage.setItem('hotelpro_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setAuthModalOpen(false);
        showToast(`Welcome back, ${newUser.name.split(' ')[0]}!`, 'success');
        fetchNotifications?.();
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('hotelpro_token', newToken);
        localStorage.setItem('hotelpro_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setAuthModalOpen(false);
        showToast(`Account created! Welcome to SHREE श्री, ${newUser.name.split(' ')[0]}.`, 'success');
        fetchNotifications?.();
        return { success: true, user: newUser, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('hotelpro_token');
      localStorage.removeItem('hotelpro_user');
      setUser(null);
      setToken(null);
      showToast('You have been signed out.', 'info');
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authApi.forgotPassword(email);
      showToast(res.data.message, 'success');
      return { success: true, message: res.data.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const resetPassword = async (tokenVal, password) => {
    try {
      const res = await authApi.resetPassword({ token: tokenVal, password });
      showToast(res.data.message, 'success');
      return { success: true, message: res.data.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const verifyEmail = async (tokenVal) => {
    try {
      const res = await authApi.verifyEmail(tokenVal);
      if (res.data.success) {
        if (user) {
          const updated = { ...user, isEmailVerified: true };
          setUser(updated);
          localStorage.setItem('hotelpro_user', JSON.stringify(updated));
        }
        showToast(res.data.message, 'success');
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const resendVerification = async (email) => {
    try {
      const res = await authApi.resendVerification(email);
      showToast(res.data.message, 'success');
      return { success: true, message: res.data.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authApi.updateProfile(profileData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('hotelpro_user', JSON.stringify(res.data.user));
        showToast('Profile updated successfully', 'success');
        return { success: true };
      }
      return { success: false, message: res.data?.message };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        role: user?.role || 'guest',
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        authModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
