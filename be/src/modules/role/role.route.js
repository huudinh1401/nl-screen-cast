const express = require('express');
const router = express.Router();
const roleController = require('./role.controller');
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");
const {
  createRoleValidation,
  updateRoleValidation,
  assignPermissionsValidation,
  idValidation,
  getRolesQueryValidation
} = require("./role.validation");

// Role management routes (Admin only)
router.get('/', authenticate, authorizeRoles('Admin', 'Manager'), getRolesQueryValidation, roleController.getAllRoles);
router.get('/stats', authenticate, authorizeRoles('Admin'), roleController.getRoleStats);
router.get('/:id', authenticate, authorizeRoles('Admin', 'Manager'), idValidation, roleController.getRoleById);
router.get('/:id/permissions', authenticate, authorizeRoles('Admin', 'Manager'), idValidation, roleController.getRolePermissions);

// Admin only routes
router.post('/', authenticate, authorizeRoles('Admin'), createRoleValidation, roleController.createRole);
router.put('/:id', authenticate, authorizeRoles('Admin'), idValidation, updateRoleValidation, roleController.updateRole);
router.delete('/:id', authenticate, authorizeRoles('Admin'), idValidation, roleController.deleteRole);
router.delete('/:id/hard', authenticate, authorizeRoles('Admin'), idValidation, roleController.hardDeleteRole);
router.patch('/:id/toggle-status', authenticate, authorizeRoles('Admin'), idValidation, roleController.toggleRoleStatus);
router.post('/:id/assign-permissions', authenticate, authorizeRoles('Admin'), idValidation, assignPermissionsValidation, roleController.assignPermissions);

module.exports = router;