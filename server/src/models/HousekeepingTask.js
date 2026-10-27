import mongoose from 'mongoose';

const housekeepingTaskSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomInventory',
      default: null,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    taskType: {
      type: String,
      enum: ['daily_clean', 'checkout_clean', 'deep_clean', 'inspection', 'amenity_restock'],
      default: 'daily_clean',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const HousekeepingTask = mongoose.model('HousekeepingTask', housekeepingTaskSchema);
