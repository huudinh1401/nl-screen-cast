import api from '../config/api';
import * as SecureStore from 'expo-secure-store';

const DEVICE_CODE_KEY = 'device_code';

export const deviceService = {
    // Lấy hoặc tạo mã thiết bị
    async getOrCreateDeviceCode() {
        try {
            // Kiểm tra xem đã có mã thiết bị trong SecureStore chưa
            let deviceCode = await SecureStore.getItemAsync(DEVICE_CODE_KEY);

            if (deviceCode) {
                return deviceCode;
            }

            // Nếu chưa có, gọi API để tạo mã mới
            const response = await api.post('/devices/register');
            deviceCode = response.data.data.deviceCode;

            // Lưu mã thiết bị vào SecureStore
            await SecureStore.setItemAsync(DEVICE_CODE_KEY, deviceCode);

            return deviceCode;
        } catch (error) {
            console.error('Lỗi khi lấy mã thiết bị:', error);
            throw error;
        }
    },

    // Xóa mã thiết bị (dùng khi reset app)
    async clearDeviceCode() {
        await SecureStore.deleteItemAsync(DEVICE_CODE_KEY);
    },

    // Cập nhật tên thiết bị
    async updateDeviceName(deviceCode, deviceName) {
        try {
            const response = await api.put(`/devices/${deviceCode}`, { deviceName });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi cập nhật tên thiết bị:', error);
            throw error;
        }
    }
};
