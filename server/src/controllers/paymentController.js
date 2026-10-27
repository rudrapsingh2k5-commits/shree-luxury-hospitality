import crypto from 'crypto';
import { Booking, Payment, Notification, AuditLog } from '../models/index.js';
import {
  stripeInstance,
  isStripeLive,
  getPublishableKey,
  createPaymentIntent as stripeCreateIntent,
  constructWebhookEvent,
  createStripeRefund,
} from '../config/stripe.js';
import { convertInrToGbp, getExchangeRate, formatInr, formatGbp } from '../utils/currency.js';
import { confirmRoomInventory, releaseRoomInventory } from '../utils/availability.js';

/**
 * Get Stripe public configuration & current exchange rate
 * GET /api/payments/config
 */
export const getPaymentConfig = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      publishableKey: getPublishableKey(),
      isLiveGateway: isStripeLive,
      exchangeRate: getExchangeRate(),
      baseCurrency: 'INR',
      paymentCurrency: 'GBP',
      currencySymbol: '£',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment configuration.' });
  }
};

/**
 * Create Stripe PaymentIntent in British Pounds (£ / GBP)
 * Converts INR website price to GBP before sending to Stripe
 * POST /api/payments/create-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId).populate('hotelId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ownership check: only booking owner or admin can initiate payment
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    if (
      booking.bookingStatus === 'confirmed' ||
      ['succeeded', 'captured'].includes(booking.paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: 'This reservation is already confirmed and paid.',
      });
    }

    if (['cancelled', 'expired', 'checked_out'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate payment for booking with status '${booking.bookingStatus}'.`,
      });
    }

    const amountInr = booking.priceBreakdown?.finalAmount || 0;
    if (amountInr <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    // Convert Indian Rupee website price to British Pounds (£) for Stripe Gateway
    const conversion = convertInrToGbp(amountInr);
    const { amountGbp, gbpPence, exchangeRate } = conversion;

    // Reuse existing PaymentIntent if already created and still pending
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'requires_payment_method') {
      const existingPayment = await Payment.findOne({
        stripePaymentIntentId: booking.stripePaymentIntentId,
      });

      if (existingPayment && existingPayment.stripeClientSecret) {
        return res.status(200).json({
          success: true,
          clientSecret: existingPayment.stripeClientSecret,
          paymentIntentId: booking.stripePaymentIntentId,
          amountInr,
          amountGbp,
          gbpPence,
          exchangeRate,
          currency: 'gbp',
          currencySymbol: '£',
          bookingReference: booking.bookingReference,
          hotelName: booking.hotelId?.name,
          publishableKey: getPublishableKey(),
          isLiveGateway: isStripeLive,
          // Backwards compatibility alias for order object
          order: {
            id: booking.stripePaymentIntentId,
            amount: gbpPence,
            amountInr,
            amountGbp,
            currency: 'GBP',
            bookingReference: booking.bookingReference,
            hotelName: booking.hotelId?.name,
          },
        });
      }
    }

    // Create PaymentIntent via Stripe SDK (or sandbox fallback)
    const paymentIntent = await stripeCreateIntent({
      amountPence: gbpPence,
      bookingReference: booking.bookingReference,
      hotelName: booking.hotelId?.name,
      guestEmail: booking.guestDetails?.email,
      metadata: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        hotelId: booking.hotelId?._id?.toString() || '',
        guestId: booking.userId.toString(),
        amountInr: amountInr.toString(),
        amountGbp: amountGbp.toString(),
        exchangeRate: exchangeRate.toString(),
      },
    });

    // Create or update Payment record
    let payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      payment = new Payment({
        bookingId: booking._id,
        userId: booking.userId,
        amountInr,
        amountGbp,
        amountGbpPence: gbpPence,
        exchangeRate,
        currency: 'gbp',
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret || '',
        status: 'requires_payment_method',
      });
    } else {
      payment.amountInr = amountInr;
      payment.amountGbp = amountGbp;
      payment.amountGbpPence = gbpPence;
      payment.exchangeRate = exchangeRate;
      payment.stripePaymentIntentId = paymentIntent.id;
      payment.stripeClientSecret = paymentIntent.client_secret || '';
      payment.status = 'requires_payment_method';
    }
    await payment.save();

    // Update Booking with Stripe tracking
    booking.stripePaymentIntentId = paymentIntent.id;
    booking.amountGbp = amountGbp;
    booking.exchangeRate = exchangeRate;
    booking.paymentStatus = 'requires_payment_method';
    booking.paymentId = payment._id;
    await booking.save();

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountInr,
      amountGbp,
      gbpPence,
      exchangeRate,
      currency: 'gbp',
      currencySymbol: '£',
      bookingReference: booking.bookingReference,
      hotelName: booking.hotelId?.name,
      publishableKey: getPublishableKey(),
      isLiveGateway: isStripeLive,
      // Backwards compatibility alias for order
      order: {
        id: paymentIntent.id,
        amount: gbpPence,
        amountInr,
        amountGbp,
        currency: 'GBP',
        bookingReference: booking.bookingReference,
        hotelName: booking.hotelId?.name,
      },
    });
  } catch (err) {
    console.error('createPaymentIntent error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create Stripe payment intent.',
    });
  }
};

/**
 * Confirm / Verify Stripe Payment
 * POST /api/payments/confirm (or /api/payments/verify)
 */
export const confirmPayment = async (req, res) => {
  try {
    const {
      bookingId,
      paymentIntentId,
      // For compatibility if client sent razorpay fields
      razorpay_order_id,
      paymentMethod = 'card',
      isSimulated = false,
    } = req.body;

    const targetIntentId = paymentIntentId || razorpay_order_id;

    if (!bookingId || !targetIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required bookingId or paymentIntentId.',
      });
    }

    const booking = await Booking.findById(bookingId).populate('hotelId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Ownership check: only booking owner or admin can verify payment
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    // Idempotency check: if already confirmed and captured, return success immediately
    if (
      booking.bookingStatus === 'confirmed' &&
      ['succeeded', 'captured'].includes(booking.paymentStatus)
    ) {
      const existingPayment = await Payment.findOne({
        bookingId: booking._id,
        status: { $in: ['succeeded', 'captured'] },
      });
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and reservation confirmed.',
        booking,
        payment: existingPayment,
      });
    }

    // Booking state check
    if (['cancelled', 'expired'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot verify payment for a reservation with status '${booking.bookingStatus}'.`,
      });
    }

    // Check payment intent matches booking record
    if (
      booking.stripePaymentIntentId &&
      booking.stripePaymentIntentId !== targetIntentId &&
      booking.razorpayOrderId !== targetIntentId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Payment Intent mismatch with booking record.',
      });
    }

    // If Stripe is live, verify with Stripe API
    let paymentVerified = false;
    let paymentMethodDetails = paymentMethod;

    if (isStripeLive && stripeInstance && !targetIntentId.startsWith('pi_sim_') && !isSimulated) {
      try {
        let stripeIntent = await stripeInstance.paymentIntents.retrieve(targetIntentId);

        // If the payment intent is awaiting payment method or confirmation, confirm it with Stripe
        if (['requires_payment_method', 'requires_confirmation'].includes(stripeIntent.status)) {
          const pmToUse = req.body.paymentMethodId || 'pm_card_visa';
          try {
            stripeIntent = await stripeInstance.paymentIntents.confirm(targetIntentId, {
              payment_method: pmToUse,
            });
          } catch (confirmErr) {
            console.warn('[Stripe] Intent confirm attempt notice:', confirmErr.message);
          }
        }

        if (stripeIntent.status === 'succeeded') {
          paymentVerified = true;
          paymentMethodDetails = stripeIntent.payment_method_types?.[0] || 'card';
        } else {
          return res.status(400).json({
            success: false,
            message: `Stripe payment has status '${stripeIntent.status}'. Payment not completed.`,
          });
        }
      } catch (stripeErr) {
        console.error('Stripe retrieve error:', stripeErr);
        return res.status(400).json({
          success: false,
          message: `Stripe verification failed: ${stripeErr.message}`,
        });
      }
    } else {
      // Sandbox / Test Simulator mode: confirm simulated payment
      paymentVerified = true;
    }

    if (!paymentVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment could not be verified.',
      });
    }

    // Find or create Payment record
    let payment = await Payment.findOne({
      $or: [{ stripePaymentIntentId: targetIntentId }, { bookingId: booking._id }],
    });

    const conversion = convertInrToGbp(booking.priceBreakdown?.finalAmount || 0);

    if (!payment) {
      payment = new Payment({
        bookingId: booking._id,
        userId: booking.userId,
        amountInr: conversion.amountInr,
        amountGbp: conversion.amountGbp,
        amountGbpPence: conversion.gbpPence,
        exchangeRate: conversion.exchangeRate,
        currency: 'gbp',
        stripePaymentIntentId: targetIntentId,
        status: 'succeeded',
        paymentMethod: paymentMethodDetails,
      });
    } else {
      payment.status = 'succeeded';
      payment.paymentMethod = paymentMethodDetails;
      payment.amountInr = conversion.amountInr;
      payment.amountGbp = conversion.amountGbp;
      payment.amountGbpPence = conversion.gbpPence;
      payment.exchangeRate = conversion.exchangeRate;
    }
    await payment.save();

    // Atomic Booking Confirmation
    booking.bookingStatus = 'confirmed';
    booking.paymentStatus = 'succeeded';
    booking.paymentId = payment._id;
    booking.stripePaymentIntentId = targetIntentId;
    booking.amountGbp = conversion.amountGbp;
    booking.exchangeRate = conversion.exchangeRate;
    await booking.save();

    // Confirm inventory allocations
    await confirmRoomInventory(booking._id);

    // Create In-App Notification
    await Notification.create({
      userId: booking.userId,
      title: 'Reservation Confirmed',
      message: `Your stay at ${booking.hotelId?.name || 'SHREE श्री'} is confirmed! Reference: ${booking.bookingReference} (Billed: £${conversion.amountGbp.toFixed(2)} GBP)`,
      type: 'booking',
      link: `/booking/${booking.bookingReference}`,
    });

    // Security Audit Log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'STRIPE_PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      details: {
        bookingReference: booking.bookingReference,
        paymentIntentId: targetIntentId,
        amountInr: conversion.amountInr,
        amountGbp: conversion.amountGbp,
        currency: 'gbp',
        exchangeRate: conversion.exchangeRate,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Payment of £${conversion.amountGbp.toFixed(2)} GBP (₹${conversion.amountInr.toLocaleString('en-IN')}) verified. Reservation confirmed!`,
      booking,
      payment,
    });
  } catch (err) {
    console.error('confirmPayment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment confirmation.',
    });
  }
};

/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    let event;
    try {
      event = constructWebhookEvent(rawBody, signature);
    } catch (err) {
      console.error(`[Stripe Webhook] Verification error: ${err.message}`);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const intentId = intent.id;
      const bookingId = intent.metadata?.bookingId;

      let booking = null;
      if (bookingId) {
        booking = await Booking.findById(bookingId);
      }
      if (!booking) {
        booking = await Booking.findOne({ stripePaymentIntentId: intentId });
      }

      if (!booking) {
        console.warn(`[Stripe Webhook] No booking found for PaymentIntent: ${intentId}`);
        return res.status(200).json({ status: 'ignored', message: 'No matching booking found' });
      }

      // CRITICAL: Never uncancel a cancelled booking through late webhook!
      if (booking.bookingStatus === 'cancelled') {
        await AuditLog.create({
          userId: booking.userId,
          userRole: 'system',
          action: 'LATE_WEBHOOK_ON_CANCELLED_BOOKING',
          entityType: 'Booking',
          entityId: booking._id.toString(),
          details: {
            paymentIntentId: intentId,
            message: 'Webhook received for already cancelled booking. Booking remains cancelled.',
          },
          ipAddress: req.ip,
        });
        return res.status(200).json({ status: 'ignored', message: 'Booking is cancelled' });
      }

      if (booking.bookingStatus !== 'confirmed') {
        booking.bookingStatus = 'confirmed';
        booking.paymentStatus = 'succeeded';
        booking.stripePaymentIntentId = intentId;
        await booking.save();

        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: intentId },
          {
            $set: {
              status: 'succeeded',
              stripePaymentIntentId: intentId,
            },
            $push: { rawWebhookPayloads: { event: event.type, payload: intent } },
          },
          { upsert: true }
        );

        // Confirm inventory hold
        await confirmRoomInventory(booking._id);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const bookingId = intent.metadata?.bookingId;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          $set: {
            status: 'failed',
            failureReason: intent.last_payment_error?.message || 'Payment failed',
          },
          $push: { rawWebhookPayloads: { event: event.type, payload: intent } },
        }
      );

      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('handleWebhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Process Refund via Stripe in British Pounds (£)
 * POST /api/payments/refund
 */
export const processRefund = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role & property authorization: Admin or Staff assigned to this hotel
    if (req.user.role !== 'admin') {
      if (
        req.user.role !== 'staff' ||
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== booking.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to process refunds for this property.',
        });
      }
    }

    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'A refund has already been fully processed for this booking.',
      });
    }

    if (booking.bookingStatus !== 'cancelled' && booking.paymentStatus !== 'refund_pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not eligible for refund processing.',
      });
    }

    // Authoritative server-calculated refund amount in INR
    const refundAmountInr = booking.refundAmount;
    if (!refundAmountInr || refundAmountInr <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible refund amount calculated for this booking under current policy.',
      });
    }

    const maxCapturableInr = booking.priceBreakdown?.finalAmount || 0;
    if (refundAmountInr > maxCapturableInr) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed the total captured payment amount.',
      });
    }

    // Convert refund to GBP
    const conversion = convertInrToGbp(refundAmountInr, booking.exchangeRate);
    const { amountGbp, gbpPence } = conversion;

    const refund = await createStripeRefund({
      paymentIntentId: booking.stripePaymentIntentId || '',
      amountPence: gbpPence,
      reason: `Guest refund for ${booking.bookingReference}`,
    });

    booking.paymentStatus = 'refunded';
    await booking.save();

    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          refundId: refund.id,
          refundAmountInr,
          refundAmountGbp: amountGbp,
          refundStatus: 'processed',
          status: 'refunded',
        },
      }
    );

    // Release any lingering inventory
    await releaseRoomInventory(booking._id);

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'STRIPE_REFUND_PROCESSED',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: {
        bookingReference: booking.bookingReference,
        refundId: refund.id,
        refundAmountInr,
        refundAmountGbp: amountGbp,
        currency: 'gbp',
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Refund of £${amountGbp.toFixed(2)} GBP (₹${refundAmountInr.toLocaleString('en-IN')}) processed successfully.`,
      refundId: refund.id,
      refundAmountInr,
      refundAmountGbp: amountGbp,
      currency: 'gbp',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get payment status
 * GET /api/payments/:paymentId/status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('bookingId');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Access authorization: Owner, assigned staff, or Admin
    const isOwner = payment.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedStaff =
      req.user.role === 'staff' &&
      req.user.assignedHotelId &&
      payment.bookingId?.hotelId &&
      req.user.assignedHotelId.toString() === payment.bookingId.hotelId.toString();

    if (!isOwner && !isAdmin && !isAssignedStaff) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, payment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment.' });
  }
};

// Aliases for compatibility
export const createPaymentOrder = createPaymentIntent;
export const verifyPayment = confirmPayment;
export const getSimulatorSignature = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Stripe uses clientSecret confirmation.',
  });
};
