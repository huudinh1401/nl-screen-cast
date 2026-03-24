const deviceService = require('../../services/device.service');

class DeviceController {
    async generateCode(req, res) {
        try {
            const userId = req.user?.id;
            const device = await deviceService.createDevice(req.body.deviceInfo, userId);

            res.status(201).json({
                success: true,
                message: 'Tạo mã thiết bị thành công',
                data: {
                    deviceCode: device.deviceCode,
                    id: device.id
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo mã thiết bị',
                error: error.message
            });
        }
    }

    async getMyDevices(req, res) {
        try {
            const userId = req.user.id;
            const devices = await deviceService.getUserDevices(userId);

            res.json({
                success: true,
                data: devices
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thiết bị',
                error: error.message
            });
        }
    }

    async updateDeviceName(req, res) {
        try {
            const { deviceId } = req.params;
            const { deviceName } = req.body;
            const userId = req.user.id;

            const device = await deviceService.updateDeviceName(deviceId, deviceName, userId);

            res.json({
                success: true,
                message: 'Cập nhật tên thiết bị thành công',
                data: device
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async claimDevice(req, res) {
        try {
            const { deviceCode } = req.body;
            const userId = req.user.id;

            const device = await deviceService.claimDevice(deviceCode, userId);

            res.json({
                success: true,
                message: 'Liên kết thiết bị thành công',
                data: device
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const userId = req.user.id;

            await deviceService.deleteDevice(deviceId, userId);

            res.json({
                success: true,
                message: 'Xóa thiết bị thành công'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async checkStatus(req, res) {
        try {
            const { deviceCode } = req.params;
            const device = await deviceService.getDeviceByCode(deviceCode);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'INVALID_CODE',
                    detail: 'Không tìm thấy thiết bị'
                });
            }

            res.json({
                success: true,
                data: {
                    deviceCode: device.deviceCode,
                    deviceName: device.deviceName,
                    status: device.status,
                    lastConnected: device.lastConnected
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra trạng thái',
                error: error.message
            });
        }
    }

    async getDeviceInfo(req, res) {
        try {
            const { deviceCode } = req.params;
            const device = await deviceService.getDeviceByCode(deviceCode);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'INVALID_CODE',
                    detail: 'Không tìm thấy thiết bị'
                });
            }

            res.json({
                success: true,
                data: device
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin thiết bị',
                error: error.message
            });
        }
    }

    async getAllDevices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await deviceService.getAllDevices(page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thiết bị',
                error: error.message
            });
        }
    }
}

module.exports = new DeviceController();
