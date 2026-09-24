import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Navigation, Clock, Activity, Wifi, LogOut, 
  Bus, User, Zap, TrendingDown, Radio, QrCode, Camera,
  X, CheckCircle, GraduationCap
} from "lucide-react";
import io from "socket.io-client";
import L from "leaflet";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import toast from 'react-hot-toast';
import { API_URL } from "../config";
import "leaflet/dist/leaflet.css";

const socket = io(API_URL);

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

const studentIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const collegeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2602/2602414.png",
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
}

function StudentMap() {
  const navigate = useNavigate();
  const [busLocation, setBusLocation] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [collegeLocation, setCollegeLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [distanceToCollege, setDistanceToCollege] = useState(null);
  const [busStatus, setBusStatus] = useState("offline");
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [showScanner, setShowScanner] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [scannerError, setScannerError] = useState("");

  const html5QrCodeRef = useRef(null);

  const busId = localStorage.getItem("busId");
  const userName = localStorage.getItem("userName");
  const userId = localStorage.getItem("userId");
  const registerNumber = localStorage.getItem("registerNumber");
  const department = localStorage.getItem("department");

  // Check if user is logged in
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "student") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    axios.get(`${API_URL}/collegeInfo`)
      .then(res => setCollegeLocation(res.data))
      .catch(err => console.log(err));

    socket.on('connect', () => {
      setConnectionStatus('connected');
      toast.success('Connected to tracking server');
    });
    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      toast.error('Lost connection to server');
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStudentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setStudentLocation({ lat: 10.9456, lng: 76.9558 })
      );
    } else {
      setStudentLocation({ lat: 10.9456, lng: 76.9558 });
    }

    if (busId) {
      socket.on(`busLocation:${busId}`, (data) => {
        setBusLocation({ lat: data.lat, lng: data.lng });
        setBusStatus("active");
        if (data.distanceToCollege) setDistanceToCollege(data.distanceToCollege);
      });

      socket.on(`rideStarted:${busId}`, () => {
        setBusStatus("active");
        setAttendanceMarked(false);
        toast.success('Your bus has started!', { icon: '🚌' });
      });

      socket.on(`rideStopped:${busId}`, () => {
        setBusStatus("stopped");
        setBusLocation(null);
        toast('Bus ride has ended', { icon: '🛑' });
      });
    }

    return () => {
      socket.off(`busLocation:${busId}`);
      socket.off(`rideStarted:${busId}`);
      socket.off(`rideStopped:${busId}`);
      socket.off('connect');
      socket.off('disconnect');
      stopScanner();
    };
  }, [busId]);

  useEffect(() => {
    if (busLocation && studentLocation) {
      const dist = calculateDistance(
        studentLocation.lat, studentLocation.lng,
        busLocation.lat, busLocation.lng
      );
      setDistance(dist);
      setEta((dist / 30) * 60);
    }
  }, [busLocation, studentLocation]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startScanner = async () => {
    setShowScanner(true);
    setScannerError("");

    setTimeout(async () => {
      try {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {}
        );
      } catch (err) {
        setScannerError("Could not access camera. Please allow camera permission.");
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.log("Scanner stop error:", err);
      }
    }
    setShowScanner(false);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText);
      
      const response = await axios.post(`${API_URL}/verifyQR`, {
        qrCode: qrData.code,
        busId: busId,
        studentId: userId,
        location: studentLocation
      });

      if (response.data.success) {
        toast.success('Attendance marked successfully! ✅');
        setAttendanceMarked(true);
        stopScanner();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid QR code";
      toast.error(errorMsg);
      
      if (errorMsg === "Attendance already marked for today") {
        setAttendanceMarked(true);
        stopScanner();
      }
    }
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
      className="min-h-screen bg-gradient-to-br from-black via-[#0f0f15] to-black relative"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Track Your Bus
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {userName} • {registerNumber} • {department?.split(' - ')[0]}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {attendanceMarked ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/20 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:block">Present</span>
              </div>
            ) : busStatus === "active" ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startScanner}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              >
                <QrCode className="w-4 h-4" />
                <span className="text-sm font-medium">Mark Attendance</span>
              </motion.button>
            ) : null}

            <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium hidden md:block">
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
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
      </div>

      {/* Stats Cards */}
      <div className="absolute top-24 md:top-28 left-4 right-4 z-[1000] grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <StatCard icon={Bus} label="Bus Status" value={busStatus === "active" ? "Active" : busStatus === "stopped" ? "Stopped" : "Offline"} gradient="from-green-400 to-emerald-500" />
        <StatCard icon={TrendingDown} label="Bus Distance" value={distance ? `${distance.toFixed(1)} km` : "---"} gradient="from-blue-400 to-cyan-500" />
        <StatCard icon={Clock} label="ETA" value={eta ? `${Math.ceil(eta)} min` : "---"} gradient="from-purple-400 to-pink-500" />
        <StatCard icon={GraduationCap} label="To College" value={distanceToCollege ? `${(distanceToCollege/1000).toFixed(1)} km` : "---"} gradient="from-orange-400 to-red-500" />
      </div>

      {/* Map */}
      <div className="h-screen w-full">
        {studentLocation && (
          <MapContainer
            center={[studentLocation.lat, studentLocation.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

            {/* Student */}
            <Marker position={[studentLocation.lat, studentLocation.lng]} icon={studentIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-purple-600">Your Location</p>
                  <p className="text-xs text-gray-600">{userName}</p>
                </div>
              </Popup>
            </Marker>
            <Circle center={[studentLocation.lat, studentLocation.lng]} radius={150} pathOptions={{ color: "#a855f7", fillColor: "#a855f7", fillOpacity: 0.1 }} />

            {/* College */}
            {collegeLocation && (
              <>
                <Marker position={[collegeLocation.lat, collegeLocation.lng]} icon={collegeIcon}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">🎓 {collegeLocation.name}</p>
                      <p className="text-xs text-gray-600">{collegeLocation.address}</p>
                    </div>
                  </Popup>
                </Marker>
                <Circle center={[collegeLocation.lat, collegeLocation.lng]} radius={collegeLocation.radius || 200} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, dashArray: "5, 10" }} />
              </>
            )}

            {/* Bus */}
            {busLocation && (
              <>
                <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-green-600">🚌 Your Bus</p>
                      {distance && <p className="text-xs text-cyan-600">{distance.toFixed(1)} km from you</p>}
                    </div>
                  </Popup>
                </Marker>

                {/* Route Lines */}
                <Polyline
                  positions={[[busLocation.lat, busLocation.lng], [studentLocation.lat, studentLocation.lng]]}
                  pathOptions={{ color: "#22d3ee", weight: 4, opacity: 0.8, dashArray: "10, 10" }}
                />
                {collegeLocation && (
                  <Polyline
                    positions={[[busLocation.lat, busLocation.lng], [collegeLocation.lat, collegeLocation.lng]]}
                    pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.6, dashArray: "5, 15" }}
                  />
                )}
              </>
            )}

            <MapRecenter center={busLocation ? [busLocation.lat, busLocation.lng] : null} />
          </MapContainer>
        )}
      </div>

      {/* Offline Message */}
      <AnimatePresence>
        {busStatus === "offline" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-4 right-4 z-[1000]"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Radio className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bus Not Active</h3>
              <p className="text-gray-400 text-sm">Your bus hasn't started yet. You'll be notified when tracking begins.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f15] border border-white/20 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  Scan QR Code
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={stopScanner}
                  className="p-2 rounded-lg bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

              {scannerError && (
                <p className="text-red-400 text-sm mt-4 text-center">{scannerError}</p>
              )}

              <p className="text-gray-400 text-sm mt-4 text-center">
                Point camera at the QR code displayed by your driver
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-3 md:p-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs">{label}</p>
          <p className="text-white font-bold text-sm md:text-lg truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default StudentMap;
