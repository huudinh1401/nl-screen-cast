const Device = require('../modules/device/device.model');
const User = require('../modules/user/user.model');

class DeviceService {
    generateDeviceCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'NL-';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    async createDevice(deviceInfo = {}, userId = null) {
        let deviceCode;
        let isUnique = false;

        while (!isUnique) {
            deviceCode = this.generateDeviceCode();
            const existing = await Device.findOne({ where: { deviceCode } });
            if (!existing) isUnique = true;
        }

        const device = await Device.create({
            deviceCode,
            deviceInfo,
            userId,
            status: 'offline'
        });

        return device;
    }

    async registerDevice(deviceCode, socketId, deviceInfo = {}, userId = null) {
        let device = await Device.findOne({ where: { deviceCode } });

        if (!device) {
            device = await Device.create({
                deviceCode,
                socketId,
                deviceInfo,
                userId,
                status: 'online',
                lastConnected: new Date()
            });
        } else {
            await device.update({
                socketId,
                status: 'online',
                deviceInfo,
                userId: userId || device.userId,
                lastConnected: new Date()
            });
        }

        return device;
    }

    async setDeviceOffline(socketId) {
        const device = await Device.findOne({ where: { socketId } });
        if (device) {
            await device.update({ status: 'offline', socketId: null });
        }
        return device;
    }

    async getDeviceByCode(deviceCode) {
        return await Device.findOne({
            where: { deviceCode },
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'username', 'email']
            }]
        });
    }

    async getDeviceBySocketId(socketId) {
        return await Device.findOne({ where: { socketId } });
    }

    async isDeviceOnline(deviceCode) {
        const device = await this.getDeviceByCode(deviceCode);
        return device && device.status === 'online';
    }

    async getUserDevices(userId) {
        return await Device.findAll({
            where: { userId },
            order: [['lastConnected', 'DESC']]
        });
    }

    async updateDeviceName(deviceId, deviceName, userId) {
        const device = await Device.findOne({
            where: { id: deviceId, userId }
        });

        if (!device) {
            throw new Error('Không tìm thấy thiết bị hoặc bạn không có quyền');
        }

        await device.update({ deviceName });
        return device;
    }

    async claimDevice(deviceCode, userId) {
        const device = await Device.findOne({ where: { deviceCode } });

        if (!device) {
            throw new Error('Không tìm thấy thiết bị');
        }

        if (device.userId && device.userId !== userId) {
            throw new Error('Thiết bị đã được liên kết với tài khoản khác');
        }

        await device.update({ userId });
        return device;
    }

    async deleteDevice(deviceId, userId) {
        const device = await Device.findOne({
            where: { id: deviceId, userId }
        });

        if (!device) {
            throw new Error('Không tìm thấy thiết bị hoặc bạn không có quyền');
        }

        await device.destroy();
        return true;
    }

    async getAllDevices(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const { count, rows } = await Device.findAndCountAll({
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'username', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return {
            devices: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }
}

module.exports = new DeviceService();
