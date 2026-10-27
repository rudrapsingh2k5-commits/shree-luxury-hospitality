import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'hotelpro_jwt_secret_dev_key_2026' || secret === 'hotelpro_super_secure_jwt_secret_key_2026_xyz') {
      throw new Error('[Security Fatal] Insecure or missing JWT_SECRET in production environment.');
    }
  }
  return secret || 'hotelpro_jwt_secret_dev_key_2026';
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedHotelId: user.assignedHotelId,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
