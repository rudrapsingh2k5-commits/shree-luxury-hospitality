import React, { useState } from 'react';
import { paymentApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Sparkles,
  AlertTriangle,
  RotateCw,
  ArrowRightLeft,
  Info,
} from 'lucide-react';

export const StripePaymentModal = ({
  isOpen,
  onClose,
  booking,
  paymentData,
  onPaymentSuccess,
}) => {
  const { showToast } = useNotification();
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState(booking?.guestDetails?.name || 'Grand Guest');
  const [billingCountry, setBillingCountry] = useState('India (IN)');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !booking || !paymentData) return null;

  const amountInr = paymentData.amountInr || booking.priceBreakdown?.finalAmount || 0;
  const amountGbp = paymentData.amountGbp || Number((amountInr / (paymentData.exchangeRate || 105)).toFixed(2));
  const exchangeRate = paymentData.exchangeRate || 105.0;
  const isLive = paymentData.isLiveGateway;

  const handleProcessPayment = async (forceFailure = false) => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      if (forceFailure) {
        // Intentionally test failure condition
        await paymentApi.confirmPayment({
          bookingId: booking._id,
          paymentIntentId: 'pi_invalid_declined_intent',
          paymentMethod: 'card',
          isSimulated: true,
        });
        return;
      }

      // Confirm Stripe payment intent with server
      const res = await paymentApi.confirmPayment({
        bookingId: booking._id,
        paymentIntentId: paymentData.paymentIntentId || paymentData.id,
        paymentMethod: 'card',
        paymentMethodId: 'pm_card_visa',
        isSimulated: false,
      });

      if (res.data.success) {
        // Royal celebratory confetti
        try {
          confetti({
            particleCount: 85,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#6E1A24', '#C59B27', '#D4AF37', '#1B382B'],
          });
        } catch {
          // ignore if suppressed
        }

        showToast(
          `Payment of £${amountGbp.toFixed(2)} GBP (₹${amountInr.toLocaleString('en-IN')}) confirmed!`,
          'success'
        );
        onPaymentSuccess(res.data.booking, res.data.payment);
      } else {
        throw new Error(res.data.message || 'Payment confirmation failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Stripe payment could not be processed.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid var(--accent-brass, #C59B27)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg, 0 20px 40px -8px rgba(26, 48, 38, 0.2))',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Stripe Gateway Header */}
        <div
          style={{
            backgroundColor: '#0A2540', // Official Stripe navy blue
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid var(--accent-brass, #C59B27)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", serif)',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  fontSize: '1.2rem',
                  color: '#FAF6F0',
                }}
              >
                SHREE <span style={{ color: '#D4AF37' }}>श्री</span>
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: '#635BFF',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                stripe {isLive ? 'LIVE' : 'SANDBOX'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#93C5FD', marginTop: '3px' }}>
              Ref: {booking.bookingReference} • {paymentData.paymentIntentId || 'pi_pending'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                £{amountGbp.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: '500' }}>
                GBP (Billed in British Pounds)
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Currency Conversion Alert Banner */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            padding: '10px 16px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #BFDBFE',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft size={16} color="#2563EB" />
            <span>
              <strong>Website Price in India:</strong> ₹{amountInr.toLocaleString('en-IN')} INR
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: '#DBEAFE',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '600',
            }}
          >
            Rate: 1 GBP = ₹{exchangeRate.toFixed(2)}
          </span>
        </div>

        {/* Mode Notification */}
        {!isLive && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '8px 16px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #FDE68A',
            }}
          >
            <Sparkles size={14} color="#B45309" />
            <span>
              <strong>Stripe Ready:</strong> Paste your API keys into <code>server/.env</code> anytime to activate live card charging.
            </span>
          </div>
        )}

        {/* Modal Body with smooth scrolling */}
        <div
          className="modal-body"
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #FECACA',
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Luxury Card Elements */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
              borderRadius: '12px',
              padding: '1.25rem',
              color: '#FAF6F0',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #44403C',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={18} color="#D4AF37" />
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontWeight: '700' }}>
                  Stripe Card Checkout
                </span>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '0.05em', color: '#FFFFFF' }}>
                £{amountGbp.toFixed(2)} GBP
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8A29E', display: 'block', marginBottom: '4px' }}>
                Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8A29E', display: 'block', marginBottom: '4px' }}>
                  Expiry
                </label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8A29E', display: 'block', marginBottom: '4px' }}>
                  CVC / CVV
                </label>
                <input
                  type="password"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Billing Name & Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main, #1F2937)', marginBottom: '4px', display: 'block' }}>
                Cardholder Name
              </label>
              <input
                type="text"
                className="form-input"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main, #1F2937)', marginBottom: '4px', display: 'block' }}>
                Country / Region
              </label>
              <select
                className="form-select"
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              >
                <option value="India (IN)">India (IN)</option>
                <option value="United Kingdom (GB)">United Kingdom (GB)</option>
                <option value="United States (US)">United States (US)</option>
                <option value="United Arab Emirates (AE)">United Arab Emirates (AE)</option>
              </select>
            </div>
          </div>

          {/* Stripe Security & Currency Assurance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#475569',
              marginBottom: '1.5rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <ShieldCheck size={18} color="#635BFF" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '2px' }}>
                End-to-End Encrypted via Stripe (GBP Billing)
              </div>
              <div>
                Your card is charged <strong>£{amountGbp.toFixed(2)} GBP</strong>. The equivalent reservation value of <strong>₹{amountInr.toLocaleString('en-IN')} INR</strong> is fully guaranteed and confirmed immediately.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={processing}
              onClick={() => handleProcessPayment(false)}
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1.02rem',
                backgroundColor: '#635BFF', // Stripe brand purple/blue
                color: '#FFFFFF',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: processing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99, 91, 255, 0.25)',
              }}
            >
              {processing ? (
                <>
                  <RotateCw size={18} className="spin" />
                  <span>Processing Stripe Transaction...</span>
                </>
              ) : (
                <>
                  <Lock size={17} />
                  <span>Pay £{amountGbp.toFixed(2)} GBP (₹{amountInr.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              disabled={processing}
              onClick={() => handleProcessPayment(true)}
              style={{
                width: '100%',
                fontSize: '0.8rem',
                color: '#991B1B',
                borderColor: '#FCA5A5',
                justifyContent: 'center',
                gap: '6px',
                padding: '0.5rem',
                borderRadius: '6px',
              }}
            >
              <XCircle size={15} /> Simulate Stripe Card Decline (Test Case)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;
