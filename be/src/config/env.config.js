/**
 * Environment Configuration
 * Centralizes all environment variables for the backend template
 */
require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost',

  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'backend_template',
  DB_PORT: process.env.DB_PORT || 3306,

  // JWT Configuration
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key',
  ACCESS_TOKEN_LIFETIME: process.env.ACCESS_TOKEN_LIFETIME || '15m',
  REFRESH_TOKEN_LIFETIME: process.env.REFRESH_TOKEN_LIFETIME || '7d',

  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '*',

  // Security Configuration
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,

  // File Upload Configuration
  JSON_LIMIT: process.env.JSON_LIMIT || '10mb',
  URL_ENCODED_LIMIT: process.env.URL_ENCODED_LIMIT || '10mb',
  FILE_UPLOAD_LIMIT: process.env.FILE_UPLOAD_LIMIT || '50mb',

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
  
  // Development vs Production flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database Sync Configuration
  DB_SYNC_FORCE: process.env.DB_SYNC_FORCE === 'true', // Force drop and recreate tables
  DB_SYNC_ALTER: process.env.DB_SYNC_ALTER === 'true', // Alter existing tables
  
  // Individual Table Sync Control
  SYNC_ROLES: process.env.SYNC_ROLES !== 'false', // Default: true
  SYNC_PERMISSIONS: process.env.SYNC_PERMISSIONS !== 'false', // Default: true
  SYNC_USERS: process.env.SYNC_USERS !== 'false', // Default: true
  SYNC_AUTH: process.env.SYNC_AUTH !== 'false', // Default: true
  SYNC_LOGS: process.env.SYNC_LOGS !== 'false', // Default: true
  SYNC_UUID_LOGIN: process.env.SYNC_UUID_LOGIN !== 'false' // Default: true
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Thiếu các biến môi trường bắt buộc:', missingEnvVars.join(', '));
  console.error('Vui lòng kiểm tra file .env hoặc cấu hình môi trường.');
  process.exit(1);
}

module.exports = config;
