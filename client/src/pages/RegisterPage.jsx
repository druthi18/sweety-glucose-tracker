import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '1.5rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: 'white',
            borderRadius: '16px',
            width: '3.5rem',
            height: '3.5rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(225, 29, 72, 0.25)'
          }}>
            <HeartPulse size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Create Your Account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Start monitoring and managing your blood glucose with Sweety
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {errorMessage && (
            <div className="alert alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-email"
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type="password"
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm"
                  type="password"
                  className="input-field"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Registering...' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700 }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
