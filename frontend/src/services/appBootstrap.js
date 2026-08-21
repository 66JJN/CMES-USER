import API_BASE_URL from "../config/apiConfig";
import { initializeAuth as defaultInitializeAuth } from "./authService";

const shopProfileCache = new Map();
const pendingShopProfiles = new Map();

export function getCachedShopProfile(shopId) {
  return shopProfileCache.get(String(shopId || "").trim()) || null;
}

export function clearShopProfileCache(shopId) {
  if (shopId) {
    shopProfileCache.delete(String(shopId).trim());
    pendingShopProfiles.delete(String(shopId).trim());
    return;
  }
  shopProfileCache.clear();
  pendingShopProfiles.clear();
}

export async function loadShopProfile(shopId) {
  const normalizedShopId = String(shopId || "").trim();
  if (!normalizedShopId) throw new Error("ไม่พบรหัสร้าน กรุณาสแกน QR Code ใหม่");

  const cached = getCachedShopProfile(normalizedShopId);
  if (cached) return cached;
  if (pendingShopProfiles.has(normalizedShopId)) {
    return pendingShopProfiles.get(normalizedShopId);
  }

  const request = (async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/shop-profile?shopId=${encodeURIComponent(normalizedShopId)}`,
      { headers: { "x-shop-id": normalizedShopId } },
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "เชื่อมต่อข้อมูลร้านไม่สำเร็จ");
    }

    const name = String(data?.shop?.name || "").trim();
    if (!data?.success || !name) {
      throw new Error("ไม่พบข้อมูลชื่อร้าน กรุณาตรวจสอบ QR Code");
    }

    const profile = { name, logo: data.shop.logo || null };
    shopProfileCache.set(normalizedShopId, profile);
    return profile;
  })();

  pendingShopProfiles.set(normalizedShopId, request);
  try {
    return await request;
  } finally {
    pendingShopProfiles.delete(normalizedShopId);
  }
}

export async function bootstrapApplication({
  shopId,
  initializeAuth = defaultInitializeAuth,
  loadShopProfile: loadProfile = loadShopProfile,
  timeoutMs = 8000,
} = {}) {
  const normalizedShopId = String(shopId || "").trim();
  if (!normalizedShopId) {
    throw new Error("ไม่พบรหัสร้าน กรุณาสแกน QR Code ใหม่");
  }

  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.all([initializeAuth(), loadProfile(normalizedShopId)]).then(([, profile]) => profile),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}
