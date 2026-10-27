import express from 'express';
import { createSupportTicket, getSupportTickets } from '../controllers/supportController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Optional authentication middleware for creating ticket (works for guest or logged in user)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  next();
};

router.post('/tickets', optionalAuth, createSupportTicket);
router.get('/tickets', authenticateToken, authorizeRoles('admin'), getSupportTickets);

export default router;
