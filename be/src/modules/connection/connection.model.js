const { DataTypes } = require('sequelize');
const db = require('../../config/sequelize');

const ConnectionRequest = db.sequelize.define('ConnectionRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    deviceCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'device_code'
    },
    clientSocketId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'client_socket_id'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'timeout'),
        defaultValue: 'pending'
    },
    requestedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'requested_at'
    },
    respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'responded_at'
    }
}, {
    tableName: 'connection_requests',
    timestamps: true,
    underscored: true
});

module.exports = ConnectionRequest;
