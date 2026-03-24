const express = require('express');
const router = express.Router();
const deviceController = require('./device.controller');
const { authenticate, authorizeRoles } = require('../auth/auth.middleware');

router.post('/generate', authenticate, deviceController.generateCode);
router.post('/register', deviceController.generateCode);
router.get('/my-devices', authenticate, deviceController.getMyDevices);
router.put('/:deviceId/name', authenticate, deviceController.updateDeviceName);
router.post('/claim', authenticate, deviceController.claimDevice);
router.delete('/:deviceId', authenticate, deviceController.deleteDevice);

router.get('/status/:deviceCode', deviceController.checkStatus);
router.get('/info/:deviceCode', deviceController.getDeviceInfo);

router.get('/all', authenticate, authorizeRoles('superadmin'), deviceController.getAllDevices);

module.exports = router;
