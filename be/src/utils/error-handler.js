/**
 * Lớp xử lý lỗi tập trung cho ứng dụng
 * Cung cấp các phương thức để tạo và xử lý lỗi một cách nhất quán
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || `ERR_${statusCode}`;
    this.data = data;
    this.success = false;
    this.isOperational = true; // Đánh dấu lỗi có thể xử lý được

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Lỗi xác thực (401)
 */
class AuthenticationError extends AppError {
  constructor(message = "Lỗi xác thực người dùng", errorCode = "ERR_AUTH", data = null) {
    super(message, 401, errorCode, data);
  }
}

/**
 * Lỗi phân quyền (403)
 */
class AuthorizationError extends AppError {
  constructor(message = "Không có quyền truy cập", errorCode = "ERR_FORBIDDEN", data = null) {
    super(message, 403, errorCode, data);
  }
}

/**
 * Lỗi không tìm thấy tài nguyên (404)
 */
class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy tài nguyên", errorCode = "ERR_NOT_FOUND", data = null) {
    super(message, 404, errorCode, data);
  }
}

/**
 * Lỗi dữ liệu không hợp lệ (400)
 */
class ValidationError extends AppError {
  constructor(message = "Dữ liệu không hợp lệ", errorCode = "ERR_VALIDATION", data = null) {
    super(message, 400, errorCode, data);
  }
}

/**
 * Lỗi xung đột dữ liệu (409)
 */
class ConflictError extends AppError {
  constructor(message = "Xung đột dữ liệu", errorCode = "ERR_CONFLICT", data = null) {
    super(message, 409, errorCode, data);
  }
}

/**
 * Lỗi máy chủ (500)
 */
class ServerError extends AppError {
  constructor(message = "Lỗi máy chủ nội bộ", errorCode = "ERR_SERVER", data = null) {
    super(message, 500, errorCode, data);
  }
}

/**
 * Xử lý lỗi từ Sequelize
 */
const handleSequelizeError = (error) => {
  // Xử lý lỗi validation của Sequelize
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return new ValidationError('Lỗi validation dữ liệu', 'ERR_VALIDATION', errors);
  }

  // Xử lý lỗi unique constraint
  if (error.name === 'SequelizeUniqueConstraintError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return new ConflictError('Dữ liệu đã tồn tại', 'ERR_DUPLICATE', errors);
  }

  // Xử lý lỗi foreign key
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new ValidationError('Lỗi khóa ngoại', 'ERR_FOREIGN_KEY');
  }

  // Xử lý lỗi database khác
  if (error.name === 'SequelizeDatabaseError') {
    return new ServerError('Lỗi cơ sở dữ liệu', 'ERR_DATABASE');
  }

  // Trả về lỗi mặc định nếu không xử lý được
  return new ServerError(error.message);
};

/**
 * Xử lý lỗi JWT
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token đã hết hạn', 'ERR_TOKEN_EXPIRED');
  }
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Token không hợp lệ', 'ERR_INVALID_TOKEN');
  }
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token chưa có hiệu lực', 'ERR_TOKEN_NOT_ACTIVE');
  }
  return new AuthenticationError('Lỗi xác thực', 'ERR_AUTH');
};

/**
 * Xử lý lỗi Multer
 */
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File quá lớn', 'ERR_FILE_TOO_LARGE');
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Loại file không được hỗ trợ', 'ERR_UNSUPPORTED_FILE');
  }
  return new ValidationError(`Lỗi upload file: ${error.message}`, 'ERR_UPLOAD');
};

module.exports = {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ServerError,
  handleSequelizeError,
  handleJWTError,
  handleMulterError
};
