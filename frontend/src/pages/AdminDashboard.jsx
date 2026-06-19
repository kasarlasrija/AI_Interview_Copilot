import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Clock,
  Activity,
  Settings,
  LogOut,
  Search,
  Plus,
  Edit,
  Trash,
  Check,
  X,
  ShieldAlert,
  Info,
  ChevronDown,
  Sun,
  Moon,
  Zap,
  Globe
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation sub-tabs: 'overview' | 'users' | 'questions' | 'logs' | 'monitoring' | 'config'
  const [adminTab, setAdminTab] = useState('overview');

  // Backend Data
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionFilterRole, setQuestionFilterRole] = useState('All');

  // Question CRUD Modals & Form states
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionRole, setQuestionRole] = useState('Software Engineer');
  const [questionCategory, setQuestionCategory] = useState('technical');
  const [questionDifficulty, setQuestionDifficulty] = useState('Easy');
  const [questionText, setQuestionText] = useState('');
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  // Config States
  const [sessionLifetime, setSessionLifetime] = useState('24 Hours');
  const [otpExpiry, setOtpExpiry] = useState('10 Minutes');
  const [livenessThreshold, setLivenessThreshold] = useState('85%');
  const [modelEndpoint, setModelEndpoint] = useState('Gemini 3.5 Flash');
  const [configSuccess, setConfigSuccess] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpEnabled, setSmtpEnabled] = useState(false);

  // Delete account states
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: Password, 2: OTP, 3: Checkbox final
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteConfirmCheck, setDeleteConfirmCheck] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics
      const resAnalytic = await fetch('http://localhost:5000/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAnalytic.ok) {
        const data = await resAnalytic.json();
        setAnalytics(data);
      }

      // Fetch users list
      const resUsers = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsersList(data.users || []);
      }

      // Fetch questions bank
      const resQuestions = await fetch('http://localhost:5000/api/admin/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resQuestions.ok) {
        const data = await resQuestions.json();
        setQuestions(data.questions || []);
      }

      // Fetch audit logs
      const resLogs = await fetch('http://localhost:5000/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }

      // Fetch configurations
      const resConfig = await fetch('http://localhost:5000/api/admin/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resConfig.ok) {
        const { config } = await resConfig.json();
        if (config) {
          if (config.session_lifetime) setSessionLifetime(config.session_lifetime);
          if (config.otp_expiry) setOtpExpiry(config.otp_expiry);
          if (config.liveness_threshold) setLivenessThreshold(config.liveness_threshold);
          if (config.model_endpoint) setModelEndpoint(config.model_endpoint);
          if (config.smtp_host !== undefined) setSmtpHost(config.smtp_host);
          if (config.smtp_port !== undefined) setSmtpPort(config.smtp_port);
          if (config.smtp_user !== undefined) setSmtpUser(config.smtp_user);
          if (config.smtp_pass !== undefined) setSmtpPass(config.smtp_pass);
          if (config.smtp_enabled !== undefined) setSmtpEnabled(config.smtp_enabled === '1' || config.smtp_enabled === 'true');
        }
      }
    } catch (err) {
      console.error('Failed fetching administrator data panels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle User Status (Deactivate / Activate)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        // Update local status
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
        loadAdminData(); // refresh logs
      } else {
        alert(data.error || 'Failed to toggle user status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Promote / Demote Role
  const handleUpdateRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: nextRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
        loadAdminData(); // refresh logs
      } else {
        alert(data.error || 'Failed to modify role');
      }
    } catch (err) {
      console.error('Error modifying role:', err);
    }
  };

  // Question CRUD Submits
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');

    if (!questionText.trim()) {
      setCrudError('Question text content cannot be blank');
      return;
    }

    try {
      const endpoint = 'http://localhost:5000/api/admin/questions';
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const body = {
        role: questionRole,
        category: questionCategory,
        difficulty: questionDifficulty,
        questionText: questionText
      };
      if (modalMode === 'edit') {
        body.id = editingQuestionId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setCrudSuccess(modalMode === 'create' ? 'Question added successfully' : 'Question modified successfully');
        setQuestionText('');
        setQuestionModalOpen(false);
        loadAdminData(); // reload list
      } else {
        setCrudError(data.error || 'Failed to submit question');
      }
    } catch (err) {
      setCrudError('Server connectivity issue.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this question?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        loadAdminData();
      } else {
        alert(data.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (q) => {
    setModalMode('edit');
    setEditingQuestionId(q.id);
    setQuestionRole(q.role);
    setQuestionCategory(q.category);
    setQuestionDifficulty(q.difficulty);
    setQuestionText(q.question_text);
    setCrudError('');
    setCrudSuccess('');
    setQuestionModalOpen(true);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingQuestionId(null);
    setQuestionRole('Software Engineer');
    setQuestionCategory('technical');
    setQuestionDifficulty('Easy');
    setQuestionText('');
    setCrudError('');
    setCrudSuccess('');
    setQuestionModalOpen(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          configurations: {
            session_lifetime: sessionLifetime,
            otp_expiry: otpExpiry,
            liveness_threshold: livenessThreshold,
            model_endpoint: modelEndpoint,
            smtp_host: smtpHost,
            smtp_port: smtpPort,
            smtp_user: smtpUser,
            smtp_pass: smtpPass,
            smtp_enabled: smtpEnabled ? '1' : '0'
          }
        })
      });
      if (res.ok) {
        setConfigSuccess('Configurations saved successfully');
        setTimeout(() => setConfigSuccess(''), 3000);
      } else {
        alert('Failed to save settings configurations');
      }
    } catch (err) {
      console.error('Error saving settings configurations:', err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString();
  };

  // Account Deletion Workflow
  const handleRequestDeleteOtp = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteSuccessMsg('');

    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/request-delete-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteSuccessMsg(`OTP Code generated: ${data.otp}`);
        setDeleteStep(2);
      } else {
        setDeleteError(data.error || 'Verification failed');
      }
    } catch (err) {
      setDeleteError('Server connection error.');
    }
  };

  const handleConfirmDeleteOtp = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteSuccessMsg('');

    if (!deleteOtp) {
      setDeleteError('Verification OTP is required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-delete-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: deleteOtp })
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteSuccessMsg('OTP code verified successfully. Please confirm final acknowledgment.');
        setDeleteStep(3);
      } else {
        setDeleteError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setDeleteError('Server error.');
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Questions List
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesRole = questionFilterRole === 'All' || q.role === questionFilterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }} className="text-gradient nav-text">Hirenix Admin</h2>
        </div>

        {/* Profile Details Mini-Widget */}
        <div className="sidebar-profile-details" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
            {user?.username ? user.username[0].toUpperCase() : 'A'}
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user?.username}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Administrator</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setAdminTab('overview')} 
            className={`btn ${adminTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <LayoutDashboard size={18} />
            <span className="nav-text">System Metrics</span>
          </button>

          <button 
            onClick={() => setAdminTab('users')} 
            className={`btn ${adminTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Users size={18} />
            <span className="nav-text">User Accounts</span>
          </button>

          <button 
            onClick={() => setAdminTab('questions')} 
            className={`btn ${adminTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <HelpCircle size={18} />
            <span className="nav-text">Question Bank</span>
          </button>

          <button 
            onClick={() => setAdminTab('logs')} 
            className={`btn ${adminTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Clock size={18} />
            <span className="nav-text">Audit Activity Logs</span>
          </button>

          <button 
            onClick={() => setAdminTab('monitoring')} 
            className={`btn ${adminTab === 'monitoring' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Zap size={18} />
            <span className="nav-text">AI Model Monitoring</span>
          </button>

          <button 
            onClick={() => setAdminTab('config')} 
            className={`btn ${adminTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', width: '100%', border: 'none' }}
          >
            <Settings size={18} />
            <span className="nav-text">Configuration</span>
          </button>
        </nav>

        {/* Theme and Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span className="nav-text">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%', color: 'var(--error)' }}
          >
            <LogOut size={18} />
            <span className="nav-text">Sign Out</span>
          </button>

          <button 
            onClick={() => {
              setDeleteModalActive(true);
              setDeleteStep(1);
              setDeletePassword('');
              setDeleteOtp('');
              setDeleteConfirmCheck(false);
              setDeleteError('');
              setDeleteSuccessMsg('');
            }}
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start', padding: '10px 16px', width: '100%', color: 'var(--error)' }}
          >
            <Trash size={18} />
            <span className="nav-text">Delete Account Permanently</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">

        {/* TAB 1: SYSTEM METRICS OVERVIEW */}
        {adminTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>ADMIN PORTAL</span>
              <h1 style={{ fontSize: '2.2rem' }}>Platform Metrics & Operations</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Global monitoring metrics of user registration, resume parsing, and server status.</p>
            </div>

            {/* Counts Metrics */}
            <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
              <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Total User Registrations</h4>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }} className="text-gradient">
                  {analytics?.metrics?.totalUsers || '0'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Active: {analytics?.metrics?.activeUsers || 0}</span>
              </div>

              <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Resumes Synchronized</h4>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{analytics?.metrics?.totalResumes || 0}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Average ATS: {analytics?.metrics?.avgAts || 0}%</span>
              </div>

              <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Mock Sessions Completed</h4>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{analytics?.metrics?.totalInterviews || 0}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Average Score: {analytics?.metrics?.avgScore || 0}%</span>
              </div>

              <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>AI Model Server Latency</h4>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{analytics?.system?.apiLatency || '0ms'}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Service Uptime: {analytics?.system?.uptime || '100%'}</span>
              </div>
            </div>

            {/* Quick Audit status & System logs */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
              
              {/* Short logs view */}
              <div className="glass-container" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Real-time Audit Timeline Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {auditLogs.slice(0, 5).map((log, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.82rem' }}>{log.action}</p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>User: {log.username || 'System'} | IP: {log.ip_address}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{formatTime(log.timestamp)}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No audit events logged.</p>}
                </div>
              </div>

              {/* Status details */}
              <div className="glass-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem' }}>AI Endpoint Health</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Evaluator Model:</span>
                    <strong style={{ color: 'var(--primary)' }}>Gemini-1.5-Pro</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Verification Model:</span>
                    <strong>Symmetric Embedding (128d)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>API Success Rate:</span>
                    <strong style={{ color: 'var(--success)' }}>{analytics?.system?.successRate || '100%'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Secure SSL:</span>
                    <strong style={{ color: 'var(--success)' }}>TLS 1.3 Active</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: USER ACCOUNT MANAGEMENT */}
        {adminTab === 'users' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>PLATFORM CONTROLLERS</span>
              <h1 style={{ fontSize: '2.2rem' }}>User Directory & Permissions</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Activate or deactivate candidate accounts and assign administrative roles.</p>
            </div>

            {/* Filter toolbar */}
            <div className="glass-container" style={{ padding: '16px', display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input 
                  type="text" 
                  placeholder="Search user email or username..." 
                  className="form-input" 
                  style={{ paddingLeft: '38px', paddingBottom: '8px', paddingTop: '8px' }}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="glass-container" style={{ padding: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Username</th>
                      <th style={{ padding: '12px' }}>Email</th>
                      <th style={{ padding: '12px' }}>Role</th>
                      <th style={{ padding: '12px' }}>Created Date</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--card-border)', opacity: item.status === 'inactive' ? 0.6 : 1 }}>
                        <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.username}</td>
                        <td style={{ padding: '14px 12px' }}>{item.email}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: item.role === 'admin' ? 'var(--accent)' : 'var(--text-primary)' }}>
                            {item.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>{formatTime(item.registration_date)}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ background: item.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: item.status === 'active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', color: item.status === 'active' ? 'var(--success)' : 'var(--error)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', display: 'flex', gap: '8px' }}>
                          <button 
                            disabled={item.id === user.id}
                            onClick={() => handleToggleUserStatus(item.id, item.status)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem', color: item.status === 'active' ? 'var(--error)' : 'var(--success)' }}
                          >
                            {item.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <button 
                            disabled={item.id === user.id}
                            onClick={() => handleUpdateRole(item.id, item.role)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          >
                            Set {item.role === 'admin' ? 'User' : 'Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matches found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUESTION BANK CRUD */}
        {adminTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>CONTENT SCHEDULER</span>
                <h1 style={{ fontSize: '2.2rem' }}>Interview Question Bank</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Create, update, and manage technical/HR interview questionnaires.</p>
              </div>
              <button onClick={openCreateModal} className="btn btn-primary">
                <Plus size={16} /> Add New Question
              </button>
            </div>

            {/* Filters toolbar */}
            <div className="glass-container" style={{ padding: '16px', display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input 
                  type="text" 
                  placeholder="Search questions keyword..." 
                  className="form-input" 
                  style={{ paddingLeft: '38px', paddingBottom: '8px', paddingTop: '8px' }}
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter Role:</span>
                <select 
                  className="form-input" 
                  style={{ width: '180px', paddingBottom: '6px', paddingTop: '6px', background: 'var(--bg-primary)' }}
                  value={questionFilterRole}
                  onChange={(e) => setQuestionFilterRole(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredQuestions.map((q) => (
                <div key={q.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124,58,237,0.25)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {q.role}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {q.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        Difficulty: {q.difficulty}
                      </span>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600 }}>{q.question_text}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEditModal(q)} className="btn btn-secondary" style={{ padding: '8px' }} title="Edit Question">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-secondary" style={{ padding: '8px', color: 'var(--error)' }} title="Delete Question">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredQuestions.length === 0 && (
                <div className="glass-container" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Info style={{ margin: '0 auto 12px auto' }} />
                  <p>No questions matching criteria inside the bank</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TIMELINE LOGS */}
        {adminTab === 'logs' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>SECURITY LOGS</span>
              <h1 style={{ fontSize: '2.2rem' }}>System-Wide Audit Trails</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Immutable logs tracking operations, configuration mutations, logins, and deletions.</p>
            </div>

            <div className="glass-container" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '8px' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'start', flexShrink: 0 }}>
                      <Clock size={16} />
                    </div>
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.action}</p>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                        <span>User Context: <strong>{log.username || 'Unauthenticated'}</strong> ({log.email || 'N/A'})</span>
                        <span>IP Address: <strong>{log.ip_address}</strong></span>
                        <span>Log ID: #{log.id}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatTime(log.timestamp)}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No audit transactions recorded.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI MODEL MONITORING */}
        {adminTab === 'monitoring' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>PERFORMANCE TELEMETRY</span>
              <h1 style={{ fontSize: '2.2rem' }}>AI Model Telemetry & Scalability</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Live indicators for evaluator workloads, server load, and growth distributions.</p>
            </div>

            {/* Growth charts dynamically created using SVGs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* User Growth Chart */}
              <div className="glass-container" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={18} /> User Registration Metrics</h3>
                {analytics?.charts?.userGrowth ? (
                  <div>
                    <svg viewBox="0 0 500 200" style={{ width: '100%', height: '200px', overflow: 'visible' }}>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.05)" />

                      {(() => {
                        const data = analytics.charts.userGrowth;
                        const points = data.map((d, idx) => {
                          const x = idx * (500 / (data.length - 1));
                          // Map value to y coordinate
                          const maxCount = Math.max(...data.map(item => item.count)) || 10;
                          const y = 170 - (d.count / (maxCount * 1.2)) * 140;
                          return { x, y, date: d.date, count: d.count };
                        });

                        const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" />
                            {points.map((p, idx) => (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="5" fill="var(--secondary)" />
                                <text x={p.x} y={190} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">{p.date}</text>
                                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">{p.count}</text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                ) : <p>Loading data...</p>}
              </div>

              {/* Volume Distribution Chart */}
              <div className="glass-container" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={18} /> Volume by Role</h3>
                {analytics?.charts?.interviewVolume ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', height: '200px' }}>
                    {analytics.charts.interviewVolume.map((vol, i) => {
                      const total = analytics.charts.interviewVolume.reduce((s, item) => s + item.count, 0) || 1;
                      const percent = Math.round((vol.count / total) * 100);
                      return (
                        <div key={i} style={{ fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>{vol.role}</span>
                            <strong>{vol.count} sessions ({percent}%)</strong>
                          </div>
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p>Loading data...</p>}
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: GLOBAL CONFIGURATION PANEL */}
        {adminTab === 'config' && (
          <div>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>SYSTEM SCHEMAS</span>
              <h1 style={{ fontSize: '2.2rem' }}>Platform Global Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Mutate security variables, token validity limits, and model choices.</p>
            </div>

            <div className="glass-container" style={{ padding: '36px', maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>System Configuration Parameters</h3>
              
              {configSuccess && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
                  {configSuccess}
                </div>
              )}

              <form onSubmit={handleSaveConfig}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--primary)' }}>General Settings</h4>
                    <div className="form-group">
                      <label className="form-label">Active AI Model Endpoint</label>
                      <select 
                        className="form-input" 
                        style={{ background: 'var(--bg-primary)' }}
                        value={modelEndpoint}
                        onChange={(e) => setModelEndpoint(e.target.value)}
                      >
                        <option value="Gemini 3.5 Flash">Gemini 3.5 Flash (Default)</option>
                        <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Precision)</option>
                        <option value="GPT-4o Mock">GPT-4o (Fallback API)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Secure Auth Token Lifetime</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={sessionLifetime}
                        onChange={(e) => setSessionLifetime(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">OTP Verification Lifespan</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={otpExpiry}
                        onChange={(e) => setOtpExpiry(e.target.value)}
                      />
                    </div>

                  </div>

                  <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>SMTP Configuration</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={smtpEnabled}
                          onChange={(e) => setSmtpEnabled(e.target.checked)}
                          style={{ accentColor: 'var(--secondary)' }}
                        />
                        <span>Enable SMTP</span>
                      </label>
                    </div>

                    <div className="form-group" style={{ opacity: smtpEnabled ? 1 : 0.5, pointerEvents: smtpEnabled ? 'auto' : 'none', transition: 'all 0.2s ease' }}>
                      <label className="form-label">SMTP Host</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ opacity: smtpEnabled ? 1 : 0.5, pointerEvents: smtpEnabled ? 'auto' : 'none', transition: 'all 0.2s ease' }}>
                      <label className="form-label">SMTP Port</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. 587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ opacity: smtpEnabled ? 1 : 0.5, pointerEvents: smtpEnabled ? 'auto' : 'none', transition: 'all 0.2s ease' }}>
                      <label className="form-label">SMTP User</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="username@gmail.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ opacity: smtpEnabled ? 1 : 0.5, pointerEvents: smtpEnabled ? 'auto' : 'none', transition: 'all 0.2s ease' }}>
                      <label className="form-label">SMTP Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }}>
                  Save Configurations
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* QUESTION CRUD DIALOG MODAL */}
      {questionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ padding: '36px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>
                {modalMode === 'create' ? 'Add New Interview Question' : 'Edit Question Details'}
              </h3>
              <button onClick={() => setQuestionModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {crudError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {crudError}
              </div>
            )}

            <form onSubmit={handleQuestionSubmit}>
              <div className="form-group">
                <label className="form-label">Target Role Profile</label>
                <select 
                  className="form-input" 
                  style={{ background: 'var(--bg-primary)' }}
                  value={questionRole}
                  onChange={(e) => setQuestionRole(e.target.value)}
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Category</label>
                <select 
                  className="form-input" 
                  style={{ background: 'var(--bg-primary)' }}
                  value={questionCategory}
                  onChange={(e) => setQuestionCategory(e.target.value)}
                >
                  <option value="technical">Technical Concept</option>
                  <option value="hr">HR / Behavioral</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Rating</label>
                <select 
                  className="form-input" 
                  style={{ background: 'var(--bg-primary)' }}
                  value={questionDifficulty}
                  onChange={(e) => setQuestionDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text Content</label>
                <textarea 
                  placeholder="Type the actual interview question prompt here..." 
                  className="form-input" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }}>
                {modalMode === 'create' ? 'Insert into Bank' : 'Update Question Bank'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModalActive && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ padding: '36px', maxWidth: '480px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert /> Secure Deletion Wizard
              </h3>
              <button onClick={() => setDeleteModalActive(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {deleteError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {deleteError}
              </div>
            )}

            {deleteSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {deleteSuccessMsg}
              </div>
            )}

            {/* STEP 1: Verification Password */}
            {deleteStep === 1 && (
              <form onSubmit={handleRequestDeleteOtp}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 1 of 3:</strong> Input your password to initiate OTP deletion code verification.
                </p>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="form-input" 
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Verify & Request OTP
                </button>
              </form>
            )}

            {/* STEP 2: Verification OTP */}
            {deleteStep === 2 && (
              <form onSubmit={handleConfirmDeleteOtp}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 2 of 3:</strong> We have generated a deletion OTP code. Input code below to proceed.
                </p>
                <div className="form-group">
                  <label className="form-label">One-Time Password (OTP)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 123456" 
                    maxLength="6"
                    className="form-input" 
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem' }}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Confirm OTP Code
                </button>
              </form>
            )}

            {/* STEP 3: Final confirmation Checkbox */}
            {deleteStep === 3 && (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  <strong>Step 3 of 3:</strong> Click deletion confirmation checkbox to delete database record.
                </p>
                
                <div style={{ margin: '20px 0', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={deleteConfirmCheck} 
                      onChange={(e) => setDeleteConfirmCheck(e.target.checked)}
                      style={{ marginTop: '3px', accentColor: 'var(--error)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--error)' }}>Yes, permanently delete my account</p>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>This deletes resumes, credentials, and match histories immediately.</span>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setDeleteModalActive(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button 
                    disabled={!deleteConfirmCheck} 
                    onClick={async () => {
                      try {
                        setDeleteError('');
                        const res = await fetch('http://localhost:5000/api/auth/confirm-delete', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ otp: deleteOtp }) // re-validate on confirm
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert('Account permanently purged.');
                          logout();
                        } else {
                          setDeleteError(data.error || 'Erase failed.');
                        }
                      } catch (err) {
                        setDeleteError('Server error on erase.');
                      }
                    }} 
                    className={`btn ${deleteConfirmCheck ? 'btn-danger' : 'btn-disabled'}`}
                    style={{ flex: 1 }}
                  >
                    Erase Account Data
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
