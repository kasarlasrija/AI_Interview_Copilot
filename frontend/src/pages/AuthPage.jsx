import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Cpu, ArrowLeft, Key, Mail, User, ShieldAlert, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthPage() {
  const { 
    login, 
    register, 
    verifyOtp, 
    forgotPassword, 
    resetPassword,
    setCurrentPage,
    logout
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  // Auth Modes: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('signin');
  // Is Admin Switcher
  const [isAdminSignIn, setIsAdminSignIn] = useState(false);

  // Sign In states
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up states
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  
  // Forgot Password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Reset

  // Verification flow states
  const [currentStep, setCurrentStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [regEmail, setRegEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Errors / Success alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSignUpAdmin, setIsSignUpAdmin] = useState(false);

  const clearAlerts = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Submit Sign In Form
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!signInIdentifier || !signInPassword) {
      setErrorMsg('Please enter all credentials');
      return;
    }

    try {
      const res = await login(signInIdentifier, signInPassword);
      // Verify that users signing in as admin actually have the admin role
      if (isAdminSignIn && res && res.user && res.user.role !== 'admin') {
        logout();
        setErrorMsg('This credential is not authorized for administrative entry');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit Sign Up Form
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!signUpEmail || !signUpUsername || !signUpPassword) {
      setErrorMsg('All registration fields are required');
      return;
    }

    try {
      const res = await register(signUpUsername, signUpEmail, signUpPassword, isSignUpAdmin ? 'admin' : 'user');
      setRegEmail(signUpEmail);
      
      setSuccessMsg('OTP verification code sent to your email. Please verify to complete signup.');
      setCurrentStep('otp');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!otpCode) {
      setErrorMsg('Please input the 6-digit verification code');
      return;
    }

    try {
      await verifyOtp(regEmail, otpCode);
      setSuccessMsg('Email successfully verified! Setup complete.');
      setCurrentStep('success');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit Password Forgot Email
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    clearAlerts();
    try {
      await forgotPassword(forgotEmail);
      setForgotOtp('123456');
      setSuccessMsg('Reset request approved. Please enter your new password.');
      setForgotStep(2);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit Password Reset Form
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearAlerts();
    try {
      await resetPassword(forgotEmail, forgotOtp, newPassword);
      setSuccessMsg('Your password has been changed. You can now sign in.');
      setAuthMode('signin');
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0
      }}></div>

      {/* Main Glass Box */}
      <div className="glass-container" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Header toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button 
            onClick={() => {
              stopCamera();
              setCurrentPage('landing');
            }} 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Home
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="var(--primary)" />
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>Hirenix</span>
          </div>

          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--error)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN FLOW */}
        {authMode === 'signin' && currentStep === 'form' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              {isAdminSignIn ? 'Admin Dashboard Sign In' : 'Sign In to Platform'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Access your personalized workspace metrics.
            </p>

            {/* Admin Switch */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--card-border)' }}>
              <button 
                type="button" 
                onClick={() => { setIsAdminSignIn(false); clearAlerts(); }}
                style={{ flex: 1, padding: '8px', border: 'none', background: !isAdminSignIn ? 'var(--primary)' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                User Login
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAdminSignIn(true); clearAlerts(); }}
                style={{ flex: 1, padding: '8px', border: 'none', background: isAdminSignIn ? 'var(--primary)' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Admin Login
              </button>
            </div>


            {/* Standard Password Form */}
            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Username or Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                  <input 
                    type="text" 
                    placeholder="e.g. user@interviewcopilot.com" 
                    className="form-input" 
                    style={{ paddingLeft: '44px' }}
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button type="button" onClick={() => setAuthMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Key size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="form-input" 
                    style={{ paddingLeft: '44px' }}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                Authenticate
              </button>
            </form>

            {/* Signup redirect */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Don't have an account?{' '}
                <button onClick={() => { setAuthMode('signup'); clearAlerts(); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                  Create Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 2. SIGN UP / REGISTRATION WIZARD */}
        {authMode === 'signup' && (
          <div>
            {currentStep === 'form' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Begin your AI interview readiness program.
                </p>

                {/* Role Switcher */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--card-border)' }}>
                  <button 
                    type="button" 
                    onClick={() => { setIsSignUpAdmin(false); clearAlerts(); }}
                    style={{ flex: 1, padding: '8px', border: 'none', background: !isSignUpAdmin ? 'var(--primary)' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    User Account
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setIsSignUpAdmin(true); clearAlerts(); }}
                    style={{ flex: 1, padding: '8px', border: 'none', background: isSignUpAdmin ? 'var(--primary)' : 'transparent', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Admin Account
                  </button>
                </div>

                <form onSubmit={handleSignUp}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                      <input 
                        type="text" 
                        placeholder="e.g. dev_candidate" 
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                      <input 
                        type="email" 
                        placeholder="candidate@example.com" 
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                      <input 
                        type="password" 
                        placeholder="Min. 8 characters" 
                        className="form-input" 
                        style={{ paddingLeft: '44px' }}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
                    Sign Up
                  </button>
                </form>

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '24px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Already have an account?{' '}
                    <button onClick={() => { setAuthMode('signin'); clearAlerts(); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'otp' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Security Verification</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  We have sent a secure OTP to <strong>{regEmail}</strong>. Enter the verification code below.
                </p>

                <form onSubmit={handleVerifyOtp}>
                  <div className="form-group">
                    <label className="form-label">One-Time Password (OTP)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456" 
                      maxLength="6"
                      className="form-input" 
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.4rem' }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    Verify Email
                  </button>
                </form>
              </div>
            )}


            {currentStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  color: 'var(--success)'
                }}>
                  <CheckCircle size={44} />
                </div>

                <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '8px' }}>Setup Complete!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                  Your account is verified and successfully set up.
                </p>

                <button 
                  onClick={() => {
                    setAuthMode('signin');
                    setCurrentStep('form');
                    clearAlerts();
                  }} 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Log In Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. FORGOT PASSWORD WORKFLOW */}
        {authMode === 'forgot' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Reset Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Recover access using your registered email address.
            </p>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter account email" 
                    className="form-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Request Reset Token
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                {/* OTP field is bypassed */}
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    placeholder="At least 8 characters" 
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Save New Password
                </button>
              </form>
            )}

            <button 
              onClick={() => {
                setAuthMode('signin');
                setForgotStep(1);
                clearAlerts();
              }} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '12px' }}
            >
              Back to Sign In
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
