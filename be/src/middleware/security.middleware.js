/**
 * Security Middleware
 * Configures security-related middleware for the application
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Configure Helmet security middleware
 */
const setupHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "ws:", "wss:", "*"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
};

/**
 * Configure Rate Limiting middleware
 */
const setupRateLimit = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || (isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1min dev, 15min prod
    max: process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? 1000 : 100), // 1000 dev, 100 prod
    message: {
      success: false,
      message: 'Quá nhiều request từ IP này, vui lòng thử lại sau'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health check
      return req.path === '/health' || (isDevelopment && req.path.startsWith('/api/'));
    }
  });
};

/**
 * Configure MongoDB injection protection
 */
const setupMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_'
  });
};

/**
 * Setup all security middleware
 */
const setupSecurity = (app) => {
  // Apply security middleware
  app.use(setupHelmet());
  app.use(setupRateLimit());
  app.use(setupMongoSanitize());
};

module.exports = {
  setupSecurity,
  setupHelmet,
  setupRateLimit,
  setupMongoSanitize
};
