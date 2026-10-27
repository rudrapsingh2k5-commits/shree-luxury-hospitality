import { Booking, RoomType, RoomNightAllocation } from '../models/index.js';

export const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateKeys = (startDate, endDate) => {
  const keys = [];
  const curr = new Date(startDate);
  const end = new Date(endDate);
  while (curr < end) {
    keys.push(formatDateKey(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return keys;
};

/**
 * Clean up expired holds and sync stale pending reservations
 */
export const cleanupExpiredHolds = async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // 1. Expire stale pending bookings
    const expiredBookings = await Booking.find({
      bookingStatus: 'pending_payment',
      createdAt: { $lt: fifteenMinutesAgo },
    });

    if (expiredBookings.length > 0) {
      const expiredIds = expiredBookings.map((b) => b._id);
      await Booking.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { bookingStatus: 'expired', cancellationReason: 'Payment session expired' } }
      );
      await RoomNightAllocation.deleteMany({ bookingId: { $in: expiredIds } });
    }

    // 2. Delete any allocations with expired holds
    await RoomNightAllocation.deleteMany({
      status: 'held',
      expiresAt: { $lt: now },
    });
  } catch (err) {
    console.error('cleanupExpiredHolds error:', err);
  }
};

/**
 * Check room availability for a specific room type between checkIn and checkOut dates
 */
export const checkRoomAvailability = async (
  roomTypeId,
  checkIn,
  checkOut,
  requestedRooms = 1,
  excludeBookingId = null
) => {
  await cleanupExpiredHolds();

  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType || !roomType.active) {
    return {
      available: false,
      totalRooms: 0,
      bookedRooms: 0,
      remainingRooms: 0,
      error: 'Room type not found or inactive',
    };
  }

  const totalRooms = roomType.totalRoomsCount || 5;
  const dateKeys = getDateKeys(checkIn, checkOut);

  if (dateKeys.length === 0) {
    return {
      available: false,
      totalRooms,
      bookedRooms: totalRooms,
      remainingRooms: 0,
      error: 'Check-out date must be strictly after check-in date.',
    };
  }

  let minRemaining = totalRooms;
  let maxBooked = 0;

  for (const dateKey of dateKeys) {
    const query = {
      roomTypeId,
      date: dateKey,
    };
    if (excludeBookingId) {
      query.bookingId = { $ne: excludeBookingId };
    }
    const allocatedCount = await RoomNightAllocation.countDocuments(query);
    const remaining = Math.max(0, totalRooms - allocatedCount);
    if (remaining < minRemaining) minRemaining = remaining;
    if (allocatedCount > maxBooked) maxBooked = allocatedCount;
  }

  return {
    available: minRemaining >= requestedRooms,
    totalRooms,
    bookedRooms: maxBooked,
    remainingRooms: minRemaining,
  };
};

/**
 * Reserve room inventory atomically across all requested nights.
 * Uses MongoDB unique compound index { roomTypeId: 1, date: 1, slot: 1 }
 * to mathematically prevent overbooking or race condition collisions.
 */
export const reserveRoomInventoryAtomic = async ({
  roomTypeId,
  hotelId,
  bookingId,
  checkIn,
  checkOut,
  requestedRooms = 1,
}) => {
  await cleanupExpiredHolds();

  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType || !roomType.active) {
    return { success: false, reason: 'Room type not found or inactive.' };
  }

  const totalRooms = roomType.totalRoomsCount || 5;
  const dateKeys = getDateKeys(checkIn, checkOut);
  if (dateKeys.length === 0) {
    return { success: false, reason: 'Invalid date range: at least 1 night required.' };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute temporary hold

  const plannedAllocations = [];

  for (const dateKey of dateKeys) {
    const existing = await RoomNightAllocation.find({
      roomTypeId,
      date: dateKey,
      bookingId: { $ne: bookingId },
    }).select('slot');

    const takenSlots = new Set(existing.map((a) => a.slot));
    const availableSlots = [];
    for (let s = 1; s <= totalRooms; s++) {
      if (!takenSlots.has(s)) {
        availableSlots.push(s);
      }
    }

    if (availableSlots.length < requestedRooms) {
      return {
        success: false,
        reason: `Requested inventory unavailable for date ${dateKey}. Only ${availableSlots.length} room(s) available, but ${requestedRooms} requested.`,
        remainingRooms: availableSlots.length,
        isConflict: true,
      };
    }

    for (let i = 0; i < requestedRooms; i++) {
      plannedAllocations.push({
        hotelId,
        roomTypeId,
        date: dateKey,
        slot: availableSlots[i],
        bookingId,
        status: 'held',
        expiresAt,
      });
    }
  }

  try {
    await RoomNightAllocation.insertMany(plannedAllocations, { ordered: true });
    return { success: true, allocations: plannedAllocations };
  } catch (err) {
    // Duplicate key collision (E11000) during concurrent race
    await RoomNightAllocation.deleteMany({ bookingId });
    return {
      success: false,
      reason: 'Concurrent booking conflict: inventory was reserved by another guest. Please try again.',
      isConflict: true,
    };
  }
};

/**
 * Confirm temporary holds after verified payment
 */
export const confirmRoomInventory = async (bookingId) => {
  return await RoomNightAllocation.updateMany(
    { bookingId },
    { $set: { status: 'confirmed', expiresAt: null } }
  );
};

/**
 * Release inventory allocations on cancellation or payment failure
 */
export const releaseRoomInventory = async (bookingId) => {
  return await RoomNightAllocation.deleteMany({ bookingId });
};

/**
 * Generate unique human-readable booking reference
 * Format: SHREE-YEAR-XXXXX (e.g. SHREE-2026-9E4K2)
 */
export const generateBookingReference = () => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SHREE-${year}-${randomPart}`;
};
