import React, { createContext, useContext, useEffect, useState } from "react";
import API_BASE_URL from "../config/apiConfig";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  systemConfig: null,
  shopId: "",
});

/**
 * User browsers intentionally do not connect to CMES-ADMIN Socket.IO. They
 * receive read-only configuration through CMES-USER, keeping both the Admin
 * JWT and the service token off the public client.
 */
export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null);
  const [shopId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("shopId") || localStorage.getItem("shopId") || "";
  });

  useEffect(() => {
    if (!shopId) return undefined;
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status?shopId=${encodeURIComponent(shopId)}`, {
          headers: { "x-shop-id": shopId },
        });
        if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
        const config = await response.json();
        if (!cancelled) {
          setSystemConfig(config);
          setIsConnected(true);
        }
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 10000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [shopId]);

  return (
    <SocketContext.Provider value={{ socket: null, isConnected, systemConfig, shopId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
