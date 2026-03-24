const { body, param, query } = require('express-validator');

// Create role validation
const createRoleValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên role phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_\s]+$/)
    .withMessage('Tên role chỉ được chứa chữ cái, số, dấu gạch dưới và khoảng trắng'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Mô tả không được quá 255 ký tự'),
  body('permissionIds')
    .optional()
    .isArray()
    .withMessage('Permission IDs phải là mảng'),
  body('permissionIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Permission ID phải là số nguyên dương')
];

// Update role validation
const updateRoleValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên role phải từ 2-50 ký tự')
    .matches(/^[a-zA-Z0-9_\s]+$/)
    .withMessage('Tên role chỉ được chứa chữ cái, số, dấu gạch dưới và khoảng trắng'),
  body('description')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Mô tả không được quá 255 ký tự'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
  body('permissionIds')
    .optional()
    .isArray()
    .withMessage('Permission IDs phải là mảng'),
  body('permissionIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Permission ID phải là số nguyên dương')
];

// Assign permissions validation
const assignPermissionsValidation = [
  body('permissionIds')
    .isArray()
    .withMessage('Permission IDs phải là mảng')
    .notEmpty()
    .withMessage('Permission IDs không được để trống'),
  body('permissionIds.*')
    .isInt({ min: 1 })
    .withMessage('Permission ID phải là số nguyên dương')
];

// ID validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

// Get roles query validation
const getRolesQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive phải là true hoặc false'),
  query('includePermissions')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includePermissions phải là true hoặc false'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'description'])
    .withMessage('sortBy không hợp lệ'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder phải là ASC hoặc DESC')
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  assignPermissionsValidation,
  idValidation,
  getRolesQueryValidation
};
