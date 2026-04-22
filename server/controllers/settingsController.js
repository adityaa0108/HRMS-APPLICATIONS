const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ name: 'GlobalSettings' });
    if (!settings) {
      settings = await Settings.create({ name: 'GlobalSettings' });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private (Admin/HR)
exports.updateSettings = async (req, res) => {
  try {
    const { officeLocation } = req.body;
    
    let settings = await Settings.findOne({ name: 'GlobalSettings' });
    if (!settings) {
      settings = new Settings({ name: 'GlobalSettings' });
    }
    
    if (officeLocation) {
      settings.officeLocation = {
        latitude: officeLocation.latitude,
        longitude: officeLocation.longitude,
        radius: officeLocation.radius
      };
    }
    
    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
