import { Review, Booking, Hotel } from '../models/index.js';

export const createReview = async (req, res) => {
  try {
    const {
      bookingId,
      rating,
      cleanlinessRating = 5,
      serviceRating = 5,
      locationRating = 5,
      amenitiesRating = 5,
      title,
      comment,
    } = req.body;

    if (!bookingId || rating === undefined || !comment) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, rating, and comment are required.',
      });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    if (typeof comment !== 'string' || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 10 characters long.',
      });
    }

    // Verify booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings.',
      });
    }

    // Strict eligibility: Only allow reviews on verified completed stays (checked_out status)
    if (booking.bookingStatus !== 'checked_out') {
      return res.status(400).json({
        success: false,
        message: 'Reviews are only permitted for completed, checked-out stays.',
      });
    }

    // Prevent duplicate reviews for same booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'A review has already been submitted for this stay.',
      });
    }

    const review = await Review.create({
      bookingId,
      userId: req.user._id,
      hotelId: booking.hotelId,
      rating: numRating,
      cleanlinessRating: Number(cleanlinessRating) || 5,
      serviceRating: Number(serviceRating) || 5,
      locationRating: Number(locationRating) || 5,
      amenitiesRating: Number(amenitiesRating) || 5,
      title: title?.trim() || '',
      comment: comment.trim(),
      verifiedStay: true,
    });

    await review.populate('userId', 'name avatar');

    // Recalculate hotel's average rating from real review records
    const allHotelReviews = await Review.find({ hotelId: booking.hotelId });
    const totalReviews = allHotelReviews.length;
    const sumRatings = allHotelReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(1)) : 5.0;

    await Hotel.findByIdAndUpdate(booking.hotelId, {
      $set: { averageRating: avgRating, totalReviews },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your verified stay review!',
      review,
    });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create review.' });
  }
};

export const getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const reviews = await Review.find({ hotelId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('hotelId', 'name slug address images')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch your reviews.' });
  }
};
