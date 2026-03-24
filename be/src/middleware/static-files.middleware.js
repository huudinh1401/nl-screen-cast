/**
 * Static Files Middleware
 * Handles file serving with proper CORS headers
 */
const express = require('express');
const path = require('path');

/**
 * Configure static files middleware with caching and CORS
 */
const setupStaticFiles = (app) => {
  // Static files options
  const staticOptions = {
    etag: true,
    lastModified: true,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Set CORS headers for all static files
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');

      // Special handling for different file types
      if (filePath.endsWith('.pdf')) {
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'inline');
      } else if (filePath.endsWith('.xml')) {
        res.set('Content-Type', 'application/xml');
        res.set('Content-Disposition', 'inline');
      } else if (filePath.endsWith('.json')) {
        res.set('Content-Type', 'application/json');
      }
    }
  };

  // CORS middleware for uploads
  const uploadsMiddleware = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Embedder-Policy');
    next();
  };

  // Avatar uploads route
  app.use('/api/uploads/avatar', uploadsMiddleware, express.static(path.join(__dirname, '../uploads/avatar'), staticOptions));

  // Avatar file serving route
  app.get('/api/uploads/avatar/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/avatar', filename);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.removeHeader('Cross-Origin-Resource-Policy');

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Lỗi phục vụ avatar ${filename}:`, err);
        res.status(404).json({ 
          success: false,
          error: 'Avatar not found' 
        });
      }
    });
  });

  // Alternative avatar route (backward compatibility)
  app.use('/uploads/avatar', uploadsMiddleware, express.static(path.join(__dirname, '../uploads/avatar'), {
    ...staticOptions,
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
};

module.exports = setupStaticFiles;
