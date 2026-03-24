import axios from 'axios';
import NProgress from 'nprogress';
import { message } from 'antd';
import 'nprogress/nprogress.css';

let navigate;

export const setNavigate = (nav) => {
    navigate = nav;
};

NProgress.configure({
    showSpinner: false,
    trickleSpeed: 100,
});

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7010/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        NProgress.start();
        return config;
    },
    (error) => {
        NProgress.done();
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        NProgress.done();
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
                if (navigate) navigate('/login');
                return Promise.reject(new Error('Không có refresh token'));
            }

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:7010/api'}/auth/refresh-token`,
                    { refreshToken }
                );
                localStorage.setItem('accessToken', response.data.accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                message.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
                if (navigate) navigate('/login');
                return Promise.reject(refreshError);
            }
        }

        NProgress.done();
        return Promise.reject(error);
    }
);

export default api;
