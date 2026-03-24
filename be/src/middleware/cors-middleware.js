/**
 * CORS Middleware đơn giản cho Backend Template
 * Cấu hình CORS cơ bản với hỗ trợ wildcard
 */
const cors = require('cors');

/**
 * Create basic CORS middleware
 * @param {Object} options - CORS options
 * @returns {Function} CORS middleware
 */
const corsMiddleware = (options = {}) => {
  // Check if wildcard is allowed
  const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';
  const isWildcard = allowedOrigins === '*';

  const defaultOptions = {
    origin: isWildcard ? true : allowedOrigins.split(',').map(origin => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: !isWildcard, // Only enable credentials if not wildcard
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
  };

  const corsOptions = { ...defaultOptions, ...options };
  return cors(corsOptions);
};

/**
 * Extended CORS middleware for special cases
 */
const corsExtended = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';
  const isWildcard = allowedOrigins === '*';

  if (isWildcard) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    const origin = req.headers.origin;
    const allowedList = allowedOrigins.split(',').map(o => o.trim());
    
    if (origin && allowedList.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

module.exports = {
  corsMiddleware,
  corsExtended
};
