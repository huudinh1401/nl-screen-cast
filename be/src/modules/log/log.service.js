const Log = require('./log.model');
const User = require('../user/user.model');
const { Op } = require('sequelize');

// Get all logs with pagination and filters
const getAllLogs = async (options = {}) => {
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
  } = options;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Search filter
  if (search) {
    whereClause[Op.or] = [
      { content: { [Op.like]: `%${search}%` } },
      { action: { [Op.like]: `%${search}%` } },
      { resource: { [Op.like]: `%${search}%` } }
    ];
  }

  // User filter
  if (userId) {
    whereClause.user_id = userId;
  }

  // Source filter
  if (source) {
    whereClause.source = source;
  }

  // Level filter
  if (level) {
    whereClause.level = level;
  }

  // Action filter
  if (action) {
    whereClause.action = action;
  }

  // Resource filter
  if (resource) {
    whereClause.resource = resource;
  }

  // Date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
  }

  const { count, rows } = await Log.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'fullname', 'email'],
        required: false
      }
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

        return {
    logs: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Get log by ID
const getLogById = async (id) => {
  const log = await Log.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'fullname', 'email'],
        required: false
      }
    ]
  });

  if (!log) {
    throw new Error("Log không tồn tại");
  }

  return log;
};

// Add new log
const addLog = async (logData) => {
  const {
    user_id = null,
    noi_dung, // backward compatibility
    content,
    action = null,
    resource = null,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    source = 'system',
    level = 'info',
    metadata = null
  } = logData;

  // Use content or fallback to noi_dung for backward compatibility
  const logContent = content || noi_dung;

  if (!logContent) {
    throw new Error("Log content is required");
  }

  const newLog = await Log.create({
    user_id,
    content: logContent,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    source,
    level,
    metadata
  });

  return newLog;
};

// Add log with request context
const addLogWithContext = async (req, logData) => {
  const contextData = {
    ...logData,
    user_id: req.user?.id || null,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent')
  };

  return await addLog(contextData);
};

// Delete old logs (cleanup)
const deleteOldLogs = async (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deletedCount = await Log.destroy({
    where: {
      createdAt: {
        [Op.lt]: cutoffDate
      }
    }
  });

  return {
    success: true,
    message: `Đã xóa ${deletedCount} log entries cũ hơn ${daysToKeep} ngày`,
    deletedCount
  };
};

// Get log statistics
const getLogStats = async (options = {}) => {
  const {
    startDate = null,
    endDate = null
  } = options;

  const whereClause = {};

  // Date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
  }

  // Total logs
  const totalLogs = await Log.count({ where: whereClause });

  // Logs by level
  const logsByLevel = await Log.findAll({
    attributes: [
      'level',
      [Log.sequelize.fn('COUNT', Log.sequelize.col('id')), 'count']
    ],
    where: whereClause,
    group: ['level'],
    order: [['level', 'ASC']]
  });

  // Logs by source
  const logsBySource = await Log.findAll({
            attributes: [
                'source',
      [Log.sequelize.fn('COUNT', Log.sequelize.col('id')), 'count']
    ],
    where: whereClause,
    group: ['source'],
    order: [['source', 'ASC']]
  });

  // Logs by action
  const logsByAction = await Log.findAll({
    attributes: [
      'action',
      [Log.sequelize.fn('COUNT', Log.sequelize.col('id')), 'count']
    ],
    where: {
      ...whereClause,
      action: { [Op.ne]: null }
    },
    group: ['action'],
    order: [['action', 'ASC']]
  });

  // Recent activity (last 24 hours)
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const recentActivity = await Log.count({
    where: {
      createdAt: {
        [Op.gte]: last24Hours
      }
    }
  });

  // Most active users
  const mostActiveUsers = await Log.findAll({
    attributes: [
      'user_id',
      [Log.sequelize.fn('COUNT', Log.sequelize.col('Log.id')), 'logCount']
    ],
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['username', 'fullname'],
        required: true
      }
    ],
    where: {
      ...whereClause,
      user_id: { [Op.ne]: null }
    },
    group: ['user_id', 'User.id'],
    order: [[Log.sequelize.literal('logCount'), 'DESC']],
    limit: 10
  });

  return {
    totalLogs,
    recentActivity,
    logsByLevel,
    logsBySource,
    logsByAction,
    mostActiveUsers
  };
};

// Get logs by user
const getLogsByUser = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    startDate = null,
    endDate = null,
    source = null,
    level = null
  } = options;

  const whereClause = { user_id: userId };

  // Date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
  }

  // Source filter
  if (source) {
    whereClause.source = source;
  }

  // Level filter
  if (level) {
    whereClause.level = level;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Log.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'fullname'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    logs: rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Export logs to CSV
const exportLogsToCSV = async (options = {}) => {
  const {
    startDate = null,
    endDate = null,
    source = null,
    level = null,
    limit = 10000
  } = options;

  const whereClause = {};

  // Date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate);
    }
  }

  // Source filter
  if (source) {
    whereClause.source = source;
  }

  // Level filter
  if (level) {
    whereClause.level = level;
  }

  const logs = await Log.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['username', 'fullname'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  return logs;
};

module.exports = {
  getAllLogs,
  getLogById,
  addLog,
  addLogWithContext,
  deleteOldLogs,
  getLogStats,
  getLogsByUser,
  exportLogsToCSV
};