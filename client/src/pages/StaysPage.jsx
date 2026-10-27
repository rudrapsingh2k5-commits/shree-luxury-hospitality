import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { hotelApi } from '../services/api';
import ImageWithFallback from '../components/common/ImageWithFallback';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';

export const StaysPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '2';
  const children = searchParams.get('children') || '0';
  const rooms = searchParams.get('rooms') || '1';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const starRating = searchParams.get('starRating') || '';
  const propertyType = searchParams.get('propertyType') || '';
  const minRating = searchParams.get('minRating') || '';
  const amenities = searchParams.get('amenities') || '';
  const sortBy = searchParams.get('sortBy') || 'recommended';

  const [hotels, setHotels] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter input states
  const [destInput, setDestInput] = useState(destination);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const availableAmenities = [
    'High-Speed Wi-Fi',
    'Swimming Pool',
    'Fine Dining Restaurant',
    'Ayurvedic Royal Spa',
    '24/7 Butler Service',
    'Valet Parking',
    'Private Beach Access',
  ];

  const propertyTypes = ['palace', 'resort', 'heritage', 'boutique', 'business'];

  // Fetch hotels matching criteria
  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(searchParams.entries());
        const res = await hotelApi.getHotels(params);
        if (res.data.success) {
          setHotels(res.data.hotels || []);
          setTotalCount(res.data.total || 0);
        }
      } catch (err) {
        console.error('Failed to search hotels', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (destInput.trim()) newParams.set('destination', destInput.trim());
    else newParams.delete('destination');

    if (minPriceInput) newParams.set('minPrice', minPriceInput);
    else newParams.delete('minPrice');

    if (maxPriceInput) newParams.set('maxPrice', maxPriceInput);
    else newParams.delete('maxPrice');

    setSearchParams(newParams);
  };

  const toggleAmenity = (amenity) => {
    const currentList = amenities ? amenities.split(',') : [];
    let updated = [];
    if (currentList.includes(amenity)) {
      updated = currentList.filter((a) => a !== amenity);
    } else {
      updated = [...currentList, amenity];
    }
    updateParam('amenities', updated.join(','));
  };

  const togglePropertyType = (type) => {
    const currentList = propertyType ? propertyType.split(',') : [];
    let updated = [];
    if (currentList.includes(type)) {
      updated = currentList.filter((t) => t !== type);
    } else {
      updated = [...currentList, type];
    }
    updateParam('propertyType', updated.join(','));
  };

  const resetFilters = () => {
    setDestInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-brass" style={{ marginBottom: '6px' }}>
          Real-Time Inventory
        </span>
        <h1 style={{ fontSize: '2.4rem' }}>
          {destination ? `Luxury Stays in ${destination}` : 'Curated Luxury Stays'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Showing {totalCount} verified properties with instant calendar availability.
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Result List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 280px) 1fr',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Filters Sidebar */}
        <aside
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-medium)',
            borderRadius: '10px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: '90px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.95rem' }}>
              <Filter size={16} color="var(--primary-forest)" />
              <span>Filter Sanctuaries</span>
            </div>
            <button
              onClick={resetFilters}
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-brass)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <form onSubmit={handleApplyFilter}>
            {/* Destination filter */}
            <div className="form-group">
              <label className="form-label">City or Destination</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Udaipur, Goa..."
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
              />
            </div>

            {/* Price Range Filter */}
            <div className="form-group">
              <label className="form-label">Nightly Rate (₹ INR)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min ₹"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max ₹"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: '1.5rem' }}>
              Apply Criteria
            </button>
          </form>

          {/* Star Rating */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <label className="form-label">Star Classification</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {[5, 4, 3].map((star) => {
                const isSelected = starRating.split(',').includes(String(star));
                return (
                  <label
                    key={star}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const stars = starRating ? starRating.split(',') : [];
                        const updated = isSelected
                          ? stars.filter((s) => s !== String(star))
                          : [...stars, String(star)];
                        updateParam('starRating', updated.join(','));
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {[...Array(star)].map((_, i) => (
                        <Star key={i} size={14} color="#EAB308" fill="#EAB308" />
                      ))}
                      <span style={{ marginLeft: '4px' }}>{star} Stars</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Property Type */}
          <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <label className="form-label">Property Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {propertyTypes.map((type) => {
                const isSelected = propertyType.split(',').includes(type);
                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePropertyType(type)}
                    />
                    <span>{type}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Amenities */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <label className="form-label">Amenities</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {availableAmenities.map((amenity) => {
                const isSelected = amenities.split(',').includes(amenity);
                return (
                  <label
                    key={amenity}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Results Stream */}
        <div>
          {/* Top Sort & Active Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Showing <strong>{hotels.length}</strong> matching luxury properties
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Sort By:
              </label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.85rem' }}
              >
                <option value="recommended">Featured / Recommended</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Guest Rating</option>
                <option value="stars">Star Category</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading luxury stays...
            </div>
          ) : hotels.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No sanctuaries match your criteria</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Try relaxing your price filters or removing selected amenities.
              </p>
              <button onClick={resetFilters} className="btn btn-brass btn-sm">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {hotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                    overflow: 'hidden',
                  }}
                >
                  {/* Photo Thumbnail */}
                  <div style={{ position: 'relative', height: '100%', minHeight: '230px' }}>
                    <ImageWithFallback
                      key={hotel.images?.[0]?.url || hotel._id}
                      src={hotel.images?.[0]?.url}
                      alt={hotel.name}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(16, 33, 25, 0.85)',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      {hotel.propertyType}
                    </div>
                  </div>

                  {/* Information Panel */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-brass)', textTransform: 'uppercase' }}>
                            {hotel.address?.city}, {hotel.address?.state}
                          </div>
                          <h2 style={{ fontSize: '1.4rem', margin: '2px 0 6px 0' }}>{hotel.name}</h2>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'var(--accent-brass-light)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            color: '#8C6A12',
                          }}
                        >
                          <Star size={14} color="#8C6A12" fill="#8C6A12" />
                          <span>{hotel.averageRating || 4.9}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '8px 0 12px 0' }}>
                        {hotel.tagline || hotel.description?.slice(0, 140) + '...'}
                      </p>

                      {/* Amenities */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                        {hotel.amenities?.slice(0, 4).map((a) => (
                          <span
                            key={a}
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: 'var(--bg-cream)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: 'var(--text-main)',
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price and CTA row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                          Nightly Rate From
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary-forest)' }}>
                          ₹{(hotel.startingPrice || 8500).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>+ 18% GST Itemized</div>
                      </div>

                      <Link
                        to={`/hotel/${hotel.slug}?${searchParams.toString()}`}
                        className="btn btn-primary"
                      >
                        <span>View Suites & Book</span>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaysPage;
