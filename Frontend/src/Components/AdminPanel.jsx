import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, Bus, Plus, Trash2, Search, 
  TrendingUp, Activity, LogOut, Menu, X, Download, Upload, FileSpreadsheet,
  Building2, Phone, Hash, CheckCircle
} from "lucide-react";
import axios from "axios";
import toast from 'react-hot-toast';
import { API_URL } from "../config";

function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("drivers");
  const [drivers, setDrivers] = useState([]);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Form states
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverBus, setDriverBus] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentBus, setStudentBus] = useState("");
  const [studentRegisterNumber, setStudentRegisterNumber] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");

  const [busName, setBusName] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [busCapacity, setBusCapacity] = useState("");
  const [busRoute, setBusRoute] = useState("");

  const departmentsList = [
    "CSE - Computer Science",
    "ECE - Electronics & Communication",
    "EEE - Electrical & Electronics",
    "MECH - Mechanical",
    "CIVIL - Civil Engineering",
    "AI&DS - AI & Data Science",
    "IT - Information Technology"
  ];

  // Check if admin is logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const role = localStorage.getItem("userRole");
    if (isAdmin !== "true" && role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "attendance") fetchAttendance();
  }, [activeTab, attendanceDate, selectedDepartment]);

  const fetchData = () => {
    axios.get(`${API_URL}/getDrivers`).then(res => setDrivers(res.data)).catch(err => console.log(err));
    axios.get(`${API_URL}/getStudents`).then(res => setStudents(res.data)).catch(err => console.log(err));
    axios.get(`${API_URL}/getBuses`).then(res => setBuses(res.data)).catch(err => console.log(err));
  };

  const fetchAttendance = () => {
    axios.get(`${API_URL}/attendance/${attendanceDate}`)
      .then(res => {
        let data = res.data;
        if (selectedDepartment) data = data.filter(a => a.department === selectedDepartment);
        setAttendance(data);
      })
      .catch(err => console.log(err));
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/addDriver`, {
        name: driverName, email: driverEmail, password: driverPassword, busId: driverBus, phone: driverPhone
      });
      toast.success(`Driver ${driverName} added! 🚗`);
      setDriverName(""); setDriverEmail(""); setDriverPassword(""); setDriverBus(""); setDriverPhone("");
      setIsAddingNew(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to add driver");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/addStudent`, {
        name: studentName, email: studentEmail, password: studentPassword,
        busId: studentBus, registerNumber: studentRegisterNumber, department: studentDepartment
      });
      toast.success(`Student ${studentName} added! 🎓`);
      setStudentName(""); setStudentEmail(""); setStudentPassword(""); 
      setStudentBus(""); setStudentRegisterNumber(""); setStudentDepartment("");
      setIsAddingNew(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to add student");
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/addBus`, { busName, busNumber, capacity: busCapacity, route: busRoute });
      toast.success(`Bus ${busName} added! 🚌`);
      setBusName(""); setBusNumber(""); setBusCapacity(""); setBusRoute("");
      setIsAddingNew(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to add bus");
    }
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Delete ${type} ${name}?`)) return;
    try {
      await axios.delete(`${API_URL}/delete${type}/${id}`);
      toast.success(`${type} deleted`);
      fetchData();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const downloadAttendance = () => {
    let url = `${API_URL}/downloadAttendance?startDate=${attendanceDate}`;
    if (selectedDepartment) url += `&department=${encodeURIComponent(selectedDepartment)}`;
    window.open(url, '_blank');
    toast.success('Downloading attendance...');
  };

  const downloadTemplate = () => {
    window.open(`${API_URL}/downloadStudentTemplate`, '_blank');
    toast.success('Downloading template...');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/importStudents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Imported ${res.data.imported} students!`);
      fetchData();
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const stats = [
    { title: "Total Drivers", value: drivers.length, icon: Users, color: "bg-cyan-500/10" },
    { title: "Total Students", value: students.length, icon: UserCheck, color: "bg-purple-500/10" },
    { title: "Active Buses", value: buses.filter(b => b.isActive).length, icon: Bus, color: "bg-green-500/10" },
    { title: "Today's Attendance", value: attendance.length, icon: CheckCircle, color: "bg-orange-500/10" },
  ];

  const filteredDrivers = drivers.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDepartment || s.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });
  const filteredBuses = buses.filter(b => b.busName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-gradient-to-br from-black via-[#0f0f15] to-black">
      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 min-h-screen p-6 fixed z-50"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">Akshaya College</span>
                  <p className="text-xs text-gray-500">Bus Management</p>
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: "drivers", label: "Drivers", icon: Users, count: drivers.length },
                  { id: "students", label: "Students", icon: UserCheck, count: students.length },
                  { id: "buses", label: "Buses", icon: Bus, count: buses.length },
                  { id: "attendance", label: "Attendance", icon: CheckCircle, count: attendance.length },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsAddingNew(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : "text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{item.count}</span>
                  </button>
                ))}
              </nav>

              <div className="absolute bottom-6 left-6 right-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}>
          {/* Header */}
          <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4 md:p-6 sticky top-0 z-40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                  {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-gray-400 text-sm">Manage your fleet</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(activeTab === "students" || activeTab === "attendance") && (
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  >
                    <option value="">All Departments</option>
                    {departmentsList.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
                  </select>
                )}

                {activeTab === "attendance" && (
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-40"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, i) => (
                <div key={i} className={`${stat.color} backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-xl bg-white/10">
                      <stat.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400 text-xs md:text-sm">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
                    <div className="flex flex-wrap gap-2">
                      {activeTab === "students" && (
                        <>
                          <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                            <Download className="w-4 h-4" /> Template
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm"
                          >
                            <Upload className="w-4 h-4" /> {isUploading ? 'Importing...' : 'Import'}
                          </button>
                          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                        </>
                      )}

                      {activeTab === "attendance" && (
                        <button onClick={downloadAttendance} className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                          <FileSpreadsheet className="w-4 h-4" /> Download Excel
                        </button>
                      )}

                      {activeTab !== "attendance" && (
                        <button
                          onClick={() => setIsAddingNew(!isAddingNew)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium"
                        >
                          <Plus className="w-4 h-4" /> Add New
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Drivers */}
                    {activeTab === "drivers" && filteredDrivers.map((driver) => (
                      <div key={driver._id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-cyan-500/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {driver.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{driver.name}</p>
                            <p className="text-sm text-gray-400">{driver.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {driver.phone && <span className="text-xs text-green-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone}</span>}
                              <span className="text-xs text-cyan-400">Bus: {buses.find(b => b._id === driver.busId)?.busName || "Not assigned"}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDelete("Driver", driver._id, driver.name)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Students */}
                    {activeTab === "students" && filteredStudents.map((student) => (
                      <div key={student._id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-purple-500/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {student.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{student.name}</p>
                            <p className="text-sm text-gray-400">{student.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {student.registerNumber && <span className="text-xs text-cyan-400 flex items-center gap-1"><Hash className="w-3 h-3" /> {student.registerNumber}</span>}
                              {student.department && <span className="text-xs text-orange-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {student.department.split(' - ')[0]}</span>}
                              <span className="text-xs text-purple-400">Bus: {buses.find(b => b._id === student.busId)?.busName || "Not assigned"}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDelete("Student", student._id, student.name)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Buses */}
                    {activeTab === "buses" && filteredBuses.map((bus) => (
                      <div key={bus._id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-green-500/30">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${bus.isActive ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gray-600'}`}>
                            <Bus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {bus.busName}
                              {bus.isActive && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Active</span>}
                            </p>
                            <p className="text-sm text-gray-400">{bus.busNumber}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-green-400">Route: {bus.route}</span>
                              <span className="text-xs text-gray-400">Capacity: {bus.capacity}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDelete("Bus", bus._id, bus.busName)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Attendance */}
                    {activeTab === "attendance" && attendance.map((record) => (
                      <div key={record._id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{record.studentName}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-cyan-400">{record.registerNumber}</span>
                              <span className="text-xs text-orange-400">{record.department?.split(' - ')[0]}</span>
                              <span className="text-xs text-purple-400">{record.busName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-sm font-medium">{record.status}</p>
                          <p className="text-gray-500 text-xs">{record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString() : '-'}</p>
                        </div>
                      </div>
                    ))}

                    {activeTab === "attendance" && attendance.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No attendance records for this date</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div>
                <AnimatePresence mode="wait">
                  {isAddingNew && activeTab !== "attendance" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-6">Add New {activeTab.slice(0, -1)}</h3>

                      {activeTab === "drivers" && (
                        <form onSubmit={handleAddDriver} className="space-y-4">
                          <input type="text" placeholder="Driver Name" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                          <input type="email" placeholder="Email" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} required />
                          <input type="password" placeholder="Password" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={driverPassword} onChange={(e) => setDriverPassword(e.target.value)} required />
                          <input type="tel" placeholder="Phone Number" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
                          <select className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500" value={driverBus} onChange={(e) => setDriverBus(e.target.value)} required>
                            <option value="">Select Bus</option>
                            {buses.map(bus => <option key={bus._id} value={bus._id}>{bus.busName} - {bus.busNumber}</option>)}
                          </select>
                          <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl">Add Driver</button>
                        </form>
                      )}

                      {activeTab === "students" && (
                        <form onSubmit={handleAddStudent} className="space-y-4">
                          <input type="text" placeholder="Student Name" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                          <input type="text" placeholder="Register Number" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentRegisterNumber} onChange={(e) => setStudentRegisterNumber(e.target.value)} required />
                          <select className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentDepartment} onChange={(e) => setStudentDepartment(e.target.value)} required>
                            <option value="">Select Department</option>
                            {departmentsList.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
                          </select>
                          <input type="email" placeholder="Email" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                          <input type="password" placeholder="Password" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required />
                          <select className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500" value={studentBus} onChange={(e) => setStudentBus(e.target.value)} required>
                            <option value="">Select Bus</option>
                            {buses.map(bus => <option key={bus._id} value={bus._id}>{bus.busName} - {bus.route}</option>)}
                          </select>
                          <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 rounded-xl">Add Student</button>
                        </form>
                      )}

                      {activeTab === "buses" && (
                        <form onSubmit={handleAddBus} className="space-y-4">
                          <input type="text" placeholder="Bus Name (e.g., Bus 1)" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500" value={busName} onChange={(e) => setBusName(e.target.value)} required />
                          <input type="text" placeholder="Bus Number (e.g., TN-38-AB-1234)" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required />
                          <input type="number" placeholder="Capacity" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500" value={busCapacity} onChange={(e) => setBusCapacity(e.target.value)} required />
                          <input type="text" placeholder="Route (e.g., Coimbatore - Kinathukadavu)" className="w-full p-3 rounded-xl bg-black/40 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500" value={busRoute} onChange={(e) => setBusRoute(e.target.value)} required />
                          <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 rounded-xl">Add Bus</button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isAddingNew && (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Quick Info
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-black/40 rounded-xl">
                        <p className="text-gray-400 text-sm">College</p>
                        <p className="text-white font-medium">Akshaya College of Engineering</p>
                        <p className="text-gray-500 text-xs mt-1">Kinathukadavu, Coimbatore</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl">
                        <p className="text-gray-400 text-sm">Active Routes</p>
                        <p className="text-green-400 font-bold text-2xl">{buses.filter(b => b.isActive).length}</p>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl">
                        <p className="text-gray-400 text-sm">Today's Date</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 10px; }
      `}</style>
    </motion.div>
  );
}

export default AdminPanel;
