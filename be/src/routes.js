const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require("./modules/auth/auth.middleware");
const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const logRoutes = require('./modules/log/log.route');
const roleRoutes = require('./modules/role/role.route');
const permissionRoutes = require('./modules/permission/permission.route');
const deviceRoutes = require('./modules/device/device.route');

router.use('/auth', authRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/logs', authenticate, logRoutes);
router.use('/roles', authenticate, roleRoutes);
router.use('/permissions', authenticate, permissionRoutes);
router.use('/devices', deviceRoutes);


module.exports = router;
