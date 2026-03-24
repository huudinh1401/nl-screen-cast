const userService = require("./user.service");
const logService = require('../log/log.service');
const { validationResult } = require('express-validator');

// Get all users with pagination and filters
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      roleId = null,
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const result = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      roleId: roleId ? parseInt(roleId) : null,
      isActive: isActive !== null ? isActive === 'true' : null,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array()
      });
    }

    const userData = req.body;
    const newUser = await userService.createUser(userData);

    // Log user creation
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Tạo người dùng mới: ${newUser.username}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(201).json({
      success: true,
      message: "Tạo người dùng thành công",
      data: newUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(id, updateData);

    // Log user update
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Cập nhật thông tin người dùng ID: ${id}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user can change this password (own account or admin)
    if (req.user.id !== parseInt(id) && req.user.Role?.name !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thay đổi mật khẩu này"
      });
    }

    const result = await userService.changePassword(id, currentPassword, newPassword);

    // Log password change
    const logData = {
      user_id: req.user.id,
      noi_dung: `Thay đổi mật khẩu cho user ID: ${id}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Reset password (Admin only)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới là bắt buộc"
      });
    }

    const result = await userService.resetPassword(id, newPassword);

    // Log password reset
    const logData = {
      user_id: req.user.id,
      noi_dung: `[ADMIN_ACTION] Reset mật khẩu cho user ID: ${id}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.toggleUserStatus(id);

    // Log status change
    const logData = {
      user_id: req.user.id,
      noi_dung: `Thay đổi trạng thái user ID: ${id} - ${result.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: "Bạn không thể xóa tài khoản của chính mình"
      });
    }

    const result = await userService.deleteUser(id);

    // Log user deletion
    const logData = {
      user_id: req.user.id,
      noi_dung: `Xóa người dùng ID: ${id}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update user avatar
const updateAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file avatar được upload"
      });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const result = await userService.updateAvatar(id, avatarPath);

    // Log avatar update
    const logData = {
      user_id: req.user.id,
      noi_dung: `Cập nhật avatar cho user ID: ${id}`,
      source: 'user_management'
    };
    await logService.addLog(logData);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await userService.getUserStats();

    res.status(200).json({
      success: true,
      message: "Lấy thống kê người dùng thành công",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin profile thành công",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array()
      });
    }

    // Only allow certain fields for profile update
    const allowedFields = ['fullname', 'phone', 'emailNotifications'];
    const updateData = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const updatedUser = await userService.updateUser(req.user.id, updateData);

    // Log profile update
    const logData = {
      user_id: req.user.id,
      noi_dung: `Cập nhật thông tin profile`,
      source: 'user_profile'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Cập nhật profile thành công",
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  resetPassword,
  toggleUserStatus,
  deleteUser,
  updateAvatar,
  getUserStats,
  getProfile,
  updateProfile
};