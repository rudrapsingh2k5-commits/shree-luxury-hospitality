import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      postalCode: { type: String, default: '' },
    },
    locationCoordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
      index: true,
    },
    propertyType: {
      type: String,
      enum: ['palace', 'boutique', 'resort', 'heritage', 'business', 'villa', 'haveli', 'camp', 'lodge', 'mansion', 'hotel'],
      default: 'boutique',
      index: true,
    },
    amenities: {
      type: [String],
      default: [
        'High-Speed Wi-Fi',
        'Swimming Pool',
        'Spa & Wellness',
        'Fine Dining Restaurant',
        'Concierge Service',
        'Valet Parking',
        'Air Conditioning',
      ],
      index: true,
    },
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    checkInTime: {
      type: String,
      default: '14:00',
    },
    checkOutTime: {
      type: String,
      default: '11:00',
    },
    cancellationPolicyDefault: {
      type: String,
      default:
        'Free cancellation up to 48 hours prior to check-in. Cancellations within 48 hours will incur a 1-night charge.',
    },
    managerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

hotelSchema.index({ 'address.city': 1, starRating: -1, averageRating: -1 });

export const Hotel = mongoose.model('Hotel', hotelSchema);
