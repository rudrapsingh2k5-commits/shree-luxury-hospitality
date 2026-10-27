import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Phone, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    register,
    forgotPassword,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setIsSubmitting(true);

    if (authModalTab === 'login') {
      const res = await login(email, password);
      if (res && !res.success) {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    } else if (authModalTab === 'register') {
      const res = await register({ name, email, password, phone });
      if (res && !res.success) {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } else if (authModalTab === 'forgot') {
      const res = await forgotPassword(email);
      if (res && res.success) {
        setStatusMessage(res.message);
      } else {
        setErrorMessage(res?.message || 'Failed to submit password reset request.');
      }
    }

    setIsSubmitting(false);
  };

  const switchTab = (tab) => {
    setErrorMessage('');
    setStatusMessage('');
    setAuthModalTab(tab);
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'relative',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-royal)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-brass)',
                fontWeight: '700',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              SHREE श्री Hospitality
            </span>
            <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-forest)' }}>
              {authModalTab === 'login' && 'Sign In to Your Account'}
              {authModalTab === 'register' && 'Create Guest Account'}
              {authModalTab === 'forgot' && 'Reset Your Password'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {/* Status / Error Alerts */}
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-crimson-bg)',
                border: '1px solid rgba(153, 27, 27, 0.2)',
                color: 'var(--status-crimson)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-emerald-bg)',
                border: '1px solid rgba(22, 101, 52, 0.2)',
                color: 'var(--status-emerald)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              {statusMessage}
            </div>
          )}

          {/* Tab Navigation for Login / Register */}
          {authModalTab !== 'forgot' && (
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => switchTab('login')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: authModalTab === 'login' ? '2px solid var(--primary-forest)' : '2px solid transparent',
                  color: authModalTab === 'login' ? 'var(--primary-forest)' : 'var(--text-muted)',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: authModalTab === 'register' ? '2px solid var(--primary-forest)' : '2px solid transparent',
                  color: authModalTab === 'register' ? 'var(--primary-forest)' : 'var(--text-muted)',
                }}
              >
                Register as Guest
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authModalTab === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-name">
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon
                      size={18}
                      color="var(--text-subtle)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="auth-name"
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '40px' }}
                      placeholder="e.g. Maharani Gayatri Devi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-phone">
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={18}
                      color="var(--text-subtle)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="auth-phone"
                      type="tel"
                      className="form-control"
                      style={{ paddingLeft: '40px' }}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {authModalTab === 'login' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select Profile to Autofill & Sign In:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@shreehotels.com');
                      setPassword('Admin@123');
                    }}
                    className="btn btn-subtle btn-sm"
                    style={{ fontSize: '0.78rem', padding: '8px 4px', fontWeight: '600' }}
                  >
                    🛡️ Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('staff.udaipur@shreehotels.com');
                      setPassword('Staff@123');
                    }}
                    className="btn btn-subtle btn-sm"
                    style={{ fontSize: '0.78rem', padding: '8px 4px', fontWeight: '600' }}
                  >
                    🏨 Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('guest@shreehotels.com');
                      setPassword('Guest@123');
                    }}
                    className="btn btn-subtle btn-sm"
                    style={{ fontSize: '0.78rem', padding: '8px 4px', fontWeight: '600' }}
                  >
                    👑 Guest
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="auth-email"
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {authModalTab !== 'forgot' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  {authModalTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-brass)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    color="var(--text-subtle)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    placeholder={authModalTab === 'register' ? 'Min 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-subtle)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                marginTop: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              {isSubmitting ? (
                <span>Please wait...</span>
              ) : (
                <>
                  {authModalTab === 'login' && 'Sign In to Account'}
                  {authModalTab === 'register' && 'Register Guest Profile'}
                  {authModalTab === 'forgot' && 'Send Password Reset Link'}
                  <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                </>
              )}
            </button>
          </form>

          {authModalTab === 'forgot' && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => switchTab('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-forest)',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Return to Sign In
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Staff and administrator accounts are provisioned directly by hotel administration. Public registration assigns guest access only.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
