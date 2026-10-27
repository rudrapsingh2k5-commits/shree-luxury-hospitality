import express from 'express';
import {
  createReview,
  getHotelReviews,
  getMyReviews,
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/hotel/:hotelId', getHotelReviews);
router.get('/my-reviews', authenticateToken, getMyReviews);
router.post('/', authenticateToken, createReview);

export default router;
