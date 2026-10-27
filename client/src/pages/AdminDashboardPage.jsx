import React, { useState, useEffect } from 'react';
import { adminApi, hotelApi, roomApi, paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Download,
  Building,
  Plus,
  RefreshCw,
  Eye,
  RotateCcw,
  ShieldAlert,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { user, isAuthenticated, role, openAuthModal } = useAuth();
  const { showToast } = useNotification();

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'analytics' | 'hotels' | 'users' | 'audit_logs'
  const [activeTab, setActiveTab] = useState('analytics');

  // New Hotel Modal state
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelCity, setNewHotelCity] = useState('');
  const [newHotelState, setNewHotelState] = useState('');
  const [newHotelType, setNewHotelType] = useState('boutique');
  const [newHotelDescription, setNewHotelDescription] = useState('');

  // User Role Modal state
  const [userRoleModalOpen, setUserRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [targetRole, setTargetRole] = useState('guest');
  const [targetAssignedHotel, setTargetAssignedHotel] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, hotelsRes, logsRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getUsers(),
        hotelApi.getHotels({}),
        adminApi.getAuditLogs(),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      if (usersRes.data.success) setUsers(usersRes.data.users || []);
      if (hotelsRes.data.success) setHotels(hotelsRes.data.hotels || []);
      if (logsRes.data.success) setAuditLogs(logsRes.data.logs || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      loadAdminData();
    }
  }, [isAuthenticated, role]);

  if (!isAuthenticated || role !== 'admin') {
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
              backgroundColor: 'var(--accent-brass-light)',
              color: 'var(--accent-brass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <Shield size={32} />
          </div>
          <span className="badge badge-brass" style={{ marginBottom: '0.75rem' }}>
            Executive Platform Console
          </span>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>
            Administrator Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {isAuthenticated ? (
              <>
                You are currently signed in as <strong>{user?.name}</strong> with role{' '}
                <span className="badge badge-forest" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                  {role?.toUpperCase()}
                </span>
                . Administrator privileges are required to view cross-property revenue, manage users, and configure properties.
              </>
            ) : (
              'This console is reserved for verified platform administrators with executive permissions.'
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              Sign In with Administrator Credentials
            </button>
          </div>

          <a href="/stays" style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', textDecoration: 'underline' }}>
            ← Return to SHREE श्री Public Stays
          </a>
        </div>
      </div>
    );
  }

  // Handle Export CSV
  const handleExportCSV = async () => {
    try {
      showToast('Generating platform bookings CSV export...', 'info');
      const res = await adminApi.exportBookingsCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shree_bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV export downloaded successfully.', 'success');
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  // Handle Create Hotel
  const handleCreateHotel = async (e) => {
    e.preventDefault();
    try {
      const res = await hotelApi.create({
        name: newHotelName,
        slug: newHotelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        propertyType: newHotelType,
        description: newHotelDescription,
        address: {
          city: newHotelCity,
          state: newHotelState,
          country: 'India',
        },
        amenities: ['High-Speed Wi-Fi', 'Swimming Pool', 'Fine Dining Restaurant', '24/7 Butler Service'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
            caption: 'Exterior facade',
            isPrimary: true,
          },
        ],
        featured: true,
      });

      if (res.data.success) {
        showToast(`Hotel property ${newHotelName} created!`, 'success');
        setHotelModalOpen(false);
        setNewHotelName('');
        setNewHotelCity('');
        setNewHotelState('');
        setNewHotelDescription('');
        loadAdminData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Update User Role
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!selectedUserForRole) return;
    try {
      const res = await adminApi.updateUserRole(
        selectedUserForRole._id,
        targetRole,
        targetRole === 'staff' ? targetAssignedHotel : null,
        true
      );
      if (res.data.success) {
        showToast(`Role for ${selectedUserForRole.name} updated to ${targetRole}.`, 'success');
        setUserRoleModalOpen(false);
        setSelectedUserForRole(null);
        loadAdminData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Admin Title & Export Bar */}
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
            <span className="badge badge-brass">Platform Administration</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin: {user.name}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-royal, "Cinzel", serif)' }}>
            SHREE श्री Executive Console
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-brass btn-sm">
            <FileSpreadsheet size={15} />
            <span>Export Bookings CSV</span>
          </button>
          <button onClick={loadAdminData} className="btn btn-subtle btn-sm">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Real Database Analytics KPI Strip */}
      {analytics?.summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              Gross Captured Revenue
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-forest)', margin: '4px 0' }}>
              ₹{analytics.summary.grossRevenue?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-emerald)' }}>Verified Stripe Payments (£ GBP)</div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              Net Platform Revenue
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-brass)', margin: '4px 0' }}>
              ₹{analytics.summary.netRevenue?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Less ₹{analytics.summary.totalRefunds?.toLocaleString('en-IN')} refunds
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              Total Reservations
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '4px 0' }}>
              {analytics.summary.totalBookingsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active & Historical</div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              Overall Occupancy
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--status-navy)', margin: '4px 0' }}>
              {analytics.summary.occupancyRate}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {analytics.summary.occupiedRoomsCount} / {analytics.summary.totalRoomsCount} rooms occupied
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
              Average Daily Rate (ADR)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-forest-dark)', margin: '4px 0' }}>
              ₹{analytics.summary.adr?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per occupied suite/night</div>
          </div>
        </div>
      )}

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
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'analytics' ? '700' : '500',
            color: activeTab === 'analytics' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Revenue & Performance Charts
        </button>

        <button
          onClick={() => setActiveTab('hotels')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'hotels' ? '700' : '500',
            color: activeTab === 'hotels' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'hotels' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Hotel Properties ({hotels.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'users' ? '700' : '500',
            color: activeTab === 'users' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Staff & User Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          style={{
            padding: '10px 16px',
            fontWeight: activeTab === 'audit_logs' ? '700' : '500',
            color: activeTab === 'audit_logs' ? 'var(--primary-forest)' : 'var(--text-muted)',
            borderBottom: activeTab === 'audit_logs' ? '2px solid var(--primary-forest)' : 'none',
            fontSize: '0.92rem',
          }}
        >
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Charts & Property Breakdown */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Revenue Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Last 7 Days Revenue Trend (₹ INR)</h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.revenueChartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#1A3026" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Property Performance Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Property Performance Breakdown</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 0' }}>Property</th>
                    <th style={{ padding: '8px 0' }}>Bookings</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.hotelPerformance?.map((hp) => (
                    <tr key={hp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '600' }}>
                        {hp.name}
                      </td>
                      <td style={{ padding: '10px 0' }}>{hp.bookingsCount} reservations</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: 'var(--primary-forest)' }}>
                        ₹{hp.revenue?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hotels Management */}
      {activeTab === 'hotels' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem' }}>Registered Hotel Listings</h3>
            <button onClick={() => setHotelModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add New Hotel Property
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Property</th>
                  <th style={{ padding: '8px 0' }}>Destination</th>
                  <th style={{ padding: '8px 0' }}>Type</th>
                  <th style={{ padding: '8px 0' }}>Rating</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 0', fontWeight: '600' }}>{h.name}</td>
                    <td style={{ padding: '12px 0' }}>{h.address?.city}, {h.address?.state}</td>
                    <td style={{ padding: '12px 0', textTransform: 'capitalize' }}>{h.propertyType}</td>
                    <td style={{ padding: '12px 0' }}>★ {h.averageRating || 4.9}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <a href={`/hotel/${h.slug}`} target="_blank" rel="noreferrer" className="btn btn-subtle btn-sm">
                        View Page
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users & Staff Management */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>User Roles & Property Assignments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>User</th>
                  <th style={{ padding: '8px 0' }}>Email</th>
                  <th style={{ padding: '8px 0' }}>Role</th>
                  <th style={{ padding: '8px 0' }}>Assigned Hotel</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 0', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '12px 0' }}>{u.email}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span
                        className={`badge ${
                          u.role === 'admin' ? 'badge-brass' : u.role === 'staff' ? 'badge-forest' : 'badge-subtle'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>
                      {u.assignedHotelId?.name || 'All Properties / None'}
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForRole(u);
                          setTargetRole(u.role);
                          setTargetAssignedHotel(u.assignedHotelId?._id || hotels[0]?._id);
                          setUserRoleModalOpen(true);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Platform Security & Audit Trail</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Timestamp</th>
                  <th style={{ padding: '8px 0' }}>Action</th>
                  <th style={{ padding: '8px 0' }}>User</th>
                  <th style={{ padding: '8px 0' }}>Role</th>
                  <th style={{ padding: '8px 0' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 0', color: 'var(--text-subtle)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 0', fontWeight: '700', color: 'var(--primary-forest)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '10px 0' }}>{log.userId?.name || 'System / Guest'}</td>
                    <td style={{ padding: '10px 0' }}>{log.userRole}</td>
                    <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Hotel Modal */}
      {hotelModalOpen && (
        <div className="modal-backdrop" onClick={() => setHotelModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem' }}>Add New Hotel Listing</h3>
              <button onClick={() => setHotelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateHotel} className="modal-body">
              <div className="form-group">
                <label className="form-label">Property Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Royal Haveli Retreat"
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jodhpur"
                    value={newHotelCity}
                    onChange={(e) => setNewHotelCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rajasthan"
                    value={newHotelState}
                    onChange={(e) => setNewHotelState(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select
                  className="form-select"
                  value={newHotelType}
                  onChange={(e) => setNewHotelType(e.target.value)}
                >
                  <option value="palace">Palace</option>
                  <option value="resort">Resort</option>
                  <option value="heritage">Heritage</option>
                  <option value="boutique">Boutique</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Property highlights, historical heritage, architecture..."
                  value={newHotelDescription}
                  onChange={(e) => setNewHotelDescription(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Create Hotel Property
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {userRoleModalOpen && selectedUserForRole && (
        <div className="modal-backdrop" onClick={() => setUserRoleModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.3rem' }}>Assign Role & Property</h3>
              <button onClick={() => setUserRoleModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUserRole} className="modal-body">
              <div style={{ backgroundColor: 'var(--bg-cream)', padding: '10px 12px', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ fontWeight: '700' }}>{selectedUserForRole.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedUserForRole.email}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Permitted Role</label>
                <select
                  className="form-select"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="guest">Guest</option>
                  <option value="staff">Staff (Front Desk)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {targetRole === 'staff' && (
                <div className="form-group">
                  <label className="form-label">Assigned Property</label>
                  <select
                    className="form-select"
                    value={targetAssignedHotel}
                    onChange={(e) => setTargetAssignedHotel(e.target.value)}
                  >
                    {hotels.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} ({h.address?.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Update Permissions
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
