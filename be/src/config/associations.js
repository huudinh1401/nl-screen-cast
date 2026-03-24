// Setup model associations
const { DataTypes } = require("sequelize");
const db = require("./sequelize");
const User = require('../modules/user/user.model');
const Role = require('../modules/role/role.model');
const Permission = require('../modules/permission/permission.model');
const Log = require('../modules/log/log.model');
const Auth = require('../modules/auth/auth.model');
const UuidLogin = require('../modules/auth/uuid_login.model');
const Device = require('../modules/device/device.model');

// Define RolePermission junction table model inline
const RolePermission = db.sequelize.define("RolePermission", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Roles',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Permissions',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
}, {
  tableName: "rolepermissions",
  timestamps: true,
  indexes: [
    {
      fields: ['roleId']
    },
    {
      fields: ['permissionId']
    },
    {
      fields: ['roleId', 'permissionId'],
      unique: true
    }
  ]
});

const setupAssociations = () => {
  // User - Role associations
  User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'Role'
  });
  Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'Users'
  });

  // Role - Permission many-to-many through RolePermission
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'Permissions'
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'Roles'
  });

  // Direct associations for RolePermission
  RolePermission.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'Role'
  });
  RolePermission.belongsTo(Permission, {
    foreignKey: 'permissionId',
    as: 'Permission'
  });

  // User - Log associations
  Log.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
    constraints: false // Allow null user_id for system logs
  });
  User.hasMany(Log, {
    foreignKey: 'user_id',
    as: 'Logs'
  });

  // User - Auth associations (for refresh tokens)
  Auth.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User'
  });
  User.hasMany(Auth, {
    foreignKey: 'userId',
    as: 'AuthTokens'
  });

  // User - UuidLogin associations (for 2FA if needed in future)
  UuidLogin.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  User.hasMany(UuidLogin, {
    foreignKey: 'user_id',
    as: 'UuidLogins'
  });

  // User - Device associations
  Device.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User'
  });
  User.hasMany(Device, {
    foreignKey: 'userId',
    as: 'Devices'
  });

  console.log("Thiết lập quan hệ giữa các models thành công.");
};

module.exports = { setupAssociations, RolePermission };
