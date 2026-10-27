import express from 'express';
import {
  createPaymentIntent,
  createPaymentOrder,
  confirmPayment,
  verifyPayment,
  getPaymentConfig,
  handleWebhook,
  getPaymentStatus,
  processRefund,
  getSimulatorSignature,
} from '../controllers/paymentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Configuration & exchange rates
router.get('/config', getPaymentConfig);

// Stripe Payment Intent Creation (Converts INR to GBP)
router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/create-order', authenticateToken, createPaymentOrder); // Legacy alias

// Payment Confirmation
router.post('/confirm', authenticateToken, confirmPayment);
router.post('/verify', authenticateToken, verifyPayment); // Legacy alias
router.post('/simulate-signature', authenticateToken, getSimulatorSignature);

// Stripe Webhook
router.post('/webhook', handleWebhook);

// Payment details & admin refunding
router.get('/:paymentId/status', authenticateToken, getPaymentStatus);
router.post('/refund', authenticateToken, authorizeRoles('admin', 'staff'), processRefund);

export default router;
