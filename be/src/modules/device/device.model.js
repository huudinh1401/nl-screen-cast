const { DataTypes } = require('sequelize');
const db = require('../../config/sequelize');

const Device = db.sequelize.define('Device', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    deviceCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'device_code'
    },
    deviceName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'device_name'
    },
    socketId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'socket_id'
    },
    status: {
        type: DataTypes.ENUM('online', 'offline'),
        defaultValue: 'offline'
    },
    deviceInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'device_info'
    },
    lastConnected: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_connected'
    }
}, {
    tableName: 'devices',
    timestamps: true,
    underscored: true
});

module.exports = Device;
