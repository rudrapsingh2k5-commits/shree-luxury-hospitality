import dotenv from 'dotenv';
dotenv.config();

import Stripe from 'stripe';
import crypto from 'crypto';

const secretKey = process.env.STRIPE_SECRET_KEY || '';
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const isStripeLive = Boolean(
  secretKey &&
    !secretKey.includes('YOUR_') &&
    !secretKey.includes('sample_') &&
    !secretKey.includes('placeholder')
);

export let stripeInstance = null;

if (isStripeLive) {
  try {
    stripeInstance = new Stripe(secretKey);
    console.log('[Stripe] Live/Test Stripe gateway credentials initialized.');
  } catch (err) {
    console.warn('[Stripe] Initialization warning:', err.message);
  }
} else {
  console.log(
    '[Stripe] Running in Sandbox/Evaluation Simulator mode. (Configure STRIPE_SECRET_KEY & STRIPE_PUBLISHABLE_KEY in .env to activate live processing)'
  );
}

/**
 * Check if Stripe is configured with real API keys
 */
export const isConfigured = () => isStripeLive && stripeInstance !== null;

/**
 * Get Stripe publishable key for client initialization
 */
export const getPublishableKey = () => {
  return isStripeLive ? publishableKey : (process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_shree_sandbox');
};

/**
 * Create a Stripe PaymentIntent in British Pounds (GBP)
 * @param {Object} params
 * @param {number} params.amountPence - Amount in GBP pence (e.g. £10.00 = 1000 pence)
 * @param {string} params.bookingReference - Unique reservation reference
 * @param {string} params.hotelName - Property name
 * @param {string} params.guestEmail - Guest email
 * @param {Object} params.metadata - Metadata including INR amounts and exchange rates
 */
export const createPaymentIntent = async ({
  amountPence,
  bookingReference,
  hotelName,
  guestEmail,
  metadata = {},
}) => {
  if (isStripeLive && stripeInstance) {
    return await stripeInstance.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      receipt_email: guestEmail || undefined,
      description: `SHREE Reservation ${bookingReference} - ${hotelName || 'Luxury Stay'}`,
      metadata: {
        bookingReference,
        hotelName: hotelName || 'SHREE Stay',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
  }

  // Sandbox / Test Simulator Mode
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const simPaymentIntentId = `pi_sim_${Date.now()}_${randomSuffix}`;
  const simClientSecret = `${simPaymentIntentId}_secret_${crypto.randomBytes(8).toString('hex')}`;

  return {
    id: simPaymentIntentId,
    client_secret: simClientSecret,
    amount: amountPence,
    currency: 'gbp',
    status: 'requires_payment_method',
    metadata: {
      bookingReference,
      hotelName: hotelName || 'SHREE Stay',
      ...metadata,
      isSimulated: true,
    },
  };
};

/**
 * Verify / Construct Stripe Webhook Event
 * @param {string|Buffer} rawBody
 * @param {string} signature - Stripe signature header ('stripe-signature')
 */
export const constructWebhookEvent = (rawBody, signature) => {
  if (isStripeLive && stripeInstance && webhookSecret) {
    return stripeInstance.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  // In sandbox / test mode without configured webhook secret, parse rawBody safely
  if (typeof rawBody === 'string') {
    return JSON.parse(rawBody);
  }
  return JSON.parse(rawBody.toString('utf8'));
};

/**
 * Process a refund through Stripe
 * @param {Object} params
 * @param {string} params.paymentIntentId - Stripe Payment Intent ID
 * @param {number} params.amountPence - Amount in GBP pence
 * @param {string} params.reason - Refund reason
 */
export const createStripeRefund = async ({ paymentIntentId, amountPence, reason = '' }) => {
  if (isStripeLive && stripeInstance && !paymentIntentId.startsWith('pi_sim_')) {
    return await stripeInstance.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountPence,
      reason: 'requested_by_customer',
      metadata: { reason },
    });
  }

  // Sandbox refund fallback
  return {
    id: `re_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    amount: amountPence,
    currency: 'gbp',
    status: 'succeeded',
    payment_intent: paymentIntentId,
  };
};
