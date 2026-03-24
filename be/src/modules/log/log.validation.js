const { body, param, query } = require('express-validator');

// Create log validation
const createLogValidation = [
  body('content')
    .notEmpty()
    .withMessage('Content là bắt buộc')
    .isLength({ max: 1000 })
    .withMessage('Content không được quá 1000 ký tự'),
  body('action')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Action không được quá 100 ký tự'),
  body('resource')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Resource không được quá 100 ký tự'),
  body('resourceId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Resource ID phải là số nguyên dương'),
  body('source')
    .optional()
    .isIn(['auth', 'user_management', 'role_management', 'permission_management', 'system', 'api'])
    .withMessage('Source không hợp lệ'),
  body('level')
    .optional()
    .isIn(['info', 'warning', 'error', 'debug'])
    .withMessage('Level phải là: info, warning, error, debug'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata phải là object')
];

// Delete old logs validation
const deleteOldLogsValidation = [
  body('daysToKeep')
    .isInt({ min: 1, max: 365 })
    .withMessage('Days to keep phải từ 1-365 ngày')
];

// ID validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

// User ID validation
const userIdValidation = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID phải là số nguyên dương')
];

// Get logs query validation
const getLogsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID phải là số nguyên dương'),
  query('source')
    .optional()
    .isIn(['auth', 'user_management', 'role_management', 'permission_management', 'system', 'api'])
    .withMessage('Source không hợp lệ'),
  query('level')
    .optional()
    .isIn(['info', 'warning', 'error', 'debug'])
    .withMessage('Level không hợp lệ'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date phải là ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date phải là ISO8601 format'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'content', 'source', 'level', 'action'])
    .withMessage('sortBy không hợp lệ'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder phải là ASC hoặc DESC')
];

// Export logs query validation
const exportLogsQueryValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date phải là ISO8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date phải là ISO8601 format'),
  query('source')
    .optional()
    .isIn(['auth', 'user_management', 'role_management', 'permission_management', 'system', 'api'])
    .withMessage('Source không hợp lệ'),
  query('level')
    .optional()
    .isIn(['info', 'warning', 'error', 'debug'])
    .withMessage('Level không hợp lệ'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50000 })
    .withMessage('Limit phải từ 1-50000')
];

module.exports = {
  createLogValidation,
  deleteOldLogsValidation,
  idValidation,
  userIdValidation,
  getLogsQueryValidation,
  exportLogsQueryValidation
};
