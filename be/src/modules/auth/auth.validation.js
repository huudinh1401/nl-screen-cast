const { body } = require('express-validator');

// Register validation
const registerValidation = [
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
    body('role_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Role ID phải là số nguyên dương')
];

// Login validation
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username hoặc email là bắt buộc'),
    body('password')
        .notEmpty()
        .withMessage('Password là bắt buộc')
];

// Change password validation
const changePasswordValidation = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Mật khẩu cũ là bắt buộc'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
];

module.exports = {
    registerValidation,
    loginValidation,
    changePasswordValidation
};
