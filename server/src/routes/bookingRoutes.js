import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.get('/:reference', authenticateToken, getBookingDetails);
router.put('/:id/cancel', authenticateToken, cancelBooking);

export default router;
