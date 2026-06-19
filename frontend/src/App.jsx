import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { currentPage, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(124, 58, 237, 0.1)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 600 }}>Hirenix AI</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Securing access & loading environment...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'auth':
      return <AuthPage />;
    case 'dashboard':
      return <Dashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <LandingPage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
