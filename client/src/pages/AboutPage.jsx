import React from 'react';
import { ShieldCheck, Award, Sparkles, HeartHandshake, Compass, Users } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div style={{ paddingTop: '3.5rem', paddingBottom: '5.5rem' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span
            className="badge badge-brass"
            style={{ marginBottom: '10px', padding: '6px 16px', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} color="var(--accent-brass, #C59B27)" />
            The SHREE श्री Philosophy
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
              marginBottom: '1.25rem',
              color: 'var(--primary-forest-dark, #102119)',
            }}
          >
            Prosperity, Auspiciousness & Grand Stays
          </h1>
          <p
            style={{
              fontSize: '1.18rem',
              color: 'var(--text-muted, #5F6762)',
              lineHeight: '1.8',
              maxWidth: '750px',
              margin: '0 auto',
            }}
          >
            In ancient Indian philosophy, <strong>श्री (Shree)</strong> embodies sacred prosperity, grace, and auspicious beginnings. <strong>SHREE श्री</strong> was conceived as an antidote to generic mass booking aggregators—curating authentic Indian architectural sanctuaries where every stay feels grand.
          </p>
        </div>

        {/* Narrative Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card jharokha-card" style={{ padding: '2.75rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '1rem', color: 'var(--primary-maroon, #6E1A24)' }}>
              1. The Curatorial Standard
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Rather than aggregating thousands of indistinguishable commercial rooms, SHREE श्री handpicks properties that exhibit distinct regional soul: 18th-century Rajputana palaces on Lake Pichola, sun-drenched Portuguese beachside havelis in Sinquerim, and colonial tea sanctuaries in Munnar at 5,400 feet.
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Each property undergoes an in-person audit examining structural heritage preservation, courtyard tranquility, culinary authenticity, and personal butler service attentiveness.
            </p>
          </div>

          <div className="card jharokha-card" style={{ padding: '2.75rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '1rem', color: 'var(--primary-maroon, #6E1A24)' }}>
              2. Technological & Financial Rigor
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '1rem' }}>
              Hospitality is fundamentally built on trust. SHREE श्री is architected with a production MERN foundation:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
              <li>
                <strong>Atomic Inventory Protection:</strong> Eliminates double-bookings by verifying date overlaps mathematically against MongoDB unique slot indexes during reservation creation.
              </li>
              <li>
                <strong>Stripe Global Payment Gateway:</strong> Uses Stripe PaymentIntents with automated INR-to-GBP (£) currency conversion and end-to-end cryptographic webhook verification to ensure 100% financial security.
              </li>
              <li>
                <strong>Property-Level Isolation:</strong> Staff permissions are strictly bounded to their assigned property, protecting private guest folios and operational data.
              </li>
              <li>
                <strong>Transparent Taxation:</strong> Statutory 18% GST is explicitly itemized, with zero hidden platform markups.
              </li>
            </ul>
          </div>

          <div className="card jharokha-card" style={{ padding: '2.75rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '1rem', color: 'var(--primary-maroon, #6E1A24)' }}>
              3. The Viva & Academic Foundation
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
              Engineered with clean architectural separation across controllers, models, and service abstractions, SHREE श्री demonstrates full-stack software development in Node.js, Express, MongoDB, and React with Vite. Every API route, model relationship, and verification workflow is built to be inspected, understood, and defended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
