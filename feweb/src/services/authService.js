import api from '../config/api';

const normalizeRoleName = (user) => {
    const roleName =
        user?.Role?.name ??
        user?.role?.name ??
        user?.roleName ??
        user?.role_name ??
        user?.role;

    return typeof roleName === 'string' ? roleName.trim().toLowerCase() : '';
};

const getLoginRouteForContext = () => {
    const authEntry = sessionStorage.getItem('authEntry');
    return authEntry === 'admin' ? '/admin/login' : '/login';
};

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.success) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },

    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    setAuthEntry: (entry) => {
        sessionStorage.setItem('authEntry', entry === 'admin' ? 'admin' : 'user');
    },

    getLoginRouteForContext,

    isAdminUser: (user) => {
        const normalizedRole = normalizeRoleName(user);

        if (normalizedRole) {
            return ['superadmin', 'admin', 'administrator'].includes(normalizedRole);
        }

        // Fallback for APIs that only return numeric role ids.
        if (user?.role_id === 1 || user?.Role?.id === 1 || user?.role?.id === 1) {
            return true;
        }

        // Final fallback: if the user entered via the admin portal and is still authenticated,
        // prefer the admin flow unless the API explicitly says otherwise.
        return authService.isAuthenticated() && sessionStorage.getItem('authEntry') === 'admin';
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    }
};
