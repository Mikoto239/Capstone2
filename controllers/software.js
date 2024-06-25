const Hardware = require('../models/hardware');
const MinorAlert = require('../models/minoralerts.js');
const Pinlocation = require('../models/pinlocation.js');
const Theft = require('../models/theftdetails.js');
const TheftAlert = require('../models/theftalert.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_API_KEY);


//register the user 
exports.userregistration = async (req, res, next) => {
  const { name, uniqueId, email, cellphonenumber } = req.body;

  try {
    // Optional: verify Google token
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_API_KEY, 
    // });
    // const payload = ticket.getPayload();
    // const emailFromGoogle = payload.email;

    const findUser = await User.findOne({ uniqueId, email });
    if (findUser) {
      return res.status(400).json({ message: "User is already registered!" });
    }

    const hardwareId = await Hardware.findOne({ uniqueId });
    if (!hardwareId) {
      return res.status(400).json({ message: "Hardware ID not found!" });
    }

    const newUser = new User({ name, uniqueId, email, cellphonenumber });
    await newUser.save();

    const tokenToSend = jwt.sign({ id: newUser._id }, SECRET_KEY);
  
    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      token: tokenToSend
    });
  } catch (error) {
    console.error('Error during user registration:', error); // Log the error details
    return res.status(500).json({ message: "Internal server error" });
  }
};

//get the latest pinned location
exports.getlocation = async (req, res, next) => {

  const { token } = req.body;  // Ensure you are using req.query to get the token

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id;

    const userId = await User.findById(decodedId);
    if (!userId) {
      return res.status(404).json({ message: "User not found!" });
    }

    const uniqueId = userId.uniqueId;
     const pinLocation = await Pinlocation.findOne({ uniqueId,statusPin:true}).sort({ pinAt: -1 });

      if (!pinLocation) {
          console.log("No pin location found for uniqueId:", uniqueId);
          return res.status(400).json({ message: "Invalid uniqueId" });
      } 
      
      const latitude = pinLocation.currentlatitude;
      const longitude = pinLocation.currentlongitude;
      const time = pinLocation.pinAt
      return res.status(200).json({ success:true,latitude: latitude, longitude: longitude, time:time});
  } catch (error) {
    console.error('Error during getlocation:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


//turn off the hardware to stop sending data
exports.turnoffhardware = async (req, res, next) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id;

    const user = await User.findById(decodedId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const uniqueId = user.uniqueId;
    const result = await Pinlocation.updateMany(
      { uniqueId },
      { $set: { statusPin: false } }
    );

    console.log('Update Result:', result);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'No pin locations were updated!' });
    }

    return res.status(200).json({ message: 'Updated pin locations status to false' });
  } catch (error) {
    console.error('Error updating pin locations:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};




//turn on the hardware to send data
exports.turnOnhardware = async (req, res, next) => {
  const {token,pinlocation } = req.body;
 
  try {

    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 

    const userexist= await User.findById(decodedId);
    if(!userexist){
      res.status(404).json({message:"Not found!"});
    }
    const uniqueId = userexist.uniqueId;
    const hardware = await Hardware.findOneAndUpdate(
      { uniqueId },
      { pinlocation: true },
      { new: true }
    );
    
    if (!hardware) {
      return res.status(400).json({ message: "Hardware not Found!" });
    }

    return res.status(200).json({message:"Pin Successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




//check the user if already register
exports.userexist = async (req, res, next) => {
  const { token } = req.body; 
   if(!token){
    return res.status(401).json({ message: 'User not registered yet!' });
   }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 

    const user= await User.findById(decodedId);
      if (!user) {
       
          return res.status(404).json({ message: 'User not registered yet' });
      }
      const {  name, email,uniqueId, cellphonenumber } = user; 

      return res.status(200).json({ success:true,name, email, cellphonenumber,uniqueId });
  } catch (error) {
      // If an error occurs, return 500 status with an error message
      return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};






exports.deletetheft = async (req, res, next) => {
  const { uniqueId } = req.body;

  try {
    const count = await Theft.countDocuments({ uniqueId });
    if (count > 5) {
      const oldestTheftDetail = await Theft.findOneAndDelete({ uniqueId }, { sort: { createdAt: 1 } });
      return res.status(200).json({ message: "Success" });
    } else {
      return res.status(400).json({ message: "No need to delete. Count is less than or equal to 5." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};





//get latest theft status
exports.theftalert = async (req, res, next) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id;

    const userexist = await User.findById(decodedId);
    if (!userexist) {
      return res.status(404).json({ message: 'Not found!' });
    }
    const uniqueId = userexist.uniqueId;

    const theft = await Theft.findOne({ uniqueId }).sort({ happenedAt: -1 });
    const latestPin = await Pinlocation.findOne({ uniqueId }).sort({ happenedAt: -1 });

   

    let response;

    if (theft && (theft.happenedAt > latestPin.pinAt)) {
      response = {
        latitude: theft.currentlatitude,
        longitude: theft.currentlongitude,
        time: theft.happenedAt,
        description: theft.description,
        level: theft.level,
        source: 'Theft'
      };
    } else  {
     res.status(401).json({message:"not latest theft Alert!"});
    }

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.deleteuser = async (req, res, next) =>{
  const {token} = req.body;
  
  try{
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 

    const deleteduser= await User.findByIdAndDelete(decodedId);
    if(deleteduser){
      return res.status(200).json({message:"successfully deleted!"});
     }
     else{
      return res.status(400).json({message:"Unable to delete!"});
     }
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
 
};








//check the hardwarestatus
exports.changestatus = async (req, res, next) => {
  const { token, status } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 
    const userexist= await User.findById(decodedId);
    if(!userexist){
      res.status(404).json({message:"Not found!"});
    }
    const uniqueId = userexist.uniqueId;
    const hardware = await Hardware.findOneAndUpdate({ uniqueId }, { status }, { new: true });

    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    const hardwareStatus = hardware.status;

    return res.status(200).json({ status: hardwareStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




//get all notification of minor alert and theft alert
exports.allnotification = async (req, res, next) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 
    const userexist = await User.findById(decodedId);

    if (!userexist) {
      return res.status(404).json({ message: "User not found!" });
    }

    const uniqueId = userexist.uniqueId;

    const allVibrate = await MinorAlert.find({ uniqueId }).lean().exec();
    const allTheft = await Theft.find({ uniqueId }).lean().exec();

    let allData = [];

    allData = allData.concat(allVibrate.map(data => ({ ...data, collection: 'MinorAlert' })));
    allData = allData.concat(allTheft.map(data => ({ ...data, collection: 'Theft' })));

    // Reverse the sort order based on timestamps
    allData.sort((a, b) => {
      const timestampA = a.pinAt || a.vibrateAt || a.happenedAt;
      const timestampB = b.pinAt || b.vibrateAt || b.happenedAt;
      return new Date(timestampB) - new Date(timestampA); 
    });

    if (!allData.length) {
      return res.status(400).json({ message: "No record found" });
    }

    res.status(200).json({ data: allData });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};








//get the latest notification
exports.latestnotification = async (req, res, next) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id;
    const userexist = await User.findById(decodedId);
    if (!userexist) {
      return res.status(404).json({ message: "Not found!" });
    }

    const uniqueId = userexist.uniqueId;

    const latestVibrate = await MinorAlert.findOne({ uniqueId }).sort({ vibrateAt: -1 });
    const latestTheft = await Theft.findOne({ uniqueId }).sort({ happenedAt: -1 });
    const latestPin = await Pinlocation.findOne({ uniqueId, statusPin: true }).sort({ pinAt: -1 });

    let latestData = null;

    if (latestPin && ((latestVibrate && latestPin.pinAt < latestVibrate.vibrateAt) || (latestTheft && latestPin.pinAt < latestTheft.happenedAt))) {
      latestData = latestVibrate && latestVibrate.vibrateAt > (latestTheft ? latestTheft.happenedAt : 0) 
        ? { ...latestVibrate.toObject(), collection: 'MinorAlert' } 
        : latestTheft 
          ? { ...latestTheft.toObject(), collection: 'Theft' }
          : null;
    } else if (latestVibrate && (!latestTheft || latestVibrate.vibrateAt > latestTheft.happenedAt)) {
      latestData = { ...latestVibrate.toObject(), collection: 'MinorAlert' };
    } else if (latestTheft) {
      latestData = { ...latestTheft.toObject(), collection: 'Theft' };
    }

    if (!latestData) {
      return res.status(400).json({ message: latestPin });
    }

    res.status(200).json({ data: [latestData] });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};









//get all pinned history
exports.pinhistory = async (req, res, next) => {
  const { token } = req.body; // Destructure uniqueId from req.body

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Unauthorized Access!' });
    }

    const decodedId = decoded.id; 
    const userexist= await User.findById(decodedId);
    if(!userexist){
      res.status(404).json({message:"Not found!"});
    }
    const uniqueId = userexist.uniqueId;
    const pinhistory = await Pinlocation.find({ uniqueId }).sort({ pinAt: -1 });

    if (!pinhistory || pinhistory.length === 0) { 
      return res.status(400).json({ message: 'No pin history recorded' });
    }

    return res.status(200).json({ pinhistory });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: 'Internal server error' });
  }
};








// exports.getlocation = async (req, res, next) => {

//   const { token } = req.body;  // Ensure you are using req.query to get the token

//   if (!token) {
//     return res.status(400).json({ message: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     if (!decoded || !decoded.id) {
//       return res.status(401).json({ message: 'Unauthorized Access!' });
//     }

//     const decodedId = decoded.id;

//     const userId = await User.findById(decodedId);
//     if (!userId) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     const uniqueId = userId.uniqueId;
//     const results = await MinorAlert.find({ uniqueId });

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No information found' });
//     }

//     return res.status(200).json(results);
//   } catch (error) {
//     console.error('Error during getlocation:', error);
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ message: 'Invalid token' });
//     }
//     return res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// };
















// exports.latestnotification = async (req, res, next) => {
//   const { token } = req.body;
//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     if (!decoded || !decoded.id) {
//       return res.status(401).json({ message: 'Unauthorized Access!' });
//     }

//     const decodedId = decoded.id; 
//     const userexist= await User.findById(decodedId);
//     if(!userexist){
//       res.status(404).json({message:"Not found!"});
//     }
//     const uniqueId = userexist.uniqueId;

//     const latestVibrate = await MinorAlert.findOne({ uniqueId }).sort({ vibrateAt: -1 }).limit(1);

//     const latestTheft = await Theft.findOne({ uniqueId }).sort({ happenedAt: -1 }).limit(1);

//     const latestPin  = await Pinlocation.findOne({uniqueId,statusPin:true}).sort({ happenedAt: -1 }).limit(1);

//     const latesttimepin = latestpin.pinAt;

//     let latestData = null;

//     if (latestVibrate && latestTheft) {

//       latestData = latestVibrate.vibrateAt > latestTheft.happenedAt ? { ...latestVibrate.toObject(), collection: 'MinorAlert' } : { ...latestTheft.toObject(), collection: 'Theft' };
//     } else if (latestVibrate) {
//       latestData = { ...latestVibrate.toObject(), collection: 'MinorAlert' };
//     } else if (latestTheft) {
//       latestData = { ...latestTheft.toObject(), collection: 'Theft' };
//     }

//     if (!latestData) {
//       return res.status(400).json({ message: "No record found" });
//     }

//     res.status(200).json({ data: [latestData] });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };
