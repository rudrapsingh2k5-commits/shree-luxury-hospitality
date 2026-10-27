import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Compass,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Briefcase,
  Calendar,
  Sparkles,
  ChevronDown,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, role, logout, openAuthModal } = useAuth();
  const { systemNotifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Stays', path: '/stays' },
    { label: 'Offers', path: '/offers' },
    { label: 'About', path: '/about' },
    { label: 'Support', path: '/support' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        backgroundColor: 'rgba(251, 249, 245, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
        }}
      >
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }} title="SHREE श्री — Prosperity, Auspiciousness & Grand Stays">
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: 'var(--primary-maroon, #6E1A24)',
              color: 'var(--accent-gold, #D4AF37)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontFamily: 'var(--font-devanagari, "Noto Serif Devanagari", serif)',
              fontSize: '1.45rem',
              fontWeight: '700',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 3px 10px rgba(110, 26, 36, 0.25)',
            }}
          >
            श्री
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-royal, "Cinzel", serif)',
                  fontSize: '1.45rem',
                  fontWeight: '700',
                  color: 'var(--primary-forest-dark, #102119)',
                  letterSpacing: '0.04em',
                }}
              >
                SHREE
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-devanagari, "Noto Serif Devanagari", serif)',
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  color: 'var(--primary-maroon, #6E1A24)',
                }}
              >
                श्री
              </span>
              <span style={{ color: 'var(--accent-brass)', fontSize: '1.2rem', lineHeight: '0.8', marginLeft: '2px' }}>•</span>
            </div>
            <span
              style={{
                fontSize: '0.66rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-brass, #C59B27)',
                fontWeight: '700',
                display: 'block',
                marginTop: '-3px',
              }}
            >
              Where Every Stay Feels Grand
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  fontSize: '0.92rem',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? 'var(--primary-forest)' : 'var(--text-muted)',
                  borderBottom: isActive ? '2px solid var(--accent-brass)' : '2px solid transparent',
                  padding: '6px 0',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Role Quick Shortcut Link (Admin or Staff) */}
          {role === 'admin' && (
            <Link to="/admin" className="badge badge-brass" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <Shield size={13} /> Admin Console
            </Link>
          )}

          {role === 'staff' && (
            <Link to="/staff" className="badge badge-forest" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <Briefcase size={13} /> Staff Desk
            </Link>
          )}

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div ref={notifMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-forest)',
                  backgroundColor: notifDropdownOpen ? 'var(--bg-cream)' : 'transparent',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      backgroundColor: 'var(--accent-terracotta)',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      width: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {notifDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '340px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '12px',
                    zIndex: 600,
                    animation: 'slideUp 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-brass)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {systemNotifications.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      systemNotifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.read) markAsRead(n._id);
                            if (n.link) navigate(n.link);
                            setNotifDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '6px',
                            backgroundColor: n.read ? 'transparent' : 'var(--bg-card-subtle)',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'var(--transition-fast)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: n.read ? '500' : '700', color: 'var(--text-main)' }}>
                              {n.title}
                            </span>
                            {!n.read && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-brass)' }} />
                            )}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Account / Sign In */}
          {isAuthenticated ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: userDropdownOpen ? 'var(--bg-cream)' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-forest-subtle)',
                    color: 'var(--primary-forest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--primary-forest)' }}>
                    {user.name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.68rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {user.role}
                  </div>
                </div>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '220px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '8px',
                    zIndex: 600,
                    animation: 'slideUp 0.15s ease-out',
                  }}
                >
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>

                  {role === 'guest' && (
                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="btn btn-subtle btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                    >
                      <Calendar size={14} /> My Reservations & Stays
                    </Link>
                  )}

                  {role === 'staff' && (
                    <Link
                      to="/staff"
                      onClick={() => setUserDropdownOpen(false)}
                      className="btn btn-subtle btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                    >
                      <Briefcase size={14} /> Hotel Operations Desk
                    </Link>
                  )}

                  {role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="btn btn-subtle btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                      >
                        <Shield size={14} /> Management Console
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="btn btn-subtle btn-sm"
                        style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px' }}
                      >
                        <Calendar size={14} /> Guest Dashboard View
                      </Link>
                    </>
                  )}

                  <Link
                    to="/welcome"
                    onClick={() => setUserDropdownOpen(false)}
                    className="btn btn-subtle btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '4px', color: 'var(--accent-brass)' }}
                  >
                    <Sparkles size={14} /> Switch Role / Portal
                  </Link>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', marginTop: '6px' }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link
                to="/welcome"
                className="btn btn-subtle btn-sm"
                style={{ fontWeight: '600' }}
              >
                <UserIcon size={14} />
                <span>Sign In</span>
              </Link>
              <button
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.55rem 1.15rem' }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
