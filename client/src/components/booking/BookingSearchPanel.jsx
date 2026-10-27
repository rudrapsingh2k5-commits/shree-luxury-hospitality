import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, ChevronDown } from 'lucide-react';

export const BookingSearchPanel = ({ initialValues = {}, className = '' }) => {
  const navigate = useNavigate();

  // Default dates: tomorrow and +2 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = tomorrow.toISOString().split('T')[0];

  const checkoutDefault = new Date(tomorrow);
  checkoutDefault.setDate(checkoutDefault.getDate() + 2);
  const defaultCheckOut = checkoutDefault.toISOString().split('T')[0];

  const [destination, setDestination] = useState(initialValues.destination || '');
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || defaultCheckOut);
  const [adults, setAdults] = useState(Number(initialValues.adults) || 2);
  const [children, setChildren] = useState(Number(initialValues.children) || 0);
  const [rooms, setRooms] = useState(Number(initialValues.rooms) || 1);

  const [guestsOpen, setGuestsOpen] = useState(false);

  const popularDestinations = ['Udaipur', 'Goa', 'Jaipur', 'Munnar', 'New Delhi'];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('adults', adults);
    params.set('children', children);
    params.set('rooms', rooms);

    navigate(`/stays?${params.toString()}`);
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-medium)',
      }}
    >
      <form onSubmit={handleSearch}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Destination */}
          <div
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <MapPin size={14} color="var(--accent-brass)" />
              <label style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Destination or Heritage Stay
              </label>
            </div>
            <input
              type="text"
              placeholder="e.g. Udaipur, Goa, Palace..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontWeight: '600',
                color: 'var(--primary-forest)',
                outline: 'none',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* Check-In */}
          <div
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Calendar size={14} color="var(--accent-brass)" />
              <label style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Check-in Date
              </label>
            </div>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) {
                  const nextDay = new Date(e.target.value);
                  nextDay.setDate(nextDay.getDate() + 1);
                  setCheckOut(nextDay.toISOString().split('T')[0]);
                }
              }}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontWeight: '600',
                color: 'var(--primary-forest)',
                outline: 'none',
                fontSize: '0.92rem',
              }}
            />
          </div>

          {/* Check-Out */}
          <div
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Calendar size={14} color="var(--accent-brass)" />
              <label style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Check-out Date
              </label>
            </div>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontWeight: '600',
                color: 'var(--primary-forest)',
                outline: 'none',
                fontSize: '0.92rem',
              }}
            />
          </div>

          {/* Guests & Rooms Popover Trigger */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setGuestsOpen(!guestsOpen)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card-subtle)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Users size={14} color="var(--accent-brass)" />
                <label style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Guests & Rooms
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--primary-forest)', fontSize: '0.95rem' }}>
                  {adults + children} Guests • {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </div>
            </div>

            {guestsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '16px',
                  zIndex: 400,
                  animation: 'slideUp 0.15s ease-out',
                }}
              >
                {/* Adults */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>Adults</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ages 13 and above</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{adults}</span>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setAdults(adults + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>Children</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ages 0 to 12</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setChildren(Math.max(0, children - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{children}</span>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setChildren(children + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Rooms */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>Rooms</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Number of suites</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setRooms(Math.max(1, rooms - 1))}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{rooms}</span>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setRooms(rooms + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setGuestsOpen(false)}
                >
                  Apply Selection
                </button>
              </div>
            )}
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '52px',
                fontSize: '0.98rem',
                backgroundColor: 'var(--primary-forest)',
              }}
            >
              <Search size={18} />
              <span>Search Luxury Stays</span>
            </button>
          </div>
        </div>

        {/* Quick presets row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            Popular Sanctuaries:
          </span>
          {popularDestinations.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setDestination(city)}
              style={{
                fontSize: '0.78rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: destination === city ? 'var(--primary-forest)' : 'var(--bg-cream)',
                color: destination === city ? '#FFFFFF' : 'var(--primary-forest)',
                border: '1px solid var(--border-subtle)',
                fontWeight: '500',
                transition: 'var(--transition-fast)',
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default BookingSearchPanel;
