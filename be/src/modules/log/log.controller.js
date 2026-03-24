const logService = require('./log.service');
const { validationResult } = require('express-validator');

// Get all logs with pagination and filters
const getAllLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      userId = null,
      source = null,
      level = null,
      action = null,
      resource = null,
      startDate = null,
      endDate = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const result = await logService.getAllLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      userId: userId ? parseInt(userId) : null,
      source,
      level,
      action,
      resource,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách logs thành công",
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get log by ID
const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await logService.getLogById(id);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin log thành công",
      data: log
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// Create new log (Manual logging)
const createLog = async (req, res) => {
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

    const logData = {
      ...req.body,
      user_id: req.user?.id || null
    };

    const newLog = await logService.addLogWithContext(req, logData);

    res.status(201).json({
      success: true,
      message: "Tạo log thành công",
      data: newLog
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete old logs (cleanup)
const deleteOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    if (daysToKeep < 1 || daysToKeep > 365) {
      return res.status(400).json({
        success: false,
        message: "Days to keep phải từ 1-365 ngày"
      });
    }

    const result = await logService.deleteOldLogs(parseInt(daysToKeep));

    // Log this action
    await logService.addLogWithContext(req, {
      content: `[ADMIN_ACTION] Cleanup logs older than ${daysToKeep} days - ${result.deletedCount} logs deleted`,
      action: 'cleanup',
      resource: 'logs',
      source: 'system',
      level: 'info'
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get log statistics
const getLogStats = async (req, res) => {
  try {
    const { startDate = null, endDate = null } = req.query;
    
    const stats = await logService.getLogStats({
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      message: "Lấy thống kê logs thành công",
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get logs by user
const getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      startDate = null,
      endDate = null,
      source = null,
      level = null
    } = req.query;

    // Check if user can access these logs (own logs or admin)
    if (req.user.id !== parseInt(userId) && req.user.Role?.name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem logs của user này"
      });
    }

    const result = await logService.getLogsByUser(parseInt(userId), {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      source,
      level
    });

    res.status(200).json({
      success: true,
      message: "Lấy logs của user thành công",
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export logs to CSV
const exportLogs = async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      source = null,
      level = null,
      limit = 10000
    } = req.query;

    const logs = await logService.exportLogsToCSV({
      startDate,
      endDate,
      source,
      level,
      limit: parseInt(limit)
    });

    // Log export action
    await logService.addLogWithContext(req, {
      content: `[ADMIN_ACTION] Export ${logs.length} logs to CSV`,
      action: 'export',
      resource: 'logs',
      source: 'system',
      level: 'info'
    });

    // Generate CSV content
    const csvHeader = 'ID,User,Content,Action,Resource,Source,Level,Created At\n';
    const csvData = logs.map(log => {
      const user = log.User ? log.User.username : 'System';
      const content = `"${log.content.replace(/"/g, '""')}"`;
      const action = log.action || '';
      const resource = log.resource || '';
      const createdAt = log.createdAt.toISOString();
      
      return `${log.id},${user},${content},${action},${resource},${log.source},${log.level},${createdAt}`;
    }).join('\n');

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs_export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user's logs
const getMyLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate = null,
      endDate = null,
      source = null,
      level = null
    } = req.query;

    const result = await logService.getLogsByUser(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      source,
      level
    });

    res.status(200).json({
      success: true,
      message: "Lấy logs của bạn thành công",
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllLogs,
  getLogById,
  createLog,
  deleteOldLogs,
  getLogStats,
  getLogsByUser,
  exportLogs,
  getMyLogs
};