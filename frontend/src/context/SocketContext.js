import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { REALTIME_URL } from "../config/apiConfig";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  systemConfig: null,
  shopId: "",
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemConfig, setSystemConfig] = useState(null);
  const [shopId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("shopId") || localStorage.getItem("shopId") || "";
  });

  useEffect(() => {
    if (!shopId) {
      console.log("[SocketContext] No shopId found, skipping socket initialization");
      return;
    }

    console.log("[SocketContext] Initializing single WebSocket connection for shopId:", shopId);

    const socketInstance = io(REALTIME_URL, {
      query: { shopId },
      transports: ["websocket"], // ⚡ Enforce WebSocket only (no HTTP long-polling duplication)
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("[SocketContext] WebSocket connected:", socketInstance.id);
      setIsConnected(true);
      socketInstance.emit("getConfig");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[SocketContext] WebSocket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("status", (data) => {
      console.log("[SocketContext] Received status event:", data);
      if (data) {
        setSystemConfig(data);
      }
    });

    socketInstance.on("configUpdate", (newConfig) => {
      console.log("[SocketContext] Received configUpdate event:", newConfig);
      if (newConfig) {
        setSystemConfig((prev) => ({ ...prev, ...newConfig }));
      }
    });

    setSocket(socketInstance);

    return () => {
      console.log("[SocketContext] Unmounting provider or shopId changed, disconnecting socket");
      socketInstance.disconnect();
    };
  }, [shopId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        systemConfig,
        shopId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export default SocketContext;
