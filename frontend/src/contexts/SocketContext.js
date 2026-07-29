import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import API_BASE_URL from "../config/apiConfig";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  systemConfig: null,
  shopId: "",
});

/**
 * User browsers connect only to CMES-USER. That backend broadcasts a
 * read-only config stream per shop and keeps Admin credentials server-side.
 */
export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null);
  const [socket, setSocket] = useState(null);
  const [shopId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("shopId") || localStorage.getItem("shopId") || "";
  });

  useEffect(() => {
    if (!shopId) return undefined;
    let cancelled = false;

    const realtimeSocket = io(API_BASE_URL, {
      auth: { shopId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const handleConfig = (config) => {
      if (!cancelled && config) setSystemConfig(config);
    };
    const handleConnect = () => {
      if (!cancelled) setIsConnected(true);
      realtimeSocket.emit("getConfig");
    };
    const handleDisconnect = () => {
      if (!cancelled) setIsConnected(false);
    };

    realtimeSocket.on("connect", handleConnect);
    realtimeSocket.on("disconnect", handleDisconnect);
    realtimeSocket.on("status", handleConfig);
    realtimeSocket.on("configUpdate", handleConfig);
    setSocket(realtimeSocket);

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status?shopId=${encodeURIComponent(shopId)}`, {
          headers: { "x-shop-id": shopId },
        });
        if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
        const config = await response.json();
        if (!cancelled) {
          setSystemConfig(config);
          // HTTP remains a resilience fallback while Socket.IO reconnects.
        }
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      realtimeSocket.off("connect", handleConnect);
      realtimeSocket.off("disconnect", handleDisconnect);
      realtimeSocket.off("status", handleConfig);
      realtimeSocket.off("configUpdate", handleConfig);
      realtimeSocket.disconnect();
      setSocket(null);
    };
  }, [shopId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, systemConfig, shopId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
