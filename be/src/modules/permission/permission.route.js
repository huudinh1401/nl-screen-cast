const express = require('express');
const router = express.Router();
const permissionController = require('./permission.controller');
const { authenticate, authorizeRoles } = require("../auth/auth.middleware");
const {
  createPermissionValidation,
  updatePermissionValidation,
  createResourcePermissionsValidation,
  idValidation,
  resourceValidation,
  getPermissionsQueryValidation
} = require("./permission.validation");

// Permission management routes (Admin only)
router.get('/', authenticate, authorizeRoles('Admin', 'Manager'), getPermissionsQueryValidation, permissionController.getAllPermissions);
router.get('/stats', authenticate, authorizeRoles('Admin'), permissionController.getPermissionStats);
router.get('/resources', authenticate, authorizeRoles('Admin', 'Manager'), permissionController.getAvailableResources);
router.get('/actions', authenticate, authorizeRoles('Admin', 'Manager'), permissionController.getAvailableActions);
router.get('/by-resource/:resource', authenticate, authorizeRoles('Admin', 'Manager'), resourceValidation, permissionController.getPermissionsByResource);
router.get('/:id', authenticate, authorizeRoles('Admin', 'Manager'), idValidation, permissionController.getPermissionById);

// Admin only routes
router.post('/', authenticate, authorizeRoles('Admin'), createPermissionValidation, permissionController.createPermission);
router.post('/bulk-create', authenticate, authorizeRoles('Admin'), createResourcePermissionsValidation, permissionController.createResourcePermissions);
router.put('/:id', authenticate, authorizeRoles('Admin'), idValidation, updatePermissionValidation, permissionController.updatePermission);
router.delete('/:id', authenticate, authorizeRoles('Admin'), idValidation, permissionController.deletePermission);
router.delete('/:id/hard', authenticate, authorizeRoles('Admin'), idValidation, permissionController.hardDeletePermission);
router.patch('/:id/toggle-status', authenticate, authorizeRoles('Admin'), idValidation, permissionController.togglePermissionStatus);

module.exports = router;