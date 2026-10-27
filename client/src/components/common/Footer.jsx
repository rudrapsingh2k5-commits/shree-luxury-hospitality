import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Sparkles, PhoneCall, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#161311', // Deep imperial charcoal
        color: '#E2E8F0',
        paddingTop: '4.5rem',
        paddingBottom: '2.5rem',
        marginTop: 'auto',
        borderTop: '2px solid var(--accent-brass, #C59B27)',
      }}
    >
      <div className="container">
        {/* Upper Editorial Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: 'var(--primary-maroon, #6E1A24)',
                  color: 'var(--accent-gold, #D4AF37)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-devanagari, "Noto Serif Devanagari", serif)',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              >
                श्री
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-royal, "Cinzel", serif)',
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    SHREE
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-devanagari, "Noto Serif Devanagari", serif)',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'var(--accent-gold, #D4AF37)',
                    }}
                  >
                    श्री
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-brass, #C59B27)',
                    fontWeight: '700',
                    display: 'block',
                    marginTop: '-2px',
                  }}
                >
                  Where Every Stay Feels Grand
                </span>
              </div>
            </div>
            <p style={{ color: '#A8A29E', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.2rem' }}>
              Rooted in the Sanskrit ideals of prosperity and auspiciousness, SHREE श्री curates India’s most distinguished Rajputana palaces, coastal havelis, and highland sanctuaries with guaranteed real-time inventory and verified stays.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-brass" style={{ fontSize: '0.7rem' }}>
                <ShieldCheck size={12} /> Stripe Secure (£ GBP)
              </span>
              <span
                className="badge badge-forest"
                style={{ fontSize: '0.7rem', color: '#A7F3D0', borderColor: '#065F46' }}
              >
                <Award size={12} /> INR (₹) Pricing
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                color: '#FAF6F0',
                fontFamily: 'var(--font-royal, "Cinzel", serif)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '1.2rem',
              }}
            >
              Curated Sanctuaries
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
              <li>
                <Link to="/stays?destination=Udaipur" style={{ color: '#A8A29E' }}>
                  Lake Pichola Rajputana Palaces
                </Link>
              </li>
              <li>
                <Link to="/stays?destination=Goa" style={{ color: '#A8A29E' }}>
                  Portuguese Beachfront Haveli Villas
                </Link>
              </li>
              <li>
                <Link to="/stays?destination=Jaipur" style={{ color: '#A8A29E' }}>
                  Pink City Royal Courtyard Havelis
                </Link>
              </li>
              <li>
                <Link to="/stays?destination=Munnar" style={{ color: '#A8A29E' }}>
                  Western Ghats Tea Sanctuaries
                </Link>
              </li>
              <li>
                <Link to="/stays?destination=Delhi" style={{ color: '#A8A29E' }}>
                  Diplomatic Art Deco Suites
                </Link>
              </li>
            </ul>
          </div>

          {/* Guest Privileges */}
          <div>
            <h4
              style={{
                color: '#FAF6F0',
                fontFamily: 'var(--font-royal, "Cinzel", serif)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '1.2rem',
              }}
            >
              Royal Guest Privileges
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: '#A8A29E' }}>
              <li>• Transparent 18% statutory GST breakdown</li>
              <li>• 48-Hour complimentary cancellation policy</li>
              <li>• Verified guest stay reviews exclusively</li>
              <li>• 24/7 dedicated butler & concierge assistance</li>
              <li>• Cryptographic HMAC-SHA256 checkout security</li>
            </ul>
          </div>

          {/* 24/7 Concierge Desk */}
          <div>
            <h4
              style={{
                color: '#FAF6F0',
                fontFamily: 'var(--font-royal, "Cinzel", serif)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '1.2rem',
              }}
            >
              SHREE Concierge Desk
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#A8A29E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={16} color="var(--accent-brass, #C59B27)" />
                <span>+91 1800 200 7473 (Toll-Free)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--accent-brass, #C59B27)" />
                <span>concierge@shreehotels.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} color="var(--accent-brass, #C59B27)" style={{ marginTop: '3px' }} />
                <span>Janpath Diplomatic Enclave, New Delhi 110001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Legal / Copyright Strip */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '2rem',
            fontSize: '0.8rem',
            color: '#78716C',
          }}
        >
          <div>
            © {new Date().getFullYear()} SHREE श्री Luxury Hospitality Platform. Where Every Stay Feels Grand.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            <Link to="/about" style={{ color: '#78716C' }}>About SHREE श्री</Link>
            <Link to="/support" style={{ color: '#78716C' }}>Help & FAQs</Link>
            <Link to="/offers" style={{ color: 'var(--accent-brass, #C59B27)' }}>Seasonal Privileges</Link>
            <span style={{ color: 'var(--accent-brass, #C59B27)' }}>Primary Currency: INR (₹)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
