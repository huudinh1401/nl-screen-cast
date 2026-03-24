import api from '../config/api';

export const deviceService = {
    getMyDevices: async () => {
        const response = await api.get('/devices/my-devices');
        return response.data;
    },

    claimDevice: async (deviceCode) => {
        const response = await api.post('/devices/claim', { deviceCode });
        return response.data;
    },

    updateDeviceName: async (deviceId, deviceName) => {
        const response = await api.put(`/devices/${deviceId}/name`, { deviceName });
        return response.data;
    },

    deleteDevice: async (deviceId) => {
        const response = await api.delete(`/devices/${deviceId}`);
        return response.data;
    },

    getAllDevices: async (page = 1, limit = 20) => {
        const response = await api.get(`/devices/all?page=${page}&limit=${limit}`);
        return response.data;
    }
};
