const ConnectionRequest = require('../modules/connection/connection.model');

class ConnectionService {
    async createRequest(deviceCode, clientSocketId) {
        const request = await ConnectionRequest.create({
            deviceCode,
            clientSocketId,
            status: 'pending'
        });
        return request;
    }

    async updateRequestStatus(requestId, status) {
        const request = await ConnectionRequest.findByPk(requestId);
        if (request) {
            await request.update({
                status,
                respondedAt: new Date()
            });
        }
        return request;
    }

    async getRequestById(requestId) {
        return await ConnectionRequest.findByPk(requestId);
    }

    async getPendingRequestByDevice(deviceCode) {
        return await ConnectionRequest.findOne({
            where: {
                deviceCode,
                status: 'pending'
            },
            order: [['requestedAt', 'DESC']]
        });
    }

    async timeoutOldRequests(minutes = 5) {
        const timeoutDate = new Date(Date.now() - minutes * 60 * 1000);
        await ConnectionRequest.update(
            { status: 'timeout' },
            {
                where: {
                    status: 'pending',
                    requestedAt: { [require('sequelize').Op.lt]: timeoutDate }
                }
            }
        );
    }
}

module.exports = new ConnectionService();
