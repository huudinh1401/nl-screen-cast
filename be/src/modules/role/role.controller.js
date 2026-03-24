const roleService = require('./role.service');
const logService = require('../log/log.service');
const { validationResult } = require('express-validator');

// Get all roles with pagination and filters
const getAllRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive = null,
      includePermissions = 'true',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const result = await roleService.getAllRoles({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      isActive: isActive !== null ? isActive === 'true' : null,
      includePermissions: includePermissions === 'true',
      sortBy,
      sortOrder
    });

    // Log action
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xem danh sách roles`,
      source: 'role_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách roles thành công",
      data: result.roles,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includePermissions = 'true' } = req.query;
    
    const role = await roleService.getRoleById(id, includePermissions === 'true');

    // Log action
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xem chi tiết role ID: ${id}`,
      source: 'role_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin role thành công",
      data: role
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create new role
const createRole = async (req, res) => {
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

    const roleData = req.body;
    const newRole = await roleService.createRole(roleData);

    // Log role creation
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Tạo role mới: ${newRole.name}`,
      source: 'role_management'
    };
    await logService.addLog(logData);

    res.status(201).json({
      success: true,
      message: "Tạo role thành công",
      data: newRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update role
const updateRole = async (req, res) => {
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
    
    const updatedRole = await roleService.updateRole(id, updateData);

    // Log role update
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Cập nhật role ID: ${id}`,
      source: 'role_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Cập nhật role thành công",
      data: updatedRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roleService.deleteRole(id);

    // Log role deletion
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xóa role ID: ${id}`,
      source: 'role_management'
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

// Hard delete role (Admin only)
const hardDeleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roleService.hardDeleteRole(id);

    // Log hard deletion
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `[ADMIN_ACTION] Hard delete role ID: ${id}`,
      source: 'role_management'
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

// Assign permissions to role
const assignPermissions = async (req, res) => {
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
    const { permissionIds } = req.body;
    
    const result = await roleService.assignPermissionsToRole(id, permissionIds);

    // Log permission assignment
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Gán permissions cho role ID: ${id}`,
      source: 'role_management'
    };
    await logService.addLog(logData);

    // Return updated role with permissions
    const updatedRole = await roleService.getRoleById(id);

    res.status(200).json({
      success: true,
      message: "Gán permissions thành công",
      data: updatedRole
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get role permissions
const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await roleService.getRolePermissions(id);

    res.status(200).json({
      success: true,
      message: "Lấy permissions của role thành công",
      data: permissions
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle role status
const toggleRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roleService.toggleRoleStatus(id);

    // Log status change
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Thay đổi trạng thái role ID: ${id} - ${result.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}`,
      source: 'role_management'
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

// Get role statistics
const getRoleStats = async (req, res) => {
  try {
    const stats = await roleService.getRoleStats();

    res.status(200).json({
      success: true,
      message: "Lấy thống kê roles thành công",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  hardDeleteRole,
  assignPermissions,
  getRolePermissions,
  toggleRoleStatus,
  getRoleStats
};