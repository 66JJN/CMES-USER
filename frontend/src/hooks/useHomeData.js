import { useState, useEffect, useCallback, useRef } from "react";
import { ADMIN_API_URL } from "../config/apiConfig";
import { apiCall, getShopId, getToken } from "../authService";
import { useSocket } from "../context/SocketContext";

// ===== In-Memory SWR Cache (Module-Scoped) =====
// Retains cached data across route navigation within the SPA session
const homeCache = {
  shopId: null,
  shopProfile: { name: "Digital Signage CMES", logo: null },
  profile: null,
  status: { systemOn: true, imageOn: true, textOn: true, giftOn: true, birthdayOn: true },
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

/**
 * Admin API fetch helper ensuring x-shop-id header & query params
 */
const adminApiCall = async (endpoint, options = {}) => {
  const shopId = getShopId();
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    "x-shop-id": shopId,
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const urlSeparator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${ADMIN_API_URL}${endpoint}${urlSeparator}shopId=${shopId}`, {
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
    homeCache.shopProfile = { name: "Digital Signage CMES", logo: null };
    homeCache.profile = null;
    homeCache.status = { systemOn: true, imageOn: true, textOn: true, giftOn: true, birthdayOn: true };
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
  const [shopProfile, setShopProfile] = useState(homeCache.shopProfile);
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
  const fetchAllOrderStatuses = useCallback(async (currentOrders) => {
    if (!currentOrders || currentOrders.length === 0) return;

    // Skip orders that are already terminal (completed or rejected)
    const pendingOrders = currentOrders.filter((ord) => {
      if (!ord.orderId) return false;
      const currentStatus = homeCache.ordersStatus[ord.orderId]?.status;
      return currentStatus !== "completed" && currentStatus !== "rejected";
    });

    if (pendingOrders.length === 0) return;

    setStatusLoading(true);
    const newStatuses = {};

    await Promise.all(pendingOrders.map(async (ord) => {
      try {
        const data = await adminApiCall(`/api/order-status/${ord.orderId}`);
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
    setStatusLoading(false);
  }, [syncOrdersStatusToCache]);

  // ===== Load Local Orders =====
  const loadOrders = useCallback(() => {
    try {
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        let parsed = JSON.parse(storedOrders);
        if (Array.isArray(parsed)) {
          const reversed = [...parsed].reverse();
          setOrders(reversed);
          fetchAllOrderStatuses(reversed);
          return;
        }
      }

      const storedOrder = localStorage.getItem("order");
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        const singleList = [parsed];
        setOrders(singleList);
        fetchAllOrderStatuses(singleList);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("[useHomeData] Error loading orders:", err);
    }
  }, [fetchAllOrderStatuses]);

  // ===== Delete Single Order =====
  const deleteOrder = useCallback((orderIdToDelete) => {
    try {
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        let parsed = JSON.parse(storedOrders);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((ord) => (ord.orderId || ord.id) !== orderIdToDelete);
          localStorage.setItem("orders", JSON.stringify(updated));
        }
      }
      const storedOrder = localStorage.getItem("order");
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        if ((parsed.orderId || parsed.id) === orderIdToDelete) {
          localStorage.removeItem("order");
        }
      }

      setOrders((prev) => prev.filter((ord) => (ord.orderId || ord.id) !== orderIdToDelete));
      showAlert("ลบประวัติคำสั่งซื้อสำเร็จ");
    } catch (err) {
      console.error("[useHomeData] Error deleting order:", err);
      showAlert("เกิดข้อผิดพลาดในการลบคำสั่งซื้อ");
    }
  }, [showAlert]);

  // ===== Fetch Leaderboard =====
  const loadRankings = useCallback(async () => {
    if (!homeCache.leaderboard[rankingType]) {
      setRankLoading(true);
    }
    try {
      const data = await adminApiCall(`/api/rankings/top?type=${rankingType}`);
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
      const data = await adminApiCall('/api/shop/profile');
      if (data && data.success && data.shop) {
        const sProfile = {
          name: data.shop.name || "Digital Signage CMES",
          logo: data.shop.logo || null
        };
        homeCache.shopProfile = sProfile;
        setShopProfile(sProfile);
      }
    } catch (err) {
      console.error("[useHomeData] Shop profile fetch error:", err.message);
    }

    // 3. Fetch Perks
    try {
      const data = await adminApiCall('/api/config/perks');
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
      const newStatus = {
        systemOn: data.systemOpen ?? data.systemOn ?? true,
        imageOn: (data.enableImage ?? data.imageOn) ?? true,
        textOn: (data.enableText ?? data.textOn) ?? true,
        giftOn: (data.enableGift ?? data.giftOn) ?? true,
        birthdayOn: (data.enableBirthday ?? data.birthdayOn) ?? true,
      };
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
        const data = await adminApiCall(`/api/birthday-eligibility/${encodedEmail}`);
        if (data && data.success) {
          const bData = {
            eligible: data.eligible,
            totalSpent: data.totalSpent || 0,
            required: data.required || 100,
            reason: data.reason || "unknown"
          };
          homeCache.birthdayEligibility = bData;
          setBirthdayEligibility(bData);
        }
      } catch (err) {
        console.error("[useHomeData] Birthday eligibility error:", err.message);
      }
    }
  }, [loadOrders, loadRankings]);

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
        const updated = {
          ...prev,
          systemOn: newConfig.systemOpen ?? newConfig.systemOn ?? prev.systemOn,
          imageOn: newConfig.enableImage ?? prev.imageOn,
          textOn: newConfig.enableText ?? prev.textOn,
          giftOn: newConfig.enableGift ?? prev.giftOn,
          birthdayOn: newConfig.enableBirthday ?? prev.birthdayOn,
        };
        homeCache.status = updated;
        return updated;
      });
    };

    const handleStatus = (socketStatus) => {
      if (!socketStatus) return;
      setStatus((prev) => {
        const updated = {
          ...prev,
          systemOn: socketStatus.systemOpen ?? socketStatus.systemOn ?? prev.systemOn,
          imageOn: socketStatus.enableImage ?? prev.imageOn,
          textOn: socketStatus.enableText ?? prev.textOn,
          giftOn: socketStatus.enableGift ?? prev.giftOn,
          birthdayOn: socketStatus.enableBirthday ?? prev.birthdayOn,
        };
        homeCache.status = updated;
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
