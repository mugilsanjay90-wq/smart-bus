const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const ExcelJS = require("exceljs");
const multer = require("multer");
const UserModel = require("./models/User");
const BusModel = require("./models/Bus");
const AttendanceModel = require("./models/Attendance");
require("dotenv").config();

const app = express();
app.use(express.json());

// CORS for production
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const upload = multer({ storage: multer.memoryStorage() });

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// College Location - Akshaya College
const COLLEGE_LOCATION = {
  lat: 10.9456,
  lng: 76.9558,
  name: "Akshaya College of Engineering and Technology",
  address: "Bhagavathipalayam, Kinathukadavu, Coimbatore, Tamil Nadu 642109",
  radius: 200
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

// Helper Functions
function generateQRCode() {
  return crypto.randomBytes(32).toString('hex') + '_' + Date.now();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isInCollegeCampus(lat, lng) {
  const distance = calculateDistance(lat, lng, COLLEGE_LOCATION.lat, COLLEGE_LOCATION.lng);
  return distance <= COLLEGE_LOCATION.radius;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Health Check
app.get("/", (req, res) => {
  res.json({ status: "Smart Bus API Running", college: COLLEGE_LOCATION.name });
});

// College Info
app.get("/collegeInfo", (req, res) => {
  res.json(COLLEGE_LOCATION);
});

// Signup
app.post("/signup", (req, res) => {
  UserModel.create(req.body)
    .then(user => res.json(user))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check admin
    if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() && 
        password === process.env.ADMIN_PASSWORD) {
      return res.json("admin");
    }

    const user = await UserModel.findOne({ email });
    if (!user) return res.json("No record existed...!");

    if (user.password !== password) {
      return res.json("Password incorrect...!");
    }

    if (user.role === "driver") {
      return res.json({ 
        status: "driver", 
        userId: user._id, 
        busId: user.busId, 
        name: user.name,
        phone: user.phone 
      });
    }

    if (user.role === "student") {
      return res.json({ 
        status: "student", 
        userId: user._id, 
        busId: user.busId, 
        name: user.name,
        registerNumber: user.registerNumber,
        department: user.department
      });
    }

    return res.json("User role not recognized...!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Driver
app.post("/addDriver", (req, res) => {
  const driverData = { ...req.body, role: "driver" };
  UserModel.create(driverData)
    .then(driver => res.json(driver))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Add Student
app.post("/addStudent", (req, res) => {
  const studentData = { ...req.body, role: "student" };
  UserModel.create(studentData)
    .then(student => res.json(student))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Import Students from Excel
app.post("/importStudents", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.getWorksheet(1);
    const students = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = row.getCell(1).value;
      const email = row.getCell(2).value;
      const password = row.getCell(3).value || 'student123';
      const registerNumber = row.getCell(4).value;
      const department = row.getCell(5).value;
      const busId = row.getCell(6).value;
      const year = row.getCell(7).value;

      if (name && email) {
        students.push({
          name: String(name),
          email: String(email),
          password: String(password),
          registerNumber: registerNumber ? String(registerNumber) : '',
          department: department ? String(department) : '',
          busId: busId ? String(busId) : '',
          year: year ? String(year) : '',
          role: 'student'
        });
      }
    });

    await UserModel.insertMany(students, { ordered: false }).catch(() => {});
    res.json({ success: true, imported: students.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Student Template
app.get("/downloadStudentTemplate", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Password', key: 'password', width: 15 },
      { header: 'Register Number', key: 'registerNumber', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Bus ID', key: 'busId', width: 30 },
      { header: 'Year', key: 'year', width: 10 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.addRow({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'student123',
      registerNumber: '2021CSE001',
      department: 'CSE',
      busId: 'paste_bus_id_here',
      year: '3rd'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student_template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Bus
app.post("/addBus", (req, res) => {
  BusModel.create(req.body)
    .then(bus => res.json(bus))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Get All Drivers
app.get("/getDrivers", (req, res) => {
  UserModel.find({ role: "driver" })
    .then(drivers => res.json(drivers))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Get All Students
app.get("/getStudents", (req, res) => {
  UserModel.find({ role: "student" })
    .then(students => res.json(students))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Get All Buses
app.get("/getBuses", (req, res) => {
  BusModel.find()
    .then(buses => res.json(buses))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Delete Driver
app.delete("/deleteDriver/:id", (req, res) => {
  UserModel.findByIdAndDelete(req.params.id)
    .then(() => res.json("Driver deleted"))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Delete Student
app.delete("/deleteStudent/:id", (req, res) => {
  UserModel.findByIdAndDelete(req.params.id)
    .then(() => res.json("Student deleted"))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Delete Bus
app.delete("/deleteBus/:id", (req, res) => {
  BusModel.findByIdAndDelete(req.params.id)
    .then(() => res.json("Bus deleted"))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Verify QR and Mark Attendance
app.post("/verifyQR", async (req, res) => {
  try {
    const { qrCode, busId, studentId, location } = req.body;
    
    const bus = await BusModel.findById(busId);
    if (!bus) return res.status(404).json({ error: "Bus not found" });

    // Check if QR is valid (within 15 seconds)
    const qrAge = Date.now() - new Date(bus.qrGeneratedAt).getTime();
    if (bus.currentQRCode !== qrCode || qrAge > 15000) {
      return res.status(400).json({ error: "Invalid or expired QR code" });
    }

    const student = await UserModel.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const today = getTodayDate();
    const existingAttendance = await AttendanceModel.findOne({
      studentId: studentId,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ error: "Attendance already marked for today" });
    }

    const attendance = await AttendanceModel.create({
      studentId: studentId,
      studentName: student.name,
      registerNumber: student.registerNumber,
      department: student.department,
      busId: busId,
      busName: bus.busName,
      busNumber: bus.busNumber,
      date: today,
      punchInTime: new Date(),
      punchInLocation: location,
      status: 'present'
    });

    io.emit(`attendance:${busId}`, {
      studentName: student.name,
      registerNumber: student.registerNumber,
      time: new Date()
    });

    res.json({ success: true, message: "Attendance marked successfully", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Attendance by Date
app.get("/attendance/:date", async (req, res) => {
  try {
    const attendance = await AttendanceModel.find({ date: req.params.date })
      .sort({ punchInTime: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Today's Attendance Count
app.get("/todayAttendance/:busId", async (req, res) => {
  try {
    const today = getTodayDate();
    const count = await AttendanceModel.countDocuments({
      busId: req.params.busId,
      date: today
    });
    res.json({ count, date: today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Attendance Excel
app.get("/downloadAttendance", async (req, res) => {
  try {
    const { startDate, endDate, busId, department } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = startDate;
    } else {
      query.date = getTodayDate();
    }
    
    if (busId) query.busId = busId;
    if (department) query.department = department;

    const attendance = await AttendanceModel.find(query).sort({ date: -1, punchInTime: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Register Number', key: 'registerNumber', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Bus Name', key: 'busName', width: 15 },
      { header: 'Bus Number', key: 'busNumber', width: 15 },
      { header: 'Punch In Time', key: 'punchInTime', width: 20 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true };

    attendance.forEach(record => {
      worksheet.addRow({
        date: record.date,
        studentName: record.studentName,
        registerNumber: record.registerNumber || '-',
        department: record.department || '-',
        busName: record.busName,
        busNumber: record.busNumber,
        punchInTime: record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString() : '-',
        status: record.status
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${query.date || 'report'}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Departments
app.get("/departments", async (req, res) => {
  try {
    const departments = await UserModel.distinct('department', { role: 'student', department: { $ne: '' } });
    res.json(departments.filter(d => d));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO
const activeBuses = new Map();

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("updateLocation", async (data) => {
    const { busId, lat, lng } = data;
    
    activeBuses.set(busId, { busId, lat, lng, timestamp: new Date() });
    
    const distanceToCollege = calculateDistance(lat, lng, COLLEGE_LOCATION.lat, COLLEGE_LOCATION.lng);
    const isNearCollege = isInCollegeCampus(lat, lng);
    const etaMinutes = (distanceToCollege / 1000) / 30 * 60;

    await BusModel.findByIdAndUpdate(busId, {
      currentLocation: { lat, lng },
      isActive: true
    });

    io.emit(`busLocation:${busId}`, { 
      busId, lat, lng,
      distanceToCollege,
      etaMinutes,
      isNearCollege,
      collegeLocation: COLLEGE_LOCATION
    });

    if (isNearCollege) {
      io.emit(`autoStopRide:${busId}`, { 
        message: "Bus has arrived at college campus",
        busId 
      });
    }
  });

  socket.on("startRide", async (data) => {
    const { busId } = data;
    const qrCode = generateQRCode();
    
    await BusModel.findByIdAndUpdate(busId, {
      isActive: true,
      currentQRCode: qrCode,
      qrGeneratedAt: new Date()
    });
    
    io.emit(`rideStarted:${busId}`, { busId, qrCode });
  });

  socket.on("stopRide", async (data) => {
    const { busId } = data;
    activeBuses.delete(busId);
    
    await BusModel.findByIdAndUpdate(busId, {
      isActive: false,
      currentQRCode: null
    });
    
    io.emit(`rideStopped:${busId}`, { busId });
  });

  socket.on("refreshQR", async (data) => {
    const { busId } = data;
    const qrCode = generateQRCode();
    
    await BusModel.findByIdAndUpdate(busId, {
      currentQRCode: qrCode,
      qrGeneratedAt: new Date()
    });
    
    io.emit(`newQR:${busId}`, { qrCode, generatedAt: new Date() });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏫 College: ${COLLEGE_LOCATION.name}`);
});
