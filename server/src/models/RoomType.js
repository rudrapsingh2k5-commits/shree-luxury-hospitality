import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'executive', 'presidential', 'villa', 'cottage', 'tent'],
      default: 'deluxe',
    },
    description: {
      type: String,
      default: '',
    },
    basePricePerNight: {
      type: Number,
      required: [true, 'Base price per night is required'],
      min: [0, 'Price must be positive'],
    },
    capacityAdults: {
      type: Number,
      default: 2,
      min: 1,
    },
    capacityChildren: {
      type: Number,
      default: 1,
      min: 0,
    },
    maxOccupancy: {
      type: Number,
      default: 3,
      min: 1,
    },
    totalRoomsCount: {
      type: Number,
      default: 6,
      min: 1,
    },
    bedType: {
      type: String,
      default: 'King Bed',
    },
    roomSizeSqFt: {
      type: Number,
      default: 450,
    },
    amenities: {
      type: [String],
      default: [
        'Complimentary Wi-Fi',
        'Heritage Garden View',
        'Marble Bathroom',
        'Rain Shower',
        'Espresso Machine',
        '24/7 Butler Service',
      ],
    },
    photos: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

roomTypeSchema.index({ hotelId: 1, active: 1, basePricePerNight: 1 });

export const RoomType = mongoose.model('RoomType', roomTypeSchema);
