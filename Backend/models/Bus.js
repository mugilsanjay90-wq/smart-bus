const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  busNumber: { type: String, required: true },
  busName: { type: String, required: true },
  capacity: { type: Number },
  route: { type: String },
  isActive: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  currentQRCode: { type: String },
  qrGeneratedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const BusModel = mongoose.model("buses", BusSchema);
module.exports = BusModel;
