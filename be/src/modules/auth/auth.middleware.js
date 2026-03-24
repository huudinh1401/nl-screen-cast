const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const Role = require('../role/role.model');
const Permission = require('../permission/permission.model');

// Load from environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "backend_template_access_secret";

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token không được cung cấp"
        });
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;

        // Get user with role information
        const user = await User.findOne({
            where: { 
                id: userId,
                isActive: true 
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'description', 'isActive'],
                    include: [
                        {
                            model: Permission,
                            as: 'Permissions',
                            through: { attributes: [] },
                            attributes: ['id', 'name', 'resource', 'action']
                        }
                    ]
                }
            ],
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User không tồn tại hoặc đã bị vô hiệu hóa"
            });
        }

        if (!user.Role || !user.Role.isActive) {
            return res.status(403).json({
                success: false,
                message: "Role không hợp lệ hoặc đã bị vô hiệu hóa"
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token đã hết hạn"
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Lỗi xác thực"
        });
    }
};

// Middleware to authorize by roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Chưa được xác thực"
            });
        }

        const userRole = req.user.Role?.name;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập"
            });
        }

        next();
    };
};

// Middleware to authorize by permissions
const authorizePermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Chưa được xác thực"
            });
        }

        const userPermissions = req.user.Role?.Permissions || [];
        
        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(permission => {
            // Support both "resource:action" format and separate checks
            if (permission.includes(':')) {
                const [resource, action] = permission.split(':');
                return userPermissions.some(p => p.resource === resource && p.action === action);
            } else {
                // Simple permission name check
                return userPermissions.some(p => p.name === permission);
            }
        });

        if (!hasAllPermissions) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền thực hiện hành động này"
            });
        }

        next();
    };
};

// Middleware to check resource ownership or admin role
const authorizeResourceOwnership = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Chưa được xác thực"
            });
        }

        const resourceId = req.params[resourceIdParam];
        const userId = req.user.id;
        const userRole = req.user.Role?.name;

        // Admin can access any resource
        if (userRole === 'Admin') {
            return next();
        }

        // User can only access their own resources
        if (parseInt(resourceId) === userId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Bạn chỉ có thể truy cập tài nguyên của chính mình"
        });
    };
};

// Optional authentication - doesn't fail if no token provided
const optionalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const userId = decoded.userId;

        const user = await User.findOne({
            where: { 
                id: userId,
                isActive: true 
            },
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['id', 'name', 'description']
                }
            ],
            attributes: { exclude: ['password', 'refreshToken'] }
        });

        if (user && user.Role?.isActive) {
            req.user = user;
        }
    } catch (error) {
        // Silently ignore token errors for optional auth
    }

    next();
};

module.exports = {
    authenticate,
    authorizeRoles,
    authorizePermissions,
    authorizeResourceOwnership,
    optionalAuthenticate
};