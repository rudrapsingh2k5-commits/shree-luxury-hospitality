import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // Only one review per completed booking
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    cleanlinessRating: { type: Number, min: 1, max: 5, default: 5 },
    serviceRating: { type: Number, min: 1, max: 5, default: 5 },
    locationRating: { type: Number, min: 1, max: 5, default: 5 },
    amenitiesRating: { type: Number, min: 1, max: 5, default: 5 },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: 10,
    },
    verifiedStay: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// After saving a review, recalculate the Hotel's average rating & review count
reviewSchema.post('save', async function () {
  try {
    const hotelId = this.hotelId;
    const HotelModel = mongoose.model('Hotel');
    const stats = await mongoose.model('Review').aggregate([
      { $match: { hotelId } },
      {
        $group: {
          _id: '$hotelId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await HotelModel.findByIdAndUpdate(hotelId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }
  } catch (err) {
    console.error('Error updating hotel rating stats:', err);
  }
});

export const Review = mongoose.model('Review', reviewSchema);
