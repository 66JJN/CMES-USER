import React, { useCallback, useEffect, useState } from "react";
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
import { getShopId } from "./services/authService";
import { bootstrapApplication, clearShopProfileCache } from "./services/appBootstrap";
import AppLoadingScreen from "./components/AppLoadingScreen";
import Toast from "./components/Toast";
import "./components/Toast.css";
import SystemStatusOverlay from "./components/SystemStatusOverlay";

import { SocketProvider } from "./contexts/SocketContext";

function App() {
  const [bootstrapState, setBootstrapState] = useState({ loading: true, error: "" });

  const startApplication = useCallback(async ({ retry = false } = {}) => {
    setBootstrapState({ loading: true, error: "" });
    const shopId = getShopId();
    if (retry) clearShopProfileCache(shopId);

    try {
      await bootstrapApplication({ shopId });
      setBootstrapState({ loading: false, error: "" });
    } catch (error) {
      setBootstrapState({
        loading: false,
        error: error?.message || "เชื่อมต่อข้อมูลร้านไม่สำเร็จ",
      });
    }
  }, []);

  useEffect(() => {
    // ดักจับ shopId จาก URL ก่อน
    const params = new URLSearchParams(window.location.search);
    const urlShopId = params.get('shopId');
    if (urlShopId) {
      localStorage.setItem('shopId', urlShopId);
    }

    startApplication();
  }, [startApplication]);

  if (bootstrapState.loading || bootstrapState.error) {
    return (
      <AppLoadingScreen
        error={bootstrapState.error}
        onRetry={() => startApplication({ retry: true })}
      />
    );
  }

  return (
    <SocketProvider>
      <BrowserRouter>
        <SystemStatusOverlay />
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
