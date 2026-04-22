const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Using a single document with a known ID or singleton pattern
  name: { type: String, default: 'GlobalSettings', unique: true },
  officeLocation: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    radius: { type: Number, default: 0 } // in meters. 0 means disabled
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
