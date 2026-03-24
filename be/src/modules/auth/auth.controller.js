const authService = require("./auth.service");
const logService = require('../log/log.service');
const { validationResult } = require('express-validator');

// Register new user
const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: "Validation error",
                errors: errors.array() 
            });
        }

        const { username, email, password, role_id } = req.body;
        const user = await authService.register(username, email, password, role_id);
        
        // Log registration
        const logData = {
            user_id: user.id,
            noi_dung: `Đăng ký tài khoản mới: ${username}`,
            source: 'auth'
        };
        await logService.addLog(logData);

        res.status(201).json({ 
            success: true,
            message: "Đăng ký thành công", 
            user 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: "Validation error",
                errors: errors.array() 
            });
        }

        const { username, password } = req.body;
        const result = await authService.login(username, password);
        const { accessToken, refreshToken, user } = result;

        // Log successful login
        const logData = {
            user_id: user.id,
            noi_dung: `Đăng nhập thành công - IP: ${req.ip}`,
            source: 'auth'
        };
        await logService.addLog(logData);

        res.status(200).json({ 
            success: true,
            accessToken, 
            refreshToken, 
            user 
        });
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: "Validation error",
                errors: errors.array() 
            });
        }

        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        const result = await authService.changePassword(userId, oldPassword, newPassword);

        // Log password change
        const logData = {
            user_id: userId,
            noi_dung: `Thay đổi mật khẩu thành công`,
            source: 'auth'
        };
        await logService.addLog(logData);

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// User logout
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ 
                success: false,
                message: "Refresh token is required" 
            });
        }

        await authService.logout(refreshToken);

        res.status(200).json({ 
            success: true,
            message: "Đăng xuất thành công" 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                success: false,
                message: "Refresh token is required" 
            });
        }

        const { accessToken } = await authService.refreshAccessToken(refreshToken);
        res.status(200).json({ 
            success: true,
            accessToken 
        });
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Emergency clear all sessions for user (Admin only)
const clearAllSessions = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: "User ID is required" 
            });
        }

        const result = await authService.clearAllSessions(userId);

        // Log admin action
        const logData = {
            user_id: req.user?.id || null,
            noi_dung: `[ADMIN_ACTION] Clear all sessions cho user ID: ${userId}`,
            source: 'auth'
        };
        await logService.addLog(logData);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    register,
    login,
    changePassword,
    logout,
    refreshAccessToken,
    clearAllSessions
};