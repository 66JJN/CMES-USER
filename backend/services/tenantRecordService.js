const SHOP_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export const requireShopIdValue = (value) => {
  const shopId = String(value || "").trim();
  if (!SHOP_ID_PATTERN.test(shopId)) {
    const error = new Error("A valid shopId is required");
    error.status = 400;
    throw error;
  }
  return shopId;
};

export const findGiftForShop = (
  { shopId, orderId },
  { findOne },
) => findOne({ orderId, shopId: requireShopIdValue(shopId) });

export const getPendingUploadForShop = ({
  shopId,
  uploadId,
  pendingUploads,
}) => {
  const normalizedShopId = requireShopIdValue(shopId);
  const upload = pendingUploads.get(uploadId);
  return upload?.shopId === normalizedShopId ? upload : null;
};
