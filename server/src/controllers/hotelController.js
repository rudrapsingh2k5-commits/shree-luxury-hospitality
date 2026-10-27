import { Hotel, RoomType, Review, Booking } from '../models/index.js';

export const getHotels = async (req, res) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      rooms = 1,
      minPrice,
      maxPrice,
      starRating,
      propertyType,
      minRating,
      amenities,
      sortBy = 'recommended',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { active: true };

    // Destination search (City, Hotel Name, State, Street)
    if (destination && destination.trim() !== '') {
      const searchRegex = new RegExp(destination.trim(), 'i');
      query.$or = [
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
        { name: searchRegex },
        { tagline: searchRegex },
      ];
    }

    // Star rating filter
    if (starRating) {
      const stars = Array.isArray(starRating)
        ? starRating.map(Number)
        : starRating.split(',').map(Number);
      query.starRating = { $in: stars };
    }

    // Property type filter
    if (propertyType) {
      const types = Array.isArray(propertyType)
        ? propertyType
        : propertyType.split(',');
      query.propertyType = { $in: types };
    }

    // Guest rating filter (e.g. 4.0+)
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // Amenities filter (must contain all selected amenities)
    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(',');
      query.amenities = { $all: amenityList };
    }

    // Sorting definition
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        // We will sort hotels by lowest base price of their room types below
        break;
      case 'price_high':
        break;
      case 'rating':
        sortOptions = { averageRating: -1, totalReviews: -1 };
        break;
      case 'stars':
        sortOptions = { starRating: -1 };
        break;
      case 'recommended':
      default:
        sortOptions = { featured: -1, averageRating: -1, starRating: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Fetch hotels matching base criteria
    let hotels = await Hotel.find(query).sort(sortOptions);

    // Attach lowest price & room types to each hotel
    const hotelIds = hotels.map((h) => h._id);
    const roomTypes = await RoomType.find({
      hotelId: { $in: hotelIds },
      active: true,
    });

    const hotelRoomMap = {};
    roomTypes.forEach((rt) => {
      const idStr = rt.hotelId.toString();
      if (!hotelRoomMap[idStr]) {
        hotelRoomMap[idStr] = [];
      }
      hotelRoomMap[idStr].push(rt);
    });

    // Check date availability if checkIn & checkOut provided
    let results = [];
    const guestsTotal = Number(adults) + Number(children);
    const requiredRooms = Number(rooms);

    for (const hotel of hotels) {
      const roomsForHotel = hotelRoomMap[hotel._id.toString()] || [];
      if (roomsForHotel.length === 0) continue;

      // Find lowest price among active rooms
      let minRoomPrice = Math.min(
        ...roomsForHotel.map((r) => r.basePricePerNight)
      );

      // Price filter check
      if (minPrice && minRoomPrice < Number(minPrice)) continue;
      if (maxPrice && minRoomPrice > Number(maxPrice)) continue;

      // Filter by capacity: hotel must have at least one room type capable of requested guests per room
      const eligibleRooms = roomsForHotel.filter(
        (r) => r.maxOccupancy >= Math.ceil(guestsTotal / requiredRooms)
      );
      if (eligibleRooms.length === 0) continue;

      // Date availability check if dates given
      let isAvailable = true;
      if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);

        // Check if ANY eligible room type has enough rooms
        let hasAnyAvailableRoomType = false;
        for (const rt of eligibleRooms) {
          const overlapping = await Booking.find({
            roomTypeId: rt._id,
            bookingStatus: {
              $in: ['confirmed', 'checked_in', 'pending_payment'],
            },
            checkIn: { $lt: end },
            checkOut: { $gt: start },
          });

          const booked = overlapping.reduce(
            (sum, b) => sum + (b.numberOfRooms || 1),
            0
          );
          if (rt.totalRoomsCount - booked >= requiredRooms) {
            hasAnyAvailableRoomType = true;
            break;
          }
        }
        if (!hasAnyAvailableRoomType) {
          isAvailable = false;
        }
      }

      if (isAvailable) {
        results.push({
          ...hotel.toObject(),
          startingPrice: minRoomPrice,
          availableRoomTypesCount: eligibleRooms.length,
        });
      }
    }

    // Sort by price if requested
    if (sortBy === 'price_low') {
      results.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_high') {
      results.sort((a, b) => b.startingPrice - a.startingPrice);
    }

    const totalResults = results.length;
    const paginatedHotels = results.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      count: paginatedHotels.length,
      total: totalResults,
      page: pageNum,
      totalPages: Math.ceil(totalResults / limitNum) || 1,
      hotels: paginatedHotels,
    });
  } catch (err) {
    console.error('getHotels error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch hotels.' });
  }
};

export const getFeaturedHotels = async (req, res) => {
  try {
    const featuredHotels = await Hotel.find({ active: true, featured: true })
      .limit(6)
      .lean();

    // Attach starting prices
    for (const hotel of featuredHotels) {
      const room = await RoomType.findOne({ hotelId: hotel._id, active: true })
        .sort({ basePricePerNight: 1 })
        .lean();
      hotel.startingPrice = room ? room.basePricePerNight : 5000;
    }

    return res.status(200).json({ success: true, hotels: featuredHotels });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured hotels.' });
  }
};

export const getHotelBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const hotel = await Hotel.findOne({ slug, active: true }).lean();

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    // Fetch active room types
    const roomTypes = await RoomType.find({
      hotelId: hotel._id,
      active: true,
    }).sort({ basePricePerNight: 1 }).lean();

    // Fetch verified reviews
    const reviews = await Review.find({ hotelId: hotel._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      hotel: {
        ...hotel,
        roomTypes,
        reviews,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hotel details.' });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findById(id).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }
    return res.status(200).json({ success: true, hotel });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hotel.' });
  }
};

// Admin creation of hotels
export const createHotel = async (req, res) => {
  try {
    const newHotel = await Hotel.create(req.body);
    return res.status(201).json({ success: true, hotel: newHotel });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Admin/Manager update of hotel
export const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Hotel.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    return res.status(200).json({ success: true, hotel: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
