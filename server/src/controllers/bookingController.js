import { Booking, RoomType, Hotel, Offer, Notification, AuditLog } from '../models/index.js';
import {
  checkRoomAvailability,
  reserveRoomInventoryAtomic,
  releaseRoomInventory,
  generateBookingReference,
} from '../utils/availability.js';
import { calculateStayPrice } from '../utils/pricing.js';

/**
 * Create a new pending reservation
 */
export const createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      numberOfRooms = 1,
      guests = { adults: 2, children: 0 },
      guestDetails,
      couponCode,
    } = req.body;

    if (!hotelId || !roomTypeId || !checkIn || !checkOut || !guestDetails?.name || !guestDetails?.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required reservation fields.',
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out date format.',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be strictly after check-in date.',
      });
    }

    // Policy: Past check-in dates rejected, same-day allowed from start of local day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (start < todayStart) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past.',
      });
    }

    // Verify hotel exists and is active
    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.active) {
      return res.status(404).json({ success: false, message: 'Hotel not found or inactive.' });
    }

    // Verify room type exists, is active, AND strictly belongs to the selected hotel!
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType || !roomType.active) {
      return res.status(404).json({ success: false, message: 'Room type not found or inactive.' });
    }

    if (roomType.hotelId.toString() !== hotel._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The selected room category does not belong to the selected hotel property.',
      });
    }

    const roomsCount = parseInt(numberOfRooms, 10);
    if (isNaN(roomsCount) || roomsCount < 1 || roomsCount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Number of rooms must be an integer between 1 and 100.',
      });
    }

    const adultsCount = parseInt(guests?.adults, 10) || 1;
    const childrenCount = parseInt(guests?.children, 10) || 0;
    if (adultsCount < 1 || childrenCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Guest count must include at least 1 adult.',
      });
    }

    // Validate max occupancy per room category
    const totalGuests = adultsCount + childrenCount;
    const maxCapacity = (roomType.maxOccupancy || 3) * roomsCount;
    if (totalGuests > maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Capacity exceeded: This room category accommodates a maximum of ${maxCapacity} guest(s) across ${roomsCount} room(s).`,
      });
    }

    // Validate Coupon if provided
    let offer = null;
    if (couponCode && couponCode.trim() !== '') {
      offer = await Offer.findOne({
        code: couponCode.trim().toUpperCase(),
        active: true,
        validUntil: { $gte: new Date() },
      });
    }

    // Recalculate authoritative price on the server
    const pricing = calculateStayPrice({
      basePricePerNight: roomType.basePricePerNight,
      checkIn: start,
      checkOut: end,
      numberOfRooms: roomsCount,
      offer,
    });

    const bookingReference = generateBookingReference();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newBooking = await Booking.create({
      bookingReference,
      userId: req.user._id,
      hotelId: hotel._id,
      roomTypeId: roomType._id,
      checkIn: start,
      checkOut: end,
      numberOfRooms: roomsCount,
      guests: { adults: adultsCount, children: childrenCount },
      guestDetails,
      priceBreakdown: pricing,
      cancellationPolicy: hotel.cancellationPolicyDefault,
      bookingStatus: 'pending_payment',
      paymentStatus: 'pending',
      invoiceNumber,
    });

    // Atomic race-safe inventory reservation hold
    const holdResult = await reserveRoomInventoryAtomic({
      roomTypeId: roomType._id,
      hotelId: hotel._id,
      bookingId: newBooking._id,
      checkIn: start,
      checkOut: end,
      requestedRooms: roomsCount,
    });

    if (!holdResult.success) {
      await Booking.findByIdAndDelete(newBooking._id);
      return res.status(holdResult.isConflict ? 409 : 400).json({
        success: false,
        message: holdResult.reason,
      });
    }

    // Populate references for client response
    await newBooking.populate([
      { path: 'hotelId', select: 'name tagline address images starRating' },
      { path: 'roomTypeId', select: 'name type photos bedType' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Pending reservation created. Please proceed to payment.',
      booking: newBooking,
    });
  } catch (err) {
    console.error('createBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
};

/**
 * Get guest bookings
 */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('hotelId', 'name slug address images starRating')
      .populate('roomTypeId', 'name type photos')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

/**
 * Get booking by reference or ID
 */
export const getBookingDetails = async (req, res) => {
  try {
    const { reference } = req.params;
    const isObjectId = reference.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId
      ? { _id: reference }
      : { bookingReference: reference.toUpperCase() };

    const booking = await Booking.findOne(query)
      .populate('hotelId', 'name slug address phone images starRating cancellationPolicyDefault')
      .populate('roomTypeId', 'name type photos amenities bedType')
      .populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Authorization check: User can view their own booking, or Staff of the hotel, or Admin
    const isOwner = req.user._id.toString() === booking.userId._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedStaff =
      req.user.role === 'staff' &&
      req.user.assignedHotelId &&
      req.user.assignedHotelId.toString() === booking.hotelId._id.toString();

    if (!isOwner && !isAdmin && !isAssignedStaff) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking.' });
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by guest' } = req.body;

    const booking = await Booking.findById(id).populate('hotelId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Check ownership or admin
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Check if cancellation is allowed
    if (['checked_in', 'checked_out', 'cancelled'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.bookingStatus}`,
      });
    }

    // Calculate refund according to cancellation policy:
    // If cancelled >= 48 hours before checkIn: 100% refund
    // If < 48 hours: 1 night fee deducted
    const now = new Date();
    const checkInTime = new Date(booking.checkIn);
    const hoursToCheckIn = (checkInTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    if (booking.paymentStatus === 'captured') {
      if (hoursToCheckIn >= 48) {
        refundAmount = booking.priceBreakdown.finalAmount;
      } else {
        const oneNightRate = booking.priceBreakdown.basePricePerNight;
        refundAmount = Math.max(0, booking.priceBreakdown.finalAmount - oneNightRate);
      }
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.refundAmount = refundAmount;
    if (refundAmount > 0) {
      booking.paymentStatus = 'refund_pending';
    }
    await booking.save();

    // Immediately release inventory allocations so other guests can reserve
    await releaseRoomInventory(booking._id);

    // Create Notification
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your reservation ${booking.bookingReference} has been cancelled. Eligible refund: ₹${refundAmount.toLocaleString('en-IN')}`,
      type: 'booking',
      link: `/booking/${booking.bookingReference}`,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: {
        bookingReference: booking.bookingReference,
        refundAmount,
        reason,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking,
      refundAmount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
};
