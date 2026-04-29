import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./03_Register/Register";
import Home from "./01_Home/Home";
import Select from "./05_Select/Select";
import Upload from "./09_Upload/Upload";
import Status from "./10_Status/Status";
import Payment from "./04_Payment/Payment";
import Profile from "./02_Profile/Profile";
import Report from "./07_Report/Report";
import Gift from "./08_Gift/Gift";
import { ProtectedRoute, PublicRoute } from "./ProtectedRoute";
import { initializeAuth } from "./authService";

function App() {
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // ดักจับ shopId จาก URL ก่อน
    const params = new URLSearchParams(window.location.search);
    const urlShopId = params.get('shopId');
    if (urlShopId) {
      localStorage.setItem('shopId', urlShopId);
    }

    // Initialize auth on app load
    const initAuth = async () => {
      await initializeAuth();
      setAuthLoading(false);
    };
    initAuth();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
        color: "white",
        gap: "24px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Animated Logo Placeholder */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.25)',
          animation: 'skeletonPulse 1.8s ease-in-out infinite',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        {/* Skeleton Text Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '180px', height: '14px', borderRadius: '7px',
            background: 'rgba(255,255,255,0.2)',
            animation: 'skeletonPulse 1.8s ease-in-out infinite',
          }} />
          <div style={{
            width: '120px', height: '10px', borderRadius: '5px',
            background: 'rgba(255,255,255,0.12)',
            animation: 'skeletonPulse 1.8s ease-in-out 0.2s infinite',
          }} />
        </div>
        {/* Spinner */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: 'rgba(255,255,255,0.8)',
          animation: 'appSpin 0.8s linear infinite',
        }} />
        <style>{`
          @keyframes skeletonPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes appSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<PublicRoute><Register /></PublicRoute>}
        />
        <Route
          path="/home"
          element={<ProtectedRoute><Home /></ProtectedRoute>}
        />
        <Route
          path="/select"
          element={<ProtectedRoute><Select /></ProtectedRoute>}
        />
        <Route
          path="/upload"
          element={<ProtectedRoute><Upload /></ProtectedRoute>}
        />
        <Route
          path="/status"
          element={<ProtectedRoute><Status /></ProtectedRoute>}
        />
        <Route
          path="/payment"
          element={<ProtectedRoute><Payment /></ProtectedRoute>}
        />
        <Route
          path="/report"
          element={<ProtectedRoute><Report /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/gift"
          element={<ProtectedRoute><Gift /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
