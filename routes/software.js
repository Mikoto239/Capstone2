const express = require('express');
const router = express.Router();
const {getlocation,turnoffhardware,turnOnhardware,userexist,deletetheft,alltheft, userregistration, deleteuser, hardwarestatus, changestatus, notification, allnotification,pinhistory} = require('../controllers/software');

router.get('/getlocation',getlocation);
router.post('/deletecurrentlocation',turnoffhardware);
router.post('/currentlocation',turnOnhardware);
router.post('/checkuserregister',userexist);
router.post('/removetheftdetails',deletetheft);
router.post('/gettheftdetails',alltheft);
router.post('/userregister',userregistration);
router.post('/deleteuser',deleteuser);
router.get('/hardwarestatus',hardwarestatus);
router.post('/changestatus',changestatus);
router.post('/allhistory',allnotification);
router.post('/getnotification',notification);
router.post('/getpinhistory',pinhistory);


module.exports = router;


