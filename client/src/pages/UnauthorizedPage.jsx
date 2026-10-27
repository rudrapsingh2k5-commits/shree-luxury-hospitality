import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = ({ requiredRoles = [], currentRole = 'guest' }) => {
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="container"
      style={{
        padding: '5rem 1.5rem',
        maxWidth: '680px',
        margin: '0 auto',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-medium)',
          borderRadius: '12px',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(110, 26, 36, 0.08)',
            color: 'var(--primary-maroon)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid rgba(110, 26, 36, 0.2)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <span
          style={{
            fontFamily: 'var(--font-royal)',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-brass)',
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          Access Restriction (403 Forbidden)
        </span>

        <h2 style={{ fontSize: '1.9rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-forest)', marginBottom: '1rem' }}>
          Restricted Portal Area
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
          You are currently signed in as <strong>{user?.name}</strong> with role{' '}
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-cream)',
              color: 'var(--primary-forest)',
              fontWeight: '700',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
            }}
          >
            {currentRole}
          </span>
          . This portal requires authorized credentials for{' '}
          <strong style={{ color: 'var(--primary-forest)' }}>
            [{requiredRoles.join(', ')}]
          </strong>
          .
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}>
          <Link to="/stays" className="btn btn-primary" style={{ justifyContent: 'center', gap: '8px' }}>
            <Home size={16} />
            Explore Sanctuaries & Stays
          </Link>

          {currentRole === 'guest' && (
            <Link to="/dashboard" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              View My Reservations
            </Link>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-subtle"
            style={{ justifyContent: 'center', gap: '6px', color: 'var(--status-crimson)' }}
          >
            <LogOut size={15} />
            Sign Out & Switch Account
          </button>
        </div>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-subtle)',
          }}
        >
          If you believe you should have access to this portal, please contact the general manager or platform administration.
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
