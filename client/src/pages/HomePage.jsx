import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hotelApi, offerApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import BookingSearchPanel from '../components/booking/BookingSearchPanel';
import ImageWithFallback from '../components/common/ImageWithFallback';
import {
  Star,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Compass,
  HeartHandshake,
  Clock,
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [activeOffers, setActiveOffers] = useState([]);
  const [copiedCoupon, setCopiedCoupon] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelsRes, offersRes] = await Promise.all([
          hotelApi.getFeatured(),
          offerApi.getActive(),
        ]);
        if (hotelsRes.data.success) {
          setFeaturedHotels(hotelsRes.data.hotels || []);
        }
        if (offersRes.data.success) {
          setActiveOffers(offersRes.data.offers || []);
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    showToast(`Coupon code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCoupon(''), 3000);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    showToast('Subscribed to SHREE श्री Royal Gazettes.', 'success');
  };

  const collections = [
    {
      title: 'Imperial Rajputana Palaces',
      city: 'Udaipur & Jaipur',
      description: 'Hand-carved jharokhas, tranquil marble courtyards, and starlit private dining.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      query: 'Udaipur',
    },
    {
      title: 'Barefoot Coastal Sanctuaries',
      city: 'Goa',
      description: 'Portuguese colonial architecture, plunge pools, and private ocean breezes.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      query: 'Goa',
    },
    {
      title: 'Highland Tea Sanctuaries',
      city: 'Munnar',
      description: 'Misty hills at 5,400 feet, colonial fireplaces, and curated tea-tasting trails.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      query: 'Munnar',
    },
    {
      title: 'Art Deco Diplomatic Enclaves',
      city: 'New Delhi',
      description: 'Colonnaded royal driveways, high tea salons, and executive luxury.',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      query: 'New Delhi',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '4rem' }}>
      {/* Editorial Hero Section */}
      <section
        style={{
          position: 'relative',
          paddingTop: '3.5rem',
          paddingBottom: '5rem',
          backgroundColor: 'var(--bg-cream)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              className="badge badge-brass"
              style={{
                marginBottom: '1rem',
                fontSize: '0.8rem',
                padding: '6px 16px',
              }}
            >
              <Sparkles size={14} color="var(--accent-brass, #C59B27)" />
              SHREE श्री • Prosperity & Auspicious Hospitality
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
                fontWeight: '700',
                color: 'var(--primary-forest-dark, #102119)',
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
                lineHeight: '1.2',
              }}
            >
              Where Every Stay Feels <span style={{ color: 'var(--primary-maroon, #6E1A24)', fontStyle: 'italic' }}>Grand.</span>
            </h1>
            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: '1.75',
                color: 'var(--text-muted, #5F6762)',
                maxWidth: '700px',
                margin: '0 auto',
              }}
            >
              Immerse yourself in India’s most distinguished Rajputana palaces, sun-drenched coastal havelis, and misty highland sanctuaries. Authentic royal hospitality, guaranteed real-time inventory, and verified stays.
            </p>
          </div>

          {/* Interactive Search Panel */}
          <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
            <BookingSearchPanel />
          </div>
        </div>
      </section>

      {/* Featured Stays */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <span className="badge badge-forest" style={{ marginBottom: '6px' }}>
              Handpicked Residences
            </span>
            <h2 style={{ fontSize: '2.1rem' }}>Featured Stays of the Season</h2>
          </div>
          <Link to="/stays" className="btn btn-outline" style={{ fontSize: '0.88rem' }}>
            <span>Explore All Stays</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {featuredHotels.map((hotel) => (
            <div
              key={hotel._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {/* Hotel Image with Primary Badge */}
              <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                <ImageWithFallback
                  key={hotel.images?.[0]?.url || hotel._id}
                  src={hotel.images?.[0]?.url}
                  alt={hotel.name}
                  style={{ width: '100%', height: '100%', transition: 'transform 0.4s ease' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    backgroundColor: 'rgba(16, 33, 25, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {hotel.propertyType}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    right: '14px',
                    backgroundColor: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Star size={14} color="#EAB308" fill="#EAB308" />
                  <span>{hotel.averageRating || 4.9}</span>
                  <span style={{ color: 'var(--text-subtle)', fontWeight: '400', fontSize: '0.72rem' }}>
                    ({hotel.totalReviews || 24})
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--accent-brass)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {hotel.address?.city}, {hotel.address?.state}
                </div>
                <h3 style={{ fontSize: '1.35rem', margin: '4px 0 8px 0' }}>{hotel.name}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', flex: 1, marginBottom: '1.25rem' }}>
                  {hotel.tagline || hotel.description?.slice(0, 110) + '...'}
                </p>

                {/* Amenities Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
                  {hotel.amenities?.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--bg-card-subtle)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                  {hotel.amenities?.length > 3 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', padding: '3px 4px' }}>
                      +{hotel.amenities.length - 3} more
                    </span>
                  )}
                </div>

                {/* Pricing & CTA */}
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
                      From per night
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-forest)' }}>
                      ₹{(hotel.startingPrice || 8500).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Link to={`/hotel/${hotel.slug}`} className="btn btn-primary btn-sm">
                    View Suites
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Collections Editorial Grid */}
      <section style={{ backgroundColor: 'var(--primary-forest-dark)', color: '#FFFFFF', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', marginBottom: '3rem' }}>
            <span className="badge badge-brass" style={{ marginBottom: '8px' }}>
              The Curated Portfolio
            </span>
            <h2 style={{ fontSize: '2.3rem', color: '#FFFFFF', marginBottom: '1rem' }}>
              Distinctive Hospitality Across India
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.6' }}>
              Each property in our collection is personally audited for architectural fidelity, privacy, and exceptional regional dining.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {collections.map((col) => (
              <div
                key={col.title}
                onClick={() => navigate(`/stays?destination=${col.query}`)}
                style={{
                  position: 'relative',
                  height: '340px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <ImageWithFallback
                  src={col.image}
                  alt={col.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(16, 33, 25, 0.95) 0%, rgba(16, 33, 25, 0.2) 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-brass)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {col.city}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', color: '#FFFFFF', margin: '4px 0 6px 0' }}>{col.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: '1.4' }}>{col.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limited-Time Offers / Coupons */}
      {activeOffers.length > 0 && (
        <section className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
            <span className="badge badge-brass" style={{ marginBottom: '6px' }}>
              Member Privileges
            </span>
            <h2 style={{ fontSize: '2.1rem' }}>Seasonal Sanctuary Privileges</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Apply valid promotional codes at checkout for instant reductions on your stay.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {activeOffers.map((offer) => (
              <div
                key={offer._id}
                className="card card-editorial"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-brass" style={{ fontSize: '0.72rem' }}>
                      {offer.discountPercentage}% Instant Reduction
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Valid till {new Date(offer.validUntil).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{offer.title}</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    {offer.description} (Min. booking: ₹{offer.minBookingAmount?.toLocaleString('en-IN')})
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-cream)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-brass)',
                  }}
                >
                  <code style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-forest)', letterSpacing: '0.08em' }}>
                    {offer.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(offer.code)}
                    className="btn btn-brass btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {copiedCoupon === offer.code ? (
                      <>
                        <Check size={13} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verified Stays & Guest Reviews */}
      <section style={{ backgroundColor: 'var(--bg-cream)', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ maxWidth: '640px', marginBottom: '3rem' }}>
            <span className="badge badge-forest" style={{ marginBottom: '6px' }}>
              Authentic Feedback
            </span>
            <h2 style={{ fontSize: '2.1rem' }}>Reviews from Verified Stays</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Only guests who completed reservations on SHREE श्री are permitted to publish verified testimonials.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} color="#EAB308" fill="#EAB308" />
                ))}
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
                “A royal fairytale come to life on Lake Pichola”
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                From the private boat arrival to the flute performance at dusk, our stay at The Mewar Palace was extraordinary. The staff anticipated every need, the food was exquisite, and the morning view of the lake is unforgettable.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-forest-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: 'var(--primary-forest)',
                  }}
                >
                  AS
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Ananya Sharma</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-brass)' }}>Verified Stay • Lake Retreat Udaipur</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} color="#EAB308" fill="#EAB308" />
                ))}
              </div>
              <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
                “Barefoot Portuguese luxury with private plunge pool”
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Aguada Cove is everything we sought for an anniversary retreat. Quiet coconut groves, impeccable seafood, and direct access to Sinquerim sands without any crowds. Truly a 5-star haven.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-forest-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: 'var(--primary-forest)',
                  }}
                >
                  KM
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Karan Mehra</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-brass)' }}>Verified Stay • Aguada Cove Goa</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The SHREE श्री Hospitality Promise */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
          <span className="badge badge-brass" style={{ marginBottom: '6px' }}>
            Our Guarantee
          </span>
          <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-royal, "Cinzel", serif)' }}>The SHREE श्री Hospitality Pillars</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-forest-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-forest)',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Verified Real-Time Inventory</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Direct database calendar reservations ensure your room is held without risk of double-booking.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-brass-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-brass-hover)',
              }}
            >
              <Award size={26} />
            </div>
            <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Transparent Price Breakdown</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Every rupee is transparently itemized with standard 18% GST and zero surprise resort levies.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-forest-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-forest)',
              }}
            >
              <Clock size={26} />
            </div>
            <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>48-Hour Free Cancellation</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Cancel up to 48 hours prior to check-in for a full, unpenalized refund directly to your source account.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-brass-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-brass-hover)',
              }}
            >
              <HeartHandshake size={26} />
            </div>
            <h4 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Dedicated Concierge Support</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Direct access to our front desk teams for airport transfers, dietary preferences, and room services.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="container">
        <div
          style={{
            backgroundColor: 'var(--primary-forest)',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <span className="badge badge-brass" style={{ marginBottom: '8px' }}>
            The Private Gazette
          </span>
          <h2 style={{ fontSize: '2.2rem', color: '#FFFFFF', marginBottom: '0.75rem' }}>
            Receive Invitations to Private Escapes
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '0.98rem', maxWidth: '580px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Subscribers receive first access to seasonal suite privileges, cultural itineraries, and newly restored royal properties.
          </p>

          {newsletterSubmitted ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#A7F3D0',
                fontSize: '0.92rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Thank you. You have been added to the SHREE श्री Royal Gazette registry.</span>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center',
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              <input
                type="email"
                placeholder="Enter your personal email..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '0.92rem',
                }}
              />
              <button type="submit" className="btn btn-brass">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
