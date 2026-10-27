import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import AuthModal from './components/common/AuthModal';
import ProtectedRoute from './components/common/ProtectedRoute';

import { useAuth } from './context/AuthContext';

// Pages
import WelcomeSignInPage from './pages/WelcomeSignInPage';
import HomePage from './pages/HomePage';
import StaysPage from './pages/StaysPage';
import HotelDetailsPage from './pages/HotelDetailsPage';
import GuestDashboardPage from './pages/GuestDashboardPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import OffersPage from './pages/OffersPage';
import SupportPage from './pages/SupportPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

export const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/" element={!isAuthenticated ? <WelcomeSignInPage /> : <HomePage />} />
          <Route path="/welcome" element={<WelcomeSignInPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/stays" element={<StaysPage />} />
          <Route path="/hotel/:slug" element={<HotelDetailsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage initialMode="reset" />} />
          <Route path="/verify-email" element={<AuthPage initialMode="verify" />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['guest', 'staff', 'admin']}>
                <GuestDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-forest)' }}>
                  404 — Sanctuary Not Found
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  The page or suite you are seeking does not exist or has been relocated.
                </p>
                <a href="/" className="btn btn-primary">
                  Return to SHREE श्री Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};

export default App;
