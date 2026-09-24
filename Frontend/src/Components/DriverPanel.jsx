import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Square, MapPin, Navigation, Radio, Battery, 
  Wifi, User, Bus, LogOut, Clock, Zap, QrCode,
  Users, Shield, RefreshCw, CheckCircle
} from "lucide-react";
import io from "socket.io-client";
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { API_URL } from "../config";

const socket = io(API_URL);

function DriverPanel() {
  const navigate = useNavigate();
  const [isRiding, setIsRiding] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [qrCode, setQrCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrTimer, setQrTimer] = useState(10);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [distanceToCollege, setDistanceToCollege] = useState(null);

  const qrIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const userName = localStorage.getItem("userName");
  const busId = localStorage.getItem("busId");
  const userPhone = localStorage.getItem("userPhone");

  // Check if user is logged in
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "driver") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetch(`${API_URL}/collegeInfo`)
      .then(res => res.json())
      .then(data => setCollegeInfo(data))
      .catch(err => console.log(err));

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));

    socket.on(`attendance:${busId}`, (data) => {
      toast.success(`${data.studentName} marked present!`, { icon: '✅' });
      setRecentAttendance(prev => [data, ...prev].slice(0, 5));
      setAttendanceCount(prev => prev + 1);
    });

    socket.on(`autoStopRide:${busId}`, (data) => {
      toast.success(data.message, { icon: '🏫' });
      handleStopRide();
    });

    const batteryInterval = setInterval(() => {
      setBatteryLevel(prev => Math.max(20, prev - 0.1));
    }, 10000);

    const preventScreenshot = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault();
        toast.error('Screenshots are disabled for security');
      }
    };
    document.addEventListener('keydown', preventScreenshot);

    return () => {
      clearInterval(batteryInterval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off(`attendance:${busId}`);
      socket.off(`autoStopRide:${busId}`);
      document.removeEventListener('keydown', preventScreenshot);
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [busId]);

  useEffect(() => {
    if (isRiding) {
      startTracking();
      startQRGeneration();
    } else {
      stopTracking();
      stopQRGeneration();
    }
    return () => {
      stopTracking();
      stopQRGeneration();
    };
  }, [isRiding]);

  const generateNewQR = async () => {
    const newCode = `${busId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setQrCode(newCode);
    setQrTimer(10);

    try {
      const dataUrl = await QRCode.toDataURL(JSON.stringify({
        code: newCode,
        busId: busId,
        timestamp: Date.now()
      }), {
        width: 250,
        margin: 2,
        color: { dark: '#22d3ee', light: '#0f0f15' }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    }

    socket.emit('refreshQR', { busId });
  };

  const startQRGeneration = () => {
    generateNewQR();
    qrIntervalRef.current = setInterval(() => generateNewQR(), 10000);
    timerIntervalRef.current = setInterval(() => {
      setQrTimer(prev => prev <= 1 ? 10 : prev - 1);
    }, 1000);
  };

  const stopQRGeneration = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setQrCode("");
    setQrDataUrl("");
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setCurrentLocation(location);
          setError("");
          
          if (collegeInfo) {
            const dist = calculateDistance(latitude, longitude, collegeInfo.lat, collegeInfo.lng);
            setDistanceToCollege(dist);
          }
          
          socket.emit("updateLocation", { busId, lat: latitude, lng: longitude });
        },
        () => {
          setError("GPS unavailable, using simulated location");
          simulateLocation();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      setWatchId(id);
    } else {
      simulateLocation();
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const simulateLocation = () => {
    const testLocation = {
      lat: 10.9456 + (Math.random() - 0.5) * 0.02,
      lng: 76.9558 + (Math.random() - 0.5) * 0.02
    };
    setCurrentLocation(testLocation);
    
    if (collegeInfo) {
      const dist = calculateDistance(testLocation.lat, testLocation.lng, collegeInfo.lat, collegeInfo.lng);
      setDistanceToCollege(dist);
    }
    
    socket.emit("updateLocation", { busId, lat: testLocation.lat, lng: testLocation.lng });
  };

  useEffect(() => {
    let interval;
    if (isRiding && !watchId) {
      interval = setInterval(simulateLocation, 5000);
    }
    return () => clearInterval(interval);
  }, [isRiding, watchId]);

  const handleStartRide = () => {
    if (!busId) {
      toast.error("No bus assigned. Contact admin.");
      return;
    }
    setIsRiding(true);
    setAttendanceCount(0);
    setRecentAttendance([]);
    socket.emit("startRide", { busId });
    toast.success("Ride started! QR attendance active 🚌");
  };

  const handleStopRide = () => {
    setIsRiding(false);
    socket.emit("stopRide", { busId });
    setCurrentLocation(null);
    setDistanceToCollege(null);
    toast.success("Ride stopped safely");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-black via-[#0f0f15] to-black relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Driver Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Akshaya College Bus Service</p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium hidden md:block">
                {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Driver Info Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {userName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{userName}</h2>
                <p className="text-gray-400 text-sm">Bus Driver</p>
                {userPhone && <p className="text-cyan-400 text-xs">{userPhone}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow icon={Bus} label="Bus ID" value={busId?.slice(-8) || "Not assigned"} />
              <InfoRow icon={Radio} label="Status" value={isRiding ? "🟢 Active" : "⚫ Offline"} />
              <InfoRow icon={Battery} label="Battery" value={`${Math.floor(batteryLevel)}%`} />
              <InfoRow icon={Users} label="Attendance" value={`${attendanceCount} students`} />
              {distanceToCollege && (
                <InfoRow icon={MapPin} label="To College" value={distanceToCollege > 1000 ? `${(distanceToCollege/1000).toFixed(1)} km` : `${Math.round(distanceToCollege)} m`} />
              )}
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-cyan-400" />
              Attendance QR
            </h2>

            {isRiding ? (
              <div className="text-center">
                <div 
                  className="qr-container no-screenshot inline-block p-4 bg-black/60 rounded-2xl border-2 border-cyan-500/30 relative"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Attendance QR" 
                      className="w-48 h-48 mx-auto"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <Shield className="w-32 h-32 text-white" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${qrTimer <= 3 ? 'animate-spin' : ''}`} />
                  <span className="text-gray-400 text-sm">
                    New code in <span className="text-cyan-400 font-bold">{qrTimer}s</span>
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-2">Students scan to mark attendance</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gray-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400">Start ride to generate QR code</p>
              </div>
            )}
          </motion.div>

          {/* GPS & Attendance */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-green-400" />
              GPS Status
            </h2>

            {currentLocation ? (
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 rounded-xl p-3 border border-green-500/20">
                    <p className="text-gray-400 text-xs mb-1">Latitude</p>
                    <p className="text-green-400 font-mono text-sm">{currentLocation.lat.toFixed(5)}</p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 border border-green-500/20">
                    <p className="text-gray-400 text-xs mb-1">Longitude</p>
                    <p className="text-green-400 font-mono text-sm">{currentLocation.lng.toFixed(5)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Live Tracking Active</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 mb-4">
                <p className="text-gray-400 text-sm">{isRiding ? "Acquiring GPS..." : "Start ride to track"}</p>
              </div>
            )}

            {recentAttendance.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Attendance</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentAttendance.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-black/40 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{att.studentName}</p>
                        <p className="text-gray-500 text-xs">{att.registerNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Control Panel */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Ride Controls
          </h2>

          <AnimatePresence mode="wait">
            {!isRiding ? (
              <motion.button
                key="start"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartRide}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-5 rounded-2xl font-bold text-white text-lg shadow-2xl shadow-green-500/30 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                Start Ride & Attendance
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStopRide}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 py-5 rounded-2xl font-bold text-white text-lg shadow-2xl shadow-red-500/30 flex items-center justify-center gap-3"
              >
                <Square className="w-6 h-6" />
                Stop Ride ({attendanceCount} present)
              </motion.button>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm">
              ⚠️ {error}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

export default DriverPanel;
