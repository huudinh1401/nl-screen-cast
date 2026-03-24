const Permission = require("./permission.model");
const { Op } = require('sequelize');

// Get all permissions with pagination and filters
const getAllPermissions = async (options = {}) => {
  const {
    page = 1,
    limit = 50, // Higher default for permissions as there are usually fewer
    search = '',
    resource = null,
    action = null,
    isActive = null,
    sortBy = 'resource',
    sortOrder = 'ASC'
  } = options;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Search filter
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { resource: { [Op.like]: `%${search}%` } }
    ];
  }

  // Resource filter
  if (resource) {
    whereClause.resource = resource;
  }

  // Action filter
  if (action) {
    whereClause.action = action;
  }

  // Active status filter
  if (isActive !== null) {
    whereClause.isActive = isActive;
  }

  const { count, rows } = await Permission.findAndCountAll({
    where: whereClause,
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    permissions: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Get permission by ID
const getPermissionById = async (id) => {
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw new Error("Permission không tồn tại");
  }
  return permission;
};

// Create new permission
const createPermission = async (permissionData) => {
  const { name, description, resource, action } = permissionData;

  // Check if permission already exists
  const existingPermission = await Permission.findOne({
    where: {
      [Op.or]: [
        { name },
        { resource, action }
      ]
    }
  });

  if (existingPermission) {
    throw new Error("Permission đã tồn tại với tên này hoặc resource/action này");
  }

  // Create permission
  const newPermission = await Permission.create({
    name,
    description,
    resource,
    action,
    isActive: true,
    isSystem: false
  });

  return newPermission;
};

// Update permission
const updatePermission = async (id, updateData) => {
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw new Error("Permission không tồn tại");
  }

  // Check if permission is system permission
  if (permission.isSystem && (updateData.resource || updateData.action)) {
    throw new Error("Không thể thay đổi resource/action của system permission");
  }

  // Check if updating name and it already exists
  if (updateData.name && updateData.name !== permission.name) {
    const existingPermission = await Permission.findOne({
      where: {
        name: updateData.name,
        id: { [Op.ne]: id }
      }
    });
    if (existingPermission) {
      throw new Error("Tên permission đã được sử dụng");
    }
  }

  // Check if updating resource/action combination already exists
  if ((updateData.resource || updateData.action) && 
      (updateData.resource !== permission.resource || updateData.action !== permission.action)) {
    const resource = updateData.resource || permission.resource;
    const action = updateData.action || permission.action;
    
    const existingPermission = await Permission.findOne({
      where: {
        resource,
        action,
        id: { [Op.ne]: id }
      }
    });
    if (existingPermission) {
      throw new Error("Resource/action combination đã tồn tại");
    }
  }

  // Update permission
  await permission.update(updateData);
  return permission;
};

// Delete permission (soft delete by deactivating)
const deletePermission = async (id) => {
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw new Error("Permission không tồn tại");
  }

  // Check if permission is system permission
  if (permission.isSystem) {
    throw new Error("Không thể xóa system permission");
  }

  // Check if permission is being used by roles
  const { RolePermission } = require("../../config/associations");
  const usageCount = await RolePermission.count({ where: { permissionId: id } });
  if (usageCount > 0) {
    throw new Error(`Không thể xóa permission này vì đang được sử dụng bởi ${usageCount} role(s)`);
  }

  // Soft delete by deactivating
  await permission.update({ isActive: false });

  return { success: true, message: "Đã xóa permission thành công" };
};

// Hard delete permission (Admin only, dangerous)
const hardDeletePermission = async (id) => {
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw new Error("Permission không tồn tại");
  }

  // Check if permission is system permission
  if (permission.isSystem) {
    throw new Error("Không thể xóa system permission");
  }

  // Remove all role associations
  const { RolePermission } = require("../../config/associations");
  await RolePermission.destroy({ where: { permissionId: id } });

  // Delete permission
  await permission.destroy();

  return { success: true, message: "Đã xóa permission vĩnh viễn" };
};

// Toggle permission status
const togglePermissionStatus = async (id) => {
  const permission = await Permission.findByPk(id);
  if (!permission) {
    throw new Error("Permission không tồn tại");
  }

  // Check if permission is system permission
  if (permission.isSystem && permission.isActive) {
    throw new Error("Không thể vô hiệu hóa system permission");
  }

  await permission.update({ isActive: !permission.isActive });

  return {
    success: true,
    message: `Đã ${permission.isActive ? 'kích hoạt' : 'vô hiệu hóa'} permission`,
    isActive: permission.isActive
  };
};

// Get permissions by resource
const getPermissionsByResource = async (resource) => {
  const permissions = await Permission.findAll({
    where: {
      resource,
      isActive: true
    },
    order: [['action', 'ASC']]
  });

  return permissions;
};

// Get available resources
const getAvailableResources = async () => {
  const resources = await Permission.findAll({
    attributes: ['resource'],
    group: ['resource'],
    order: [['resource', 'ASC']]
  });

  return resources.map(p => p.resource);
};

// Get available actions
const getAvailableActions = async () => {
  const actions = ['create', 'read', 'update', 'delete', 'manage'];
  return actions;
};

// Bulk create permissions for a resource
const createResourcePermissions = async (resource, description = '') => {
  const actions = ['create', 'read', 'update', 'delete', 'manage'];
  const permissions = [];

  for (const action of actions) {
    const name = `${resource}:${action}`;
    const permissionDescription = description || `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      where: { resource, action }
    });

    if (!existingPermission) {
      const permission = await Permission.create({
        name,
        description: permissionDescription,
        resource,
        action,
        isActive: true,
        isSystem: false
      });
      permissions.push(permission);
    }
  }

  return permissions;
};

// Get permission statistics
const getPermissionStats = async () => {
  const totalPermissions = await Permission.count();
  const activePermissions = await Permission.count({ where: { isActive: true } });
  const systemPermissions = await Permission.count({ where: { isSystem: true } });
  const customPermissions = totalPermissions - systemPermissions;

  // Get permissions grouped by resource
  const permissionsByResource = await Permission.findAll({
    attributes: [
      'resource',
      [Permission.sequelize.fn('COUNT', Permission.sequelize.col('id')), 'count']
    ],
    group: ['resource'],
    order: [['resource', 'ASC']]
  });

  // Get permissions grouped by action
  const permissionsByAction = await Permission.findAll({
    attributes: [
      'action',
      [Permission.sequelize.fn('COUNT', Permission.sequelize.col('id')), 'count']
    ],
    group: ['action'],
    order: [['action', 'ASC']]
  });

  return {
    totalPermissions,
    activePermissions,
    inactivePermissions: totalPermissions - activePermissions,
    systemPermissions,
    customPermissions,
    permissionsByResource,
    permissionsByAction
  };
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  hardDeletePermission,
  togglePermissionStatus,
  getPermissionsByResource,
  getAvailableResources,
  getAvailableActions,
  createResourcePermissions,
  getPermissionStats
};