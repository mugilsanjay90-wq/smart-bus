const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  studentName: { type: String, required: true },
  registerNumber: { type: String },
  department: { type: String },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'buses', required: true },
  busName: { type: String },
  busNumber: { type: String },
  date: { type: String, required: true },
  punchInTime: { type: Date },
  punchOutTime: { type: Date },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  punchInLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const AttendanceModel = mongoose.model("attendance", AttendanceSchema);
module.exports = AttendanceModel;
