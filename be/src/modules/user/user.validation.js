const { body, param, query } = require('express-validator');

// Create user validation
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username phải từ 3-50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  body('fullname')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Fullname không được quá 100 ký tự'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Phone number không hợp lệ'),
  body('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID phải là số nguyên dương')
];

// Update user validation
const updateUserValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username phải từ 3-50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('fullname')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Fullname không được quá 100 ký tự'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Phone number không hợp lệ'),
  body('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID phải là số nguyên dương'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications phải là boolean')
];

// Update profile validation
const updateProfileValidation = [
  body('fullname')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Fullname không được quá 100 ký tự'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Phone number không hợp lệ'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications phải là boolean')
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
];

// ID validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

// Get users query validation
const getUsersQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải từ 1-100'),
  query('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID phải là số nguyên dương'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive phải là true hoặc false'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'username', 'email', 'fullname'])
    .withMessage('sortBy không hợp lệ'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder phải là ASC hoặc DESC')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  updateProfileValidation,
  changePasswordValidation,
  idValidation,
  getUsersQueryValidation
};
