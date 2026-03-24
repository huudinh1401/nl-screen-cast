const express = require("express");
const authController = require("./auth.controller");
const { authenticate, authorizeRoles } = require("./auth.middleware");
const { 
    registerValidation, 
    loginValidation, 
    changePasswordValidation 
} = require("./auth.validation");
const router = express.Router();

// Auth routes
router.post("/register", registerValidation, authController.register);

router.post("/login", loginValidation, authController.login);
router.post("/change-password", authenticate, changePasswordValidation, authController.changePassword);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/clear-all-sessions", authenticate, authorizeRoles("Admin"), authController.clearAllSessions);

module.exports = router;