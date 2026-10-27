import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Briefcase,
  Crown,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Compass,
  Building,
} from 'lucide-react';

export const WelcomeSignInPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role: activeRole } = useAuth();

  // Role accounts configured in SHREE system
  const roleProfiles = {
    admin: {
      key: 'admin',
      title: 'Platform Administrator',
      subtitle: 'Complete System Governance',
      email: 'admin@shreehotels.com',
      password: 'Admin@123',
      icon: Shield,
      badge: 'Headquarters',
      badgeClass: 'badge-maroon',
      description: 'Access financial analytics, hotel catalog approvals, coupon management, and security audit logs.',
      destination: '/admin',
    },
    staff_udaipur: {
      key: 'staff_udaipur',
      title: 'Udaipur Palace Staff',
      subtitle: 'Front Desk & Operations',
      email: 'staff.udaipur@shreehotels.com',
      password: 'Staff@123',
      icon: Building,
      badge: 'Udaipur Palace',
      badgeClass: 'badge-forest',
      description: 'Check in & check out guests at The Mewar Palace, update room cleaning status, and handle concierge service.',
      destination: '/staff',
    },
    staff_goa: {
      key: 'staff_goa',
      title: 'Goa Resort Staff',
      subtitle: 'Beachfront Operations',
      email: 'staff.goa@shreehotels.com',
      password: 'Staff@123',
      icon: Briefcase,
      badge: 'Goa Resort',
      badgeClass: 'badge-forest',
      description: 'Manage seaside arrivals at Aguada Cove Beach Resort, housekeeping turnover, and guest inquiries.',
      destination: '/staff',
    },
    guest: {
      key: 'guest',
      title: 'Royal Guest',
      subtitle: 'Patron & Member',
      email: 'guest@shreehotels.com',
      password: 'Guest@123',
      icon: Crown,
      badge: 'Patron Tier',
      badgeClass: 'badge-brass',
      description: 'Discover luxury Indian stays, reserve heritage suites, use exclusive promo coupons, and manage itinerary.',
      destination: '/dashboard',
    },
  };

  const [selectedRole, setSelectedRole] = useState('guest');
  const [email, setEmail] = useState(roleProfiles.guest.email);
  const [password, setPassword] = useState(roleProfiles.guest.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle selecting a role card and autofilling credentials
  const handleSelectRole = (roleKey) => {
    const profile = roleProfiles[roleKey];
    if (!profile) return;
    setSelectedRole(roleKey);
    setEmail(profile.email);
    setPassword(profile.password);
    setErrorMessage('');
  };

  // Perform sign in with the loaded credentials
  const handleSignIn = async (overrideRoleKey = null) => {
    const roleKey = overrideRoleKey || selectedRole;
    const profile = roleProfiles[roleKey] || roleProfiles.guest;
    const targetEmail = overrideRoleKey ? profile.email : email;
    const targetPassword = overrideRoleKey ? profile.password : password;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(targetEmail, targetPassword);
      if (res && res.success) {
        const dest = profile.destination || (res.user?.role === 'admin' ? '/admin' : res.user?.role === 'staff' ? '/staff' : '/dashboard');
        navigate(dest, { replace: true });
      } else {
        setErrorMessage(res?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error occurred during sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProfile = roleProfiles[selectedRole] || roleProfiles.guest;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 76px)',
        backgroundColor: 'var(--bg-ivory, #FBF9F5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {/* Top Auspicious Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 18px',
              backgroundColor: 'rgba(197, 155, 39, 0.12)',
              border: '1px solid rgba(197, 155, 39, 0.35)',
              borderRadius: '9999px',
              color: 'var(--primary-forest, #1A3026)',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={16} color="var(--accent-brass, #C59B27)" />
            <span>SHREE श्री Auspicious Hospitality Portal</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-royal, "Cinzel", serif)',
              fontSize: '2.6rem',
              color: 'var(--primary-forest-dark, #102119)',
              marginBottom: '0.6rem',
              letterSpacing: '0.02em',
            }}
          >
            Welcome & Gateway Portal
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-muted, #5F6762)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Select who you wish to sign in as. Your credentials will be automatically populated so you can access the system with a single click.
          </p>
        </div>

        {/* Role Selection Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.25rem',
          }}
        >
          {/* 1. Admin */}
          {(() => {
            const p = roleProfiles.admin;
            const isSelected = selectedRole === p.key;
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => handleSelectRole(p.key)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  border: isSelected ? '2px solid var(--primary-maroon, #6E1A24)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(110, 26, 36, 0.04)' : '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: isSelected ? '0 10px 24px -4px rgba(110, 26, 36, 0.2)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary-maroon-subtle, rgba(110, 26, 36, 0.1))',
                        color: 'var(--primary-maroon, #6E1A24)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className={`badge ${p.badgeClass}`}>{p.badge}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest-dark)', marginBottom: '4px' }}>
                    {p.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-brass)', fontWeight: '600', marginBottom: '8px' }}>
                    {p.subtitle}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {p.description}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-cream, #EFE8DD)',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      color: 'var(--primary-forest)',
                      marginBottom: '10px',
                    }}
                  >
                    <div>{p.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(p.key);
                      handleSignIn(p.key);
                    }}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    style={{ width: '100%' }}
                  >
                    {isSelected ? '✓ Direct Sign In' : 'Select Administrator'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2. Staff Udaipur */}
          {(() => {
            const p = roleProfiles.staff_udaipur;
            const isSelected = selectedRole === p.key;
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => handleSelectRole(p.key)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  border: isSelected ? '2px solid var(--primary-forest, #1A3026)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(26, 48, 38, 0.05)' : '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: isSelected ? '0 10px 24px -4px rgba(26, 48, 38, 0.18)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(26, 48, 38, 0.1)',
                        color: 'var(--primary-forest, #1A3026)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className={`badge ${p.badgeClass}`}>{p.badge}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest-dark)', marginBottom: '4px' }}>
                    {p.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-brass)', fontWeight: '600', marginBottom: '8px' }}>
                    {p.subtitle}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {p.description}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-cream, #EFE8DD)',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      color: 'var(--primary-forest)',
                      marginBottom: '10px',
                    }}
                  >
                    <div>{p.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(p.key);
                      handleSignIn(p.key);
                    }}
                    className={`btn ${isSelected ? 'btn-forest' : 'btn-outline'} btn-sm`}
                    style={{ width: '100%' }}
                  >
                    {isSelected ? '✓ Direct Sign In' : 'Select Udaipur Staff'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 3. Staff Goa */}
          {(() => {
            const p = roleProfiles.staff_goa;
            const isSelected = selectedRole === p.key;
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => handleSelectRole(p.key)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  border: isSelected ? '2px solid var(--primary-forest, #1A3026)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(26, 48, 38, 0.05)' : '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: isSelected ? '0 10px 24px -4px rgba(26, 48, 38, 0.18)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(26, 48, 38, 0.1)',
                        color: 'var(--primary-forest, #1A3026)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className={`badge ${p.badgeClass}`}>{p.badge}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest-dark)', marginBottom: '4px' }}>
                    {p.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-brass)', fontWeight: '600', marginBottom: '8px' }}>
                    {p.subtitle}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {p.description}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-cream, #EFE8DD)',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      color: 'var(--primary-forest)',
                      marginBottom: '10px',
                    }}
                  >
                    <div>{p.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(p.key);
                      handleSignIn(p.key);
                    }}
                    className={`btn ${isSelected ? 'btn-forest' : 'btn-outline'} btn-sm`}
                    style={{ width: '100%' }}
                  >
                    {isSelected ? '✓ Direct Sign In' : 'Select Goa Staff'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 4. Guest */}
          {(() => {
            const p = roleProfiles.guest;
            const isSelected = selectedRole === p.key;
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => handleSelectRole(p.key)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '1.5rem',
                  border: isSelected ? '2px solid var(--accent-brass, #C59B27)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(197, 155, 39, 0.08)' : '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: isSelected ? '0 10px 24px -4px rgba(197, 155, 39, 0.25)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(197, 155, 39, 0.15)',
                        color: 'var(--accent-brass, #C59B27)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className={`badge ${p.badgeClass}`}>{p.badge}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest-dark)', marginBottom: '4px' }}>
                    {p.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-brass)', fontWeight: '600', marginBottom: '8px' }}>
                    {p.subtitle}
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                    {p.description}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-cream, #EFE8DD)',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      color: 'var(--primary-forest)',
                      marginBottom: '10px',
                    }}
                  >
                    <div>{p.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRole(p.key);
                      handleSignIn(p.key);
                    }}
                    className={`btn ${isSelected ? 'btn-brass' : 'btn-outline'} btn-sm`}
                    style={{ width: '100%' }}
                  >
                    {isSelected ? '✓ Direct Sign In' : 'Select Royal Guest'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Selected Role Autofill Sign-In Form */}
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-brass, rgba(197, 155, 39, 0.38))',
            boxShadow: 'var(--shadow-md)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card-subtle, #FAF7F2)',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <CheckCircle2 size={18} color="var(--accent-brass, #C59B27)" />
            <div style={{ fontSize: '0.88rem', color: 'var(--primary-forest)' }}>
              Active Profile: <strong>{currentProfile.title}</strong> — Credentials autofilled below.
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: 'var(--status-crimson-bg, #FEE2E2)',
                border: '1px solid #FECDD3',
                color: 'var(--status-crimson, #991B1B)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignIn();
            }}
          >
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} color="var(--primary-forest)" />
                <span>Account Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="account@shreehotels.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} color="var(--primary-forest)" />
                <span>Secure Password</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '1rem', gap: '8px' }}
            >
              {isSubmitting ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In as {currentProfile.title}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
            }}
          >
            <Link
              to="/home"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary-forest)',
                fontWeight: '600',
              }}
            >
              <Compass size={15} color="var(--accent-brass)" />
              <span>Explore Stays as Visitor →</span>
            </Link>

            <Link
              to="/register"
              style={{
                color: 'var(--text-muted)',
              }}
            >
              Create New Guest Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSignInPage;
