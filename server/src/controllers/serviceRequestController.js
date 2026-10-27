import { ServiceRequest, Booking, Notification, AuditLog } from '../models/index.js';

export const createServiceRequest = async (req, res) => {
  try {
    const {
      bookingId,
      category = 'housekeeping',
      title,
      details,
      priority = 'medium',
      roomNumber,
    } = req.body;

    if (!bookingId || !title || !details) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, title, and details are required.',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this booking.' });
    }

    const request = await ServiceRequest.create({
      hotelId: booking.hotelId,
      bookingId: booking._id,
      userId: req.user._id,
      roomNumber: roomNumber || (booking.assignedRooms?.[0] || ''),
      category,
      title,
      details,
      priority,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Service request submitted to hotel front desk.',
      request,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create service request.' });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ userId: req.user._id })
      .populate('hotelId', 'name city')
      .populate('bookingId', 'bookingReference')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

export const updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, staffNotes } = req.body;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Property-level authorization
    if (req.user.role !== 'admin') {
      if (
        req.user.role !== 'staff' ||
        !req.user.assignedHotelId ||
        req.user.assignedHotelId.toString() !== request.hotelId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to manage service requests for another hotel property.',
        });
      }
    }

    request.status = status || request.status;
    if (staffNotes) request.staffNotes = staffNotes;
    if (status === 'completed') {
      request.resolvedAt = new Date();

      // Notify the guest
      await Notification.create({
        userId: request.userId,
        title: 'Service Request Fulfilled',
        message: `Your request "${request.title}" has been completed by staff.`,
        type: 'service',
        link: '/dashboard',
      });
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request status updated to ${request.status}.`,
      request,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
