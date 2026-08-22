import { useState, useEffect, useCallback, useRef } from "react";
import API_BASE_URL from "../config/apiConfig";
import { apiCall, getShopId, getToken } from "../services/authService";
import { getCachedShopProfile, loadShopProfile } from "../services/appBootstrap";
import { useSocket } from "../contexts/SocketContext";
import {
  adoptVerifiedLegacyOrders,
  readLegacyOrders,
  readShopItem,
  readShopOrders,
  removeShopOrder,
  writeShopItem,
} from "../services/shopStorage";

// ===== In-Memory SWR Cache (Module-Scoped) =====
// Retains cached data across route navigation within the SPA session
const homeCache = {
  shopId: null,
  shopProfile: null,
  profile: null,
  status: { systemOn: true, imageOn: true, textOn: true, giftOn: true, birthdayOn: true, queueAccepting: true, freeMode: false, birthdaySpendingRequirement: 100, settings: [] },
  leaderboard: {}, // Keyed by rankingType (daily, monthly, alltime)
  birthdayEligibility: null,
  perks: [
    "🎁 แสดงชื่อและโปรไฟล์บนหน้าจออันดับผู้สนับสนุน",
    "🌟 ป้าย Diamond/Gold/Silver ที่ช่วยแยกความโดดเด่น",
    "🚀 สิทธิ์เข้าถึงโปรโมชั่นหรือกิจกรรมก่อนใคร",
    "💬 ช่องทางติดต่อพิเศษสำหรับเคสเร่งด่วน"
  ],
  ordersStatus: {},
  lastFetched: 0,
};

const normaliseStatus = (config = {}, previous = {}) => ({
  ...previous,
  systemOn: config.systemOpen ?? config.systemOn ?? previous.systemOn ?? true,
  imageOn: config.enableImage ?? config.imageOn ?? previous.imageOn ?? true,
  textOn: config.enableText ?? config.textOn ?? previous.textOn ?? true,
  giftOn: config.enableGift ?? config.giftOn ?? previous.giftOn ?? true,
  birthdayOn: config.enableBirthday ?? config.birthdayOn ?? previous.birthdayOn ?? true,
  queueAccepting: config.queueAccepting ?? previous.queueAccepting ?? true,
  freeMode: config.freeMode ?? previous.freeMode ?? false,
  birthdaySpendingRequirement: config.birthdaySpendingRequirement
    ?? previous.birthdaySpendingRequirement
    ?? 100,
  settings: Array.isArray(config.settings) ? config.settings : (previous.settings || []),
});

const normaliseBirthdayEligibility = (previous, config = {}) => {
  const freeMode = config.freeMode === true;
  const configuredRequirement = Number(config.birthdaySpendingRequirement);
  const required = freeMode
    ? 0
    : (Number.isFinite(configuredRequirement) ? configuredRequirement : previous.required);
  const totalSpent = Number(previous.totalSpent) || 0;
  return {
    ...previous,
    totalSpent,
    required,
    eligible: freeMode || totalSpent >= required,
    reason: freeMode ? 'free_mode' : (totalSpent >= required ? 'eligible' : 'insufficient_spending'),
  };
};

/**
 * All browser traffic goes to CMES-USER. It proxies only the required
 * read-only Admin data with a server-side service credential.
 */
const userApiCall = async (endpoint, options = {}) => {
  const shopId = getShopId();
  const token = getToken();
  const path = endpoint
    .replace('/api/shop/profile', '/api/shop-profile')
    .replace('/api/config/perks', '/api/perks');
  const headers = {
    "Content-Type": "application/json",
    "x-shop-id": shopId,
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const urlSeparator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${API_BASE_URL}${path}${urlSeparator}shopId=${encodeURIComponent(shopId)}`, {
    ...options,
    headers,
  });
  return response.json();
};

/**
 * Custom Hook for Home.js data fetching, client-side caching, and real-time state management.
 * Strictly enforces SKILL.md rules (Separation of Concerns, Socket.IO Singleton, Anti-N+1, SWR Caching).
 */
export function useHomeData() {
  const currentShopId = getShopId();

  // ===== Cache Invalidation on shopId Change =====
  if (homeCache.shopId !== currentShopId) {
    homeCache.shopId = currentShopId;
    homeCache.shopProfile = getCachedShopProfile(currentShopId);
    homeCache.profile = null;
    homeCache.status = { systemOn: true, imageOn: true, textOn: true, giftOn: true, birthdayOn: true, queueAccepting: true, freeMode: false, birthdaySpendingRequirement: 100, settings: [] };
    homeCache.leaderboard = {};
    homeCache.birthdayEligibility = null;
    homeCache.perks = [
      "🎁 แสดงชื่อและโปรไฟล์บนหน้าจออันดับผู้สนับสนุน",
      "🌟 ป้าย Diamond/Gold/Silver ที่ช่วยแยกความโดดเด่น",
      "🚀 สิทธิ์เข้าถึงโปรโมชั่นหรือกิจกรรมก่อนใคร",
      "💬 ช่องทางติดต่อพิเศษสำหรับเคสเร่งด่วน"
    ];
    homeCache.ordersStatus = {};
    homeCache.lastFetched = 0;
  }

  // ===== Helper: Get Valid Avatar from localStorage =====
  const getValidAvatar = () => {
    const val = localStorage.getItem("avatar");
    if (val && val !== "null" && val !== "undefined") return val;
    return null;
  };

  // ===== States (Initialized from Cache for 0ms Latency) =====
  const [shopProfile, setShopProfile] = useState(
    () => homeCache.shopProfile || getCachedShopProfile(currentShopId) || { name: "", logo: null },
  );
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [profileImage, setProfileImage] = useState(getValidAvatar);
  const [orders, setOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState(homeCache.ordersStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isBirthday, setIsBirthday] = useState(null);

  const [status, setStatus] = useState(homeCache.status);
  const [rankingType, setRankingType] = useState("alltime");
  const [leaderboard, setLeaderboard] = useState(() => homeCache.leaderboard[rankingType] || []);
  const [rankLoading, setRankLoading] = useState(() => !homeCache.leaderboard[rankingType]);
  const [userRank, setUserRank] = useState(999);

  const [birthdayEligibility, setBirthdayEligibility] = useState(() => homeCache.birthdayEligibility || {
    eligible: false,
    totalSpent: 0,
    required: 100,
    reason: "not_checked"
  });

  const [perks, setPerks] = useState(homeCache.perks);

  // Global Socket from Context
  const { socket } = useSocket();
  const socketRef = useRef(socket);
  socketRef.current = socket;

  // Show Toast Helper
  const showAlert = useCallback((msg) => {
    setAlertMessage(msg);
  }, []);

  // Sync cache helper
  const syncOrdersStatusToCache = useCallback((newStatuses) => {
    homeCache.ordersStatus = { ...homeCache.ordersStatus, ...newStatuses };
    setOrdersStatus(homeCache.ordersStatus);
  }, []);

  // ===== Batch Fetch Order Statuses with Terminal Status Optimization =====
  const fetchAllOrderStatuses = useCallback(async (currentOrders, { force = false, silent = false } = {}) => {
    if (!currentOrders || currentOrders.length === 0) return;

    // Skip orders that are already terminal (completed or rejected)
    const pendingOrders = currentOrders.filter((ord) => {
      if (!ord.orderId) return false;
      const currentStatus = homeCache.ordersStatus[ord.orderId]?.status;
      return force || (currentStatus !== "completed" && currentStatus !== "rejected");
    });

    if (pendingOrders.length === 0) return;

    // Only the first/manual load should replace modal content with a
    // skeleton. Periodic syncs must not interrupt someone reading it.
    if (!silent) setStatusLoading(true);
    const newStatuses = {};

    await Promise.all(pendingOrders.map(async (ord) => {
      try {
        const data = await userApiCall(`/api/order-status/${ord.orderId}`);
        if (data && data.success) {
          newStatuses[ord.orderId] = data;
        } else {
          newStatuses[ord.orderId] = { success: false, statusText: "ไม่พบคำสั่งซื้อ (อาจถูกลบ)" };
        }
      } catch (err) {
        console.error(`[useHomeData] Error fetching status for ${ord.orderId}:`, err);
        newStatuses[ord.orderId] = { success: false, statusText: "เกิดข้อผิดพลาด" };
      }
    }));

    syncOrdersStatusToCache(newStatuses);
    if (!silent) setStatusLoading(false);
  }, [syncOrdersStatusToCache]);

  // ===== Load Local Orders =====
  const loadOrders = useCallback(async () => {
    try {
      let storedOrders = readShopOrders(currentShopId);
      const legacyChecked = readShopItem("legacyOrdersChecked", currentShopId) === "1";
      if (storedOrders.length === 0 && !legacyChecked) {
        const legacyOrders = readLegacyOrders().filter((order) => order?.orderId || order?.id);
        const verifiedIds = new Set();
        await Promise.all(legacyOrders.map(async (order) => {
          const orderId = order.orderId || order.id;
          try {
            const data = await userApiCall(`/api/order-status/${orderId}`);
            if (data?.success) verifiedIds.add(orderId);
          } catch {
            // Legacy data stays untouched and invisible when verification fails.
          }
        }));
        storedOrders = adoptVerifiedLegacyOrders(currentShopId, verifiedIds);
        writeShopItem("legacyOrdersChecked", "1", currentShopId);
      }
      const reversed = [...storedOrders].reverse();
      setOrders(reversed);
      fetchAllOrderStatuses(reversed);
    } catch (err) {
      console.warn("[useHomeData] Error loading orders:", err);
      setOrders([]);
    }
  }, [currentShopId, fetchAllOrderStatuses]);

  // The order-status modal is a live view. Keep this separate from initial
  // loading so the Home screen does not poll in the background.
  const refreshOrdersStatus = useCallback(() => {
    return fetchAllOrderStatuses(orders, { force: true, silent: true });
  }, [fetchAllOrderStatuses, orders]);

  // ===== Delete Single Order =====
  const deleteOrder = useCallback((orderIdToDelete) => {
    try {
      removeShopOrder(currentShopId, orderIdToDelete);
      setOrders((prev) => prev.filter((ord) => (ord.orderId || ord.id) !== orderIdToDelete));
      showAlert("ลบประวัติคำสั่งซื้อสำเร็จ");
    } catch (err) {
      console.error("[useHomeData] Error deleting order:", err);
      showAlert("เกิดข้อผิดพลาดในการลบคำสั่งซื้อ");
    }
  }, [currentShopId, showAlert]);

  // ===== Fetch Leaderboard =====
  const loadRankings = useCallback(async () => {
    if (!homeCache.leaderboard[rankingType]) {
      setRankLoading(true);
    }
    try {
      const data = await userApiCall(`/api/rankings/top?type=${rankingType}`);
      if (data && data.success) {
        const ranks = data.ranks || [];
        homeCache.leaderboard[rankingType] = ranks;
        setLeaderboard(ranks);
      }
    } catch (err) {
      console.error("[useHomeData] Failed to fetch rankings:", err);
    } finally {
      setRankLoading(false);
    }
  }, [rankingType]);

  // ===== Fetch Initial Data & Background Refresh =====
  const refreshData = useCallback(async () => {
    const token = getToken();
    setIsLoggedIn(!!token);
    setProfileImage(getValidAvatar());
    loadOrders();
    loadRankings();

    // 1. Fetch User Profile if logged in
    if (token) {
      try {
        const data = await apiCall('/api/auth/profile');
        if (data && data.success && data.user) {
          homeCache.profile = data.user;
          localStorage.setItem("username", data.user.username || "");
          localStorage.setItem("email", data.user.email || "");
          localStorage.setItem("birthday", data.user.birthday || "");
          if (data.user.avatar) {
            localStorage.setItem("avatar", data.user.avatar);
            setProfileImage(data.user.avatar);
          } else {
            localStorage.removeItem("avatar");
            setProfileImage(null);
          }

          localStorage.setItem("user", JSON.stringify({
            id: data.user._id || data.user.id,
            username: data.user.username || "",
            email: data.user.email || "",
            avatar: data.user.avatar || null,
            birthday: data.user.birthday || ""
          }));
        }
      } catch (err) {
        console.error("[useHomeData] Profile refresh error:", err.message);
      }
    }

    // 2. Fetch Shop Profile
    try {
      const sProfile = await loadShopProfile(currentShopId);
      homeCache.shopProfile = sProfile;
      setShopProfile(sProfile);
    } catch (err) {
      console.error("[useHomeData] Shop profile fetch error:", err.message);
    }

    // 3. Fetch Perks
    try {
      const data = await userApiCall('/api/config/perks');
      if (data && data.success && data.perks) {
        homeCache.perks = data.perks;
        setPerks(data.perks);
      }
    } catch (err) {
      console.error("[useHomeData] Perks fetch error:", err.message);
    }

    // 4. Fetch System Status
    try {
      const data = await apiCall('/api/status');
      const newStatus = normaliseStatus(data);
      homeCache.status = newStatus;
      setStatus(newStatus);
    } catch (err) {
      // Keep existing status on error
    }

    // 5. Fetch Birthday Eligibility if logged in
    const userEmail = localStorage.getItem("email");
    if (token && userEmail) {
      try {
        const encodedEmail = encodeURIComponent(userEmail);
        const data = await userApiCall(`/api/birthday-eligibility/${encodedEmail}`);
        if (data && data.success) {
          const bData = {
            eligible: data.eligible,
            totalSpent: Number(data.totalSpent) || 0,
            required: Number.isFinite(Number(data.required)) ? Number(data.required) : 100,
            reason: data.reason || "unknown"
          };
          homeCache.birthdayEligibility = bData;
          setBirthdayEligibility(bData);
        }
      } catch (err) {
        console.error("[useHomeData] Birthday eligibility error:", err.message);
      }
    }
  }, [currentShopId, loadOrders, loadRankings]);

  // ===== Initial Mount Effect =====
  useEffect(() => {
    if (currentShopId) {
      localStorage.setItem("shopId", currentShopId);
    }
    refreshData();

    const handleStorageChange = () => {
      setProfileImage(getValidAvatar());
      loadOrders();
      loadRankings();
    };

    const handleFocus = () => {
      setProfileImage(getValidAvatar());
      loadOrders();
      loadRankings();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentShopId, loadOrders, loadRankings, refreshData]);

  // ===== Socket Real-time Listener Effect =====
  useEffect(() => {
    if (!socket) return;

    const handleConfigUpdate = (newConfig) => {
      setStatus((prev) => {
        const updated = normaliseStatus(newConfig, prev);
        homeCache.status = updated;
        return updated;
      });
      setBirthdayEligibility((prev) => {
        const updated = normaliseBirthdayEligibility(prev, newConfig);
        homeCache.birthdayEligibility = updated;
        return updated;
      });
    };

    const handleStatus = (socketStatus) => {
      if (!socketStatus) return;
      setStatus((prev) => {
        const updated = normaliseStatus(socketStatus, prev);
        homeCache.status = updated;
        return updated;
      });
      setBirthdayEligibility((prev) => {
        const updated = normaliseBirthdayEligibility(prev, socketStatus);
        homeCache.birthdayEligibility = updated;
        return updated;
      });
    };

    const handlePublicRanking = (data) => {
      if (data && data.type) {
        setRankingType(data.type);
      }
    };

    const handlePerksUpdated = (data) => {
      if (data && data.perks && Array.isArray(data.perks)) {
        homeCache.perks = data.perks;
        setPerks(data.perks);
      }
    };

    socket.on("configUpdate", handleConfigUpdate);
    socket.on("status", handleStatus);
    socket.on("publicRankingTypeUpdated", handlePublicRanking);
    socket.on("perksUpdated", handlePerksUpdated);

    socket.emit("getConfig");

    return () => {
      socket.off("configUpdate", handleConfigUpdate);
      socket.off("status", handleStatus);
      socket.off("publicRankingTypeUpdated", handlePublicRanking);
      socket.off("perksUpdated", handlePerksUpdated);
    };
  }, [socket]);

  // ===== Ranking Type Change Effect =====
  useEffect(() => {
    loadRankings();
  }, [rankingType, loadRankings]);

  // ===== User Rank Calculation Effect =====
  useEffect(() => {
    if (!isLoggedIn || leaderboard.length === 0) {
      setUserRank(999);
      return;
    }
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      setUserRank(999);
      return;
    }
    const userIndex = leaderboard.findIndex((entry) => entry.email === userEmail);
    setUserRank(userIndex === -1 ? 999 : userIndex + 1);
  }, [leaderboard, isLoggedIn]);

  // ===== Birthday Check Effect =====
  useEffect(() => {
    if (!isLoggedIn) {
      setIsBirthday(null);
      return;
    }
    const birthday = localStorage.getItem("birthday");
    if (!birthday) {
      setIsBirthday(false);
      return;
    }
    const [day, month] = birthday.split("/").map((part) => parseInt(part, 10));
    if (!day || !month) {
      setIsBirthday(false);
      return;
    }
    const today = new Date();
    setIsBirthday(day === today.getDate() && month === today.getMonth() + 1);
  }, [isLoggedIn]);

  return {
    shopId: currentShopId,
    shopProfile,
    isLoggedIn,
    profileImage,
    status,
    orders,
    ordersStatus,
    statusLoading,
    refreshOrdersStatus,
    deleteOrder,
    loadOrders,
    leaderboard,
    rankLoading,
    rankingType,
    setRankingType,
    userRank,
    birthdayEligibility,
    isBirthday,
    perks,
    alertMessage,
    showAlert,
    refreshData,
  };
}
