import {
  Booking,
  RoomInventory,
  RoomType,
  Hotel,
  HousekeepingTask,
  ServiceRequest,
  AuditLog,
} from '../models/index.js';

/**
 * Get operational dashboard metrics for staff's assigned hotel
 */
export const getStaffDashboardMetrics = async (req, res) => {
  try {
    const hotelId = req.user.role === 'admin'
      ? (req.query.hotelId || req.user.assignedHotelId)
      : req.user.assignedHotelId;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: 'No hotel assigned or specified.',
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    // Set today's date range (start of day to end of day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Today's Arrivals
    const todaysArrivals = await Booking.find({
      hotelId,
      checkIn: { $gte: startOfToday, $lte: endOfToday },
      bookingStatus: { $in: ['confirmed', 'checked_in'] },
    })
      .populate('roomTypeId', 'name type')
      .populate('userId', 'name email phone');

    // 2. Today's Departures
    const todaysDepartures = await Booking.find({
      hotelId,
      checkOut: { $gte: startOfToday, $lte: endOfToday },
      bookingStatus: 'checked_in',
    })
      .populate('roomTypeId', 'name type')
      .populate('userId', 'name email phone');

    // 3. Currently Checked In Guests
    const currentlyCheckedIn = await Booking.find({
      hotelId,
      bookingStatus: 'checked_in',
    })
      .populate('roomTypeId', 'name type')
      .populate('userId', 'name email phone');

    // 4. Room status distribution
    const rooms = await RoomInventory.find({ hotelId }).populate('roomTypeId', 'name');
    const roomCounts = {
      total: rooms.length,
      available: rooms.filter((r) => r.status === 'available').length,
      occupied: rooms.filter((r) => r.status === 'occupied').length,
      dirty: rooms.filter((r) => r.status === 'dirty').length,
      maintenance: rooms.filter((r) => r.status === 'maintenance').length,
    };

    // 5. Pending Service Requests
    const pendingServiceRequests = await ServiceRequest.find({
      hotelId,
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('userId', 'name email phone')
      .sort({ priority: -1, createdAt: -1 });

    // 6. Housekeeping Tasks
    const housekeepingTasks = await HousekeepingTask.find({
      hotelId,
      status: { $in: ['pending', 'in_progress'] },
    }).sort({ priority: -1 });

    return res.status(200).json({
      success: true,
      hotel: {
        _id: hotel._id,
        name: hotel.name,
        city: hotel.address?.city,
      },
      metrics: {
        arrivalsCount: todaysArrivals.length,
        departuresCount: todaysDepartures.length,
        checkedInCount: currentlyCheckedIn.length,
        roomCounts,
        pendingRequestsCount: pendingServiceRequests.length,
      },
      todaysArrivals,
      todaysDepartures,
      currentlyCheckedIn,
      rooms,
      pendingServiceRequests,
      housekeepingTasks,
    });
  } catch (err) {
    console.error('getStaffDashboardMetrics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff metrics.' });
  }
};

/**
 * Check In Guest
 */
export const checkInGuest = async (req, res) => {
  try {
    const { bookingId, roomNumbers } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId).populate('roomTypeId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Property-level authorization: Staff can only check in guests for their assigned hotel
    if (req.user.role !== 'admin') {
      if (
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== booking.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to check in guests for another hotel property.',
        });
      }
    }

    // Idempotency: if already checked in, return success
    if (booking.bookingStatus === 'checked_in') {
      return res.status(200).json({
        success: true,
        message: 'Guest is already checked in.',
        booking,
      });
    }

    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in booking with status '${booking.bookingStatus}'. Only confirmed reservations can be checked in.`,
      });
    }

    if (!Array.isArray(roomNumbers) || roomNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one room number must be assigned for check-in.',
      });
    }

    // Verify room count matches booking requirement
    if (roomNumbers.length !== booking.numberOfRooms) {
      return res.status(400).json({
        success: false,
        message: `Exactly ${booking.numberOfRooms} room(s) must be assigned for this reservation. Received ${roomNumbers.length}.`,
      });
    }

    // Check for duplicate room numbers in request
    const uniqueRoomNumbers = new Set(roomNumbers);
    if (uniqueRoomNumbers.size !== roomNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate room numbers cannot be assigned to the same booking.',
      });
    }

    // Verify each room belongs to the hotel & room category, and is currently available
    const assignedRooms = await RoomInventory.find({
      hotelId: booking.hotelId,
      roomNumber: { $in: roomNumbers },
    });

    if (assignedRooms.length !== roomNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more specified room numbers do not exist at this property.',
      });
    }

    for (const room of assignedRooms) {
      if (room.roomTypeId.toString() !== booking.roomTypeId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: `Room ${room.roomNumber} does not match the booked category (${booking.roomTypeId.name}).`,
        });
      }

      if (room.status === 'dirty') {
        return res.status(400).json({
          success: false,
          message: `Cannot assign Room ${room.roomNumber}: Room is marked DIRTY and must be cleaned first.`,
        });
      }
      if (room.status === 'maintenance') {
        return res.status(400).json({
          success: false,
          message: `Cannot assign Room ${room.roomNumber}: Room is under MAINTENANCE.`,
        });
      }
      if (room.status === 'occupied') {
        return res.status(400).json({
          success: false,
          message: `Cannot assign Room ${room.roomNumber}: Room is currently OCCUPIED.`,
        });
      }
    }

    // Atomic room assignment update to prevent concurrent race conditions
    const updateResult = await RoomInventory.updateMany(
      {
        hotelId: booking.hotelId,
        roomNumber: { $in: roomNumbers },
        status: 'available',
      },
      {
        $set: {
          status: 'occupied',
          currentBookingId: booking._id,
          assignedGuestName: booking.guestDetails?.name || 'Guest',
        },
      }
    );

    if (updateResult.modifiedCount !== roomNumbers.length) {
      // Revert any partially assigned rooms
      await RoomInventory.updateMany(
        { hotelId: booking.hotelId, roomNumber: { $in: roomNumbers }, currentBookingId: booking._id },
        { $set: { status: 'available', currentBookingId: null, assignedGuestName: '' } }
      );
      return res.status(409).json({
        success: false,
        message: 'Concurrent check-in conflict: One or more rooms were just claimed by another staff member. Please select another room.',
      });
    }

    // Update Booking status
    booking.bookingStatus = 'checked_in';
    booking.checkedInAt = new Date();
    booking.assignedRooms = roomNumbers;
    await booking.save();

    // Security Audit Log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'CHECK_IN_GUEST',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: {
        bookingReference: booking.bookingReference,
        assignedRooms: roomNumbers,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Guest ${booking.guestDetails?.name || 'Guest'} successfully checked into Room(s) ${roomNumbers.join(', ')}.`,
      booking,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Check Out Guest
 */
export const checkOutGuest = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Property-level authorization
    if (req.user.role !== 'admin') {
      if (
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== booking.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to check out guests for another hotel property.',
        });
      }
    }

    // Idempotency: if already checked out, return success
    if (booking.bookingStatus === 'checked_out') {
      return res.status(200).json({
        success: true,
        message: 'Guest is already checked out.',
        booking,
      });
    }

    if (booking.bookingStatus !== 'checked_in') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out booking with status '${booking.bookingStatus}'. Only currently checked-in guests can be checked out.`,
      });
    }

    // Automatically mark the vacated rooms as DIRTY and generate housekeeping tasks
    if (booking.assignedRooms && booking.assignedRooms.length > 0) {
      await RoomInventory.updateMany(
        { hotelId: booking.hotelId, roomNumber: { $in: booking.assignedRooms } },
        {
          $set: {
            status: 'dirty',
            currentBookingId: null,
            assignedGuestName: '',
          },
        }
      );

      // Create Housekeeping Tasks for checkout cleaning
      for (const roomNum of booking.assignedRooms) {
        await HousekeepingTask.create({
          hotelId: booking.hotelId,
          roomNumber: roomNum,
          taskType: 'checkout_clean',
          priority: 'high',
          status: 'pending',
          notes: `Departure clean for Booking ${booking.bookingReference}`,
        });
      }
    }

    booking.bookingStatus = 'checked_out';
    booking.checkedOutAt = new Date();
    await booking.save();

    // Security Audit log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'CHECK_OUT_GUEST',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: {
        bookingReference: booking.bookingReference,
        roomsVacated: booking.assignedRooms,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Guest checked out successfully. Room(s) queued for housekeeping inspection.`,
      booking,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Room Status (e.g. from dirty -> available after housekeeping)
 */
export const updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, notes } = req.body;

    if (!['available', 'occupied', 'dirty', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid room status.' });
    }

    const room = await RoomInventory.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Property-level authorization
    if (req.user.role !== 'admin') {
      if (
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== room.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to update rooms for another hotel property.',
        });
      }
    }

    const oldStatus = room.status;
    room.status = status;
    if (notes !== undefined) room.notes = notes;
    if (status === 'available') {
      room.currentBookingId = null;
      room.assignedGuestName = '';
    }
    await room.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'ROOM_STATUS_CHANGE',
      entityType: 'RoomInventory',
      entityId: room._id.toString(),
      details: {
        roomNumber: room.roomNumber,
        fromStatus: oldStatus,
        toStatus: status,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} status updated to '${status}'.`,
      room,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Housekeeping tasks list & status update
 */
export const getHousekeepingTasks = async (req, res) => {
  try {
    const hotelId = req.user.role === 'admin'
      ? (req.query.hotelId || req.user.assignedHotelId)
      : req.user.assignedHotelId;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'No hotel assigned.' });
    }

    const tasks = await HousekeepingTask.find({ hotelId })
      .populate('assignedStaffId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

export const updateHousekeepingTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const task = await HousekeepingTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Property-level authorization
    if (req.user.role !== 'admin') {
      if (
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== task.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to update housekeeping for another hotel property.',
        });
      }
    }

    task.status = status || task.status;
    if (notes) task.notes = notes;
    if (status === 'completed') {
      task.completedAt = new Date();
      // If task completed, mark room as available/clean
      await RoomInventory.findOneAndUpdate(
        { hotelId: task.hotelId, roomNumber: task.roomNumber },
        { $set: { status: 'available' } }
      );
    }
    await task.save();

    return res.status(200).json({ success: true, task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
