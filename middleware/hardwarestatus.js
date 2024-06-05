const Hardware = require('../models/hardware');

exports.isHardwareOn = async (req, res, next) => {
  const { uniqueId } = req.body;

  try {
    const hardware = await Hardware.findOne({ uniqueId });

    if (!hardware) {
      return res.status(404).json({ message: "Hardware not found" });
    }

    if (!hardware.status) {
      return res.status(503).json({ message: "Service Unavailable: The hardware is currently turned off and cannot process the request." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
};


