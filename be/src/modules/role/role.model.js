const { DataTypes } = require("sequelize");
const db = require("../../config/sequelize");

const Role = db.sequelize.define("Role", {
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
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: "roles",
  timestamps: true,
  indexes: [
    {
      fields: ['name']
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
    withPermissions: {
      include: [{
        association: 'Permissions',
        through: { attributes: [] },
        attributes: ['id', 'name', 'description', 'resource', 'action']
      }]
    }
  }
});

module.exports = Role;
