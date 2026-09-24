import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Signup from "./Components/Signup";
import Login from './Components/Login';
import AdminPanel from "./Components/AdminPanel";
import DriverPanel from "./Components/DriverPanel";
import StudentMap from "./Components/StudentMap";

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");

  // If no login data, redirect to login
  if (!userRole && !userId) {
    // Check if it's admin trying to access
    if (allowedRoles.includes("admin")) {
      const isAdmin = localStorage.getItem("isAdmin");
      if (!isAdmin) {
        return <Navigate to="/login" replace />;
      }
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Check if user has allowed role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Special check for admin
    const isAdmin = localStorage.getItem("isAdmin");
    if (allowedRoles.includes("admin") && isAdmin === "true") {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(15, 15, 21, 0.95)',
            color: '#fff',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: { primary: '#22d3ee', secondary: '#0f0f15' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0f0f15' },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/driver" 
            element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentMap />
              </ProtectedRoute>
            } 
          />
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
