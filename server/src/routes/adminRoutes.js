import express from 'express';
import {
  getAdminAnalytics,
  getAllUsers,
  updateUserRole,
  getAuditLogs,
  exportBookingsCSV,
} from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/export-bookings-csv', exportBookingsCSV);

export default router;
