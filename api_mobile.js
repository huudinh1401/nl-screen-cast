import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const api = axios.create({
    baseURL: 'https://apijob.nguyenluan.vn/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để thêm accessToken vào tất cả các request
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
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

        // Kiểm tra nếu gặp lỗi 401 hoặc 403 và không phải là retry
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                // Không có refresh token, yêu cầu người dùng đăng nhập lại
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
                return Promise.reject(new Error('No refresh token available'));
            }

            try {
                // Gọi API làm mới token
                const response = await api.post('/auth/refresh-token', { refreshToken });

                // Lưu accessToken mới
                await AsyncStorage.setItem('accessToken', response.data.accessToken);

                // Thêm token mới vào headers của request ban đầu và retry lại request đó
                originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Nếu refresh token hết hạn hoặc gặp lỗi
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
                return Promise.reject(refreshError);
            }
        }

        // Trả về lỗi nếu không phải là lỗi 401 hoặc là lỗi đã xử lý
        return Promise.reject(error);
    }
);

export default api;