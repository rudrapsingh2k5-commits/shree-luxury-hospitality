/**
 * Environment Configuration Validator
 * Enforces production safety guards and prevents insecure defaults.
 */
export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  // JWT Secret validation
  const jwtSecret = process.env.JWT_SECRET;
  const insecureDevSecrets = [
    'hotelpro_jwt_secret_dev_key_2026',
    'hotelpro_super_secure_jwt_secret_key_2026_xyz',
    'default_secret',
    'secret',
  ];

  if (isProduction) {
    if (!jwtSecret || jwtSecret.trim() === '') {
      errors.push('JWT_SECRET is required in production.');
    } else if (insecureDevSecrets.includes(jwtSecret)) {
      errors.push('Insecure fallback JWT_SECRET detected in production. You must set a strong, unique secret.');
    } else if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production.');
    }

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
      errors.push('MONGODB_URI is required in production. Embedded in-memory MongoDB is strictly prohibited in production.');
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('sample') || process.env.STRIPE_SECRET_KEY.includes('YOUR_')) {
      errors.push('Valid production STRIPE_SECRET_KEY is required.');
    }

    if (!process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY.includes('sample') || process.env.STRIPE_PUBLISHABLE_KEY.includes('YOUR_')) {
      errors.push('Valid production STRIPE_PUBLISHABLE_KEY is required.');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET.includes('sample') || process.env.STRIPE_WEBHOOK_SECRET.includes('YOUR_')) {
      errors.push('Valid production STRIPE_WEBHOOK_SECRET is required.');
    }
  }

  if (errors.length > 0) {
    console.error('\n======================================================');
    console.error('FATAL PRODUCTION CONFIGURATION ERRORS DETECTED:');
    errors.forEach((err) => console.error(` - [CRITICAL] ${err}`));
    console.error('======================================================\n');
    throw new Error(`Production environment configuration validation failed:\n${errors.join('\n')}`);
  }

  if (!isProduction) {
    if (!jwtSecret || insecureDevSecrets.includes(jwtSecret)) {
      console.warn('[Security Notice] Running in non-production mode with development JWT_SECRET.');
    }
  }
};
