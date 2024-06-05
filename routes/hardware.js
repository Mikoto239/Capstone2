// routes/hardware.js
const express = require('express');
const router = express.Router();
const { getcurrentpinlocation, send_alert, pinlocation, theftdetails, getusernumber, hardwareregistration, hardwarestatus } = require('../controllers/hardware.js');
const { isHardwareOn } = require('../middleware/hardwarestatus');

router.post('/checkpinlocation', isHardwareOn,getcurrentpinlocation);
router.post('/send_alert',isHardwareOn,send_alert);
router.post('/pinthislocation',isHardwareOn,pinlocation);
router.post('/hardwarestatus', hardwarestatus);
router.post('/sendtheftdetails',isHardwareOn,theftdetails);
router.post('/hardwareregister',hardwareregistration);
router.post('/usernumber',isHardwareOn, getusernumber);

module.exports = router;
