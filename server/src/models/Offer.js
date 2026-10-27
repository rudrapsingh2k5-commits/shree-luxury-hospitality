import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    maxDiscountAmount: {
      type: Number,
      default: 5000, // In INR
    },
    minBookingAmount: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months default
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Offer = mongoose.model('Offer', offerSchema);
