import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { offerApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Sparkles, Copy, Check, Calendar, ArrowRight } from 'lucide-react';

export const OffersPage = () => {
  const { showToast } = useNotification();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await offerApi.getActive();
        if (res.data.success) {
          setOffers(res.data.offers || []);
        }
      } catch (err) {
        console.error('Failed to load offers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code ${code} copied! Apply at checkout for instant savings.`, 'success');
    setTimeout(() => setCopiedCode(''), 3000);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
        <span className="badge badge-brass" style={{ marginBottom: '8px' }}>
          <Sparkles size={14} color="var(--accent-brass, #C59B27)" />
          SHREE श्री Privileges
        </span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-royal, "Cinzel", serif)' }}>
          Royal Privileges & Seasonal Suites
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Enjoy verified reductions and seasonal suite upgrades across India’s most prestigious heritage palaces and beachfront villas.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading seasonal privileges...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="card card-editorial"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="badge badge-brass">
                    {offer.discountPercentage}% Instant Reduction
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    Expires {new Date(offer.validUntil).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{offer.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {offer.description} Minimum reservation value: ₹{offer.minBookingAmount?.toLocaleString('en-IN')}. Max discount: ₹{offer.maxDiscountAmount?.toLocaleString('en-IN')}.
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-cream)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-brass)',
                    marginBottom: '1rem',
                  }}
                >
                  <code style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-forest)', letterSpacing: '0.08em' }}>
                    {offer.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="btn btn-brass btn-sm"
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Code
                      </>
                    )}
                  </button>
                </div>

                <Link to="/stays" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  <span>Apply to Available Stays</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
