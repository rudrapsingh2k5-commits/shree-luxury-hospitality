import express from 'express';
import {
  getHotels,
  getFeaturedHotels,
  getHotelBySlug,
  getHotelById,
  createHotel,
  updateHotel,
} from '../controllers/hotelController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getHotels);
router.get('/featured', getFeaturedHotels);
router.get('/slug/:slug', getHotelBySlug);
router.get('/:id', getHotelById);

// Protected Admin Routes
router.post('/', authenticateToken, authorizeRoles('admin'), createHotel);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateHotel);

export default router;
