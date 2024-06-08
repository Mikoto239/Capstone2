const Hardware = require('../models/hardware');
const MinorAlert = require('../models/minoralerts.js');
const Pinlocation = require('../models/pinlocation.js');
const TheftDetails = require('../models/theftdetails.js');
const User = require('../models/user.js');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const jwt_key = process.env.SECRET_KEY;
const client = new OAuth2Client(process.env.GOOGLE_API_KEY);



exports.userregistration = async (req, res, next) => {
  const { name, uniqueId, email, cellphonenumber, token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_API_KEY, 
    });
    const payload = ticket.getPayload();
    const emailFromGoogle = payload.email;
     
    const findUser = await User.findOne({ uniqueId, email: emailFromGoogle });
    if (findUser) {
      return res.status(400).json({ message: "User is already registered!" });
    }

    const hardwareId = await Hardware.findOne({ uniqueId });
    if (!hardwareId) {
      return res.status(400).json({ message: "Hardware ID not found!" });
    }

    const newUser = new User({ name, uniqueId, email, cellphonenumber });
    await newUser.save();

    const tokenToSend = jwt.sign({ id: newUser._id, email: newUser.email }, jwt_key); // No expiresIn option

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      token: tokenToSend
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getlocation = async (req, res, next)  => {
  const { uniqueId } = req.query;

  if (!uniqueId) {
    return res.status(400).json({ message: 'uniqueId is required' });
  }

  try {
    const results = await MinorAlert.find({ uniqueId });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No information found' });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};






exports.turnoffhardware = async (req, res, next)  => {
  const { uniqueId ,statusPin} = req.body;

  try {
    // Find all pin locations with the specified uniqueId and statusPin as true
    const pinLocations = await Pinlocation.find({ uniqueId, statusPin: true });

    if (pinLocations.length === 0) {
      return res.status(404).json({ message: 'No pin locations found with specified uniqueId and statusPin as true' });
    }

    // Update statusPin to false for all found pin locations
    await Pinlocation.updateMany({ uniqueId, statusPin: true }, { statusPin: false });

    return res.status(200).json({ message: 'Updated pin locations status to false' });
  } catch (error) {
    console.error('Error updating pin locations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




exports.turnOnhardware = async (req, res, next) => {
  const { name, uniqueId, email, cellphonenumber, pinlocation } = req.body;
  const finduser = await User.findOne({ name, email, uniqueId, cellphonenumber });
  try {
    if (!finduser) {
      return res.status(400).json({ message: "User not Found!" });
    }
    const hardwareid = finduser.uniqueId;
 
    const hardware = await Hardware.findOneAndUpdate({ uniqueId: hardwareid }, { pinlocation }, { new: true });
    if (!hardware) {
      return res.status(400).json({ message: "Hardware not Found!" });
    }

    return res.status(200).json({message:"Pin Successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};





exports.userexist = async (req, res, next) => {
  const { userName, email } = req.body; // Renamed 'name' to 'userName'

  try {
      // Find the user based on userName and email
      const user = await User.findOne({ name: userName, email });

      if (!user) {
          // If user not found, return 404 status with a message
          return res.status(404).json({ message: 'User not registered yet' });
      }

      // If user found, extract relevant information
      const { uniqueId, name, email: userEmail, cellphonenumber } = user; // Renamed 'name' to 'userName'

      // Return user information
      return res.status(200).json({ uniqueId, name, email: userEmail, cellphonenumber });
  } catch (error) {
      // If an error occurs, return 500 status with an error message
      return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};






exports.deletetheft = async (req, res, next) => {
  const { uniqueId } = req.body;

  try {
    const count = await TheftDetails.countDocuments({ uniqueId });
    if (count > 5) {
      const oldestTheftDetail = await TheftDetails.findOneAndDelete({ uniqueId }, { sort: { createdAt: 1 } });
      return res.status(200).json({ message: "Success" });
    } else {
      return res.status(400).json({ message: "No need to delete. Count is less than or equal to 5." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};






exports.alltheft = async (req, res, next)=>{
  const {uniqueId} = req.body;
  
    try{
       const theft = await TheftDetails.findOne({ uniqueId }).sort({ happenedAt:-1 });
        if(!theft){
      return res.status(400).json({message:"no theft report"});
        }
      const theftlatitude = theft.currentlatitude;
      const theftlongitude = theft.currentlongitude;
      const theftdescription = theft.description;
      const theftlevel =theft.level
      const happened = theft.happenedAt;
  
      return res.status(200).json({latitude:theftlatitude,longitude:theftlongitude,time:happened,description:theftdescription,level:theftlevel});
  
    }catch(error){
   return res.status(500).json({ message: 'Internal server error' });
    }
  
  };

  




exports.deleteuser = async (req, res, next) =>{
  const {name,uniqueId,email} = req.body;
  
  try{
    const deleteduser = await User.findOneAndDelete({name,uniqueId,email});
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






  exports.hardwarestatus = async (req, res, next) => {
  const { uniqueId } = req.query;

  try {
    const hardware = await Hardware.findOne({ uniqueId });

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




exports.changestatus = async (req, res, next) => {
  const { uniqueId, status } = req.body;

  try {
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








exports.allnotification = async (req, res, next) =>  {
  const { uniqueId } = req.body;
  try {

    const allVibrate = await MinorAlert.find({ uniqueId });
    const allTheft = await TheftDetails.find({ uniqueId });

    // Merge data from all collections into one array
    let allData = [];
    allData = allData.concat(allPinLocation.map(data => ({ ...data.toObject(), collection: 'Pinlocation' })));
    allData = allData.concat(allVibrate.map(data => ({ ...data.toObject(), collection: 'MinorAlert' })));
    allData = allData.concat(allTheft.map(data => ({ ...data.toObject(), collection: 'TheftDetails' })));

    // Reverse the sort order based on timestamps
    allData.sort((a, b) => {
      const timestampA = a.pinAt || a.vibrateAt || a.happenedAt;
      const timestampB = b.pinAt || b.vibrateAt || b.happenedAt;
      return new Date(timestampB) - new Date(timestampA); // Reversed order here
    });

    if (!allData.length) {
      return res.status(400).json({ message: "No record found" });
    }

    res.status(200).json({ data: allData });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};









exports.notification = async (req, res, next) => {
  const { uniqueId } = req.body;
  try {
    // Retrieve the latest data from MinorAlert collection
    const latestVibrate = await MinorAlert.findOne({ uniqueId }).sort({ vibrateAt: -1 }).limit(1);

    // Retrieve the latest data from TheftDetails collection
    const latestTheft = await TheftDetails.findOne({ uniqueId }).sort({ happenedAt: -1 }).limit(1);

    // Determine which data is the latest based on timestamps
    let latestData = null;
    if (latestVibrate && latestTheft) {
      // Compare timestamps to find the latest data
      latestData = latestVibrate.vibrateAt > latestTheft.happenedAt ? { ...latestVibrate.toObject(), collection: 'MinorAlert' } : { ...latestTheft.toObject(), collection: 'TheftDetails' };
    } else if (latestVibrate) {
      latestData = { ...latestVibrate.toObject(), collection: 'MinorAlert' };
    } else if (latestTheft) {
      latestData = { ...latestTheft.toObject(), collection: 'TheftDetails' };
    }

    if (!latestData) {
      return res.status(400).json({ message: "No record found" });
    }

    res.status(200).json({ data: [latestData] });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.pinhistory = async (req, res, next) => {
  const { uniqueId } = req.body; // Destructure uniqueId from req.body

  try {
    const pinhistory = await Pinlocation.find({ uniqueId }).sort({ pinAt: -1 });

    if (!pinhistory || pinhistory.length === 0) { // Check if pinhistory is empty
      return res.status(400).json({ message: 'No pin history recorded' });
    }

    return res.status(200).json({ pinhistory });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: 'Internal server error' });
  }
};

