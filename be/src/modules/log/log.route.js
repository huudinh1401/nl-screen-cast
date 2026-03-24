const express = require('express');
const router = express.Router();
const logController = require('./log.controller');
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");
const {
  createLogValidation,
  deleteOldLogsValidation,
  idValidation,
  userIdValidation,
  getLogsQueryValidation,
  exportLogsQueryValidation
} = require("./log.validation");

// Public routes (for authenticated users)
router.get('/my-logs', authenticate, getLogsQueryValidation, logController.getMyLogs);

// Log management routes (Admin and Manager)
router.get('/', authenticate, authorizeRoles('Admin', 'Manager'), getLogsQueryValidation, logController.getAllLogs);
router.get('/stats', authenticate, authorizeRoles('Admin', 'Manager'), logController.getLogStats);
router.get('/export', authenticate, authorizeRoles('Admin'), exportLogsQueryValidation, logController.exportLogs);
router.get('/user/:userId', authenticate, userIdValidation, getLogsQueryValidation, logController.getLogsByUser);
router.get('/:id', authenticate, authorizeRoles('Admin', 'Manager'), idValidation, logController.getLogById);

// Admin only routes
router.post('/', authenticate, authorizeRoles('Admin'), createLogValidation, logController.createLog);
router.delete('/cleanup', authenticate, authorizeRoles('Admin'), deleteOldLogsValidation, logController.deleteOldLogs);

module.exports = router; 
