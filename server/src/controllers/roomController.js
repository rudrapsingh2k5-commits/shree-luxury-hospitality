import { RoomType, Hotel, Offer } from '../models/index.js';
import { checkRoomAvailability } from '../utils/availability.js';
import { calculateStayPrice } from '../utils/pricing.js';

export const getRoomTypesByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const roomTypes = await RoomType.find({ hotelId, active: true }).sort({
      basePricePerNight: 1,
    });
    return res.status(200).json({ success: true, roomTypes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch rooms.' });
  }
};

/**
 * Check real-time date availability & generate price quote
 */
export const quoteRoomStay = async (req, res) => {
  try {
    const { roomTypeId } = req.params;
    const { checkIn, checkOut, numberOfRooms = 1, couponCode } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Both checkIn and checkOut dates are required.',
      });
    }

    const roomType = await RoomType.findById(roomTypeId).populate('hotelId');
    if (!roomType || !roomType.active) {
      return res.status(404).json({ success: false, message: 'Room type not found or inactive.' });
    }

    const roomsCount = Math.max(1, parseInt(numberOfRooms, 10));

    // Availability validation
    const availability = await checkRoomAvailability(
      roomTypeId,
      checkIn,
      checkOut,
      roomsCount
    );

    // Coupon check
    let offer = null;
    if (couponCode && couponCode.trim() !== '') {
      offer = await Offer.findOne({
        code: couponCode.trim().toUpperCase(),
        active: true,
        validUntil: { $gte: new Date() },
      });
    }

    // Pricing calculation
    const pricing = calculateStayPrice({
      basePricePerNight: roomType.basePricePerNight,
      checkIn,
      checkOut,
      numberOfRooms: roomsCount,
      offer,
    });

    return res.status(200).json({
      success: true,
      roomType: {
        _id: roomType._id,
        name: roomType.name,
        type: roomType.type,
        hotelName: roomType.hotelId?.name,
        basePricePerNight: roomType.basePricePerNight,
        maxOccupancy: roomType.maxOccupancy,
      },
      availability,
      pricing,
    });
  } catch (err) {
    console.error('quoteRoomStay error:', err);
    return res.status(500).json({ success: false, message: 'Failed to quote stay.' });
  }
};

// Admin create room type
export const createRoomType = async (req, res) => {
  try {
    const newRoomType = await RoomType.create(req.body);
    return res.status(201).json({ success: true, roomType: newRoomType });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Admin update room type
export const updateRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await RoomType.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    return res.status(200).json({ success: true, roomType: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
