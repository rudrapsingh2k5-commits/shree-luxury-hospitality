import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
      index: true,
    },
    checkOut: {
      type: Date,
      required: true,
      index: true,
    },
    numberOfRooms: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    guests: {
      adults: { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    guestDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      specialRequests: { type: String, default: '' },
    },
    priceBreakdown: {
      basePricePerNight: { type: Number, required: true },
      nights: { type: Number, required: true },
      roomsCount: { type: Number, required: true },
      totalBaseCharge: { type: Number, required: true },
      taxPercent: { type: Number, default: 12 },
      taxAmount: { type: Number, required: true },
      serviceFee: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      finalAmount: { type: Number, required: true }, // In INR Rupees
    },
    cancellationPolicy: {
      type: String,
      default: 'Free cancellation up to 48 hours prior to check-in.',
    },
    bookingStatus: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'created',
        'pending',
        'requires_payment_method',
        'requires_confirmation',
        'processing',
        'succeeded',
        'captured',
        'failed',
        'refund_pending',
        'partially_refunded',
        'refunded',
      ],
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      default: '',
      index: true,
    },
    amountGbp: {
      type: Number,
      default: 0,
    },
    exchangeRate: {
      type: Number,
      default: 105.0,
    },
    // Legacy payment gateway compatibility fields
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    assignedRooms: {
      type: [String],
      default: [],
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1, bookingStatus: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
