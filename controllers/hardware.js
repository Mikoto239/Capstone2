const Hardware = require('../models/hardware.js');
const MinorAlertModel = require('../models/minoralerts.js');  // Avoid naming conflict by renaming the import
const Pinlocation = require('../models/pinlocation.js');
const Theft = require('../models/theftdetails.js');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

exports.hardwareregistration = async (req, res, next) => {
  const { uniqueId } = req.body;

  try {
    const existingHardware = await Hardware.findOne({ uniqueId });

    if (existingHardware) {
      const token = jwt.sign({ id: existingHardware._id }, SECRET_KEY);
      return res.status(200).json({
        message: 'Hardware already registered',
        token: token // Send the generated token back to the hardware
      });
    } else {
      const newHardware = new Hardware({ uniqueId });
      await newHardware.save();
      const token = jwt.sign({ id: newHardware._id }, SECRET_KEY); // Use newHardware._id
      return res.status(200).json({
        message: 'Hardware registered successfully',
        token: token
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getcurrentpinlocation = async (req, res, next) => {
  const { uniqueId } = req.body;
  try {
      const pinLocation = await Pinlocation.findOne({ uniqueId, statusPin: true }).sort({ pinAt: -1 });

      if (!pinLocation) {
          console.log("No pin location found for uniqueId:", uniqueId);
          return res.status(400).json({ message: "Invalid uniqueId" });
      } 
      
      const latitude = pinLocation.currentlatitude;
      const longitude = pinLocation.currentlongitude;
      const time = pinLocation.pinAt;

      return res.status(200).json({ latitude, longitude, time });
  } catch (error) {
      console.error("Error fetching pin location:", error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.send_alert = async (req, res, next) => {
  const { description, latitude, longitude, uniqueId, level } = req.body;

  const minorAlert = new MinorAlertModel({
    description,
    latitude,
    longitude,
    uniqueId,
    level
  });

  minorAlert.save()
    .then(() => {
      console.log('Data saved to MongoDB:', minorAlert);
      res.status(200).send('Data saved successfully!');
    })
    .catch(error => {
      if (error.name === 'ValidationError') {
        console.error('Validation error:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      res.status(500).send('Failed to save data!');
    });
};

exports.pinlocation = async (req, res, next) => {
  const { uniqueId, pinlocation, currentlatitude, currentlongitude, statusPin } = req.body;

  try {
    const hardware = await Hardware.findOneAndUpdate(
      { uniqueId },
      { pinlocation },
      { new: true }
    );

    if (!hardware) {
      console.log('Hardware not found for uniqueId:', uniqueId);
      return res.status(404).json({ message: "Hardware not found" });
    }

    if (currentlatitude === 0 || currentlongitude === 0) {
      return res.status(400).json({ message: "Invalid location" });
    }

    const pinLocationSave = new Pinlocation({
      uniqueId,
      currentlatitude,
      currentlongitude,
      statusPin
    });
    await pinLocationSave.save();

    return res.status(200).json({
      message: "Location updated successfully",
      latitude: currentlatitude,
      longitude: currentlongitude
    });
  } catch (error) {
    console.error('Error updating hardware:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.hardwarestatus = async (req, res, next) => {
  const { uniqueId } = req.query;

  try {
    const hardware = await Hardware.findOne({ uniqueId });

    if (!hardware) {
      return res.status(404).json({ message: 'Hardware not found' });
    }

    const pinStatus = hardware.pinlocation;

    return res.status(200).json({ status: pinStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.theftdetails = async (req, res, next) => {
  const { uniqueId, currentlatitude, currentlongitude, description, level } = req.body;

  try {
    const theftDetail = new Pinlocation({
      uniqueId,
      currentlatitude,
      currentlongitude,
      description,
      level
    });

    await theftDetail.save();

    return res.status(200).json({ message: 'Theft details saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getusernumber = async (req, res, next) => {
  const { uniqueId } = req.body;
    
  try {
    const user = await User.findOne({ uniqueId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } 

    const userNumber = user.cellphonenumber;
    return res.status(200).json({ cellphonenumber: userNumber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
