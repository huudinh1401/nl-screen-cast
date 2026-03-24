import api from '../config/api';

export const userService = {
    getAllUsers: async (params = {}) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    createUser: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    toggleUserStatus: async (id) => {
        const response = await api.put(`/users/${id}/toggle-status`);
        return response.data;
    },

    resetPassword: async (id, newPassword) => {
        const response = await api.post(`/users/${id}/reset-password`, { newPassword });
        return response.data;
    },

    changePassword: async (id, currentPassword, newPassword) => {
        const response = await api.put(`/users/${id}/change-password`, {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    getUserStats: async () => {
        const response = await api.get('/users/stats');
        return response.data;
    }
};
