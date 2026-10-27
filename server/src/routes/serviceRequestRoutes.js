import express from 'express';
import {
  createServiceRequest,
  getMyRequests,
  updateServiceRequestStatus,
} from '../controllers/serviceRequestController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, createServiceRequest);
router.get('/my-requests', authenticateToken, getMyRequests);
router.put('/:id/status', authenticateToken, authorizeRoles('staff', 'admin'), updateServiceRequestStatus);

export default router;
