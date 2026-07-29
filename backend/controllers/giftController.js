import GiftOrder from "../models/GiftOrder.js";
import { fetchGiftSettings, sendGiftOrderToAdmin } from "../services/adminService.js";
import { randomUUID } from "crypto";

/**
 * GET /api/gifts
 * Fetches all available gifts for a specific shop.
 */
export async function getGifts(req, res, next) {
  try {
    const shopId = req.headers["x-shop-id"] || "";
    const settings = await fetchGiftSettings(shopId);
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gifts/order
 * Creates a new gift order in the system (MongoDB).
 */
export async function createGiftOrder(req, res, next) {
  try {
    const { items, tableNumber, note, senderName, senderPhone, userId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "กรุณาเลือกรายการสินค้า" });
    }

    const shopId = req.headers["x-shop-id"] || "";
    const settings = await fetchGiftSettings(shopId);
    const maxTable = Number(settings.tableCount) || 0;
    const table = Number(tableNumber);
    if (!table || table < 1 || (maxTable && table > maxTable)) {
      return res.status(400).json({ success: false, message: "เลขโต๊ะไม่ถูกต้อง" });
    }

    const normalizedPhone = String(senderPhone || "").trim();
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลัก" });
    }

    const validItems = items
      .map((orderItem) => {
        const found = (settings.items || []).find((item) => item.id === orderItem.id);
        if (!found) return null;
        const qty = Number(orderItem.quantity) || 0;
        if (qty < 1) return null;
        return {
          id: found.id,
          name: found.name,
          price: Number(found.price) || 0,
          imageUrl: found.imageUrl || "",
          quantity: qty,
        };
      })
      .filter(Boolean);

    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: "ไม่พบสินค้าที่เลือก" });
    }

    const totalPrice = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (totalPrice < 0) {
      return res.status(400).json({ success: false, message: "ยอดรวมไม่ถูกต้อง" });
    }

    const order = new GiftOrder({
      orderId: `gift-${randomUUID()}`,
      senderName: senderName?.trim() || "Guest",
      senderPhone: normalizedPhone,
      tableNumber: table,
      note: note ? note.trim() : "",
      items: validItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice,
      status: "pending_payment",
      userId: req.userId || userId || null,
    });

    await order.save();

    const responseOrder = {
      id: order.orderId,
      senderName: order.senderName,
      senderPhone: order.senderPhone,
      tableNumber: order.tableNumber,
      note: order.note,
      items: order.items,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    };

    res.json({ success: true, order: responseOrder });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gifts/order/:orderId
 * Retrieves gift order details by ID from MongoDB.
 */
export async function getGiftOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await GiftOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "ไม่พบคำสั่งซื้อ" });
    }

    const responseOrder = {
      id: order.orderId,
      senderName: order.senderName,
      senderPhone: order.senderPhone,
      tableNumber: order.tableNumber,
      note: order.note,
      items: order.items,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    };

    res.json({ success: true, order: responseOrder });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gifts/order/:orderId/confirm
 * Validates payments and forwards order data to the Admin.
 */
export async function confirmGiftOrder(req, res, next) {
  const { orderId } = req.params;
  const { userId, email, avatar } = req.body;
  const shopId = req.headers["x-shop-id"] || "";

  try {
    const order = await GiftOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "ไม่พบคำสั่งซื้อ" });
    }
    if (order.status !== "pending_payment") {
      return res.status(400).json({ success: false, message: "คำสั่งซื้ออยู่ในสถานะที่ไม่สามารถยืนยันได้" });
    }

    order.status = "awaiting_admin";
    if (req.userId || userId) {
      order.userId = req.userId || userId;
    }
    await order.save();

    const payload = {
      orderId: order.orderId,
      sender: order.senderName,
      senderPhone: order.senderPhone || null,
      userId: order.userId || null,
      email: email || null,
      avatar: avatar || null,
      tableNumber: order.tableNumber,
      note: order.note,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: order.totalPrice,
    };

    console.log("[Gift Order Confirm] Forwarding to Admin API:", JSON.stringify(payload, null, 2));

    const adminResponse = await sendGiftOrderToAdmin(shopId, payload);

    if (!adminResponse.ok) {
      console.error("[Gift Order Confirm] Admin response not OK:", adminResponse.status);
      order.status = "pending_payment";
      await order.save();
      const message = await adminResponse.text();
      return res.status(502).json({ success: false, message: message || "ส่งข้อมูลไปยังฝั่งแอดมินไม่สำเร็จ" });
    }

    console.log("[Gift Order Confirm] Successfully sent to admin");

    const responseOrder = {
      id: order.orderId,
      senderName: order.senderName,
      senderPhone: order.senderPhone,
      tableNumber: order.tableNumber,
      note: order.note,
      items: order.items,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    };

    res.json({ success: true, order: responseOrder });
  } catch (error) {
    console.error("Confirm gift order failed", error);
    try {
      const order = await GiftOrder.findOne({ orderId });
      if (order) {
        order.status = "pending_payment";
        await order.save();
      }
    } catch (e) {
      // ignore
    }
    next(error);
  }
}
