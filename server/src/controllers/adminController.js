import {
  Booking,
  Hotel,
  RoomInventory,
  RoomType,
  User,
  Payment,
  AuditLog,
} from '../models/index.js';

/**
 * Get comprehensive analytics computed from real database records
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, hotelId } = req.query;

    const matchQuery = {};
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (hotelId) {
      matchQuery.hotelId = hotelId;
    }

    // 1. All Bookings
    const allBookings = await Booking.find(matchQuery);
    const totalBookingsCount = allBookings.length;

    // 2. Paid / Captured Bookings
    const paidBookings = allBookings.filter(
      (b) => b.paymentStatus === 'captured' && b.bookingStatus !== 'cancelled'
    );
    const grossRevenue = paidBookings.reduce(
      (sum, b) => sum + (b.priceBreakdown?.finalAmount || 0),
      0
    );

    // 3. Cancelled & Refunded
    const cancelledBookings = allBookings.filter(
      (b) => b.bookingStatus === 'cancelled'
    );
    const totalRefunds = cancelledBookings.reduce(
      (sum, b) => sum + (b.refundAmount || 0),
      0
    );
    const netRevenue = Math.max(0, grossRevenue - totalRefunds);

    // 4. Average Daily Rate (ADR) = totalRoomCharge / totalNightsBooked
    let totalNightsBooked = 0;
    let totalRoomRevenue = 0;
    paidBookings.forEach((b) => {
      const nights = b.priceBreakdown?.nights || 1;
      const rooms = b.numberOfRooms || 1;
      totalNightsBooked += nights * rooms;
      totalRoomRevenue += b.priceBreakdown?.totalBaseCharge || 0;
    });
    const adr = totalNightsBooked > 0 ? Math.round(totalRoomRevenue / totalNightsBooked) : 0;

    // 5. Overall Occupancy Rate
    const totalRoomsCount = await RoomInventory.countDocuments(
      hotelId ? { hotelId } : {}
    );
    const occupiedRoomsCount = await RoomInventory.countDocuments(
      hotelId ? { hotelId, status: 'occupied' } : { status: 'occupied' }
    );
    const occupancyRate =
      totalRoomsCount > 0
        ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100)
        : 0;

    // 6. Revenue Trend Over Last 7 Days (for charts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendBookings = await Booking.find({
      createdAt: { $gte: sevenDaysAgo },
      paymentStatus: 'captured',
      bookingStatus: { $ne: 'cancelled' },
    });

    const dailyRevenueMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyRevenueMap[dateKey] = 0;
    }

    trendBookings.forEach((b) => {
      const dateKey = new Date(b.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (dailyRevenueMap[dateKey] !== undefined) {
        dailyRevenueMap[dateKey] += b.priceBreakdown?.finalAmount || 0;
      }
    });

    const revenueChartData = Object.keys(dailyRevenueMap).map((date) => ({
      date,
      revenue: dailyRevenueMap[date],
    }));

    // 7. Property Performance Breakdown
    const hotels = await Hotel.find({ active: true }).select('name city');
    const hotelPerformance = await Promise.all(
      hotels.map(async (h) => {
        const hotelBookings = allBookings.filter(
          (b) => b.hotelId.toString() === h._id.toString()
        );
        const rev = hotelBookings
          .filter((b) => b.paymentStatus === 'captured' && b.bookingStatus !== 'cancelled')
          .reduce((sum, b) => sum + (b.priceBreakdown?.finalAmount || 0), 0);
        return {
          id: h._id,
          name: h.name,
          city: h.city,
          bookingsCount: hotelBookings.length,
          revenue: rev,
        };
      })
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalBookingsCount,
        grossRevenue,
        totalRefunds,
        netRevenue,
        adr,
        occupancyRate,
        totalRoomsCount,
        occupiedRoomsCount,
      },
      revenueChartData,
      hotelPerformance,
    });
  } catch (err) {
    console.error('getAdminAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

/**
 * Get all users with filtering
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const users = await User.find(query)
      .populate('assignedHotelId', 'name city')
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

/**
 * Helper to escape CSV fields and neutralize spreadsheet formula injection
 * Values starting with =, +, -, @, tab, carriage return are prefixed with a single quote
 */
const sanitizeCsvField = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  const trimmed = str.trimStart();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Update user role or hotel assignment
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, assignedHotelId, isActive } = req.body;

    const allowedRoles = ['guest', 'staff', 'admin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of [${allowedRoles.join(', ')}].`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent self-lockout: Admin cannot demote or deactivate their own account
    if (user._id.toString() === req.user._id.toString()) {
      if ((role && role !== 'admin') || isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Administrators cannot demote or deactivate their own active account.',
        });
      }
    }

    // If assigning staff role, validate that assigned hotel exists
    if (role === 'staff' || (user.role === 'staff' && assignedHotelId)) {
      const targetHotelId = assignedHotelId || user.assignedHotelId;
      if (!targetHotelId) {
        return res.status(400).json({
          success: false,
          message: 'Staff members must be assigned to an active hotel property.',
        });
      }
      const hotelExists = await Hotel.findById(targetHotelId);
      if (!hotelExists || !hotelExists.active) {
        return res.status(400).json({
          success: false,
          message: 'The designated hotel property does not exist or is inactive.',
        });
      }
    }

    const oldRole = user.role;
    if (role) user.role = role;
    if (assignedHotelId !== undefined) user.assignedHotelId = assignedHotelId || null;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: {
        targetUserEmail: user.email,
        oldRole,
        newRole: user.role,
        assignedHotelId: user.assignedHotelId,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'User permissions updated successfully.',
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get system audit logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
};

/**
 * Export Bookings as CSV with formula injection defense and quote escaping
 */
export const exportBookingsCSV = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name')
      .sort({ createdAt: -1 });

    const headers = [
      'Booking Reference',
      'Guest Name',
      'Guest Email',
      'Hotel',
      'City',
      'Room Type',
      'Rooms',
      'Check In',
      'Check Out',
      'Nights',
      'Total Amount (INR)',
      'Booking Status',
      'Payment Status',
      'Created At',
    ];

    const rows = bookings.map((b) => [
      sanitizeCsvField(b.bookingReference),
      sanitizeCsvField(b.guestDetails?.name || ''),
      sanitizeCsvField(b.guestDetails?.email || ''),
      sanitizeCsvField(b.hotelId?.name || ''),
      sanitizeCsvField(b.hotelId?.city || ''),
      sanitizeCsvField(b.roomTypeId?.name || ''),
      b.numberOfRooms || 1,
      sanitizeCsvField(new Date(b.checkIn).toLocaleDateString('en-IN')),
      sanitizeCsvField(new Date(b.checkOut).toLocaleDateString('en-IN')),
      b.priceBreakdown?.nights || 1,
      b.priceBreakdown?.finalAmount || 0,
      sanitizeCsvField(b.bookingStatus),
      sanitizeCsvField(b.paymentStatus),
      sanitizeCsvField(new Date(b.createdAt).toLocaleDateString('en-IN')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hotelpro-bookings-export.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'CSV export failed.' });
  }
};
