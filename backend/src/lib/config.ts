import dotenv from 'dotenv';
dotenv.config();

// Render, Vercel and local .env files disagree about whether a flag is "on" —
// accept the usual spellings instead of only the literal string 'true'.
const isTruthy = (value: string | undefined): boolean =>
  ['true', '1', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'yelo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
  location: {
    defaultLat: parseFloat(process.env.DEFAULT_LAT || '30.3165'),
    defaultLng: parseFloat(process.env.DEFAULT_LNG || '78.0322'),
  },
  commission: {
    type: process.env.DEFAULT_COMMISSION_TYPE || 'percentage',
    value: parseFloat(process.env.DEFAULT_COMMISSION_VALUE || '10'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  registerRateLimit: {
    windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || '3600000', 10),
    max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '10', 10),
  },
  google: {
    // Register the OAuth routes whenever credentials exist, not only when
    // GOOGLE_OAUTH_ENABLED is spelled exactly "true" — a missing flag used to
    // unregister /api/auth/google and return a bare 404. An explicit false
    // still wins over the credentials fallback.
    enabled:
      process.env.GOOGLE_OAUTH_ENABLED
        ? isTruthy(process.env.GOOGLE_OAUTH_ENABLED)
        : Boolean(googleClientId && googleClientSecret),
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    issuer: process.env.GOOGLE_ISSUER || 'https://accounts.google.com',
    jwksUri: process.env.GOOGLE_JWKS_URI || 'https://www.googleapis.com/oauth2/v3/certs',
  },
};
