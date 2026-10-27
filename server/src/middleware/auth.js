import { verifyToken } from '../utils/token.js';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is invalid or deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

/**
 * Role-Based Access Control middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'staff', 'guest')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] role(s).`,
      });
    }

    next();
  };
};

/**
 * Property-Level Isolation:
 * Staff can ONLY access resources of their assigned hotel.
 * Admin has unrestricted platform-wide access.
 */
export const authorizeHotelStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next(); // Admin has universal property access
  }

  if (req.user.role !== 'staff') {
    return res.status(403).json({ success: false, message: 'Hotel staff access required' });
  }

  const requestedHotelId =
    req.params.hotelId || req.body.hotelId || req.query.hotelId;

  if (
    requestedHotelId &&
    req.user.assignedHotelId &&
    req.user.assignedHotelId.toString() !== requestedHotelId.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not authorized to view or manage another hotel property.',
    });
  }

  next();
};
