import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, UserPlus, Bus, Shield, ArrowRight, Hash, Building2 } from "lucide-react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from "../config";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [busId, setBusId] = useState("");
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const departments = [
    "CSE - Computer Science",
    "ECE - Electronics & Communication",
    "EEE - Electrical & Electronics",
    "MECH - Mechanical",
    "CIVIL - Civil Engineering",
    "AI&DS - AI & Data Science",
    "IT - Information Technology"
  ];

  useEffect(() => {
    axios.get(`${API_URL}/getBuses`)
      .then(res => setBuses(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/signup`, { 
        name, email, password, registerNumber, department, busId, role: 'student'
      });
      toast.success('Account created successfully! 🎉');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      toast.error('Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Bus, text: "Real-time Tracking", color: "from-cyan-400 to-blue-500" },
    { icon: Shield, text: "QR Attendance", color: "from-purple-400 to-pink-500" },
    { icon: User, text: "Easy Access", color: "from-green-400 to-emerald-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-black via-[#0f0f15] to-black relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="flex flex-col items-center justify-center mx-auto min-h-screen relative z-10 p-4 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl"
            >
              <Bus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Student Registration
            </h1>
            <p className="text-gray-400 text-sm">Akshaya College of Engineering</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 mb-1 bg-gradient-to-br ${feature.color} rounded-lg`}>
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-gray-300">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            {/* Name */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Register Number */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Register Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
                  required
                  placeholder="2021CSE001"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Department</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bus */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Select Bus</label>
              <div className="relative">
                <Bus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
                  required
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                >
                  <option value="">Select Bus</option>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>{bus.busName} - {bus.route}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold mb-1.5 text-white text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-gray-300 text-sm">
              Already have an account?{' '}
              <Link to='/login' className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Sign In
              </Link>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Signup;
