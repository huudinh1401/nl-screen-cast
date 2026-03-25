import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { API_BASE_URL } from './network';


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Interceptor để thêm accessToken vào tất cả các request
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor để refresh token khi gặp lỗi 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) {
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
                return Promise.reject(new Error('No refresh token available'));
            }

            try {
                const response = await api.post('/auth/refresh-token', { refreshToken });
                await SecureStore.setItemAsync('accessToken', response.data.accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
