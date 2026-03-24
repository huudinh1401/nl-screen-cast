/**
 * Middleware xử lý lỗi tập trung
 */
const { 
  AppError, 
  handleSequelizeError, 
  handleJWTError, 
  handleMulterError 
} = require('../utils/error-handler');
const multer = require('multer');

/**
 * Middleware bắt lỗi và xử lý nhất quán
 */
const errorHandler = (err, req, res, next) => {
  console.error('Lỗi hệ thống:', err);

  // Ghi log lỗi chi tiết
  console.error('Chi tiết lỗi:', err.stack);

  // Xử lý các loại lỗi cụ thể
  let error = err;

  // Xử lý lỗi Sequelize
  if (err.name && err.name.includes('Sequelize')) {
    error = handleSequelizeError(err);
  }

  // Xử lý lỗi JWT
  if (err.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
    error = handleJWTError(err);
  }

  // Xử lý lỗi Multer
  if (err instanceof multer.MulterError) {
    error = handleMulterError(err);
  }

  // Xử lý lỗi CORS
  if (err.message === 'Not allowed by CORS') {
    error = new AppError('CORS không cho phép truy cập từ domain này', 403, 'ERR_CORS');
  }

  // Xử lý lỗi timeout
  if (err.name === 'TimeoutError') {
    error = new AppError('Quá thời gian xử lý yêu cầu', 504, 'ERR_TIMEOUT');
  }

  // Xử lý lỗi file không tồn tại
  if (err.code === 'ENOENT') {
    error = new AppError('Không tìm thấy tài liệu', 404, 'ERR_FILE_NOT_FOUND');
  }

  // Nếu là AppError (lỗi đã được xử lý), trả về response tương ứng
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.statusCode,
      code: error.errorCode,
      message: error.message,
      data: error.data
    });
  }

  // Nếu là lỗi chưa được xử lý, trả về lỗi server 500
  return res.status(500).json({
    success: false,
    status: 500,
    code: 'ERR_SERVER',
    message: 'Lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

/**
 * Middleware bắt lỗi 404 cho các route không tồn tại
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Không tìm thấy ${req.originalUrl}`, 404, 'ERR_NOT_FOUND');
  next(error);
};

/**
 * Middleware bắt lỗi async
 * Giúp bắt lỗi trong các hàm async mà không cần try-catch
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
