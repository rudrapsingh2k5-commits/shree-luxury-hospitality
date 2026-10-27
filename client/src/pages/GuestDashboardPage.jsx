import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { bookingApi, serviceRequestApi, favoriteApi, notificationApi, reviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ImageWithFallback from '../components/common/ImageWithFallback';
import {
  Calendar,
  Clock,
  Printer,
  XCircle,
  Star,
  Heart,
  Bell,
  User as UserIcon,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from 'lucide-react';

export const GuestDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stays';

  const { user, isAuthenticated, openAuthModal, updateProfile } = useAuth();
  const { showToast } = useNotification();

  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Booking for Invoice / Cancellation / Review
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of personal travel itinerary');
  const [cancelling, setCancelling] = useState(false);

  // Review Modal state
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New Service Request Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceBookingId, setServiceBookingId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('towels_linens');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  // Profile Form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [bookRes, reqRes, favRes, notifRes] = await Promise.all([
          bookingApi.getMyBookings(),
          serviceRequestApi.getMyRequests(),
          favoriteApi.getMyFavorites(),
          notificationApi.getAll(),
        ]);

        if (bookRes.data.success) setBookings(bookRes.data.bookings || []);
        if (reqRes.data.success) setRequests(reqRes.data.requests || []);
        if (favRes.data.success) setFavorites(favRes.data.favorites || []);
        if (notifRes.data.success) setNotifications(notifRes.data.notifications || []);
      } catch (err) {
        showToast('Failed to load guest records', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-brass-light)',
              color: 'var(--accent-brass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <UserIcon size={32} />
          </div>
          <span className="badge badge-brass" style={{ marginBottom: '0.75rem' }}>
            Guest Sanctuary Portal
          </span>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>
            Guest Sign In Required
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Access your confirmed reservations, room folios & invoices, and submit in-stay room service or housekeeping requests.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-subtle"
              style={{ justifyContent: 'center', fontSize: '0.88rem' }}
            >
              Create a New Guest Account
            </button>
          </div>

          <a href="/stays" style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', textDecoration: 'underline' }}>
            ← Browse Available Stays & Sanctuaries
          </a>
        </div>
      </div>
    );
  }

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // Handle Cancellation
  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancel(selectedBookingForCancel._id, cancelReason);
      if (res.data.success) {
        showToast(
          `Reservation ${selectedBookingForCancel.bookingReference} cancelled. Eligible refund: ₹${res.data.refundAmount?.toLocaleString('en-IN')}`,
          'success'
        );
        setSelectedBookingForCancel(null);
        // Refresh bookings
        const updated = await bookingApi.getMyBookings();
        setBookings(updated.data.bookings || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to cancel reservation.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview || !reviewComment) return;
    setSubmittingReview(true);
    try {
      const res = await reviewApi.create({
        bookingId: selectedBookingForReview._id,
        rating: reviewRating,
        title: reviewTitle || 'Exceptional Sanctuary Experience',
        comment: reviewComment,
      });
      if (res.data.success) {
        showToast('Thank you! Your verified stay review has been published.', 'success');
        setSelectedBookingForReview(null);
        setReviewComment('');
        setReviewTitle('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Service Request Submission
  const handleCreateServiceRequest = async (e) => {
    e.preventDefault();
    if (!serviceBookingId || !serviceTitle || !serviceDetails) {
      showToast('Please fill all required service fields', 'error');
      return;
    }
    setSubmittingService(true);
    try {
      const res = await serviceRequestApi.create({
        bookingId: serviceBookingId,
        category: serviceCategory,
        title: serviceTitle,
        details: serviceDetails,
      });
      if (res.data.success) {
        showToast('Service request submitted to hotel front desk.', 'success');
        setServiceModalOpen(false);
        setServiceTitle('');
        setServiceDetails('');
        // Refresh requests
        const updated = await serviceRequestApi.getMyRequests();
        setRequests(updated.data.requests || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to submit service request.', 'error');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    await updateProfile({ name: profileName, phone: profilePhone });
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header Profile Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-medium)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-forest)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: '700',
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{user.name}</h1>
              <span className="badge badge-brass" style={{ fontSize: '0.68rem' }}>
                Verified Guest
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user.email} • {bookings.length} Registered Reservations
            </div>
          </div>
        </div>

        {bookings.length > 0 && (
          <button
            onClick={() => {
              setServiceBookingId(bookings[0]?._id);
              setServiceModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} />
            <span>Request In-Stay Service</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setTab('stays')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'stays' ? '700' : '500',
            color: activeTab === 'stays' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'stays' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Calendar size={16} /> My Reservations ({bookings.length})
        </button>

        <button
          onClick={() => setTab('services')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'services' ? '700' : '500',
            color: activeTab === 'services' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'services' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock size={16} /> Service Requests ({requests.length})
        </button>

        <button
          onClick={() => setTab('favorites')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'favorites' ? '700' : '500',
            color: activeTab === 'favorites' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'favorites' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Heart size={16} /> Saved Sanctuaries ({favorites.length})
        </button>

        <button
          onClick={() => setTab('notifications')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'notifications' ? '700' : '500',
            color: activeTab === 'notifications' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'notifications' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Bell size={16} /> Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setTab('profile')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'profile' ? '700' : '500',
            color: activeTab === 'profile' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <UserIcon size={16} /> Profile Settings
        </button>
      </div>

      {/* Tab 1: Bookings */}
      {activeTab === 'stays' && (
        <div>
          {loading ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading reservations...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No reservations yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Discover our handpicked collection of luxury heritage stays and villas.
              </p>
              <Link to="/stays" className="btn btn-primary btn-sm">
                Explore Available Stays
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {bookings.map((b) => {
                const canCancel = ['confirmed', 'pending_payment'].includes(b.bookingStatus);
                const canReview = ['checked_out', 'confirmed'].includes(b.bookingStatus);

                return (
                  <div
                    key={b._id}
                    className="card"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(200px, 240px) 1fr',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'relative', height: '100%', minHeight: '180px' }}>
                      <ImageWithFallback
                        src={b.hotelId?.images?.[0]?.url}
                        alt={b.hotelId?.name}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-brass)', letterSpacing: '0.04em' }}>
                                Ref: {b.bookingReference}
                              </span>
                              <span
                                className={`badge ${
                                  b.bookingStatus === 'confirmed'
                                    ? 'badge-success'
                                    : b.bookingStatus === 'checked_in'
                                    ? 'badge-info'
                                    : b.bookingStatus === 'checked_out'
                                    ? 'badge-forest'
                                    : b.bookingStatus === 'cancelled'
                                    ? 'badge-danger'
                                    : 'badge-warning'
                                }`}
                                style={{ fontSize: '0.68rem' }}
                              >
                                {b.bookingStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.35rem' }}>{b.hotelId?.name}</h3>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-forest)' }}>
                              ₹{b.priceBreakdown?.finalAmount?.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                              Payment: {b.paymentStatus}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '10px 0' }}>
                          <div>
                            Suite: <strong>{b.roomTypeId?.name}</strong>
                          </div>
                          <div>
                            Check-in: <strong>{new Date(b.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                          </div>
                          <div>
                            Check-out: <strong>{new Date(b.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                          </div>
                          {b.assignedRooms?.length > 0 && (
                            <div>
                              Room Number: <strong>{b.assignedRooms.join(', ')}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForInvoice(b)}
                          className="btn btn-subtle btn-sm"
                        >
                          <FileText size={14} /> Tax Invoice
                        </button>

                        {canReview && (
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForReview(b)}
                            className="btn btn-subtle btn-sm"
                          >
                            <Star size={14} color="#EAB308" /> Submit Stay Review
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForCancel(b)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--status-crimson)', borderColor: '#FECDD3' }}
                          >
                            <XCircle size={14} /> Cancel Stay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Service Requests */}
      {activeTab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>In-Stay Service Requests</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Housekeeping refreshes, extra towels, maintenance, and concierge assistance.
              </p>
            </div>
            {bookings.length > 0 && (
              <button
                onClick={() => {
                  setServiceBookingId(bookings[0]?._id);
                  setServiceModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> New Service Request
              </button>
            )}
          </div>

          {requests.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
              No service requests filed.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requests.map((r) => (
                <div key={r._id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-brass" style={{ fontSize: '0.7rem' }}>
                        {r.category.replace('_', ' ')}
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>
                        Room: {r.roomNumber || 'Front Desk'}
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        r.status === 'completed'
                          ? 'badge-success'
                          : r.status === 'in_progress'
                          ? 'badge-info'
                          : 'badge-warning'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', margin: '4px 0' }}>{r.title}</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{r.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Favorites */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
              <Heart size={32} color="var(--accent-brass)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Saved Sanctuaries</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Save properties while browsing to view their availability anytime.
              </p>
              <Link to="/stays" className="btn btn-primary btn-sm">
                Browse Stays
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {favorites.map((hotel) => (
                <div key={hotel._id} className="card">
                  <div style={{ height: '180px', position: 'relative' }}>
                    <ImageWithFallback src={hotel.images?.[0]?.url} alt={hotel.name} style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-brass)', fontWeight: '600', textTransform: 'uppercase' }}>
                      {hotel.address?.city}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', margin: '4px 0 8px 0' }}>{hotel.name}</h3>
                    <Link to={`/hotel/${hotel.slug}`} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                      View Sanctuary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Notification Log</h2>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              No notifications on record.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: n.read ? 'transparent' : 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{n.title}</div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 6px 0' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Profile */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: '520px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Guest Profile & Contact</h2>
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: 'var(--bg-cream)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Phone</label>
              <input
                type="tel"
                className="form-input"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Save Profile Updates
            </button>
          </form>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      {selectedBookingForInvoice && (
        <div className="modal-backdrop" onClick={() => setSelectedBookingForInvoice(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary-forest)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--primary-maroon, #6E1A24)', fontFamily: 'var(--font-royal, "Cinzel", serif)' }}>
                  SHREE श्री TAX INVOICE
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Invoice No: {selectedBookingForInvoice.invoiceNumber || 'INV-2026-001'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Booking Reference: <strong>{selectedBookingForInvoice.bookingReference}</strong>
                </div>
              </div>
              <button onClick={() => setSelectedBookingForInvoice(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Hotel & Guest Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Property Details</div>
                <div style={{ fontWeight: '600' }}>{selectedBookingForInvoice.hotelId?.name}</div>
                <div>{selectedBookingForInvoice.hotelId?.address?.city}, {selectedBookingForInvoice.hotelId?.address?.state}</div>
                <div>GSTIN: 08AAACH1234F1Z5</div>
              </div>
              <div>
                <div style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Billed To</div>
                <div style={{ fontWeight: '600' }}>{selectedBookingForInvoice.guestDetails?.name || user.name}</div>
                <div>{selectedBookingForInvoice.guestDetails?.email || user.email}</div>
                <div>{selectedBookingForInvoice.guestDetails?.phone}</div>
              </div>
            </div>

            {/* Stay Details */}
            <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>Suite: <strong>{selectedBookingForInvoice.roomTypeId?.name}</strong></div>
              <div>Duration: {new Date(selectedBookingForInvoice.checkIn).toLocaleDateString()} to {new Date(selectedBookingForInvoice.checkOut).toLocaleDateString()} ({selectedBookingForInvoice.priceBreakdown?.nights} Nights)</div>
              <div>Guests: {selectedBookingForInvoice.guests?.adults} Adults, {selectedBookingForInvoice.guests?.children} Children</div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Description</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 0' }}>
                    Room Charges ({selectedBookingForInvoice.priceBreakdown?.nights} nights × {selectedBookingForInvoice.numberOfRooms} suite)
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    ₹{selectedBookingForInvoice.priceBreakdown?.totalBaseCharge?.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 0' }}>CGST (9%) + SGST (9%)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    ₹{selectedBookingForInvoice.priceBreakdown?.taxAmount?.toLocaleString('en-IN')}
                  </td>
                </tr>
                {selectedBookingForInvoice.priceBreakdown?.discountAmount > 0 && (
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--status-emerald)' }}>
                    <td style={{ padding: '8px 0' }}>
                      Promotional Discount ({selectedBookingForInvoice.priceBreakdown?.couponCode})
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      -₹{selectedBookingForInvoice.priceBreakdown?.discountAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary-forest)' }}>
                  <td style={{ padding: '12px 0' }}>
                    Total Paid (Stripe Verified)
                    {selectedBookingForInvoice.amountGbp ? (
                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-muted)', display: 'block' }}>
                        Billed as £{selectedBookingForInvoice.amountGbp.toFixed(2)} GBP
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    ₹{selectedBookingForInvoice.priceBreakdown?.finalAmount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={16} /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {selectedBookingForCancel && (
        <div className="modal-backdrop" onClick={() => setSelectedBookingForCancel(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem', color: 'var(--status-crimson)' }}>Cancel Stay Reservation</h3>
              <button onClick={() => setSelectedBookingForCancel(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Are you sure you want to cancel reservation <strong>{selectedBookingForCancel.bookingReference}</strong> at {selectedBookingForCancel.hotelId?.name}?
              </p>

              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>Cancellation Refund Policy</div>
                <div>• Cancellations ≥ 48 hours prior to arrival are eligible for 100% refund.</div>
                <div>• Cancellations &lt; 48 hours deduct one night suite charge.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Cancellation Reason</label>
                <select
                  className="form-select"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="Change of personal travel itinerary">Change of personal travel itinerary</option>
                  <option value="Flight / travel disruption">Flight / travel disruption</option>
                  <option value="Family or medical emergency">Family or medical emergency</option>
                  <option value="Booked another hotel">Booked another hotel</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForCancel(null)}
                  className="btn btn-subtle"
                  style={{ flex: 1 }}
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelBooking}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="modal-backdrop" onClick={() => setSelectedBookingForReview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem' }}>Review Verified Stay</h3>
              <button onClick={() => setSelectedBookingForReview(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Overall Rating (1 to 5 Stars)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        padding: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Star
                        size={28}
                        color="#EAB308"
                        fill={star <= reviewRating ? '#EAB308' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Headline</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Unmatched royal hospitality and lake views"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Feedback</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe your dining, butler service, courtyard tranquility, and room comfort..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {submittingReview ? 'Publishing Review...' : 'Publish Verified Stay Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Service Request Modal */}
      {serviceModalOpen && (
        <div className="modal-backdrop" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem' }}>Submit In-Stay Request</h3>
              <button onClick={() => setServiceModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateServiceRequest} className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Active Reservation</label>
                <select
                  className="form-select"
                  value={serviceBookingId}
                  onChange={(e) => setServiceBookingId(e.target.value)}
                >
                  {bookings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bookingReference} — {b.hotelId?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Request Category</label>
                <select
                  className="form-select"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                >
                  <option value="towels_linens">Towels, Bath Sheets & Linens</option>
                  <option value="housekeeping">Daily Housekeeping Refresh</option>
                  <option value="dining">In-Suite Dining / Royal High Tea</option>
                  <option value="maintenance">Room Climate / Electrical Sensor</option>
                  <option value="concierge">Luggage / Airport Limousine Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Additional organic jasmine bath soaps"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Please state timing preferences or specific items needed..."
                  value={serviceDetails}
                  onChange={(e) => setServiceDetails(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingService}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {submittingService ? 'Submitting...' : 'Dispatch to Front Desk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestDashboardPage;
