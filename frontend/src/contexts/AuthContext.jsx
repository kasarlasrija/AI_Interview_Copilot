import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation states: 'landing' | 'auth' | 'dashboard' | 'admin'
  const [currentPage, setCurrentPage] = useState('landing');
  // Sub-sections of dashboard: 'overview' | 'resume-upload' | 'skill-gap' | 'mock-interview' | 'reports' | 'history' | 'profile' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        // Auto-redirect from landing or auth if already logged in
        if (data.user.role === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password, faceEmbedding = null) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, faceEmbedding })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    if (data.status === 'face_required') {
      return data;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    if (data.user.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
      setActiveTab('overview');
    }
    return data;
  };

  const loginWithFace = async (identifier, faceEmbedding) => {
    const res = await fetch(`${API_URL}/auth/login-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, faceEmbedding })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Facial Login failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);

    if (data.user.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
      setActiveTab('overview');
    }
    return data;
  };

  const loginWithGoogle = async (email, username, credential = null) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, credential })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google Login failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);

    if (data.user.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
      setActiveTab('overview');
    }
    return data;
  };

  const register = async (username, email, password, role = 'user') => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  };

  const registerFace = async (email, faceEmbedding) => {
    const res = await fetch(`${API_URL}/auth/register-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, faceEmbedding })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Facial registration failed');
    
    // Refresh user state locally if matches currently registered profile email
    if (user && user.email === email) {
      setUser(prev => ({ ...prev, faceRegistered: 1 }));
    }
    return data;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset request failed');
    return data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        setUser,
        loading,
        currentPage,
        setCurrentPage,
        activeTab,
        setActiveTab,
        login,
        loginWithFace,
        loginWithGoogle,
        register,
        verifyOtp,
        registerFace,
        forgotPassword,
        resetPassword,
        logout,
        fetchUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
