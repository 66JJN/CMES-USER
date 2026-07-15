import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_API_BASE = (process.env.ADMIN_API_BASE || "https://cmes-admin-server.onrender.com").replace(/\/$/, "");

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
    headers: { "x-shop-id": shopId || "" },
  });
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้");
  return res.json();
}

/**
 * Send confirmed gift order details to the Admin backend.
 */
export async function sendGiftOrderToAdmin(shopId, payload) {
  return fetchWithTimeout(`${ADMIN_API_BASE}/api/gifts/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-shop-id": shopId || "",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch top customer VIP rankings from the Admin backend.
 */
export async function fetchTopRankings(shopId, type) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/rankings/top?type=${type || "alltime"}`, {
    headers: { "x-shop-id": shopId || "" },
  });
  if (!res.ok) throw new Error("Failed to fetch rankings from admin");
  return res.json();
}

/**
 * Send stats about slip verification to the Admin backend.
 */
export async function sendSlipStat(payload) {
  return fetchWithTimeout(`${ADMIN_API_BASE}/api/stat-slip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Forward user bug reports / feedback to the Admin backend.
 */
export async function forwardReport(shopId, category, detail) {
  const res = await fetchWithTimeout(`${ADMIN_API_BASE}/api/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-shop-id": shopId || "",
    },
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
    headers: { "x-shop-id": shopId || "" },
  });
  if (!res.ok) throw new Error(`Admin returned status ${res.status}`);
  return res.json();
}
