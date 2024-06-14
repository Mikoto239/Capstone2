const express = require('express');
const router = express.Router();
const { getcurrentpinlocation, send_alert, pinlocation, theftdetails, getusernumber, hardwareregistration, pinstatus } = require('../controllers/hardware.js');
const { isHardwareOn } = require('../middleware/hardwarestatus');
const {authenticateToken} = require('../middleware/authorization');

router.post('/checkpinlocation', isHardwareOn,authenticateToken,getcurrentpinlocation);
router.post('/send_alert',isHardwareOn,authenticateToken,send_alert);
router.post('/pinthislocation',isHardwareOn,authenticateToken,pinlocation);
router.post('/pinstatus', pinstatus,authenticateToken,);
router.post('/sendtheftdetails',isHardwareOn,authenticateToken,theftdetails);
router.post('/hardwareregister',hardwareregistration);
router.post('/usernumber',isHardwareOn, getusernumber,authenticateToken);

module.exports = router;
