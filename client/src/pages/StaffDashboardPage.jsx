import React, { useState, useEffect } from 'react';
import { staffApi, hotelApi, serviceRequestApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users,
  Calendar,
  CheckCircle2,
  LogOut,
  Sparkles,
  Wrench,
  AlertTriangle,
  Clock,
  Building,
  RefreshCw,
  Search,
  Check,
  X,
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const { user, isAuthenticated, role, openAuthModal } = useAuth();
  const { showToast } = useNotification();

  const [metrics, setMetrics] = useState(null);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [housekeeping, setHousekeeping] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Property Switcher for Admin or Multi-property staff
  const [allHotels, setAllHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');

  // Active Tab: 'arrivals_departures' | 'room_matrix' | 'housekeeping' | 'service_requests'
  const [activeTab, setActiveTab] = useState('arrivals_departures');

  // Check-In Modal state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [targetArrivalBooking, setTargetArrivalBooking] = useState(null);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [processingCheckIn, setProcessingCheckIn] = useState(false);

  // Load staff properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const res = await hotelApi.getHotels({});
        if (res.data.success && res.data.hotels) {
          setAllHotels(res.data.hotels);
          if (user?.assignedHotelId?._id) {
            setSelectedHotelId(user.assignedHotelId._id);
          } else if (res.data.hotels.length > 0) {
            setSelectedHotelId(res.data.hotels[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load hotel properties', err);
      }
    };
    if (isAuthenticated) {
      loadProperties();
    }
  }, [isAuthenticated, user]);

  // Load Operational Metrics for selected property
  const loadMetrics = async (hotelIdToFetch) => {
    const targetId = hotelIdToFetch || selectedHotelId;
    if (!targetId) return;

    setLoading(true);
    try {
      const res = await staffApi.getMetrics(targetId);
      if (res.data.success) {
        setHotelInfo(res.data.hotel);
        setMetrics(res.data.metrics);
        setArrivals(res.data.todaysArrivals || []);
        setDepartures(res.data.todaysDepartures || res.data.currentlyCheckedIn || []);
        setRooms(res.data.rooms || []);
        setHousekeeping(res.data.housekeepingTasks || []);
        setServiceRequests(res.data.pendingServiceRequests || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHotelId) {
      loadMetrics(selectedHotelId);
    }
  }, [selectedHotelId]);

  if (!isAuthenticated || (role !== 'staff' && role !== 'admin')) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '640px', margin: '0 auto' }}>
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
              backgroundColor: 'var(--primary-forest-subtle)',
              color: 'var(--primary-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <Building size={32} />
          </div>
          <span className="badge badge-forest" style={{ marginBottom: '0.75rem' }}>
            Property Operations Desk
          </span>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>
            Staff Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {isAuthenticated ? (
              <>
                You are currently signed in as <strong>{user?.name}</strong> with role{' '}
                <span className="badge badge-brass" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                  {role?.toUpperCase()}
                </span>
                . Accessing the property front desk and housekeeping portal requires an authorized staff profile.
              </>
            ) : (
              'This console is reserved for front desk, concierge, and housekeeping personnel.'
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              Sign In with Authorized Staff Credentials
            </button>
          </div>

          <a href="/stays" style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', textDecoration: 'underline' }}>
            ← Return to SHREE श्री Public Stays
          </a>
        </div>
      </div>
    );
  }

  // Handle Guest Check-In
  const handleConfirmCheckIn = async () => {
    if (!selectedRoomNumber) {
      showToast('Please select a clean room number to assign.', 'error');
      return;
    }

    setProcessingCheckIn(true);
    try {
      const res = await staffApi.checkIn(targetArrivalBooking._id, [selectedRoomNumber]);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setCheckInModalOpen(false);
        setTargetArrivalBooking(null);
        setSelectedRoomNumber('');
        loadMetrics();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingCheckIn(false);
    }
  };

  // Handle Guest Check-Out
  const handleCheckOut = async (bookingId, guestName) => {
    try {
      const res = await staffApi.checkOut(bookingId);
      if (res.data.success) {
        showToast(
          `Guest ${guestName} checked out. Room vacated, marked DIRTY, and checkout housekeeping task dispatched!`,
          'success'
        );
        loadMetrics();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Room Status Direct Update
  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    try {
      const res = await staffApi.updateRoomStatus(roomId, newStatus);
      if (res.data.success) {
        showToast(`Room status updated to ${newStatus.toUpperCase()}`, 'success');
        loadMetrics();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Housekeeping Task Status Update
  const handleUpdateHousekeeping = async (taskId, status) => {
    try {
      const res = await staffApi.updateHousekeeping(taskId, status);
      if (res.data.success) {
        showToast(`Housekeeping task marked as ${status.replace('_', ' ')}`, 'success');
        loadMetrics();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Clean available rooms for check-in assignment
  const cleanAvailableRooms = rooms.filter((r) => r.status === 'available');

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Front Desk Header & Property Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-medium)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-forest">Front Desk Operations</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff: {user.name}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            {hotelInfo?.name || 'Hotel Front Desk'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Property Selector for Admin/Staff */}
          {allHotels.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={16} color="var(--primary-forest)" />
              <select
                className="form-select"
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                {allHotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.address?.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadMetrics()}
            className="btn btn-subtle btn-sm"
            title="Refresh Real-Time Metrics"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Metric Strip */}
      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Today's Arrivals
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-forest)' }}>
              {metrics.arrivalsCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Departures
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-brass)' }}>
              {metrics.departuresCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Checked In
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--status-navy)' }}>
              {metrics.checkedInCount}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Clean Available
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--status-emerald)' }}>
              {metrics.roomCounts?.available || 0}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Dirty / Cleaning
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--status-amber)' }}>
              {metrics.roomCounts?.dirty || 0}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Under Maintenance
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--status-crimson)' }}>
              {metrics.roomCounts?.maintenance || 0}
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: '700' }}>
              Pending Requests
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-terracotta)' }}>
              {metrics.pendingRequestsCount}
            </div>
          </div>
        </div>
      )}

      {/* Operational Navigation Tabs */}
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
          onClick={() => setActiveTab('arrivals_departures')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'arrivals_departures' ? '700' : '500',
            color: activeTab === 'arrivals_departures' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'arrivals_departures' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Arrivals & Departures Desk
        </button>

        <button
          onClick={() => setActiveTab('room_matrix')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'room_matrix' ? '700' : '500',
            color: activeTab === 'room_matrix' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'room_matrix' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Room Status Matrix ({rooms.length})
        </button>

        <button
          onClick={() => setActiveTab('housekeeping')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'housekeeping' ? '700' : '500',
            color: activeTab === 'housekeeping' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'housekeeping' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Housekeeping Tasks ({housekeeping.length})
        </button>

        <button
          onClick={() => setActiveTab('service_requests')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'service_requests' ? '700' : '500',
            color: activeTab === 'service_requests' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'service_requests' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Guest Requests Desk ({serviceRequests.length})
        </button>
      </div>

      {/* Tab 1: Arrivals & Departures Desk */}
      {activeTab === 'arrivals_departures' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Arrivals List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success">Arrivals</span>
              <span>Today's Incoming Guests</span>
            </h3>

            {arrivals.length === 0 ? (
              <div style={{ padding: '2rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                No pending arrivals for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {arrivals.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {b.guestDetails?.name || b.userId?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Ref: {b.bookingReference} • Suite: {b.roomTypeId?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-brass)', marginTop: '2px' }}>
                        {b.guestDetails?.specialRequests || 'No special requests'}
                      </div>
                    </div>

                    {b.bookingStatus === 'checked_in' ? (
                      <span className="badge badge-info">Already Checked In</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetArrivalBooking(b);
                          setCheckInModalOpen(true);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departures List */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-brass">Departures</span>
              <span>Currently In-House & Departures</span>
            </h3>

            {departures.length === 0 ? (
              <div style={{ padding: '2rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
                No active checked-in guests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {departures.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {b.guestDetails?.name || b.userId?.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Ref: {b.bookingReference} • Assigned: Room {b.assignedRooms?.join(', ') || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        Departing: {new Date(b.checkOut).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckOut(b._id, b.guestDetails?.name || 'Guest')}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--accent-brass-hover)' }}
                    >
                      <LogOut size={14} /> Check Out
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Room Status Matrix */}
      {activeTab === 'room_matrix' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem' }}>Property Room Status Matrix</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click on any room to toggle availability or report maintenance.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-emerald)' }} />
                Available Clean
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-navy)' }} />
                Occupied
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-amber)' }} />
                Dirty / Cleaning
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-crimson)' }} />
                Maintenance
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {rooms.map((r) => {
              const bg =
                r.status === 'available'
                  ? 'var(--status-emerald-bg)'
                  : r.status === 'occupied'
                  ? 'var(--status-navy-bg)'
                  : r.status === 'dirty'
                  ? 'var(--status-amber-bg)'
                  : 'var(--status-crimson-bg)';

              const textColor =
                r.status === 'available'
                  ? 'var(--status-emerald)'
                  : r.status === 'occupied'
                  ? 'var(--status-navy)'
                  : r.status === 'dirty'
                  ? 'var(--status-amber)'
                  : 'var(--status-crimson)';

              return (
                <div
                  key={r._id}
                  style={{
                    backgroundColor: bg,
                    border: `1px solid ${textColor}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: textColor }}>
                        Room {r.roomNumber}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: textColor }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '4px', fontWeight: '600' }}>
                      Floor {r.floor} • {r.roomTypeId?.name}
                    </div>
                    {r.assignedGuestName && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Guest: {r.assignedGuestName}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle Buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    {r.status !== 'available' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomStatus(r._id, 'available')}
                        className="btn btn-subtle btn-sm"
                        style={{ fontSize: '0.68rem', padding: '2px 6px', flex: 1 }}
                      >
                        Clean
                      </button>
                    )}
                    {r.status !== 'dirty' && r.status !== 'occupied' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomStatus(r._id, 'dirty')}
                        className="btn btn-subtle btn-sm"
                        style={{ fontSize: '0.68rem', padding: '2px 6px', flex: 1 }}
                      >
                        Dirty
                      </button>
                    )}
                    {r.status !== 'maintenance' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateRoomStatus(r._id, 'maintenance')}
                        className="btn btn-subtle btn-sm"
                        style={{ fontSize: '0.68rem', padding: '2px 6px', flex: 1 }}
                      >
                        Repair
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Housekeeping Tasks */}
      {activeTab === 'housekeeping' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Active Housekeeping Queue</h3>
          {housekeeping.length === 0 ? (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              All rooms clean! No pending cleaning tickets.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {housekeeping.map((task) => (
                <div
                  key={task._id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Room {task.roomNumber}</span>
                      <span className="badge badge-brass" style={{ fontSize: '0.68rem' }}>
                        {task.taskType?.replace('_', ' ')}
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: '0.68rem' }}>
                        Priority: {task.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {task.notes || 'Routine housekeeping task'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {task.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateHousekeeping(task._id, 'in_progress')}
                        className="btn btn-subtle btn-sm"
                      >
                        Start Cleaning
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdateHousekeeping(task._id, 'completed')}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle2 size={14} /> Mark Cleaned & Ready
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Guest Service Requests */}
      {activeTab === 'service_requests' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>In-Room Guest Service Requests</h3>
          {serviceRequests.length === 0 ? (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              No open guest service tickets.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {serviceRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-brass" style={{ fontSize: '0.7rem' }}>
                        Room {req.roomNumber || 'Front Desk'}
                      </span>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{req.title}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {req.details}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      Guest: {req.userId?.name} ({req.userId?.phone})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {req.status === 'pending' && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await serviceRequestApi.updateStatus(req._id, 'in_progress', 'Staff dispatched');
                            showToast('Request marked In Progress.', 'info');
                            loadMetrics();
                          } catch (err) {
                            showToast(err.message || 'Failed to update request', 'error');
                          }
                        }}
                        className="btn btn-subtle btn-sm"
                      >
                        In Progress
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await serviceRequestApi.updateStatus(req._id, 'completed', 'Fulfilled by front desk');
                          showToast('Service request resolved and guest notified!', 'success');
                          loadMetrics();
                        } catch (err) {
                          showToast(err.message || 'Failed to resolve request', 'error');
                        }
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Resolve & Notify Guest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Check-In Modal with Room Selection */}
      {checkInModalOpen && targetArrivalBooking && (
        <div className="modal-backdrop" onClick={() => setCheckInModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem' }}>Assign Clean Room & Check-In</h3>
              <button onClick={() => setCheckInModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '12px', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '700' }}>
                  {targetArrivalBooking.guestDetails?.name || targetArrivalBooking.userId?.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Ref: {targetArrivalBooking.bookingReference} • Suite: {targetArrivalBooking.roomTypeId?.name}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Clean Available Room</label>
                {cleanAvailableRooms.length === 0 ? (
                  <div style={{ color: 'var(--status-crimson)', fontSize: '0.85rem', padding: '8px 0' }}>
                    <AlertTriangle size={15} style={{ display: 'inline', marginRight: '4px' }} />
                    No clean available rooms! All rooms are dirty, occupied, or in maintenance. Clean a room first.
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedRoomNumber}
                    onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  >
                    <option value="">-- Choose Room --</option>
                    {cleanAvailableRooms.map((r) => (
                      <option key={r._id} value={r.roomNumber}>
                        Room {r.roomNumber} (Floor {r.floor} • {r.roomTypeId?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCheckInModalOpen(false)}
                  className="btn btn-subtle"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingCheckIn || !selectedRoomNumber}
                  onClick={handleConfirmCheckIn}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {processingCheckIn ? 'Assigning Room...' : 'Complete Check-In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboardPage;
