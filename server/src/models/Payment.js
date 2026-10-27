import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Indian Currency (Original Catalog & Invoice Price)
    amountInr: {
      type: Number,
      required: true,
    },
    // British Currency (Charged by Stripe Gateway)
    amountGbp: {
      type: Number,
      required: true,
    },
    amountGbpPence: {
      type: Number,
      required: true,
    },
    exchangeRate: {
      type: Number,
      required: true,
      default: 105.0,
    },
    currency: {
      type: String,
      default: 'gbp',
      lowercase: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      index: true,
    },
    stripeClientSecret: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'created',
        'requires_payment_method',
        'requires_confirmation',
        'processing',
        'succeeded',
        'captured', // alias for succeeded for compatibility
        'failed',
        'refund_pending',
        'partially_refunded',
        'refunded',
        'canceled',
      ],
      default: 'created',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    failureReason: {
      type: String,
      default: '',
    },
    refundId: {
      type: String,
      default: '',
    },
    refundAmountInr: {
      type: Number,
      default: 0,
    },
    refundAmountGbp: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      default: '',
    },
    rawWebhookPayloads: [
      {
        receivedAt: { type: Date, default: Date.now },
        event: { type: String },
        payload: { type: Object },
      },
    ],
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
