const { body, param, query } = require('express-validator');

// Create permission validation
const createPermissionValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên permission phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_:\s-]+$/)
    .withMessage('Tên permission chỉ được chứa chữ cái, số, dấu gạch dưới, hai chấm, khoảng trắng và dấu gạch ngang'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Mô tả không được quá 255 ký tự'),
  body('resource')
    .isLength({ min: 2, max: 50 })
    .withMessage('Resource phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Resource chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  body('action')
    .isIn(['create', 'read', 'update', 'delete', 'manage'])
    .withMessage('Action phải là một trong: create, read, update, delete, manage')
];

// Update permission validation
const updatePermissionValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên permission phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_:\s-]+$/)
    .withMessage('Tên permission chỉ được chứa chữ cái, số, dấu gạch dưới, hai chấm, khoảng trắng và dấu gạch ngang'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Mô tả không được quá 255 ký tự'),
  body('resource')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Resource phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Resource chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  body('action')
    .optional()
    .isIn(['create', 'read', 'update', 'delete', 'manage'])
    .withMessage('Action phải là một trong: create, read, update, delete, manage'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean')
];

// Create resource permissions validation
const createResourcePermissionsValidation = [
  body('resource')
    .isLength({ min: 2, max: 50 })
    .withMessage('Resource phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Resource chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Mô tả không được quá 255 ký tự')
];

// ID validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

// Resource validation
const resourceValidation = [
  param('resource')
    .isLength({ min: 2, max: 50 })
    .withMessage('Resource phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Resource chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang')
];

// Get permissions query validation
const getPermissionsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  query('resource')
    .optional()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Resource không hợp lệ'),
  query('action')
    .optional()
    .isIn(['create', 'read', 'update', 'delete', 'manage'])
    .withMessage('Action không hợp lệ'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive phải là true hoặc false'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'resource', 'action'])
    .withMessage('sortBy không hợp lệ'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder phải là ASC hoặc DESC')
];

module.exports = {
  createPermissionValidation,
  updatePermissionValidation,
  createResourcePermissionsValidation,
  idValidation,
  resourceValidation,
  getPermissionsQueryValidation
};
