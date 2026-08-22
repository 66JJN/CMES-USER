const encodeSegment = (value, fallback) =>
  encodeURIComponent(String(value || fallback).trim());

export const getStorageOwnerId = (storage = window.localStorage) => {
  try {
    const user = JSON.parse(storage.getItem("user") || "null");
    return user?.id || user?.email || "guest";
  } catch {
    return "guest";
  }
};

export const getShopStorageKey = (name, shopId, userId = "guest") =>
  `cmes:${encodeSegment(name, "state")}:${encodeSegment(
    shopId,
    "no-shop",
  )}:${encodeSegment(userId, "guest")}`;

export const readShopItem = (
  name,
  shopId,
  storage = window.localStorage,
) =>
  storage.getItem(
    getShopStorageKey(name, shopId, getStorageOwnerId(storage)),
  );

export const writeShopItem = (
  name,
  value,
  shopId,
  storage = window.localStorage,
) =>
  storage.setItem(
    getShopStorageKey(name, shopId, getStorageOwnerId(storage)),
    String(value),
  );

export const removeShopItem = (
  name,
  shopId,
  storage = window.localStorage,
) =>
  storage.removeItem(
    getShopStorageKey(name, shopId, getStorageOwnerId(storage)),
  );

export const readShopJson = (
  name,
  fallback,
  shopId,
  storage = window.localStorage,
) => {
  try {
    const raw = readShopItem(name, shopId, storage);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const writeShopJson = (
  name,
  value,
  shopId,
  storage = window.localStorage,
) => writeShopItem(name, JSON.stringify(value), shopId, storage);
