const Role = require("./role.model");
const Permission = require("../permission/permission.model");
const { RolePermission } = require("../../config/associations");
const { Op } = require('sequelize');

// Get all roles with pagination and filters
const getAllRoles = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    isActive = null,
    includePermissions = false,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Search filter
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  // Active status filter
  if (isActive !== null) {
    whereClause.isActive = isActive;
  }

  const includeOptions = [];
  if (includePermissions) {
    includeOptions.push({
      model: Permission,
      as: 'Permissions',
      through: { attributes: [] },
      attributes: ['id', 'name', 'description', 'resource', 'action']
    });
  }

  const { count, rows } = await Role.findAndCountAll({
    where: whereClause,
    include: includeOptions,
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    roles: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Get role by ID
const getRoleById = async (id, includePermissions = true) => {
  const includeOptions = [];
  if (includePermissions) {
    includeOptions.push({
      model: Permission,
      as: 'Permissions',
      through: { attributes: [] },
      attributes: ['id', 'name', 'description', 'resource', 'action']
    });
  }

  const role = await Role.findOne({
    where: { id },
    include: includeOptions
  });

  if (!role) {
    throw new Error("Role không tồn tại");
  }

  return role;
};

// Create new role
const createRole = async (roleData) => {
  const { name, description, permissionIds = [] } = roleData;

  // Check if role name exists
  const existingRole = await Role.findOne({ where: { name } });
  if (existingRole) {
    throw new Error("Tên role đã được sử dụng");
  }

  // Create role
  const newRole = await Role.create({
    name,
    description,
    isActive: true
  });

  // Assign permissions if provided
  if (permissionIds.length > 0) {
    await assignPermissionsToRole(newRole.id, permissionIds);
  }

  // Return role with permissions
  return await getRoleById(newRole.id);
};

// Update role
const updateRole = async (id, updateData) => {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  // Check if updating name and it already exists
  if (updateData.name && updateData.name !== role.name) {
    const existingRole = await Role.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: id }
      }
    });
    if (existingRole) {
      throw new Error("Tên role đã được sử dụng");
    }
  }

  // Remove permissionIds from update data
  const { permissionIds, ...roleUpdateData } = updateData;

  // Update role
  await role.update(roleUpdateData);

  // Update permissions if provided
  if (permissionIds !== undefined) {
    await assignPermissionsToRole(id, permissionIds);
  }

  // Return updated role with permissions
  return await getRoleById(id);
};

// Delete role (soft delete by deactivating)
const deleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  // Check if role is default role
  if (role.isDefault) {
    throw new Error("Không thể xóa role mặc định");
  }

  // Check if role is being used by users
  const User = require("../user/user.model");
  const userCount = await User.count({ where: { role_id: id } });
  if (userCount > 0) {
    throw new Error(`Không thể xóa role này vì đang được sử dụng bởi ${userCount} người dùng`);
  }

  // Soft delete by deactivating
  await role.update({ isActive: false });

  return { success: true, message: "Đã xóa role thành công" };
};

// Hard delete role (Admin only, dangerous)
const hardDeleteRole = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  // Check if role is default role
  if (role.isDefault) {
    throw new Error("Không thể xóa role mặc định");
  }

  // Remove all permissions
  await RolePermission.destroy({ where: { roleId: id } });

  // Delete role
  await role.destroy();

  return { success: true, message: "Đã xóa role vĩnh viễn" };
};

// Assign permissions to role
const assignPermissionsToRole = async (roleId, permissionIds) => {
  // Validate role exists
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  // Validate all permissions exist
  if (permissionIds.length > 0) {
    const existingPermissions = await Permission.findAll({
      where: { id: { [Op.in]: permissionIds } }
    });
    if (existingPermissions.length !== permissionIds.length) {
      throw new Error("Một hoặc nhiều permission không tồn tại");
    }
  }

  // Remove all existing permissions for this role
  await RolePermission.destroy({ where: { roleId } });

  // Add new permissions
  if (permissionIds.length > 0) {
    const rolePermissions = permissionIds.map(permissionId => ({
      roleId,
      permissionId
    }));
    await RolePermission.bulkCreate(rolePermissions);
  }

  return { success: true, message: "Cập nhật permissions thành công" };
};

// Get permissions for a role
const getRolePermissions = async (roleId) => {
  const role = await Role.findOne({
    where: { id: roleId },
    include: [{
      model: Permission,
      as: 'Permissions',
      through: { attributes: [] },
      attributes: ['id', 'name', 'description', 'resource', 'action']
    }]
  });

  if (!role) {
    throw new Error("Role không tồn tại");
  }

  return role.Permissions || [];
};

// Toggle role status
const toggleRoleStatus = async (id) => {
  const role = await Role.findByPk(id);
  if (!role) {
    throw new Error("Role không tồn tại");
  }

  // Check if role is default role
  if (role.isDefault && role.isActive) {
    throw new Error("Không thể vô hiệu hóa role mặc định");
  }

  await role.update({ isActive: !role.isActive });

  return {
    success: true,
    message: `Đã ${role.isActive ? 'kích hoạt' : 'vô hiệu hóa'} role`,
    isActive: role.isActive
  };
};

// Get role statistics
const getRoleStats = async () => {
  const totalRoles = await Role.count();
  const activeRoles = await Role.count({ where: { isActive: true } });
  const inactiveRoles = totalRoles - activeRoles;

  // Get roles with user counts
  const rolesWithUserCounts = await Role.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'isActive',
      [Role.sequelize.literal('(SELECT COUNT(*) FROM users WHERE users.role_id = Role.id)'), 'userCount']
    ],
    order: [['name', 'ASC']]
  });

  return {
    totalRoles,
    activeRoles,
    inactiveRoles,
    rolesWithUserCounts
  };
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  hardDeleteRole,
  assignPermissionsToRole,
  getRolePermissions,
  toggleRoleStatus,
  getRoleStats
};