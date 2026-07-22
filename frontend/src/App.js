import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import Select from "./pages/Select/Select";
import Upload from "./pages/Upload/Upload";
import Status from "./pages/Status/Status";
import Payment from "./pages/Payment/Payment";
import Profile from "./pages/Profile/Profile";
import Report from "./pages/Report/Report";
import Gift from "./pages/Gift/Gift";
import { ProtectedRoute, PublicRoute } from "./ProtectedRoute";
import { initializeAuth } from "./services/authService";
import Toast from "./components/Toast";
import "./components/Toast.css";

import { SocketProvider } from "./contexts/SocketContext";

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
        height: '100dvh',
        width: '100%',
        background: 'linear-gradient(180deg, #0a0e27 0%, #151338 50%, #0f0c29 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          maxWidth: '430px',
          padding: '0 24px',
        }}>
          {/* Logo Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'rgba(139, 92, 246, 0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(196, 181, 253, 0.8)" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          {/* App Name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' }}>CMES</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Content Management and Engagement System</div>
          </div>
          {/* Spinner */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            animation: 'appSpin 0.8s linear infinite',
          }} />
          <style>{`
            @keyframes appSpin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
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
        <Toast />
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
