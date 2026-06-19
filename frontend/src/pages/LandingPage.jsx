import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Cpu, Award, Zap, FileText, HelpCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { setCurrentPage } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <header className="glass-container" style={{
        position: 'sticky',
        top: '16px',
        margin: '16px 24px',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={28} color="var(--primary)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="text-gradient">Hirenix</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => setCurrentPage('auth')} 
            className="btn btn-primary"
          >
            Sign In / Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <section style={{ 
          textAlign: 'center', 
          padding: '80px 20px', 
          backgroundImage: 'var(--hero-gradient)',
          borderRadius: '30px',
          marginBottom: '60px'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(124, 58, 237, 0.1)', 
            padding: '8px 16px', 
            borderRadius: '50px',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            marginBottom: '24px'
          }}>
            <Award size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Next-Gen Interview Preparation</span>
          </div>

          <h1 style={{ fontSize: '3.8rem', lineHeight: '1.1', marginBottom: '24px', fontWeight: 800 }}>
            Master Your Next Interview With <br />
            <span className="text-gradient">Hirenix AI</span>
          </h1>
          
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.2rem', 
            maxWidth: '650px', 
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            Optimize your resume for ATS algorithms, identify skill gaps, and practice adaptive mock interviews with live communication, confidence, and correctness analysis.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentPage('auth')} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
              Explore Features
            </a>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" style={{ marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '16px' }}>Supercharged Platform Features</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            Experience enterprise-grade security and advanced AI components built to accelerate your career progression.
          </p>

          <div className="dashboard-grid">
            <div className="glass-card">
              <FileText size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>ATS Score & Parse Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Upload your resume to calculate its keyword matching frequency against standard job descriptions and uncover critical gaps.
              </p>
            </div>

            <div className="glass-card">
              <Cpu size={40} color="var(--secondary)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Adaptive AI Mock Interviews</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Practice with dynamically generated HR and technical questions that change difficulty in real-time based on the quality of your answers.
              </p>
            </div>

            <div className="glass-card">
              <Zap size={40} color="var(--success)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Speech & Confidence Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Integrated text-to-speech engine and audio canvas simulators monitor communication clarity, pacing delays, and answer correctness.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="glass-container" style={{ padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center', borderRadius: '24px', marginBottom: '80px' }}>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800 }} className="text-gradient">98%</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>ATS Match Accuracy</p>
          </div>
          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800 }} className="text-gradient">15k+</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Interviews Conducted</p>
          </div>

          <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800 }} className="text-gradient">100%</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>GDPR Compliant & Encrypted</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-container" style={{
        margin: 'auto 24px 24px 24px',
        padding: '24px',
        textAlign: 'center',
        borderRadius: '16px',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}>
        <p>&copy; {new Date().getFullYear()} Hirenix Platform. Built for Enterprise-Grade Interview Assessments.</p>
      </footer>
    </div>
  );
}
