import mongoose from 'mongoose';

const roomInventorySchema = new mongoose.Schema(
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
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'dirty', 'maintenance'],
      default: 'available',
      index: true,
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    assignedGuestName: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roomInventorySchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export const RoomInventory = mongoose.model('RoomInventory', roomInventorySchema);
