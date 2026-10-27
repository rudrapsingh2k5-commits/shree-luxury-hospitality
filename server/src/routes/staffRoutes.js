import express from 'express';
import {
  getStaffDashboardMetrics,
  checkInGuest,
  checkOutGuest,
  updateRoomStatus,
  getHousekeepingTasks,
  updateHousekeepingTask,
} from '../controllers/staffController.js';
import {
  authenticateToken,
  authorizeRoles,
  authorizeHotelStaff,
} from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('staff', 'admin'));
router.use(authorizeHotelStaff);

router.get('/metrics', getStaffDashboardMetrics);
router.post('/check-in', checkInGuest);
router.post('/check-out', checkOutGuest);
router.put('/rooms/:roomId/status', updateRoomStatus);
router.get('/housekeeping', getHousekeepingTasks);
router.put('/housekeeping/:taskId', updateHousekeepingTask);

export default router;
