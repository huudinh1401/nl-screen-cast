const { DataTypes } = require("sequelize");
const db = require("../../config/sequelize");

// Auth model for storing refresh tokens and session management
const Auth = db.sequelize.define(
  "Auth",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    tableName: 'auths',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['refreshToken']
      }
    ]
  }
);

module.exports = Auth;
