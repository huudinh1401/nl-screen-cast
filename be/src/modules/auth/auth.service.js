const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require('sequelize');

const User = require("../user/user.model");
const UuidLogin = require("./uuid_login.model");

// Load from environment variables with fallback defaults
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "backend_template_access_secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "backend_template_refresh_secret";
const ACCESS_TOKEN_LIFETIME = process.env.ACCESS_TOKEN_LIFETIME || "1h";
const REFRESH_TOKEN_LIFETIME = process.env.REFRESH_TOKEN_LIFETIME || "7d";

// Hàm tạo access token
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            email: user.email
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_LIFETIME }
    );
};

// Hàm tạo refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_LIFETIME }
    );
};

// Hàm sinh token và cập nhật refresh token
const generateTokens = async (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.update(
        { refreshToken },
        { where: { id: user.id } }
    );

    return {
        success: true,
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            role_id: user.role_id,
            Role: user.Role
        }
    };
};

// Generate confirmation code for 2FA
const generateConfirmationCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// User registration
const register = async (username, email, password, role_id = 2) => {
    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        throw new Error("Email hoặc username đã được sử dụng");
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role_id,
        isActive: true
    });

    return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role_id: newUser.role_id
    };
};

// User login
const login = async (username, password) => {
    // Find user by username or email
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { username },
                { email: username }
            ]
        },
        include: [
            {
                association: 'Role',
                attributes: ['id', 'name', 'description']
            }
        ]
    });

    if (!user) {
        throw new Error("Tài khoản hoặc mật khẩu không đúng");
    }

    // Check if user is active
    if (!user.isActive) {
        throw new Error("Tài khoản đã bị vô hiệu hóa");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Tài khoản hoặc mật khẩu không đúng");
    }

    // Clear any existing refresh token
    await User.update(
        { refreshToken: null },
        { where: { id: user.id } }
    );

    // Generate new tokens
    return await generateTokens(user);
};

// Change password
const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error("Người dùng không tồn tại");
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error("Mật khẩu cũ không đúng");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear refresh token
    await User.update(
        {
            password: hashedPassword,
            refreshToken: null
        },
        { where: { id: userId } }
    );

    return { success: true, message: "Đã thay đổi mật khẩu thành công" };
};
// Hàm đăng xuất
const logout = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

        await User.update(
            { refreshToken: null },
            { where: { id: decoded.userId } }
        );

        // Không xóa UUID login để duy trì trạng thái xác thực của thiết bị

        return true;
    } catch (error) {
        throw new Error("Token không hợp lệ");
    }
};

// Hàm refresh token
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        const user = await User.findOne({
            where: {
                id: decoded.userId,
                refreshToken: refreshToken
            }
        });

        if (!user) {
            throw new Error("Refresh token không hợp lệ");
        }

        const accessToken = generateAccessToken(user);
        return { accessToken };
    } catch (error) {
        // Nếu refresh token hết hạn hoặc không hợp lệ, clear nó khỏi database
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            try {
                const decoded = jwt.decode(refreshToken);
                if (decoded && decoded.userId) {
                    await User.update(
                        { refreshToken: null },
                        { where: { id: decoded.userId } }
                    );
                }
            } catch (decodeError) {
                // Ignore decode errors
            }
        }
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }
};

// Clear all sessions for user (emergency cleanup)
const clearAllSessions = async (userId) => {
    await User.update(
        { refreshToken: null },
        { where: { id: userId } }
    );

    // Clear all UUID logins for user if they exist
    await UuidLogin.destroy({
        where: { user_id: userId }
    });

    return { success: true, message: "Đã clear tất cả sessions" };
};

module.exports = {
    register,
    login,
    changePassword,
    logout,
    refreshAccessToken,
    clearAllSessions
};