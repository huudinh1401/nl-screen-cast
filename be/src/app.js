const express = require("express");
const bodyParser = require("body-parser");
const timeout = require('connect-timeout');
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require('./middleware/error-middleware');
const { corsMiddleware, corsExtended } = require('./middleware/cors-middleware');
const { setupSecurity } = require('./middleware/security.middleware');
const setupStaticFiles = require('./middleware/static-files.middleware');

const app = express();

// Apply CORS middleware
app.use(corsMiddleware());
app.use(corsExtended);

// Apply security middleware
setupSecurity(app);

// Request timeout middleware
app.use(timeout('1h'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Body parser middleware
app.use(bodyParser.json({ 
  limit: process.env.JSON_LIMIT || '10mb'
}));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: process.env.URL_ENCODED_LIMIT || '10mb'
}));

// Setup static files middleware
setupStaticFiles(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Backend Template API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use("/api", routes);

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend Template API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: 'See README.md for API documentation'
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;