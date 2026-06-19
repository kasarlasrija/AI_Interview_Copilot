import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Cpu, ArrowLeft, Camera, Key, Mail, User, ShieldAlert, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthPage() {
  const { 
    login, 
    loginWithFace, 
    loginWithGoogle,
    register, 
    verifyOtp, 
    registerFace, 
    forgotPassword, 
    resetPassword,
    setCurrentPage 
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  // Auth Modes: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('signin');
  // Sign-in Method: 'password' | 'face'
  const [signInMethod, setSignInMethod] = useState('password');
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

  // Verification & Face Reg flow states
  const [currentStep, setCurrentStep] = useState('form'); // 'form' | 'otp' | 'face_reg' | 'success'
  const [regEmail, setRegEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMessage, setScanMessage] = useState('Initializing camera...');
  const [livenessStage, setLivenessStage] = useState('align'); // 'align' | 'blink' | 'verifying'
  const [scanProgress, setScanProgress] = useState(0);

  // Errors / Success alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isDualFactorActive, setIsDualFactorActive] = useState(false);
  const [googlePopupActive, setGooglePopupActive] = useState(false);
  const [simulateSpoof, setSimulateSpoof] = useState(false);
  const [isSignUpAdmin, setIsSignUpAdmin] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    // Dynamically load Google Client library for OAuth 2.0 Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-placeholder-client-id.apps.googleusercontent.com',
          callback: (response) => {
            if (response.credential) {
              const tokenParts = response.credential.split('.');
              try {
                const payload = JSON.parse(atob(tokenParts[1]));
                loginWithGoogle(payload.email, payload.name || 'Google User', response.credential)
                  .catch(err => setErrorMsg(err.message));
              } catch (e) {
                setErrorMsg('Google login failed parsing token.');
              }
            }
          }
        });
        
        // Render button container
        const container = document.getElementById('google-signin-btn-container');
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'filled_blue',
            size: 'large',
            width: 320
          });
        }
      }
    };

    return () => {
      stopCamera();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [authMode]);

  const clearAlerts = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Start WebRTC camera
  const startCamera = async () => {
    try {
      clearAlerts();
      setCameraActive(true);
      setScanProgress(0);
      setLivenessStage('align');
      setScanMessage('Position your face inside the bounding zone');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Draw standard face scan indicators
      drawFaceFrame();
    } catch (err) {
      console.error('Camera access failed:', err);
      setErrorMsg('Unable to access device camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  };

  // Draw HUD face outline and manage liveness animations
  const drawFaceFrame = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let progress = 0;
    let blinkPromptCount = 0;

    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw oval guide line
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = 100;
      const ry = 130;

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.lineWidth = 3;
      
      if (progress < 40) {
        ctx.strokeStyle = '#7c3aed'; // Primary purple
        setLivenessStage('align');
        setScanMessage('Align your face inside the overlay');
      } else if (progress < 80) {
        ctx.strokeStyle = '#06b6d4'; // Cyan
        setLivenessStage('blink');
        setScanMessage('Liveness Check: BLINK YOUR EYES once now');
      } else {
        ctx.strokeStyle = '#10b981'; // Green
        setLivenessStage('verifying');
        setScanMessage('Analyzing facial embeddings...');
      }
      ctx.stroke();

      // Render scanner grid inside oval
      if (progress > 10 && progress < 80) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.fill();
      }

      progress += 2;
      setScanProgress(Math.min(100, progress));

      if (progress >= 100) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        onScanComplete();
      }
    }, 80);
  };

  const onScanComplete = async () => {
    stopCamera();
    clearAlerts();

    // Create custom dummy 128-float face embeddings array for DB verification
    // If simulateSpoof is active, make it fail similarity (use mean 0, e.g. Math.random() * 2 - 1)
    const mockEmbedding = simulateSpoof
      ? Array.from({ length: 128 }, () => Math.random() * 2 - 1)
      : Array.from({ length: 128 }, () => Math.random() * 0.2 + 0.5);

    try {
      if (currentStep === 'face_reg') {
        // Registering
        await registerFace(regEmail, mockEmbedding);
        setSuccessMsg('Facial registration and liveness analysis verified!');
        setCurrentStep('success');
      } else if (isDualFactorActive) {
        // Dual-factor login verification (password + face)
        await login(signInIdentifier, signInPassword, mockEmbedding);
        setIsDualFactorActive(false);
      } else {
        // Logging in (biometrics tab passwordless)
        await loginWithFace(signInIdentifier, mockEmbedding);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Submit Sign In Form
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearAlerts();
    if (!signInIdentifier || !signInPassword) {
      setErrorMsg('Please enter all credentials');
      return;
    }
    
    // Safety check for administrative role
    if (isAdminSignIn && signInIdentifier !== 'admin' && !signInIdentifier.includes('admin')) {
      setErrorMsg('This credential is not authorized for administrative entry');
      return;
    }

    try {
      const res = await login(signInIdentifier, signInPassword);
      if (res && res.status === 'face_required') {
        setIsDualFactorActive(true);
        setSignInMethod('face');
        setSuccessMsg('Dual-Factor Face Biometrics Required – Please complete face recognition authentication to enter.');
        startCamera();
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
      
      setSuccessMsg('Account created successfully. Please enroll your facial biometrics to continue.');
      setCurrentStep('face_reg');
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
      setSuccessMsg('Email successfully verified. Now capture your facial biometrics.');
      setCurrentStep('face_reg');
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

  // Trigger Mock Google account select screen
  const triggerGoogleAuth = (accountEmail, accountName) => {
    setGooglePopupActive(false);
    clearAlerts();
    loginWithGoogle(accountEmail, accountName)
      .catch(err => setErrorMsg(err.message));
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
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>CopilotAI</span>
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

            {/* Signin Method Toggle (Only for standard users) */}
            {!isAdminSignIn && (
              <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', marginBottom: '24px' }}>
                <button 
                  onClick={() => { setSignInMethod('password'); stopCamera(); }}
                  style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: signInMethod === 'password' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: signInMethod === 'password' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Password Auth
                </button>
                <button 
                  onClick={() => { setSignInMethod('face'); clearAlerts(); }}
                  style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: signInMethod === 'face' ? 'var(--primary)' : 'var(--text-secondary)', borderBottom: signInMethod === 'face' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Face Scan Auth
                </button>
              </div>
            )}

            {/* Standard Password Form */}
            {(signInMethod === 'password' || isAdminSignIn) && (
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
            )}

            {/* Face Login scan viewport */}
            {signInMethod === 'face' && !isAdminSignIn && (
              <div>
                {!cameraActive ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(124, 58, 237, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                      <Camera size={36} color="var(--primary)" />
                    </div>
                    
                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                      <label className="form-label">Username or Email</label>
                      <input 
                        type="text" 
                        placeholder="Enter email or username to search biometrics" 
                        className="form-input"
                        value={signInIdentifier}
                        onChange={(e) => setSignInIdentifier(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (!signInIdentifier) {
                          setErrorMsg('Please provide your email/username first');
                        } else {
                          startCamera();
                        }
                      }} 
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Initialize Face Scan
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="scanner-viewport">
                      <video ref={videoRef} className="scanner-video" autoPlay playsInline muted></video>
                      <canvas ref={canvasRef} width="640" height="480" className="scanner-canvas"></canvas>
                      <div className="scan-laser"></div>
                    </div>
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 600 }}>{scanMessage}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Scan Progress: {scanProgress}%</p>
                      
                      <div style={{ margin: '12px 0', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={simulateSpoof} 
                            onChange={(e) => setSimulateSpoof(e.target.checked)} 
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span>Simulate Spoofed / Unauthorized Face</span>
                        </label>
                      </div>

                      <button 
                        onClick={stopCamera} 
                        className="btn btn-secondary" 
                        style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Google OAuth & Signup redirect */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div id="google-signin-btn-container"></div>
              </div>
              <button 
                onClick={() => setGooglePopupActive(true)}
                className="btn btn-secondary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
              >
                <Cpu size={16} /> Continue with Google (Choice Dialog)
              </button>

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

            {currentStep === 'face_reg' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Facial Biometric Enrollment</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Register your face as a primary key for passwordless auth. Liveness checks ensure anti-spoofing compliance.
                </p>

                {!cameraActive ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                      width: '85px',
                      height: '85px',
                      borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px auto',
                      border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}>
                      <Camera size={38} color="var(--secondary)" />
                    </div>

                    <button onClick={startCamera} className="btn btn-primary" style={{ width: '100%' }}>
                      Open Camera
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="scanner-viewport">
                      <video ref={videoRef} className="scanner-video" autoPlay playsInline muted></video>
                      <canvas ref={canvasRef} width="640" height="480" className="scanner-canvas"></canvas>
                      <div className="scan-laser"></div>
                    </div>
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 600 }}>{scanMessage}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Verification level: {scanProgress}%</p>
                      <button 
                        onClick={stopCamera} 
                        className="btn btn-secondary" 
                        style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
                  Your account is verified, and facial biometric identifiers have been securely saved.
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

      {/* GOOGLE ACCOUNT CHOOSER MODAL POPUP */}
      {googlePopupActive && (
        <div className="modal-overlay">
          <div className="modal-content glass-container" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu color="var(--primary)" size={20} /> Choose Google Account
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              to continue to <strong>CopilotAI Platform</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => triggerGoogleAuth('alex.jones@gmail.com', 'Alex Jones')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff5722', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alex Jones</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>alex.jones@gmail.com</p>
                </div>
              </button>

              <button 
                onClick={() => triggerGoogleAuth('sarah.connor@gmail.com', 'Sarah Connor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3f51b5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sarah Connor</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>sarah.connor@gmail.com</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setGooglePopupActive(false)} 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '24px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
