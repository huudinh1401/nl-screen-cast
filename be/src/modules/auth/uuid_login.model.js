// uuid_login.model.js
const { DataTypes } = require("sequelize");
const db = require("../../config/sequelize");

const UuidLogin = db.sequelize.define('uuid_login', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    uuid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    confirmation_code: {
        type: DataTypes.STRING(6),
        allowNull: false,
    },
    confirmation_code_expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    device_info: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'uuid_login',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id', 'uuid', 'is_verified', 'updatedAt']
        },
        {
            unique: true,
            fields: ['user_id', 'uuid']
        }
    ]
});

module.exports = UuidLogin;