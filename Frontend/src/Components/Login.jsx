import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Bus, ArrowRight, GraduationCap } from "lucide-react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from "../config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Clear any existing data
    localStorage.clear();
    
    try {
      const result = await axios.post(`${API_URL}/login`, { email, password });
      
      if (result.data === "admin") {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("userRole", "admin");
        toast.success('Welcome Admin! 🎉');
        setTimeout(() => navigate('/admin'), 500);
      } else if (result.data.status === "driver") {
        localStorage.setItem("userId", result.data.userId);
        localStorage.setItem("busId", result.data.busId);
        localStorage.setItem("userName", result.data.name);
        localStorage.setItem("userRole", "driver");
        localStorage.setItem("userPhone", result.data.phone || '');
        toast.success(`Welcome ${result.data.name}! 🚌`);
        setTimeout(() => navigate('/driver'), 500);
      } else if (result.data.status === "student") {
        localStorage.setItem("userId", result.data.userId);
        localStorage.setItem("busId", result.data.busId);
        localStorage.setItem("userName", result.data.name);
        localStorage.setItem("userRole", "student");
        localStorage.setItem("registerNumber", result.data.registerNumber || '');
        localStorage.setItem("department", result.data.department || '');
        toast.success(`Welcome ${result.data.name}! 🎓`);
        setTimeout(() => navigate('/student'), 500);
      } else {
        toast.error(result.data);
      }
    } catch (err) {
      console.log(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="flex flex-col items-center justify-center mx-auto min-h-screen relative z-10 p-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl"
            >
              <Bus className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Smart Bus Tracking
            </h1>
            <p className="text-gray-400">Akshaya College of Engineering</p>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6"
          >
            {/* College Badge */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
                <p className="font-semibold text-cyan-300 text-sm">Akshaya College of Engineering</p>
              </div>
              <p className="text-gray-400 text-xs">Kinathukadavu, Coimbatore - 642109</p>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold mb-2 text-white text-sm">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold mb-2 text-white text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-gray-500"
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
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-gray-300">
              Don't have an account?{' '}
              <Link to='/' className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Create Account
              </Link>
            </p>
          </motion.form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Secured with end-to-end encryption 🔒
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Login;
