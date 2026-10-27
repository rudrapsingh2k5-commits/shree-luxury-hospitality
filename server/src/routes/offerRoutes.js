import express from 'express';
import { getActiveOffers, validateCoupon } from '../controllers/offerController.js';

const router = express.Router();

router.get('/', getActiveOffers);
router.post('/validate', validateCoupon);

export default router;
