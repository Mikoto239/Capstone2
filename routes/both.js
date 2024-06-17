const express = require('express');
const router = express.Router();
const { hardwarestatus} = require('../controllers/both.js');
const { isHardwareOn } = require('../middleware/hardwarestatus');
const {authenticateToken} = require('../middleware/authorization');

router.post('/hardwarestatus',authenticateToken,isHardwareOn,hardwarestatus);

module.exports = router;