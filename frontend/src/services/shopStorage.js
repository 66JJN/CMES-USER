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

export const readShopOrders = (
  shopId,
  storage = window.localStorage,
) => {
  const normalizedShopId = String(shopId || "").trim();
  const orders = readShopJson("orders", [], normalizedShopId, storage);
  if (!Array.isArray(orders)) return [];
  return orders.filter(
    (order) => order && String(order.shopId || "").trim() === normalizedShopId,
  );
};

export const appendShopOrder = (
  shopId,
  order,
  storage = window.localStorage,
) => {
  const normalizedShopId = String(shopId || "").trim();
  const nextOrder = { ...order, shopId: normalizedShopId };
  writeShopJson(
    "orders",
    [...readShopOrders(normalizedShopId, storage), nextOrder],
    normalizedShopId,
    storage,
  );
  writeShopJson("order", nextOrder, normalizedShopId, storage);
  return nextOrder;
};

export const removeShopOrder = (
  shopId,
  orderId,
  storage = window.localStorage,
) => {
  const orders = readShopOrders(shopId, storage).filter(
    (order) => (order.orderId || order.id) !== orderId,
  );
  writeShopJson("orders", orders, shopId, storage);

  const latest = readShopJson("order", null, shopId, storage);
  if (latest && (latest.orderId || latest.id) === orderId) {
    removeShopItem("order", shopId, storage);
  }
  return orders;
};

export const clearShopOrders = (
  shopId,
  storage = window.localStorage,
) => {
  writeShopJson("orders", [], shopId, storage);
  removeShopItem("order", shopId, storage);
};

export const readLegacyOrders = (storage = window.localStorage) => {
  try {
    const orders = JSON.parse(storage.getItem("orders") || "[]");
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
};

export const adoptVerifiedLegacyOrders = (
  shopId,
  verifiedOrderIds,
  storage = window.localStorage,
) => {
  const normalizedShopId = String(shopId || "").trim();
  const current = readShopOrders(normalizedShopId, storage);
  const knownIds = new Set(current.map((order) => order.orderId || order.id));
  const adopted = readLegacyOrders(storage)
    .filter((order) => {
      const id = order?.orderId || order?.id;
      return id && verifiedOrderIds.has(id) && !knownIds.has(id);
    })
    .map((order) => ({ ...order, shopId: normalizedShopId }));

  const merged = [...current, ...adopted];
  if (adopted.length > 0) {
    writeShopJson("orders", merged, normalizedShopId, storage);
  }
  return merged;
};
