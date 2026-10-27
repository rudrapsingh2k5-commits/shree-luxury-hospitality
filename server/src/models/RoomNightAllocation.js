import mongoose from 'mongoose';

const roomNightAllocationSchema = new mongoose.Schema(
  {
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
    date: {
      type: String, // 'YYYY-MM-DD' formatted calendar date
      required: true,
      index: true,
    },
    slot: {
      type: Number, // Integer 1..totalRoomsCount
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['held', 'confirmed'],
      default: 'held',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Unique compound index enforces strictly race-safe slot reservation at the database engine level
roomNightAllocationSchema.index({ roomTypeId: 1, date: 1, slot: 1 }, { unique: true });

export const RoomNightAllocation = mongoose.model('RoomNightAllocation', roomNightAllocationSchema);
