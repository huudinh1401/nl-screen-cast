const permissionService = require('./permission.service');
const logService = require('../log/log.service');
const { validationResult } = require('express-validator');

// Get all permissions with pagination and filters
const getAllPermissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      resource = null,
      action = null,
      isActive = null,
      sortBy = 'resource',
      sortOrder = 'ASC'
    } = req.query;

    const result = await permissionService.getAllPermissions({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      resource,
      action,
      isActive: isActive !== null ? isActive === 'true' : null,
      sortBy,
      sortOrder
    });

    // Log action
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xem danh sách permissions`,
      source: 'permission_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách permissions thành công",
      data: result.permissions,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get permission by ID
const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const permission = await permissionService.getPermissionById(id);

    // Log action
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xem chi tiết permission ID: ${id}`,
      source: 'permission_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin permission thành công",
      data: permission
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create new permission
const createPermission = async (req, res) => {
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

    const permissionData = req.body;
    const newPermission = await permissionService.createPermission(permissionData);

    // Log permission creation
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Tạo permission mới: ${newPermission.name}`,
      source: 'permission_management'
    };
    await logService.addLog(logData);

    res.status(201).json({
      success: true,
      message: "Tạo permission thành công",
      data: newPermission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update permission
const updatePermission = async (req, res) => {
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
    
    const updatedPermission = await permissionService.updatePermission(id, updateData);

    // Log permission update
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Cập nhật permission ID: ${id}`,
      source: 'permission_management'
    };
    await logService.addLog(logData);

    res.status(200).json({
      success: true,
      message: "Cập nhật permission thành công",
      data: updatedPermission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete permission
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await permissionService.deletePermission(id);

    // Log permission deletion
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Xóa permission ID: ${id}`,
      source: 'permission_management'
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

// Hard delete permission (Admin only)
const hardDeletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await permissionService.hardDeletePermission(id);

    // Log hard deletion
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `[ADMIN_ACTION] Hard delete permission ID: ${id}`,
      source: 'permission_management'
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

// Toggle permission status
const togglePermissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await permissionService.togglePermissionStatus(id);

    // Log status change
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Thay đổi trạng thái permission ID: ${id} - ${result.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'}`,
      source: 'permission_management'
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

// Get permissions by resource
const getPermissionsByResource = async (req, res) => {
  try {
    const { resource } = req.params;
    const permissions = await permissionService.getPermissionsByResource(resource);

    res.status(200).json({
      success: true,
      message: "Lấy permissions theo resource thành công",
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available resources
const getAvailableResources = async (req, res) => {
  try {
    const resources = await permissionService.getAvailableResources();

    res.status(200).json({
      success: true,
      message: "Lấy danh sách resources thành công",
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available actions
const getAvailableActions = async (req, res) => {
  try {
    const actions = await permissionService.getAvailableActions();

    res.status(200).json({
      success: true,
      message: "Lấy danh sách actions thành công",
      data: actions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create permissions for a resource
const createResourcePermissions = async (req, res) => {
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

    const { resource, description } = req.body;
    const permissions = await permissionService.createResourcePermissions(resource, description);

    // Log bulk permission creation
    const logData = {
      user_id: req.user?.id || null,
      noi_dung: `Tạo bulk permissions cho resource: ${resource}`,
      source: 'permission_management'
    };
    await logService.addLog(logData);

    res.status(201).json({
      success: true,
      message: `Tạo ${permissions.length} permissions cho resource ${resource} thành công`,
      data: permissions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get permission statistics
const getPermissionStats = async (req, res) => {
  try {
    const stats = await permissionService.getPermissionStats();

    res.status(200).json({
      success: true,
      message: "Lấy thống kê permissions thành công",
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