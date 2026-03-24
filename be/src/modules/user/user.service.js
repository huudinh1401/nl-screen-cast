const User = require("./user.model");
const bcrypt = require("bcryptjs");
const { Op } = require('sequelize');

// Get all users with pagination and filters
const getAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    roleId = null,
    isActive = null,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Search filter
  if (search) {
    whereClause[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { fullname: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }

  // Role filter
  if (roleId) {
    whereClause.role_id = roleId;
  }

  // Active status filter
  if (isActive !== null) {
    whereClause.isActive = isActive;
  }

  const { count, rows } = await User.findAndCountAll({
    where: whereClause,
    include: [
      {
        association: 'Role',
        attributes: ['id', 'name', 'description']
      }
    ],
    attributes: {
      exclude: ['password', 'refreshToken']
    },
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    users: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Get user by ID
const getUserById = async (id) => {
  const user = await User.findOne({
    where: { id },
    include: [
      {
        association: 'Role',
        attributes: ['id', 'name', 'description']
      }
    ],
    attributes: {
      exclude: ['password', 'refreshToken']
    }
  });

  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  return user;
};

// Create new user
const createUser = async (userData) => {
  const { username, email, password, fullname, phone, role_id = 2 } = userData;

  // Check if user exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email }
      ]
    }
  });

  if (existingUser) {
    throw new Error("Username hoặc email đã được sử dụng");
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    fullname,
    phone,
    role_id,
    isActive: true
  });

  // Return user without sensitive data
  const { password: _, refreshToken: __, ...userWithoutSensitiveData } = newUser.toJSON();
  return userWithoutSensitiveData;
};

// Update user
const updateUser = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  // Check if username/email already exists (exclude current user)
  if (updateData.username || updateData.email) {
    const whereConditions = [];
    if (updateData.username) whereConditions.push({ username: updateData.username });
    if (updateData.email) whereConditions.push({ email: updateData.email });

    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { [Op.or]: whereConditions },
          { id: { [Op.ne]: id } }
        ]
      }
    });

    if (existingUser) {
      throw new Error("Username hoặc email đã được sử dụng");
    }
  }

  // Remove password and refreshToken from update data for security
  const { password, refreshToken, ...safeUpdateData } = updateData;

  await user.update(safeUpdateData);

  // Return updated user
  return await getUserById(id);
};

// Change user password
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Mật khẩu hiện tại không đúng");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear refresh token
  await user.update({
    password: hashedPassword,
    refreshToken: null
  });

  return { success: true, message: "Đổi mật khẩu thành công" };
};

// Reset user password (Admin only)
const resetPassword = async (userId, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear refresh token
  await user.update({
    password: hashedPassword,
    refreshToken: null
  });

  return { success: true, message: "Reset mật khẩu thành công" };
};

// Toggle user active status
const toggleUserStatus = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  await user.update({
    isActive: !user.isActive,
    refreshToken: user.isActive ? null : user.refreshToken // Clear token if deactivating
  });

  return {
    success: true,
    message: `Đã ${user.isActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`,
    isActive: user.isActive
  };
};

// Delete user (soft delete by deactivating)
const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  // Soft delete by deactivating
  await user.update({
    isActive: false,
    refreshToken: null
  });

  return { success: true, message: "Đã xóa người dùng" };
};

// Update user avatar
const updateAvatar = async (userId, avatarPath) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  await user.update({ avatar: avatarPath });

  return {
    success: true,
    message: "Cập nhật avatar thành công",
    avatar: avatarPath
  };
};

// Get user statistics
const getUserStats = async () => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: []
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      usersByRole: []
    };
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  resetPassword,
  toggleUserStatus,
  deleteUser,
  updateAvatar,
  getUserStats
};