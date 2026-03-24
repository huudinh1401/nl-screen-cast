/**
 * Middleware xử lý phân trang
 * Cung cấp các phương thức để xử lý phân trang một cách nhất quán
 */

/**
 * Middleware xử lý phân trang
 * @param {Object} options - Các tùy chọn phân trang
 * @param {number} options.defaultLimit - Số lượng bản ghi mặc định trên mỗi trang
 * @param {number} options.maxLimit - Số lượng bản ghi tối đa trên mỗi trang
 * @returns {Function} Middleware Express
 */
const paginationMiddleware = (options = {}) => {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  return (req, res, next) => {
    // Lấy tham số phân trang từ query
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || defaultLimit;

    // Giới hạn số lượng bản ghi tối đa
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    // Tính offset
    const offset = (page - 1) * limit;

    // Thêm thông tin phân trang vào request
    req.pagination = {
      page,
      limit,
      offset
    };

    next();
  };
};

/**
 * Tạo đối tượng phân trang từ kết quả truy vấn
 * @param {Object} options - Các tùy chọn phân trang
 * @param {number} options.count - Tổng số bản ghi
 * @param {Array} options.rows - Dữ liệu của trang hiện tại
 * @param {number} options.page - Trang hiện tại
 * @param {number} options.limit - Số lượng bản ghi trên mỗi trang
 * @returns {Object} Đối tượng phân trang
 */
const paginate = (options) => {
  const { count, rows, page, limit } = options;
  const totalPages = Math.ceil(count / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: rows,
    pagination: {
      total: count,
      totalPages,
      currentPage: page,
      limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    }
  };
};

/**
 * Tạo điều kiện phân trang cho Sequelize
 * @param {Object} pagination - Thông tin phân trang
 * @returns {Object} Điều kiện phân trang cho Sequelize
 */
const getPaginationOptions = (pagination) => {
  return {
    limit: pagination.limit,
    offset: pagination.offset
  };
};

module.exports = {
  paginationMiddleware,
  paginate,
  getPaginationOptions
};
