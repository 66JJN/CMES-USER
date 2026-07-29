import React from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import "./SystemStatusOverlay.css";

const featureForLocation = (location) => {
  const type = new URLSearchParams(location.search).get("type");
  if (location.pathname === "/gift" || (location.pathname === "/payment" && type === "gift")) return "gift";
  if (["/select", "/upload", "/payment"].includes(location.pathname)) return type;
  return null;
};

const isFeatureEnabled = (config, feature) => {
  const keyByFeature = {
    image: "enableImage",
    text: "enableText",
    gift: "enableGift",
    birthday: "enableBirthday",
  };
  const key = keyByFeature[feature];
  return !key || config[key] !== false;
};

/** Blocks a currently open service page as soon as Admin changes its status. */
export default function SystemStatusOverlay() {
  const { systemConfig } = useSocket();
  const location = useLocation();
  if (!systemConfig) return null;

  const systemOpen = systemConfig.systemOpen ?? systemConfig.systemOn ?? true;
  const feature = featureForLocation(location);
  const featureEnabled = isFeatureEnabled(systemConfig, feature);
  if (systemOpen && featureEnabled) return null;

  const message = !systemOpen
    ? "ขณะนี้ร้านปิดรับบริการชั่วคราว"
    : "ฟังก์ชันนี้ถูกปิดใช้งานชั่วคราว";

  return (
    <div className="system-status-overlay" role="alert" aria-live="assertive">
      <div className="system-status-card">
        <div className="system-status-icon">!</div>
        <h2>ไม่สามารถดำเนินการต่อได้</h2>
        <p>{message}</p>
        <small>หน้านี้จะเปิดใช้งานเองทันทีเมื่อแอดมินเปิดระบบอีกครั้ง</small>
      </div>
    </div>
  );
}
