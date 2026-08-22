import { readShopItem, writeShopItem } from "./services/shopStorage";

export const incrementQueueNumber = (shopId) => {
  let currentQueueNumber = parseInt(readShopItem("queueNumber", shopId) || "0", 10);
  if (!isNaN(currentQueueNumber)) {
    currentQueueNumber += 1; // เพิ่มค่าเพียงครั้งเดียว
  } else {
    currentQueueNumber = 1; // เริ่มต้นที่ 1 หากยังไม่มีค่า
  }
  writeShopItem("queueNumber", currentQueueNumber, shopId);
  return currentQueueNumber;
};
