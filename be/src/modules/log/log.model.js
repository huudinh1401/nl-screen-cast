const { DataTypes } = require("sequelize");
const db = require("../../config/sequelize");

const Log = db.sequelize.define("Log", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Foreign key to Users table, nullable for system actions'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'noi_dung',
    comment: 'Log content describing the action performed'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Action type (create, update, delete, etc.)'
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Resource affected (users, roles, permissions, etc.)'
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the affected resource'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the user'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent of the request'
  },
  source: {
    type: DataTypes.ENUM('auth', 'user_management', 'role_management', 'permission_management', 'system', 'api'),
    allowNull: false,
    defaultValue: 'system',
    comment: 'Source module of the log'
  },
  level: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'debug'),
    allowNull: false,
    defaultValue: 'info',
    comment: 'Log level'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata as JSON'
  }
}, {
  tableName: 'logs',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['source']
    },
    {
      fields: ['level']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource']
    }
  ]
});

module.exports = Log;