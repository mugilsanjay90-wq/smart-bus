const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "driver", "student"],
    default: "student"
  },
  busId: { type: String },
  registerNumber: { type: String },
  department: { type: String },
  year: { type: String },
  phone: { type: String },
  licenseNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
