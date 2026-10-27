import express from 'express';
import {
  getRoomTypesByHotel,
  quoteRoomStay,
  createRoomType,
  updateRoomType,
} from '../controllers/roomController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/hotel/:hotelId', getRoomTypesByHotel);
router.get('/:roomTypeId/quote', quoteRoomStay);

// Protected Admin Routes
router.post('/', authenticateToken, authorizeRoles('admin'), createRoomType);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateRoomType);

export default router;
