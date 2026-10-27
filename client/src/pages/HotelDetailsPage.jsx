import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { hotelApi, roomApi, bookingApi, paymentApi, favoriteApi, offerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ImageWithFallback from '../components/common/ImageWithFallback';
import StripePaymentModal from '../components/booking/StripePaymentModal';
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Check,
  ShieldCheck,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  CreditCard,
  X,
} from 'lucide-react';

export const HotelDetailsPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useNotification();

  const [hotel, setHotel] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reservation details
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckIn = searchParams.get('checkIn') || tomorrow.toISOString().split('T')[0];

  const checkoutDefault = new Date(tomorrow);
  checkoutDefault.setDate(checkoutDefault.getDate() + 2);
  const defaultCheckOut = searchParams.get('checkOut') || checkoutDefault.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 2);
  const [children, setChildren] = useState(Number(searchParams.get('children')) || 0);
  const [numberOfRooms, setNumberOfRooms] = useState(Number(searchParams.get('rooms')) || 1);

  // Selected Room Type for Booking
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  // Multi-step Checkout Drawer/Modal state
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Info -> 2: Price & Coupon -> 3: Gateway
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Created Booking & Stripe Payment Data
  const [createdBooking, setCreatedBooking] = useState(null);
  const [stripePaymentData, setStripePaymentData] = useState(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await hotelApi.getBySlug(slug);
        if (res.data.success) {
          setHotel(res.data.hotel);
          if (res.data.hotel.roomTypes?.length > 0) {
            setSelectedRoomType(res.data.hotel.roomTypes[0]);
          }
        }
      } catch (err) {
        showToast('Failed to load hotel details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [slug]);

  useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.name);
      if (!guestEmail) setGuestEmail(user.email);
      if (!guestPhone) setGuestPhone(user.phone || '');
    }
  }, [user]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await favoriteApi.toggle(hotel._id);
      setIsFavorited(res.data.isFavorited);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast('Failed to update saved stays', 'error');
    }
  };

  // Server quote & pricing state
  const [serverPricing, setServerPricing] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  // Validate dates: checkIn >= today, checkOut > checkIn
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastCheckIn = checkIn && checkIn < todayStr;
  const isInvalidDateRange = checkIn && checkOut && checkOut <= checkIn;

  // Calculate nights
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Real-time server-side quote synchronization
  useEffect(() => {
    if (!selectedRoomType?._id || !checkIn || !checkOut) return;

    if (isPastCheckIn) {
      setQuoteError('Check-in date cannot be in the past.');
      return;
    }
    if (isInvalidDateRange) {
      setQuoteError('Check-out date must be strictly after check-in date.');
      return;
    }
    setQuoteError('');

    let isMounted = true;
    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await roomApi.getQuote(selectedRoomType._id, {
          checkIn,
          checkOut,
          numberOfRooms,
          couponCode: appliedCoupon?.code || (couponCode.trim() ? couponCode.trim() : undefined),
        });
        if (isMounted && res.data.success) {
          setServerPricing(res.data.pricing);
          if (res.data.pricing?.discountAmount > 0 && !appliedCoupon) {
            setCouponDiscount(res.data.pricing.discountAmount);
          }
        }
      } catch (err) {
        if (isMounted) {
          setQuoteError(err.response?.data?.message || 'Rate quote unavailable for selected dates.');
        }
      } finally {
        if (isMounted) setQuoteLoading(false);
      }
    };

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [selectedRoomType?._id, checkIn, checkOut, numberOfRooms, appliedCoupon]);

  // Authoritative prices calculated from server quote or fallback
  const baseRate = selectedRoomType?.basePricePerNight || 8500;
  const totalBase = serverPricing?.totalBaseCharge ?? (baseRate * nights * numberOfRooms);
  const taxPercent = serverPricing?.taxPercent ?? (baseRate >= 7500 ? 18 : 12);
  const gstTax = serverPricing?.taxAmount ?? Math.round(totalBase * (taxPercent / 100));
  const effectiveDiscount = serverPricing?.discountAmount ?? couponDiscount;
  const grossTotal = totalBase + gstTax;
  const finalPayable = serverPricing?.finalAmount ?? Math.max(0, grossTotal - effectiveDiscount);

  // Apply Coupon via backend validator
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await offerApi.validateCoupon(couponCode, totalBase);
      if (res.data.success) {
        setAppliedCoupon(res.data.offer);
        setCouponDiscount(res.data.calculatedDiscount);
        showToast(res.data.message || `Promotional code ${couponCode.toUpperCase()} applied!`, 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid promotional code.';
      showToast(msg, 'error');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  // Initiate Booking
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (submittingBooking) return;

    if (isPastCheckIn) {
      showToast('Check-in date cannot be in the past.', 'error');
      return;
    }
    if (isInvalidDateRange) {
      showToast('Check-out date must be strictly after check-in date.', 'error');
      return;
    }

    const maxAllowedGuests = (selectedRoomType?.maxOccupancy || 2) * numberOfRooms;
    if (adults + children > maxAllowedGuests) {
      showToast(`Selected room configuration accommodates up to ${maxAllowedGuests} guests. Please add more rooms.`, 'error');
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      showToast('Please provide primary guest name and valid email address.', 'error');
      return;
    }

    setSubmittingBooking(true);
    try {
      // 1. Create Pending Reservation on Server
      const bookingRes = await bookingApi.create({
        hotelId: hotel._id,
        roomTypeId: selectedRoomType._id,
        checkIn,
        checkOut,
        numberOfRooms,
        guests: { adults, children },
        guestDetails: {
          name: guestName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
          specialRequests: specialRequests.trim(),
        },
        couponCode: appliedCoupon?.code,
      });

      if (!bookingRes.data?.success) {
        throw new Error(bookingRes.data?.message || 'Could not create reservation.');
      }

      const booking = bookingRes.data.booking;
      setCreatedBooking(booking);

      // 2. Create Stripe Payment Intent on Server (converts INR price to GBP)
      const intentRes = await paymentApi.createIntent(booking._id);
      if (!intentRes.data?.success) {
        throw new Error(intentRes.data?.message || 'Payment intent creation failed.');
      }

      setStripePaymentData(intentRes.data);
      setCheckoutOpen(false);

      // 3. Open Stripe Payment Modal
      setSimulatorOpen(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to initiate booking.';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handlePaymentSuccess = (confirmedBooking) => {
    setSimulatorOpen(false);
    navigate(`/dashboard`);
  };

  if (loading || !hotel) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading sanctuary details...
      </div>
    );
  }

  const primaryPhoto = hotel.images?.[activeImage]?.url || hotel.images?.[0]?.url;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <div className="container">
        {/* Breadcrumb & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-brass">{hotel.propertyType}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {[...Array(hotel.starRating || 5)].map((_, i) => (
                  <Star key={i} size={14} color="#EAB308" fill="#EAB308" />
                ))}
              </div>
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{hotel.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              <MapPin size={15} color="var(--accent-brass)" />
              <span>
                {hotel.address?.street}, {hotel.address?.city}, {hotel.address?.state} {hotel.address?.postalCode}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleFavorite}
            className="btn btn-outline"
            style={{
              borderColor: isFavorited ? 'var(--accent-terracotta)' : 'var(--border-medium)',
              color: isFavorited ? 'var(--accent-terracotta)' : 'var(--text-main)',
            }}
          >
            <Heart size={16} fill={isFavorited ? 'var(--accent-terracotta)' : 'none'} />
            <span>{isFavorited ? 'Saved to Wishlist' : 'Save Sanctuary'}</span>
          </button>
        </div>

        {/* Photo Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '3rem' }}>
          <div style={{ height: '480px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <ImageWithFallback
              key={primaryPhoto}
              src={primaryPhoto}
              alt={hotel.name}
              loading="eager"
              fetchPriority="high"
              style={{ width: '100%', height: '100%' }}
            />
            {hotel.images?.[activeImage]?.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(16, 33, 25, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                }}
              >
                {hotel.images[activeImage].caption}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {hotel.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {hotel.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  style={{
                    width: '120px',
                    height: '80px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImage === idx ? '2px solid var(--accent-brass)' : '1px solid var(--border-subtle)',
                    opacity: activeImage === idx ? 1 : 0.65,
                    transition: 'var(--transition-fast)',
                    flexShrink: 0,
                  }}
                >
                  <ImageWithFallback
                    src={img.url}
                    alt={img.caption || hotel.name}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Layout: Left Details + Right Floating Booking Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr minmax(320px, 380px)',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column */}
          <div>
            {/* Overview & History */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Heritage & Sanctuary Story</h2>
              <p style={{ fontSize: '1.02rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
                {hotel.description}
              </p>
            </section>

            {/* Amenities Grid */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Property Highlights & Amenities</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {hotel.amenities?.map((amenity) => (
                  <div
                    key={amenity}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: 'var(--primary-forest)',
                    }}
                  >
                    <Check size={16} color="var(--accent-brass)" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Available Room Types */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Suites & Chambers</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {hotel.roomTypes?.map((room) => {
                  const isSelected = selectedRoomType?._id === room._id;
                  const roomPhoto = room.photos?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
                  return (
                    <div
                      key={room._id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        border: isSelected ? '2px solid var(--primary-forest)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-card-subtle)' : '#FFFFFF',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
                        gap: '1.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--bg-card-subtle)',
                        }}
                      >
                        <ImageWithFallback
                          key={roomPhoto}
                          src={roomPhoto}
                          alt={room.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div>
                              <span className="badge badge-brass" style={{ fontSize: '0.7rem' }}>{room.type}</span>
                              <h3 style={{ fontSize: '1.25rem', margin: '4px 0' }}>{room.name}</h3>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {room.bedType} • {room.roomSizeSqFt} sq. ft. • Up to {room.capacityAdults} Adults, {room.capacityChildren} Children
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--primary-forest)' }}>
                                ₹{room.basePricePerNight.toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>per night</div>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '6px 0 10px 0' }}>
                            {room.description}
                          </p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.85rem' }}>
                            {room.amenities?.map((a) => (
                              <span
                                key={a}
                                style={{
                                  fontSize: '0.72rem',
                                  backgroundColor: 'var(--bg-cream)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomType(room);
                              setCheckoutStep(1);
                              setCheckoutOpen(true);
                            }}
                            className={`btn ${isSelected ? 'btn-brass' : 'btn-outline'} btn-sm`}
                          >
                            {isSelected ? 'Selected Suite — Reserve Now' : 'Select Suite'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Policies */}
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Hospitality Policies</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>Check-in & Departure</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-in: 2:00 PM • Check-out: 11:00 AM</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>48-Hour Cancellation</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Full 100% refund if cancelled up to 48 hours prior to arrival.
                  </div>
                </div>
              </div>
            </section>

            {/* Verified Reviews Section */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem' }}>Verified Guest Experiences</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '1.1rem' }}>
                  <Star size={18} color="#EAB308" fill="#EAB308" />
                  <span>{hotel.averageRating || 4.9}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '400' }}>
                    ({hotel.reviews?.length || 0} verified reviews)
                  </span>
                </div>
              </div>

              {hotel.reviews?.length === 0 ? (
                <div style={{ padding: '2rem 0', color: 'var(--text-muted)' }}>
                  No reviews published yet for this property.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {hotel.reviews?.map((r) => (
                    <div key={r._id} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.92rem' }}>{r.userId?.name || 'Verified Guest'}</div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(r.rating || 5)].map((_, i) => (
                            <Star key={i} size={14} color="#EAB308" fill="#EAB308" />
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-brass)', marginBottom: '8px' }}>
                        Verified Stay • Stayed in {r.title || 'Palace Suite'}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Floating Reservation Sticky Card */}
          <aside
            style={{
              position: 'sticky',
              top: '90px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--primary-forest)' }}>
                  ₹{baseRate.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}> / night</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem', fontWeight: '700' }}>
                <Star size={15} color="#EAB308" fill="#EAB308" />
                <span>{hotel.averageRating || 4.9}</span>
              </div>
            </div>

            {/* Dates & Rooms Selector */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '8px 12px', borderRight: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={todayStr}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{ border: 'none', width: '100%', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  />
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || todayStr}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{ border: 'none', width: '100%', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                    Guests & Suites
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600' }}>
                    {adults + children} Guests • {numberOfRooms} {numberOfRooms === 1 ? 'Suite' : 'Suites'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => setNumberOfRooms(Math.max(1, numberOfRooms - 1))}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => setNumberOfRooms(numberOfRooms + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {quoteError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--status-crimson)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  lineHeight: '1.4',
                }}
              >
                {quoteError}
              </div>
            )}

            {/* Live Pricing Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>₹{baseRate.toLocaleString('en-IN')} × {nights} {nights === 1 ? 'night' : 'nights'} × {numberOfRooms} {numberOfRooms === 1 ? 'room' : 'rooms'}</span>
                <span>₹{totalBase.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>GST Tax ({taxPercent}% Statutory)</span>
                <span>₹{gstTax.toLocaleString('en-IN')}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  color: 'var(--primary-forest)',
                }}
              >
                <span>Total Amount</span>
                <span>₹{grossTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              disabled={Boolean(quoteError) || quoteLoading}
              onClick={() => {
                setCheckoutStep(1);
                setCheckoutOpen(true);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <span>{quoteLoading ? 'Synchronizing Rates...' : `Reserve ${selectedRoomType?.name || 'Suite'}`}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Instant verification • 48-Hour Free Cancellation
            </div>
          </aside>
        </div>
      </div>

      {/* Multi-Step Reservation Drawer / Modal */}
      {checkoutOpen && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <span className="badge badge-brass" style={{ fontSize: '0.7rem' }}>Step {checkoutStep} of 2</span>
                <h3 style={{ fontSize: '1.35rem' }}>
                  {checkoutStep === 1 ? 'Guest Details & Preferences' : 'Price Breakdown & Review'}
                </h3>
              </div>
              <button onClick={() => setCheckoutOpen(false)}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            <div className="modal-body">
              {checkoutStep === 1 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Primary Guest Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="guest@domain.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Special Requests (Optional)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g. High floor lake view, quiet room, late check-in..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    <span>Continue to Price Review</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {checkoutStep === 2 && (
                <div>
                  {/* Reservation Summary */}
                  <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--primary-forest)' }}>
                      {hotel.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Suite: <strong>{selectedRoomType?.name}</strong> • {nights} Nights ({checkIn} to {checkOut})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Guest: <strong>{guestName}</strong> ({guestEmail})
                    </div>
                  </div>

                  {/* Coupon Code Input */}
                  <div className="form-group">
                    <label className="form-label">Promotional Code (Optional)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. ROYAL15, COASTAL20, WELCOME10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button type="button" onClick={handleApplyCoupon} className="btn btn-brass">
                        Apply
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--status-emerald)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} /> {appliedCoupon.title} applied (-₹{couponDiscount.toLocaleString('en-IN')})
                      </div>
                    )}
                  </div>

                  {/* Final Price Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', margin: '1.25rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Base Room Charges ({nights} nights × {numberOfRooms} room)</span>
                      <span>₹{totalBase.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Statutory GST (18%)</span>
                      <span>₹{gstTax.toLocaleString('en-IN')}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--status-emerald)', fontWeight: '600' }}>
                        <span>Promotional Discount ({appliedCoupon?.code})</span>
                        <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        color: 'var(--primary-forest)',
                      }}
                    >
                      <span>Final Payable Amount</span>
                      <span>₹{finalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="btn btn-outline"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submittingBooking}
                      onClick={handleProceedToPayment}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      {submittingBooking ? (
                        'Creating Order...'
                      ) : (
                        <>
                          <CreditCard size={16} />
                          <span>
                            Pay ₹{finalPayable.toLocaleString('en-IN')} (~£{(finalPayable / 105).toFixed(2)} GBP via Stripe)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stripe Gateway Payment Modal */}
      {simulatorOpen && createdBooking && stripePaymentData && (
        <StripePaymentModal
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          booking={createdBooking}
          paymentData={stripePaymentData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default HotelDetailsPage;
