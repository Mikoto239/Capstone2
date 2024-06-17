const express = require('express');
const router = express.Router();
const {getlocation,turnoffhardware,turnOnhardware,userexist,deletetheft,theftalert, userregistration, deleteuser, changestatus, latestnotification,allnotification,pinhistory} = require('../controllers/software');
const {authenticateToken} = require('../middleware/authorization');
router.post('/userregister',userregistration);
router.post('/getlocation',authenticateToken,getlocation);
router.post('/turnoff',authenticateToken,turnoffhardware);
router.post('/currentlocation',authenticateToken,turnOnhardware);
router.post('/checkuser',authenticateToken,userexist);
router.post('/removetheftdetails',authenticateToken,deletetheft);
router.post('/theftalert',authenticateToken,theftalert);
router.post('/deleteuser',authenticateToken,deleteuser);
router.post('/changestatus',authenticateToken,changestatus);
router.post('/allnotification',authenticateToken,allnotification);
router.post('/getlatestnotification',authenticateToken,latestnotification);
router.post('/getpinhistory',authenticateToken,pinhistory);
module.exports = router;


