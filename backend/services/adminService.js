import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export const ADMIN_API_BASE = (process.env.ADMIN_API_BASE || "https://cmes-admin.onrender.com").replace(/\/$/, "");

export function createUpstreamError(resourceName, status) {
  const error = new Error(`Admin returned ${resourceName} ${status}`);
  error.status = status;
  error.statusCode = status;
  return error;
}

const serviceHeaders = (shopId, headers = {}) => ({
  ...headers,
  "x-shop-id": shopId || "",
  "x-cmes-service-token": process.env.USER_SERVICE_TOKEN || "",
});

/**
 * Helper to perform HTTP fetches to the ADMIN API with a strict timeout.
 * Prevents the Express event loop from being blocked by slow/hanging external calls.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      throw new Error(`Connection to Admin API timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch gift settings from the Admin backend.
 */
export async function fetchGiftSettings(shopId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/gifts/settings`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้");
  return res.json();
}

/**
 * Send confirmed gift order details to the Admin backend.
 */
export async function sendGiftOrderToAdmin(shopId, payload) {
  // 30s timeout: Admin needs time for AI moderation + queue processing
  return fetchWithTimeout(`${ADMIN_API_BASE}/api/gifts/order`, {
    method: "POST",
    headers: serviceHeaders(shopId, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  }, 30000);
}

/**
 * Fetch top customer VIP rankings from the Admin backend.
 */
export async function fetchTopRankings(shopId, type) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/rankings/top?type=${type || "alltime"}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error("Failed to fetch rankings from admin");
  return res.json();
}

/**
 * Send stats about slip verification to the Admin backend.
 */
export async function sendSlipStat(shopId, payload) {
  return fetchWithTimeout(`${ADMIN_API_BASE}/api/stat-slip`, {
    method: "POST",
    headers: serviceHeaders(shopId, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

/**
 * Forward user bug reports / feedback to the Admin backend.
 */
export async function forwardReport(shopId, category, detail) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/report`, {
    method: "POST",
    headers: serviceHeaders(shopId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ category, detail }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Admin API returned ${res.status}: ${errText}`);
  }
  return res.json();
}

/**
 * Fetch general system configs (active settings) from the Admin backend.
 */
export async function fetchSystemStatus(shopId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/status?shopId=${shopId || ""}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error(`Admin returned status ${res.status}`);
  return res.json();
}

export async function fetchShopProfile(shopId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/shop/public-profile?shopId=${encodeURIComponent(shopId || "")}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error(`Admin returned profile ${res.status}`);
  return res.json();
}

export async function fetchPerks(shopId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/config/perks?shopId=${encodeURIComponent(shopId || "")}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error(`Admin returned perks ${res.status}`);
  return res.json();
}

export async function fetchBirthdayEligibility(shopId, email) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/birthday-eligibility/${encodeURIComponent(email)}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error(`Admin returned birthday eligibility ${res.status}`);
  return res.json();
}

export async function fetchOrderStatus(shopId, orderId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/order-status/${encodeURIComponent(orderId)}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw createUpstreamError("order status", res.status);
  return res.json();
}

export async function deleteUserOrder(shopId, orderId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/user-delete-order/${encodeURIComponent(orderId)}`, {
    method: 'DELETE', headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw createUpstreamError("delete order", res.status);
  return res.json();
}

export async function fetchPaymentQr(shopId) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/config/payment-qr?shopId=${encodeURIComponent(shopId || "")}`, {
    headers: serviceHeaders(shopId),
  });
  if (!res.ok) throw new Error(`Admin returned payment QR ${res.status}`);
  return res.json();
}
