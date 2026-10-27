import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { supportApi } from '../services/api';
import {
  HelpCircle,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';

export const SupportPage = () => {
  const { showToast } = useNotification();
  const [openFaq, setOpenFaq] = useState(0);

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState('general');
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How does payment processing and currency conversion work on SHREE श्री?',
      a: 'All website catalog prices and invoices are displayed in Indian Rupees (INR / ₹). When you check out, your payment is securely processed through Stripe in British Pounds (GBP / £) using the current exchange rate. Both the INR amount and converted GBP charge are displayed transparently before payment, and end-to-end webhook verification guarantees that your booking is instantly confirmed.',
    },
    {
      q: 'What is the SHREE श्री cancellation and refund policy?',
      a: 'All eligible bookings enjoy our 48-Hour Free Cancellation policy. If cancelled at least 48 hours prior to the check-in date, 100% of your paid amount is refunded. For cancellations within 48 hours, a single night suite fee is retained, with the remaining balance refunded directly to your payment source.',
    },
    {
      q: 'Are taxes and GST included in the displayed rates?',
      a: 'SHREE श्री practices complete price transparency. All rates clearly itemize the statutory 18% Goods & Services Tax (9% CGST + 9% SGST). You will receive an official printable tax invoice immediately upon confirmation.',
    },
    {
      q: 'How do verified stay reviews work?',
      a: 'To guarantee total authenticity, reviews can only be submitted by registered guests who have completed a verified stay (checked-out status). Generic, unverified, or duplicate reviews are strictly rejected by the backend database.',
    },
    {
      q: 'Can hotel staff view records of other hotel properties?',
      a: 'No. SHREE श्री implements property-level database authorization. Staff assigned to The Mewar Palace in Udaipur cannot inspect, check in, or access records belonging to Aguada Cove in Goa. Platform administrators maintain universal multi-property oversight.',
    },
  ];

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquirySubject.trim() || !inquiryMessage.trim()) {
      showToast('Please complete all required fields.', 'error');
      return;
    }
    if (inquiryMessage.trim().length < 10) {
      showToast('Message must be at least 10 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await supportApi.createTicket({
        name: inquiryName.trim(),
        email: inquiryEmail.trim(),
        category: inquiryCategory,
        subject: inquirySubject.trim(),
        message: inquiryMessage.trim(),
      });

      if (res.data?.success) {
        setSubmitted(true);
        showToast(res.data.message || 'Your inquiry has been dispatched to our royal concierge team.', 'success');
      } else {
        showToast(res.data?.message || 'Could not submit inquiry.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit inquiry. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
        <span className="badge badge-brass" style={{ marginBottom: '8px' }}>
          Concierge & Support
        </span>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          How May Our Desk Assist You?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          From itinerary tailoring to reservation inquiries, our hospitality concierge team is available 24 hours a day.
        </p>
      </div>

      {/* Grid: FAQs + Direct Contact Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 0.8fr)',
          gap: '3.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: FAQs */}
        <div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Frequently Answered Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    border: isOpen ? '1px solid var(--accent-brass)' : '1px solid var(--border-subtle)',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '0.98rem',
                      color: 'var(--primary-forest)',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--accent-brass)" /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 1.25rem 1.25rem 1.25rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.92rem',
                        lineHeight: '1.6',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Contact Card & Message Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Direct Concierge Box */}
          <div
            style={{
              backgroundColor: 'var(--primary-forest)',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '1rem' }}>
              Immediate Concierge Assistance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PhoneCall size={18} color="var(--accent-brass)" />
                <span>+91 1800 200 4888 (Toll-Free Helpline)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="var(--accent-brass)" />
                <span>concierge@shreehotels.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--accent-brass)" />
                <span>24 Hours Daily • 7 Days a Week</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Send Concierge Message</h3>
            {submitted ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--status-emerald)', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1.05rem' }}>
                  ✓ Your message has been received by our desk.
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  A dedicated concierge officer has been assigned to your request and will reach out via email shortly.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setSubmitted(false);
                    setInquirySubject('');
                    setInquiryMessage('');
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value)}
                    disabled={loading}
                  >
                    <option value="general">General Hospitality Inquiries</option>
                    <option value="reservation">Reservation & Dates Assistance</option>
                    <option value="payment">Payment & Invoice Support</option>
                    <option value="cancellation">Cancellation & Refund Request</option>
                    <option value="concierge">Special Requests & Dietary Preferences</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    placeholder="e.g. Airport transfer, suite arrangements"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Please describe how we can assist you..."
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send Inquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
