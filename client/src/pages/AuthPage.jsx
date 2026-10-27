import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const AuthPage = ({ initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, forgotPassword, resetPassword, verifyEmail, isAuthenticated, role } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'reset' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const redirectTarget = searchParams.get('redirect') || (role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/dashboard');
  const tokenParam = searchParams.get('token');

  // Handle token params from URL if verify or reset
  useEffect(() => {
    if (initialMode === 'verify' || window.location.pathname === '/verify-email') {
      setMode('verify');
      if (tokenParam) {
        handleEmailVerification(tokenParam);
      }
    } else if (initialMode === 'reset' || window.location.pathname === '/reset-password') {
      setMode('reset');
    } else if (window.location.pathname === '/register') {
      setMode('register');
    } else if (window.location.pathname === '/forgot-password') {
      setMode('forgot');
    } else {
      setMode('login');
    }
  }, [initialMode, tokenParam]);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated && mode === 'login') {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget, mode]);

  const handleEmailVerification = async (tokenVal) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const res = await verifyEmail(tokenVal);
    if (res && res.success) {
      setSuccessMessage('Your email has been verified successfully! You may now sign in.');
      setMode('login');
    } else {
      setErrorMessage(res?.message || 'Verification token is invalid or has expired.');
    }
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res && res.success) {
          const dest = searchParams.get('redirect') || (res.user?.role === 'admin' ? '/admin' : res.user?.role === 'staff' ? '/staff' : '/dashboard');
          navigate(dest, { replace: true });
        } else {
          setErrorMessage(res?.message || 'Invalid email or password.');
        }
      } else if (mode === 'register') {
        const res = await register({ name, email, password, phone });
        if (res && res.success) {
          setSuccessMessage('Registration successful! Please check your email to verify your address.');
          setMode('login');
        } else {
          setErrorMessage(res?.message || 'Registration failed.');
        }
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        if (res && res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res?.message || 'Failed to submit password reset request.');
        }
      } else if (mode === 'reset') {
        if (!tokenParam) {
          setErrorMessage('Reset token is missing from URL.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        const res = await resetPassword(tokenParam, password);
        if (res && res.success) {
          setSuccessMessage(res.message);
          setMode('login');
        } else {
          setErrorMessage(res?.message || 'Failed to reset password.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 160px)',
        backgroundColor: 'var(--bg-ivory)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-medium)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            padding: '2rem 2rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: '#FAF8F4',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-maroon)',
              color: 'var(--accent-gold)',
              fontFamily: 'var(--font-devanagari)',
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 12px rgba(110, 26, 36, 0.2)',
            }}
          >
            श्री
          </div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-forest)' }}>
            {mode === 'login' && 'Sign In to SHREE श्री'}
            {mode === 'register' && 'Guest Registration'}
            {mode === 'forgot' && 'Password Recovery'}
            {mode === 'reset' && 'Set New Password'}
            {mode === 'verify' && 'Email Verification'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'login' && 'Access your luxury reservations and stay services.'}
            {mode === 'register' && 'Create your guest account to manage stays across India.'}
            {mode === 'forgot' && 'Enter your email address to receive secure reset instructions.'}
            {mode === 'reset' && 'Choose a strong, new password for your account.'}
            {mode === 'verify' && 'Confirming your email ownership token.'}
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-crimson-bg)',
                border: '1px solid rgba(153, 27, 27, 0.2)',
                color: 'var(--status-crimson)',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-emerald-bg)',
                border: '1px solid rgba(22, 101, 52, 0.2)',
                color: 'var(--status-emerald)',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Mode Switcher Tabs for Login / Register */}
          {(mode === 'login' || mode === 'register') && (
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: mode === 'login' ? '2px solid var(--primary-forest)' : '2px solid transparent',
                  color: mode === 'login' ? 'var(--primary-forest)' : 'var(--text-muted)',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('register');
                }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: mode === 'register' ? '2px solid var(--primary-forest)' : '2px solid transparent',
                  color: mode === 'register' ? 'var(--primary-forest)' : 'var(--text-muted)',
                }}
              >
                Register as Guest
              </button>
            </div>
          )}

          {mode === 'verify' && !tokenParam && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Verification token is missing. Please check the link sent to your email.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Go to Sign In
              </Link>
            </div>
          )}

          {(mode !== 'verify' || tokenParam) && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="register-name">
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={18}
                        color="var(--text-subtle)"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        id="register-name"
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
                    <label className="form-label" htmlFor="register-phone">
                      Contact Phone (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone
                        size={18}
                        color="var(--text-subtle)"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <input
                        id="register-phone"
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

              {mode === 'login' && (
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

              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-page-email">
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      color="var(--text-subtle)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="auth-page-email"
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
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" htmlFor="auth-page-password" style={{ marginBottom: 0 }}>
                      {mode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setMode('forgot');
                        }}
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
                      id="auth-page-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      placeholder={mode === 'register' || mode === 'reset' ? 'Min 6 characters' : 'Enter your password'}
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

              {mode === 'reset' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-page-confirm-password">
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      color="var(--text-subtle)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="auth-page-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    {mode === 'login' && 'Sign In'}
                    {mode === 'register' && 'Register Guest Profile'}
                    {mode === 'forgot' && 'Send Password Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                    <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
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
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
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

export default AuthPage;
