const { DataTypes } = require("sequelize");
const db = require("../../config/sequelize");

const Permission = db.sequelize.define("Permission", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50],
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Resource that this permission applies to (e.g., users, roles, posts)'
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['create', 'read', 'update', 'delete', 'manage']]
    },
    comment: 'Action that can be performed (create, read, update, delete, manage)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'System permissions cannot be deleted'
  }
}, {
  tableName: "permissions",
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['resource', 'action'],
      unique: true
    },
    {
      fields: ['isActive']
    }
  ],
  scopes: {
    active: {
      where: {
        isActive: true
      }
    },
    byResource: (resource) => ({
      where: {
        resource
      }
    })
  }
});

module.exports = Permission;
