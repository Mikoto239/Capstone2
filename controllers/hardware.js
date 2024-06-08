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
  try {
    const response = await axios.get(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=${process.env.OPENCAGE_API_KEY}`);
    const responseData = response.data;

    // Check if the response contains address information
    if (!responseData || !responseData.display_name || !responseData.address) {
      return res.status(404).json({ message: 'No address information found for the provided coordinates' });
    }

    const {
      display_name,
      address: { road, quarter, city, state, region, country_code }
    } = responseData;

    // Create the address object
    const address = {
      formatted: display_name,
      road,
      quarter,
      city,
      state,
      region,
      country_code
    };

    const minoralert = new MinorAlertModel({
      desccription,
      latitude,
      longitude,
      uniqueId,
      level,
      address: address.formatted
    });

    await minoralert.save();
    return res.status(200).send('Data saved successfully!');
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send('Failed to retrieve address information');
    } else if (error.name === 'ValidationError') {
      return res.status(400).send('Validation error');
    } else {
      return res.status(500).send('Failed to save data');
    }
  }
};


exports.pinlocation = async (req, res, next) => {
 const { uniqueId, pinlocation, currentlatitude, currentlongitude, statusPin } = req.body;
  try {
    const response = await axios.get(`https://geocode.maps.co/reverse?lat=${currentlatitude}&lon=${currentlongitude}&api_key=${process.env.OPENCAGE_API_KEY}`);
    const responseData = response.data;

    // Check if the response contains address information
    if (!responseData || !responseData.display_name || !responseData.address) {
      return res.status(404).json({ message: 'No address information found for the provided coordinates' });
    }

    const {
      display_name,
      address: { road, quarter, city, state, region, country_code }
    } = responseData;

    // Create the address object
    const address = {
      formatted: display_name,
      road,
      quarter,
      city,
      state,
      region,
      country_code
    };

    const hardware = await Hardware.findOneAndUpdate(
      { uniqueId },
      { pinlocation },
      { new: true }
    );

    if (!hardware) {
      // If hardware is not found, log the error and return a 404 error
      console.log('Hardware not found for uniqueId:', uniqueId);
      return res.status(404).json({ message: "Hardware not found" });
    }

    // Validate the current latitude and longitude
    if (currentlatitude == 0 || currentlongitude == 0) {
      // If location is invalid (assumes 0,0 is invalid), return an error
      return res.status(400).json({ message: "Invalid location" }); // Using 400 for bad request
    }

    // Since hardware exists and location is valid, save the new pin location
    const pinLocationSave = new Pinlocation({
      uniqueId,
      currentlatitude,
      currentlongitude,
      address:address. formatted,
      statusPin
    });

    
    await pinLocationSave.save();
    return res.status(200).json({
      message: "Location updated successfully",
      latitude: currentlatitude,
      longitude: currentlongitude,
      address
    });

  } catch (error) {
    // If there's an error during processing, log and return a 500 error
    console.error('Error updating hardware:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
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
    // Call the OpenCage Geocoding API to get address information
    const response = await axios.get(`https://geocode.maps.co/reverse?lat=${currentlatitude}&lon=${currentlongitude}&api_key=${process.env.OPENCAGE_API_KEY}`);

    const responseData = response.data;

    // Check if the response contains address information
    if (!responseData || !responseData.display_name || !responseData.address) {
      return res.status(404).json({ message: 'No address information found for the provided coordinates' });
    }

    const {
      display_name,
      address: { road, quarter, city, state, region, country_code }
    } = responseData;

    // Create the address object
    const address = {
      formatted: display_name,
      road,
      quarter,
      city,
      state,
      region,
      country_code
    };

    const theftDetail = new Theft({
      uniqueId,
      currentlatitude,
      currentlongitude,
      description,
      level,
      address: address.formatted // Use formatted address as you did before
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
