import express from 'express';
import { toggleFavorite, getMyFavorites } from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-favorites', authenticateToken, getMyFavorites);
router.post('/toggle', authenticateToken, toggleFavorite);

export default router;
